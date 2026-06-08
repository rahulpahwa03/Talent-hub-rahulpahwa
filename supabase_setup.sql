-- ============================================================
-- EzHire: Run this SQL in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/nztysylevyzllwsdecny/sql/new
-- ============================================================

-- 1. ALTER TABLE to add missing columns if they don't exist
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS favorite boolean DEFAULT false;

-- 2. CREATE STORAGE BUCKET for resumes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  true,
  10485760, -- 10 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf'
  ]
)
on conflict (id) do nothing;

-- 3. STORAGE POLICIES — allow public uploads and reads
create policy "Allow public resume uploads"
  on storage.objects for insert
  with check (bucket_id = 'resumes');

create policy "Allow public resume reads"
  on storage.objects for select
  using (bucket_id = 'resumes');

-- 4. CREATE insert_candidate() RPC with SECURITY DEFINER
--    This bypasses RLS so the anon key can insert new candidate profiles
create or replace function public.insert_candidate(
  p_name            text    default null,
  p_email           text    default null,
  p_phone           text    default null,
  p_linkedin        text    default null,
  p_location        text    default null,
  p_visa            text    default null,
  p_title           text    default null,
  p_skills          text    default null,
  p_experience      text    default null,
  p_employer        text    default null,
  p_summary         text    default null,
  p_resume_url      text    default null,
  p_resume_file     text    default null,
  p_resume_text     text    default null,
  p_notes           text    default null,
  p_source          text    default 'resume_upload'
)
returns json
language plpgsql
security definer        -- runs as DB owner, bypasses RLS
set search_path = public
as $$
declare
  v_row  candidates%rowtype;
  v_uuid uuid := gen_random_uuid();
begin
  -- Upsert: if same email already exists, update; otherwise insert
  if p_email is not null and p_email != '' then
    select * into v_row from candidates where "Email" = p_email limit 1;
  end if;

  if v_row.id is not null then
    -- UPDATE existing record
    update candidates set
      "Candidate Name"   = coalesce(nullif(p_name, ''),    "Candidate Name"),
      "Title"            = coalesce(nullif(p_title, ''),   "Title"),
      "Skills"           = coalesce(nullif(p_skills, ''),  "Skills"),
      "VISA"             = coalesce(nullif(p_visa, ''),    "VISA"),
      "Current Location" = coalesce(nullif(p_location, ''),"Current Location"),
      "LinkedIn"         = coalesce(nullif(p_linkedin, ''),"LinkedIn"),
      "Contact No"       = coalesce(nullif(p_phone, ''),   "Contact No"),
      resume_url         = coalesce(nullif(p_resume_url, ''), resume_url),
      resume_file_name   = coalesce(nullif(p_resume_file, ''), resume_file_name),
      resume_text        = coalesce(nullif(p_resume_text, ''), resume_text),
      notes              = coalesce(nullif(p_notes, ''),   notes),
      source             = p_source,
      profile_status     = 'Active',
      profile_completion = greatest(coalesce(profile_completion, 0),
        (case when p_name     != '' then 15 else 0 end) +
        (case when p_email    != '' then 15 else 0 end) +
        (case when p_phone    != '' then 10 else 0 end) +
        (case when p_skills   != '' then 20 else 0 end) +
        (case when p_visa     != '' then 10 else 0 end) +
        (case when p_location != '' then 10 else 0 end) +
        (case when p_resume_url != '' then 20 else 0 end)
      ),
      last_updated = now()
    where id = v_row.id
    returning * into v_row;
  else
    -- INSERT new record
    insert into candidates (
      "Candidate Name", "Email", "Contact No", "LinkedIn",
      "Title", "Skills", "VISA", "Current Location",
      resume_url, resume_file_name, resume_text, notes,
      source, profile_status, profile_completion,
      candidate_uuid, created_at, last_updated
    ) values (
      nullif(p_name, ''),
      nullif(p_email, ''),
      nullif(p_phone, ''),
      nullif(p_linkedin, ''),
      nullif(p_title, ''),
      nullif(p_skills, ''),
      nullif(p_visa, ''),
      nullif(p_location, ''),
      nullif(p_resume_url, ''),
      nullif(p_resume_file, ''),
      nullif(p_resume_text, ''),
      nullif(p_notes, ''),
      p_source,
      'Active',
      (case when p_name     is not null and p_name     != '' then 15 else 0 end) +
      (case when p_email    is not null and p_email    != '' then 15 else 0 end) +
      (case when p_phone    is not null and p_phone    != '' then 10 else 0 end) +
      (case when p_skills   is not null and p_skills   != '' then 20 else 0 end) +
      (case when p_visa     is not null and p_visa     != '' then 10 else 0 end) +
      (case when p_location is not null and p_location != '' then 10 else 0 end) +
      (case when p_resume_url is not null and p_resume_url != '' then 20 else 0 end),
      v_uuid,
      now(),
      now()
    )
    returning * into v_row;
  end if;

  return row_to_json(v_row);
end;
$$;

-- Grant execute to anon and authenticated roles
grant execute on function public.insert_candidate to anon, authenticated;

-- Done!
select 'Setup complete ✓' as status;
