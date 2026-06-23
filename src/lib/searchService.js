/**
 * EzHire Search Service
 * Handles smart search: synonym expansion, boolean parsing,
 * Supabase RPC full-text search, client-side fallback scoring,
 * and localStorage-based recent/saved search management.
 */

import { supabase } from './supabase';

// ─── Synonym Map ──────────────────────────────────────────────────────────────
// When recruiter types any key, all values are also searched
const SYNONYM_MAP = {
  'react':       ['react', 'reactjs', 'react.js', 'react js'],
  'reactjs':     ['react', 'reactjs', 'react.js'],
  'javascript':  ['javascript', 'js'],
  'js':          ['javascript', 'js', 'es6', 'es2015'],
  'typescript':  ['typescript', 'ts'],
  'node':        ['node', 'nodejs', 'node.js'],
  'nodejs':      ['node', 'nodejs', 'node.js'],
  '.net':        ['.net', 'dot net', 'dotnet', 'csharp', 'c#'],
  'dotnet':      ['.net', 'dot net', 'dotnet'],
  'dot net':     ['.net', 'dot net', 'dotnet'],
  'aws':         ['aws', 'amazon web services', 'amazon aws'],
  'amazon':      ['aws', 'amazon web services'],
  'gcp':         ['gcp', 'google cloud', 'google cloud platform'],
  'azure':       ['azure', 'microsoft azure'],
  'qa':          ['qa', 'quality analyst', 'quality assurance', 'qe', 'quality engineer'],
  'devops':      ['devops', 'sre', 'site reliability engineer', 'platform engineer'],
  'sre':         ['sre', 'devops', 'site reliability'],
  'fullstack':   ['full stack', 'fullstack', 'full-stack'],
  'full stack':  ['full stack', 'fullstack', 'full-stack'],
  'ml':          ['ml', 'machine learning', 'deep learning'],
  'ai':          ['ai', 'artificial intelligence', 'machine learning', 'deep learning'],
  'k8s':         ['k8s', 'kubernetes'],
  'kubernetes':  ['kubernetes', 'k8s'],
  'usc':         ['us citizen', 'usc', 'united states citizen'],
  'gc':          ['green card', 'gc', 'permanent resident'],
  'opt':         ['opt', 'opt/cpt', 'optional practical training'],
  'cpt':         ['cpt', 'opt/cpt', 'curricular practical training'],
};

// ─── Experience Ranges ────────────────────────────────────────────────────────
export const EXPERIENCE_RANGES = [
  { label: '0–3 Years',  min: 0,  max: 3  },
  { label: '3–6 Years',  min: 3,  max: 6  },
  { label: '6–10 Years', min: 6,  max: 10 },
  { label: '10+ Years',  min: 10, max: 999 },
];

// ─── Filter Options ───────────────────────────────────────────────────────────
export const VISA_OPTIONS = ['USC', 'GC', 'H1B', 'OPT', 'CPT'];
export const WORK_PREF_OPTIONS = ['Remote', 'Hybrid', 'Onsite'];
export const AVAILABILITY_OPTIONS = ['Immediate', '15 Days', '30 Days', '60 Days'];

// ─── Synonym Expansion ────────────────────────────────────────────────────────
export function expandSynonyms(query) {
  if (!query || !query.trim()) return query;

  const lower = query.toLowerCase();
  let expanded = query;

  // Check each synonym key
  Object.entries(SYNONYM_MAP).forEach(([key, synonyms]) => {
    if (lower.includes(key)) {
      // Build OR clause for synonyms in tsquery style
      const synStr = synonyms.map(s => `"${s}"`).join(' | ');
      expanded = expanded.replace(new RegExp(key, 'gi'), `(${synStr})`);
    }
  });

  return expanded;
}

// ─── Boolean Query Parser ─────────────────────────────────────────────────────
// Converts user-friendly boolean to PostgreSQL websearch_to_tsquery format
// "Java AND Spring NOT Angular" → "java spring -angular"
// "(Java OR Kotlin) AND Spring" → "(java | kotlin) spring"
export function parseBooleanQuery(query) {
  if (!query || !query.trim()) return '';

  let q = query.trim();

  // Convert AND/OR/NOT to websearch_to_tsquery tokens
  // websearch_to_tsquery natively supports: -word (NOT), "phrase", word1 word2 (AND), word1 OR word2
  q = q.replace(/\bAND\b/gi, ' ');
  q = q.replace(/\bNOT\b/gi, '-');
  q = q.replace(/\bOR\b/gi, 'OR');

  return q;
}

// ─── Client-Side Scoring ──────────────────────────────────────────────────────
// Used as fallback when Supabase is unavailable
// Returns [0-1] float score for a candidate given a query
export function scoreCandidate(candidate, query) {
  if (!query || !query.trim()) return 1;

  const q = query.toLowerCase();
  const keywords = q.split(/[\s,]+/).filter(Boolean);

  const name    = (candidate['Candidate Name'] || candidate.name    || '').toLowerCase();
  const title   = (candidate['Title']          || candidate.role    || '').toLowerCase();
  const skills  = (candidate['Skills']         || candidate.skills  || '').toLowerCase();
  const summary = (candidate.summary           || '').toLowerCase();
  const resume  = (candidate.resume_text       || candidate.rawText || '').toLowerCase();
  const email   = (candidate['Email']          || candidate.email   || '').toLowerCase();
  const visa    = (candidate['VISA']           || candidate.visa    || '').toLowerCase();

  let score = 0;
  let totalWeight = 0;

  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();

    // Priority 1: Exact skill match (highest weight)
    if (skills.includes(kwLower)) {
      // Count frequency in skills for skill weighting
      const freq = (skills.match(new RegExp(kwLower, 'g')) || []).length;
      score += 3 * (1 + Math.log(freq + 1));
    }

    // Priority 2: Title match
    if (title.includes(kwLower)) score += 4;

    // Priority 3: Resume keyword match
    if (resume.includes(kwLower)) {
      const freq = (resume.match(new RegExp(kwLower, 'g')) || []).length;
      score += 1.5 * (1 + Math.min(Math.log(freq + 1), 3));
    }

    // Priority 4: Summary match
    if (summary.includes(kwLower)) score += 1;

    // Priority 5: Name match
    if (name.includes(kwLower)) score += 2;

    // Email / Visa
    if (email.includes(kwLower) || visa.includes(kwLower)) score += 0.5;

    // Fuzzy: partial match via includes with prefix (e.g. "reac" matches "react")
    if (kwLower.length >= 3) {
      if (skills.includes(kwLower.slice(0, -1))) score += 0.5;
      if (title.includes(kwLower.slice(0, -1)))  score += 0.3;
    }

    totalWeight++;
  });

  // Recency bonus: newer candidates rank slightly higher
  if (candidate.created_at) {
    const daysOld = (Date.now() - new Date(candidate.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 30) score += 0.5;
    if (daysOld < 7)  score += 0.5;
  }

  return totalWeight > 0 ? score / (totalWeight * 4) : 0;
}

// ─── Client-Side Filter ───────────────────────────────────────────────────────
export function filterCandidates(candidates, { query, visa, workPref, availability, experienceRange, relocation }) {
  let result = [...candidates];

  // Search
  if (query && query.trim()) {
    const parsed = parseBooleanQuery(query);
    result = result.filter(c => scoreCandidate(c, parsed) > 0);
    // Sort by score
    result.sort((a, b) => scoreCandidate(b, parsed) - scoreCandidate(a, parsed));
  }

  // Visa filter (multi-select)
  if (visa && visa.length > 0) {
    result = result.filter(c => {
      const v = (c['VISA'] || c.visa || '').toLowerCase();
      return visa.some(vOpt => {
        const vL = vOpt.toLowerCase();
        if (vL === 'usc') return v.includes('citizen') || v.includes('usc') || v === 'us citizen';
        if (vL === 'gc')  return v.includes('green') || v.includes(' gc') || v === 'gc';
        return v.includes(vL);
      });
    });
  }

  // Work preference filter (multi-select)
  if (workPref && workPref.length > 0) {
    result = result.filter(c => {
      const wp = (c.work_preference || c.workPref || '').toLowerCase();
      // If not set, include them (don't filter out unknowns)
      if (!wp) return true;
      return workPref.some(w => wp.includes(w.toLowerCase()));
    });
  }

  // Availability filter (multi-select)
  if (availability && availability.length > 0) {
    result = result.filter(c => {
      const av = (c.availability || c.availableFrom || '').toLowerCase();
      if (!av) return true;
      return availability.some(a => {
        const aL = a.toLowerCase();
        if (aL === 'immediate') return av.includes('immediate') || av.includes('now') || av.includes('asap');
        return av.includes(aL);
      });
    });
  }

  // Experience range
  if (experienceRange) {
    result = result.filter(c => {
      const exp = parseInt(c.experience_years || c.experience || 0);
      if (experienceRange.max === 999) return exp >= experienceRange.min;
      return exp >= experienceRange.min && exp <= experienceRange.max;
    });
  }

  // Relocation
  if (relocation !== null && relocation !== undefined) {
    result = result.filter(c => {
      if (c.relocation === null || c.relocation === undefined) return true;
      return c.relocation === relocation;
    });
  }

  return result;
}

// ─── Supabase FTS Search ──────────────────────────────────────────────────────
export async function searchCandidatesDB({
  query = '',
  visa = null,
  workPref = null,
  availability = null,
  experienceRange = null,
  relocation = null,
  page = 1,
  pageSize = 20,
}) {
  if (!supabase) return null; // Fallback to client-side

  try {
    // Expand synonyms, parse boolean
    const expandedQuery = expandSynonyms(parseBooleanQuery(query));

    const { data, error } = await supabase.rpc('search_candidates', {
      p_query:        expandedQuery || '',
      p_visa:         visa && visa.length > 0 ? visa : null,
      p_work_pref:    workPref && workPref.length > 0 ? workPref : null,
      p_availability: availability && availability.length > 0 ? availability : null,
      p_exp_min:      experienceRange ? experienceRange.min : null,
      p_exp_max:      experienceRange ? (experienceRange.max === 999 ? null : experienceRange.max) : null,
      p_relocation:   relocation,
      p_limit:        pageSize,
      p_offset:       (page - 1) * pageSize,
    });

    if (error) {
      console.warn('FTS RPC error, falling back to client-side:', error.message);
      return null;
    }

    if (!data || data.length === 0) return { candidates: [], total: 0 };

    const candidates = data.map(row => ({
      ...row.candidate_data,
      _rank: row.rank_score,
    }));
    const total = data[0]?.total_count || 0;

    return { candidates, total };
  } catch (err) {
    console.warn('FTS search error, falling back to client-side:', err);
    return null;
  }
}

// ─── Recent Searches ──────────────────────────────────────────────────────────
const RECENT_KEY = 'ezhire_recent_searches';
const MAX_RECENT = 10;

export function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecentSearch(query) {
  if (!query || !query.trim()) return;
  try {
    const existing = getRecentSearches();
    const filtered = existing.filter(q => q.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY);
}

// ─── Saved Searches ───────────────────────────────────────────────────────────
const SAVED_KEY = 'ezhire_saved_searches';

export function getSavedSearches() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveSearch(query, name) {
  if (!query || !query.trim()) return;
  try {
    const existing = getSavedSearches();
    const entry = {
      id: Date.now(),
      name: name || query,
      query,
      savedAt: new Date().toISOString(),
    };
    const updated = [entry, ...existing.filter(s => s.query !== query)];
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    return entry;
  } catch {
    return null;
  }
}

export function removeSavedSearch(id) {
  try {
    const existing = getSavedSearches();
    localStorage.setItem(SAVED_KEY, JSON.stringify(existing.filter(s => s.id !== id)));
  } catch {
    // ignore
  }
}
