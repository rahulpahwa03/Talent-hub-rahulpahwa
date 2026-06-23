-- ============================================================
-- EzHire: Full-Text Search Migration (Fixed — Safe Version)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nztysylevyzllwsdecny/sql/new
-- ============================================================

-- 1. Enable trigram extension for fuzzy/typo-tolerant matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add ALL needed columns safely (won't fail if they already exist)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS work_preference  text    DEFAULT NULL;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS availability     text    DEFAULT NULL;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS relocation       boolean DEFAULT NULL;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_years int     DEFAULT NULL;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS summary          text    DEFAULT NULL;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS search_vector    tsvector;

-- 3. GIN index on search_vector for ultra-fast FTS on 20k+ rows
CREATE INDEX IF NOT EXISTS idx_candidates_fts
  ON candidates USING GIN(search_vector);

-- 4. Trigram GIN indexes for fuzzy partial matching
CREATE INDEX IF NOT EXISTS idx_candidates_name_trgm
  ON candidates USING GIN("Candidate Name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_candidates_skills_trgm
  ON candidates USING GIN("Skills" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_candidates_title_trgm
  ON candidates USING GIN("Title" gin_trgm_ops);

-- Only create resume_text index if the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'resume_text'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_candidates_resume_trgm
             ON candidates USING GIN(resume_text gin_trgm_ops)';
  END IF;
END $$;

-- 5. Trigger function — uses only columns guaranteed to exist
--    A = Name + Title (highest priority)
--    B = Skills
--    C = resume_text (if exists)
--    D = summary, Email, Contact No
CREATE OR REPLACE FUNCTION candidates_search_vector_fn()
RETURNS trigger AS $$
DECLARE
  v_resume_text text := '';
  v_summary     text := '';
BEGIN
  -- Safely read resume_text if the column exists
  BEGIN
    v_resume_text := coalesce(NEW.resume_text, '');
  EXCEPTION WHEN undefined_column THEN
    v_resume_text := '';
  END;

  -- Safely read summary if the column exists
  BEGIN
    v_summary := coalesce(NEW.summary, '');
  EXCEPTION WHEN undefined_column THEN
    v_summary := '';
  END;

  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW."Candidate Name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."Title",           '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."Skills",          '')), 'B') ||
    setweight(to_tsvector('english', v_resume_text),                        'C') ||
    setweight(to_tsvector('english', v_summary),                            'D') ||
    setweight(to_tsvector('english', coalesce(NEW."Email",           '')), 'D') ||
    setweight(to_tsvector('english', coalesce(NEW."Contact No",      '')), 'D');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to auto-update search_vector on every insert/update
DROP TRIGGER IF EXISTS candidates_search_vector_update ON candidates;
CREATE TRIGGER candidates_search_vector_update
  BEFORE INSERT OR UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION candidates_search_vector_fn();

-- 7. Backfill search_vector for all existing rows
--    Uses a DO block to handle missing optional columns gracefully
DO $$
DECLARE
  v_has_resume_text boolean;
  v_has_summary     boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'resume_text'
  ) INTO v_has_resume_text;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'summary'
  ) INTO v_has_summary;

  IF v_has_resume_text AND v_has_summary THEN
    UPDATE candidates SET search_vector =
      setweight(to_tsvector('english', coalesce("Candidate Name", '')), 'A') ||
      setweight(to_tsvector('english', coalesce("Title",           '')), 'A') ||
      setweight(to_tsvector('english', coalesce("Skills",          '')), 'B') ||
      setweight(to_tsvector('english', coalesce(resume_text,       '')), 'C') ||
      setweight(to_tsvector('english', coalesce(summary,           '')), 'D') ||
      setweight(to_tsvector('english', coalesce("Email",           '')), 'D') ||
      setweight(to_tsvector('english', coalesce("Contact No",      '')), 'D');

  ELSIF v_has_resume_text THEN
    UPDATE candidates SET search_vector =
      setweight(to_tsvector('english', coalesce("Candidate Name", '')), 'A') ||
      setweight(to_tsvector('english', coalesce("Title",           '')), 'A') ||
      setweight(to_tsvector('english', coalesce("Skills",          '')), 'B') ||
      setweight(to_tsvector('english', coalesce(resume_text,       '')), 'C') ||
      setweight(to_tsvector('english', coalesce("Email",           '')), 'D') ||
      setweight(to_tsvector('english', coalesce("Contact No",      '')), 'D');

  ELSE
    UPDATE candidates SET search_vector =
      setweight(to_tsvector('english', coalesce("Candidate Name", '')), 'A') ||
      setweight(to_tsvector('english', coalesce("Title",           '')), 'A') ||
      setweight(to_tsvector('english', coalesce("Skills",          '')), 'B') ||
      setweight(to_tsvector('english', coalesce("Email",           '')), 'D') ||
      setweight(to_tsvector('english', coalesce("Contact No",      '')), 'D');
  END IF;

  RAISE NOTICE 'search_vector backfill complete (resume_text=%, summary=%)',
    v_has_resume_text, v_has_summary;
END $$;

-- 8. Main ranked search RPC with full-text + trigram fuzzy fallback
-- Drop ALL overloaded versions of search_candidates (regardless of signature)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT oid::regprocedure AS fn_sig
    FROM pg_proc
    WHERE proname = 'search_candidates'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.fn_sig || ' CASCADE';
    RAISE NOTICE 'Dropped: %', r.fn_sig;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.search_candidates(
  p_query        text    DEFAULT '',
  p_visa         text[]  DEFAULT NULL,
  p_work_pref    text[]  DEFAULT NULL,
  p_availability text[]  DEFAULT NULL,
  p_exp_min      int     DEFAULT NULL,
  p_exp_max      int     DEFAULT NULL,
  p_relocation   boolean DEFAULT NULL,
  p_limit        int     DEFAULT 20,
  p_offset       int     DEFAULT 0
)
RETURNS TABLE (
  result_id      bigint,
  candidate_data json,
  rank_score     float4,
  total_count    bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tsquery tsquery;
BEGIN
  -- Parse the search query safely
  IF p_query IS NOT NULL AND trim(p_query) != '' THEN
    BEGIN
      v_tsquery := websearch_to_tsquery('english', p_query);
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        v_tsquery := plainto_tsquery('english', p_query);
      EXCEPTION WHEN OTHERS THEN
        v_tsquery := NULL;
      END;
    END;
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      c.*,
      CASE
        WHEN v_tsquery IS NOT NULL AND c.search_vector @@ v_tsquery
          THEN ts_rank_cd(c.search_vector, v_tsquery, 32)
        WHEN v_tsquery IS NOT NULL
          THEN GREATEST(
            similarity(coalesce(c."Candidate Name", ''), p_query),
            similarity(coalesce(c."Skills",          ''), p_query),
            similarity(coalesce(c."Title",           ''), p_query)
          ) * 0.7
        ELSE 1.0
      END AS _rank,
      COUNT(*) OVER() AS _total
    FROM candidates c
    WHERE
      -- Full-text search OR trigram fuzzy fallback
      (
        v_tsquery IS NULL
        OR c.search_vector @@ v_tsquery
        OR similarity(coalesce(c."Candidate Name", ''), p_query) > 0.2
        OR similarity(coalesce(c."Skills",          ''), p_query) > 0.15
        OR similarity(coalesce(c."Title",           ''), p_query) > 0.15
      )
      -- Visa filter (multi-select)
      AND (p_visa IS NULL OR c."VISA" = ANY(p_visa))
      -- Work preference filter
      AND (p_work_pref IS NULL OR c.work_preference = ANY(p_work_pref))
      -- Availability filter
      AND (p_availability IS NULL OR c.availability = ANY(p_availability))
      -- Experience range (tries experience_years first, falls back to experience text column)
      AND (p_exp_min IS NULL OR COALESCE(c.experience_years,
            CASE WHEN c.experience ~ '^\d+$' THEN c.experience::int ELSE 0 END, 0) >= p_exp_min)
      AND (p_exp_max IS NULL OR COALESCE(c.experience_years,
            CASE WHEN c.experience ~ '^\d+$' THEN c.experience::int ELSE 999 END, 999) <= p_exp_max)
      -- Relocation
      AND (p_relocation IS NULL OR c.relocation = p_relocation)
    ORDER BY _rank DESC, c.created_at DESC NULLS LAST
    LIMIT p_limit OFFSET p_offset
  )
  SELECT
    b.id::bigint,
    row_to_json(b)::json,
    b._rank,
    b._total
  FROM base b;
END;
$$;

-- 9. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_candidates TO anon, authenticated;

-- Done!
SELECT 'EzHire FTS Migration complete ✓' AS status;
