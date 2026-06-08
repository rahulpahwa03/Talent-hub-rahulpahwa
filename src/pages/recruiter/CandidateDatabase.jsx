import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Copy, Check, Download, SlidersHorizontal, RotateCcw,
  Users, Star, X, Plus,
} from 'lucide-react';

import { supabase } from '../../lib/supabase';
import CandidateCard from '../../components/CandidateCard';
import ProfilePanel from '../../components/ProfilePanel';
import SearchBar, { parseNaturalQuery, applyBooleanSearch, buildSupabaseQuery } from '../../components/ai/AISearchBar';
import VirtualRecruiter from '../../components/ai/VirtualRecruiter';

// ─── Constants ──────────────────────────────────────────────────────────────────
const VISA_OPTIONS = [
  { value: '',           label: 'All Visa Types' },
  { value: 'US Citizen', label: '🇺🇸 US Citizen' },
  { value: 'Green Card', label: '💚 Green Card' },
  { value: 'H1B',        label: '🔵 H1B' },
  { value: 'H4 EAD',    label: 'H4 EAD' },
  { value: 'OPT',       label: 'OPT' },
  { value: 'OPT EAD',   label: 'OPT EAD' },
  { value: 'L2S',       label: 'L2S' },
];

const DEFAULT_FILTERS = {
  visa: '',
  location: '',
  hasEmail: false,
  hasLinkedIn: false,
  hasResume: false,
  favoritesOnly: false,
  skills: [],
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
function hasResume(candidate) {
  return !!(
    candidate['resume_url']?.trim() ||
    candidate['Resume URL']?.trim() ||
    candidate['Resume']?.trim() ||
    candidate['resume']?.trim() ||
    candidate['CV']?.trim() ||
    candidate['cv_url']?.trim() ||
    candidate['resume_file_name']?.trim() ||
    candidate['Resume File Name']?.trim()
  );
}

function hasLinkedIn(candidate) {
  return !!(
    candidate['LinkedIn']?.trim() ||
    candidate['linkedin']?.trim() ||
    candidate['LinkedIn URL']?.trim()
  );
}

// ─── Skeleton Card ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="cand-card" style={{ pointerEvents: 'none' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 13, borderRadius: 6, marginBottom: 8, width: '65%' }} />
          <div className="skeleton" style={{ height: 11, borderRadius: 6, width: '45%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[72, 58, 80].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 22, borderRadius: 99, width: w }} />
        ))}
      </div>
    </div>
  );
}

// ─── Filter Badge ───────────────────────────────────────────────────────────────
function FilterCount({ count }) {
  if (!count) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 18, height: 18, borderRadius: 99,
      background: '#111827', color: '#fff',
      fontSize: 10, fontWeight: 700, padding: '0 5px',
    }}>
      {count}
    </span>
  );
}

// ─── Skill Tag ──────────────────────────────────────────────────────────────────
function SkillTag({ label, onRemove }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px 3px 10px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-muted)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
        fontSize: 11.5, fontWeight: 500,
      }}
    >
      {label}
      <button
        onClick={onRemove}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 0, borderRadius: '50%',
          width: 14, height: 14,
        }}
      >
        <X size={10} />
      </button>
    </motion.span>
  );
}

// ─── Filters Panel ──────────────────────────────────────────────────────────────
function FiltersPanel({ filters, setFilters, activeCount, totalCount, filteredCount }) {
  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !filters.skills.includes(s)) {
      setFilters(f => ({ ...f, skills: [...f.skills, s] }));
    }
    setSkillInput('');
  };

  const removeSkill = (sk) => setFilters(f => ({ ...f, skills: f.skills.filter(x => x !== sk) }));
  const reset = () => setFilters(DEFAULT_FILTERS);
  const hasActive = activeCount > 0;

  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: '#FFFFFF',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'var(--text-muted)',
        }}>
          <SlidersHorizontal size={12} />
          Filters
          <FilterCount count={activeCount} />
        </div>
        {hasActive && (
          <button
            onClick={reset}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, gap: 4, color: 'var(--text-muted)', padding: '3px 7px' }}
          >
            <RotateCcw size={10} />
            Reset
          </button>
        )}
      </div>

      {/* Result count strip */}
      {totalCount > 0 && (
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--border-soft)',
          fontSize: 11.5, color: 'var(--text-secondary)',
          background: 'var(--bg-soft)', flexShrink: 0,
        }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredCount.toLocaleString()}</strong> of {totalCount.toLocaleString()}
        </div>
      )}

      {/* Scrollable body */}
      <div className="scroll-y" style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Visa Status */}
        <div className="input-group">
          <label className="input-label" style={{ fontSize: 11.5 }}>Visa Status</label>
          <select
            value={filters.visa}
            onChange={e => setFilters(f => ({ ...f, visa: e.target.value }))}
            className="input"
            style={{ fontSize: 12.5, padding: '7px 10px' }}
          >
            {VISA_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="input-group">
          <label className="input-label" style={{ fontSize: 11.5 }}>Location</label>
          <input
            value={filters.location}
            onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Texas, New York…"
            className="input"
            style={{ fontSize: 12.5, padding: '7px 10px' }}
          />
        </div>

        {/* Skills */}
        <div className="input-group">
          <label className="input-label" style={{ fontSize: 11.5 }}>Must-Have Skills</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSkill()}
              placeholder="e.g. Python"
              className="input"
              style={{ fontSize: 12.5, padding: '7px 10px' }}
            />
            <button
              onClick={addSkill}
              className="btn btn-secondary btn-sm"
              style={{ flexShrink: 0, padding: '6px 10px' }}
            >
              <Plus size={13} />
            </button>
          </div>
          {filters.skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
              <AnimatePresence>
                {filters.skills.map(sk => (
                  <SkillTag key={sk} label={sk} onRemove={() => removeSkill(sk)} />
                ))}
              </AnimatePresence>
            </div>
          )}
          {filters.skills.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Candidates must have ALL listed skills
            </span>
          )}
        </div>

        <div className="divider" />

        {/* Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Contact & Data
          </div>
          {[
            { key: 'hasEmail',    label: 'Has Email',    emoji: '✉️' },
            { key: 'hasLinkedIn', label: 'Has LinkedIn', emoji: '🔗' },
            { key: 'hasResume',   label: 'Has Resume',   emoji: '📄', hint: 'resume_url field' },
          ].map(({ key, label, emoji, hint }) => (
            <label key={key} className="checkbox-label" style={{ padding: '5px 0' }}>
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={e => setFilters(f => ({ ...f, [key]: e.target.checked }))}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{emoji}</span>
                {label}
              </span>
            </label>
          ))}
        </div>

        <div className="divider" />

        {/* Favorites Only */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Star size={13} style={{ color: filters.favoritesOnly ? '#F59E0B' : 'var(--text-muted)' }} />
            Favorites Only
          </label>
          <button
            onClick={() => setFilters(f => ({ ...f, favoritesOnly: !f.favoritesOnly }))}
            className={`toggle ${filters.favoritesOnly ? 'on' : ''}`}
            aria-label="Toggle favorites only"
          />
        </div>

        {/* Resume data debug info */}
        <div style={{ padding: '10px 12px', background: 'var(--bg-soft)', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Data Coverage
          </div>
          {totalCount > 0 ? (
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div>📧 {filteredCount} shown</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                Resume field: resume_url
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Run a search to see stats</div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function CandidateDatabase() {
  const [searchParams] = useSearchParams();

  const [query, setQuery]           = useState(searchParams.get('q') || '');
  const [allFetched, setAllFetched] = useState([]);   // raw from supabase
  const [loading, setLoading]       = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [filters, setFilters]       = useState(() => {
    const initQ = searchParams.get('q') || '';
    const parsedInit = parseNaturalQuery(initQ);
    return {
      ...DEFAULT_FILTERS,
      visa: parsedInit.visa || '',
      location: parsedInit.location || '',
      skills: parsedInit.skills || [],
    };
  });
  const [emailsCopied, setEmailsCopied] = useState(false);

  // ── Client-side filter + boolean search applied to fetched data ───────────────
  const candidates = useMemo(() => {
    let result = allFetched;

    // 1. Boolean/keyword search (applied locally after Supabase fetch)
    if (query.trim()) {
      result = applyBooleanSearch(query, result);
    }

    // 2. Dropdown filters
    if (filters.visa) {
      result = result.filter(c =>
        (c['VISA'] || '').toLowerCase().includes(filters.visa.toLowerCase())
      );
    }
    if (filters.location) {
      result = result.filter(c =>
        (c['Current Location'] || '').toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // 3. Contact/data checkboxes
    if (filters.hasEmail)   result = result.filter(c => c['Email']?.trim());
    if (filters.hasLinkedIn) result = result.filter(c => hasLinkedIn(c));
    if (filters.hasResume)   result = result.filter(c => hasResume(c));

    // 4. Skill tags (ALL must match)
    if (filters.skills.length > 0) {
      result = result.filter(c => {
        const cSkills = (c['Skills'] || '').toLowerCase();
        return filters.skills.every(sk => cSkills.includes(sk.toLowerCase()));
      });
    }

    // 5. favoritesOnly filter
    if (filters.favoritesOnly) {
      result = result.filter(c => c.favorite);
    }
    return result;
  }, [allFetched, query, filters]);

  // ── Toggle favorite state locally & in database ─────────────────────────────
  const handleToggleFavorite = useCallback(async (candidateId) => {
    setAllFetched(prev => prev.map(c => {
      if (c.id === candidateId || c.candidate_uuid === candidateId) {
        const nextFav = !c.favorite;
        // Update background
        supabase
          .from('candidates')
          .update({ favorite: nextFav })
          .or(`id.eq.${candidateId},candidate_uuid.eq.${candidateId}`)
          .then(({ error }) => {
            if (error) {
              console.warn('[CandidateDatabase] DB favorite update failed:', error.message);
            }
          });
        return { ...c, favorite: nextFav };
      }
      return c;
    }));
  }, []);

  const handleCandidateUpdate = useCallback((updatedCandidate) => {
    setAllFetched(prev => prev.map(c => {
      if (c.id === updatedCandidate.id || c.candidate_uuid === updatedCandidate.candidate_uuid) {
        return { ...c, ...updatedCandidate };
      }
      return c;
    }));
    setSelectedCandidate(prev => {
      if (prev && (prev.id === updatedCandidate.id || prev.candidate_uuid === updatedCandidate.candidate_uuid)) {
        return { ...prev, ...updatedCandidate };
      }
      return prev;
    });
  }, []);

  // ── Fetch from Supabase ──────────────────────────────────────────────────────
  const fetchCandidates = useCallback(async (searchQuery) => {
    setLoading(true);
    try {
      const baseQuery = supabase.from('candidates').select('*');
      const compiledQuery = buildSupabaseQuery(searchQuery, baseQuery);
      
      const { data, error } = await compiledQuery;
      if (error) throw error;
      setAllFetched(data || []);
    } catch (err) {
      console.error('[CandidateDatabase] DB search failed:', err);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Search handler ────────────────────────────────────────────────────────────
  const handleSearch = useCallback((q) => {
    const term = (typeof q === 'string' ? q : query).trim();
    setQuery(term);

    // Parse natural language to auto-fill filters
    const parsed = parseNaturalQuery(term);
    
    // Reset search-extracted filters (visa, location, skills) to match the new query,
    // while keeping structural status checkboxes (hasEmail, hasLinkedIn, favoritesOnly, etc.)
    setFilters(f => ({
      ...f,
      visa: parsed.visa || '',
      location: parsed.location || '',
      skills: parsed.skills || [],
    }));

    fetchCandidates(term);
  }, [query, fetchCandidates]);

  // ── Initial load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCandidates(query);
  }, [query, fetchCandidates]);

  // ── Update selected candidate when filtered list changes ──────────────────────
  useEffect(() => {
    if (selectedCandidate && !candidates.find(c => c.id === selectedCandidate.id || c.candidate_uuid === selectedCandidate.candidate_uuid)) {
      setSelectedCandidate(candidates[0] || null);
    }
    if (!selectedCandidate && candidates.length > 0) {
      setSelectedCandidate(candidates[0]);
    }
  }, [candidates, selectedCandidate]);

  // ── Copy Emails ──────────────────────────────────────────────────────────────
  const copyEmails = useCallback(() => {
    const emails = candidates.map(c => c['Email']).filter(Boolean).join('; ');
    if (!emails) { toast.error('No emails to copy'); return; }
    navigator.clipboard.writeText(emails);
    toast.success(`Copied ${candidates.filter(c => c['Email']).length} emails`);
  }, [candidates]);

  // ── Export CSV ───────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    if (candidates.length === 0) { toast.error('Nothing to export'); return; }
    const headers = ['Candidate Name', 'Title', 'Email', 'Contact No', 'Current Location', 'VISA', 'Skills', 'LinkedIn'];
    const rows = candidates.map(c =>
      headers.map(h => `"${(c[h] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'candidates.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  }, [candidates]);

  // ── Active filter count ──────────────────────────────────────────────────────
  const activeFilterCount = [
    filters.visa, filters.location,
    filters.hasEmail, filters.hasLinkedIn, filters.hasResume, filters.favoritesOnly,
  ].filter(Boolean).length + filters.skills.length;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      background: 'var(--bg-soft)',
    }}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 24px 16px',
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyRules: 'space-between', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>Candidate Database</h2>
            {allFetched.length > 0 && !loading && (
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {candidates.length.toLocaleString()}
                </span>{' '}
                of {allFetched.length.toLocaleString()} candidates
                {candidates.length < allFetched.length && (
                  <span style={{ color: '#7C3AED', fontWeight: 500 }}> (filtered)</span>
                )}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={copyEmails} className="btn btn-secondary btn-sm" disabled={candidates.length === 0}>
              <Copy size={13} /> Copy Emails
            </button>
            <button onClick={exportCSV} className="btn btn-secondary btn-sm" disabled={candidates.length === 0}>
              <Download size={13} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={handleSearch}
          resultCount={allFetched.length > 0 ? candidates.length : undefined}
          placeholder='Search — e.g. "Snowflake" AND Texas AND H1B, or Python NOT Junior'
        />
      </div>

      {/* ── 3-column body ────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '220px 360px 1fr',
        overflow: 'hidden',
      }}>

        {/* ── Col 1: Filters ─────────────────────────────────────────────────── */}
        <FiltersPanel
          filters={filters}
          setFilters={setFilters}
          activeCount={activeFilterCount}
          totalCount={allFetched.length}
          filteredCount={candidates.length}
        />

        {/* ── Col 2: Candidate List ──────────────────────────────────────────── */}
        <div style={{
          width: 360, background: '#FFFFFF',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* List header */}
          <div style={{
            padding: '12px 16px 10px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Users size={13} style={{ color: 'var(--text-muted)' }} />
              <span className="section-title" style={{ margin: 0 }}>
                {loading ? 'Searching…' : `${candidates.length.toLocaleString()} Candidates`}
              </span>
            </div>
            {candidates.length > 0 && !loading && (
              <button onClick={copyEmails} className="btn btn-ghost btn-sm" style={{ fontSize: 11, gap: 4, padding: '3px 7px' }}>
                <Copy size={10} />
                Copy Emails
              </button>
            )}
          </div>

          {/* List body */}
          <div className="scroll-y" style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
            ) : candidates.length === 0 && query ? (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ fontSize: 28 }}>🔍</div>
                <h4 style={{ margin: 0 }}>No results</h4>
                <p style={{ fontSize: 12.5 }}>
                  Try different keywords, remove filters, or check your boolean syntax.
                </p>
                {activeFilterCount > 0 && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 12 }}
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : candidates.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ fontSize: 28 }}>🔎</div>
                <h4 style={{ margin: 0 }}>Search candidates</h4>
                <p style={{ fontSize: 12.5 }}>
                  Use the search bar with keywords, boolean operators, or field filters.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={query + filters.visa + filters.location + filters.hasResume}
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.04 } },
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  {candidates.map((candidate, i) => (
                    <motion.div
                      key={candidate['Email'] || candidate['Candidate Name'] || i}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                      }}
                    >
                      <CandidateCard
                        candidate={candidate}
                        selected={selectedCandidate === candidate}
                        onClick={() => setSelectedCandidate(candidate)}
                        onFavoriteToggle={handleToggleFavorite}
                        query={query}
                        filters={filters}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* ── Col 3: Profile Panel ──────────────────────────────────────────────── */}
        <div className="scroll-y" style={{ background: 'var(--bg-soft)', height: '100%' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCandidate?.['Email'] || selectedCandidate?.['Candidate Name'] || 'empty'}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
              style={{ background: '#FFFFFF', minHeight: '100%', borderLeft: '1px solid var(--border)' }}
            >
              <ProfilePanel 
                candidate={selectedCandidate} 
                onFavoriteToggle={handleToggleFavorite} 
                onCandidateUpdate={handleCandidateUpdate}
                query={query}
                filters={filters}
              />
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
      <VirtualRecruiter 
        candidates={candidates}
        selectedCandidate={selectedCandidate}
      />
    </div>
  );
}
