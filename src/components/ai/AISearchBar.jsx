import { useState, useRef, useCallback } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Boolean query parser ───────────────────────────────────────────────────────
// Supports: AND, OR, NOT, phrases ("..."), field:value, parentheses
// Returns an AST that can be evaluated against a candidate record

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
  // abbreviations
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
  // major cities
  'New York City','Los Angeles','Chicago','Houston','Phoenix','Philadelphia',
  'San Antonio','San Diego','Dallas','San Jose','Austin','Jacksonville',
  'Fort Worth','Columbus','Charlotte','Indianapolis','San Francisco','Seattle',
  'Denver','Nashville','Boston','Atlanta','Miami','Minneapolis','Portland',
  'Hyderabad','Bangalore','Bengaluru','Mumbai','Delhi','Chennai','Pune',
];

const VISA_TYPES = [
  { match: /h1[\s-]?b/i,           label: 'H1B' },
  { match: /green[\s-]?card/i,     label: 'Green Card' },
  { match: /\bopt[\s-]?ead\b/i,    label: 'OPT EAD' },
  { match: /\bopt\b/i,             label: 'OPT' },
  { match: /us[\s-]?citizen/i,     label: 'US Citizen' },
  { match: /\bl2[\s-]?s\b/i,       label: 'L2S' },
  { match: /h4[\s-]?ead/i,         label: 'H4 EAD' },
  { match: /\bgc\b/i,              label: 'Green Card' },
  { match: /\busc\b/i,             label: 'US Citizen' },
];

const KNOWN_SKILLS = [
  'Snowflake','Python','AWS','Java','React','Kubernetes','Docker',
  'TypeScript','JavaScript','Node','NodeJS','Angular','Vue','Go','Golang',
  'Scala','Spark','Kafka','Airflow','dbt','Terraform','SQL','NoSQL',
  'PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch','Azure','GCP',
  'Machine Learning','ML','Deep Learning','TensorFlow','PyTorch',
  'Data Engineering','Data Science','DevOps','Microservices','REST','GraphQL',
  'Spring Boot','SpringBoot','.NET','C#','C++','Rust','Ruby','PHP',
  'Hadoop','Hive','Databricks','Tableau','PowerBI','Power BI','Looker',
  'Salesforce','SAP','Workday','Redshift','BigQuery','Athena','EMR',
  'PySpark','Pandas','NumPy','Scikit','FastAPI','Flask','Django',
  'Kotlin','Swift','Objective-C','Android','iOS','React Native','Flutter',
];

// ─── tokeniser ─────────────────────────────────────────────────────────────────
function tokenise(input) {
  const tokens = [];
  let i = 0;
  const s = input.trim();
  while (i < s.length) {
    // skip whitespace
    if (/\s/.test(s[i])) { i++; continue; }
    // quoted phrase
    if (s[i] === '"') {
      let j = i + 1;
      while (j < s.length && s[j] !== '"') j++;
      tokens.push({ type: 'PHRASE', value: s.slice(i + 1, j) });
      i = j + 1;
      continue;
    }
    // parens
    if (s[i] === '(') { tokens.push({ type: 'LPAREN' }); i++; continue; }
    if (s[i] === ')') { tokens.push({ type: 'RPAREN' }); i++; continue; }
    // word / operator
    let j = i;
    while (j < s.length && !/[\s"()]/.test(s[j])) j++;
    const word = s.slice(i, j);
    const upper = word.toUpperCase();
    if (upper === 'AND') tokens.push({ type: 'AND' });
    else if (upper === 'OR') tokens.push({ type: 'OR' });
    else if (upper === 'NOT' || word === '-') tokens.push({ type: 'NOT' });
    else if (word.includes(':')) {
      const [field, ...rest] = word.split(':');
      tokens.push({ type: 'FIELD', field: field.toLowerCase(), value: rest.join(':') });
    } else tokens.push({ type: 'TERM', value: word });
    i = j;
  }
  return tokens;
}

// ─── recursive descent parser → AST ────────────────────────────────────────────
function parseExpr(tokens, pos = { i: 0 }) {
  let left = parsePrimary(tokens, pos);
  while (pos.i < tokens.length) {
    const t = tokens[pos.i];
    if (t.type === 'AND') { pos.i++; left = { op: 'AND', left, right: parsePrimary(tokens, pos) }; }
    else if (t.type === 'OR') { pos.i++; left = { op: 'OR', left, right: parsePrimary(tokens, pos) }; }
    else if (t.type === 'TERM' || t.type === 'PHRASE' || t.type === 'FIELD' || t.type === 'NOT' || t.type === 'LPAREN') {
      // implicit AND
      left = { op: 'AND', left, right: parsePrimary(tokens, pos) };
    } else break;
  }
  return left;
}

function parsePrimary(tokens, pos) {
  if (pos.i >= tokens.length) return null;
  const t = tokens[pos.i];
  if (t.type === 'NOT') {
    pos.i++;
    return { op: 'NOT', operand: parsePrimary(tokens, pos) };
  }
  if (t.type === 'LPAREN') {
    pos.i++;
    const inner = parseExpr(tokens, pos);
    if (pos.i < tokens.length && tokens[pos.i].type === 'RPAREN') pos.i++;
    return inner;
  }
  if (t.type === 'PHRASE') { pos.i++; return { op: 'PHRASE', value: t.value }; }
  if (t.type === 'FIELD')  { pos.i++; return { op: 'FIELD', field: t.field, value: t.value }; }
  if (t.type === 'TERM')   { pos.i++; return { op: 'TERM', value: t.value }; }
  return null;
}

// ─── evaluate AST against a candidate row ─────────────────────────────────────
const CANDIDATE_TEXT_FIELDS = [
  'Candidate Name','Title','Skills','Current Location','VISA','Email',
  'Contact No','LinkedIn','Employer','Summary',
];

function candidateText(c) {
  return CANDIDATE_TEXT_FIELDS.map(f => (c[f] || '')).join(' ').toLowerCase();
}

function evalNode(node, candidate) {
  if (!node) return true;
  const text = candidateText(candidate);
  switch (node.op) {
    case 'AND': return evalNode(node.left, candidate) && evalNode(node.right, candidate);
    case 'OR':  return evalNode(node.left, candidate) || evalNode(node.right, candidate);
    case 'NOT': return !evalNode(node.operand, candidate);
    case 'TERM':   return text.includes(node.value.toLowerCase());
    case 'PHRASE': return text.includes(node.value.toLowerCase());
    case 'FIELD': {
      const fieldMap = { skill: 'Skills', skills: 'Skills', visa: 'VISA', location: 'Current Location', title: 'Title', name: 'Candidate Name', email: 'Email' };
      const mapped = fieldMap[node.field];
      if (mapped) return (candidate[mapped] || '').toLowerCase().includes(node.value.toLowerCase());
      return text.includes(node.value.toLowerCase());
    }
    default: return true;
  }
}

// ─── exported: apply a boolean query string to an array of candidates ──────────
export function applyBooleanSearch(queryString, candidates) {
  if (!queryString?.trim()) return candidates;
  try {
    const tokens = tokenise(queryString);
    if (tokens.length === 0) return candidates;
    const pos = { i: 0 };
    const ast = parseExpr(tokens, pos);
    if (!ast) return candidates;
    return candidates.filter(c => evalNode(ast, c));
  } catch {
    // fallback: simple contains
    const q = queryString.toLowerCase();
    return candidates.filter(c => candidateText(c).includes(q));
  }
}

// ─── NLP extractor — used to pre-populate filter dropdowns ────────────────────
export function parseNaturalQuery(text) {
  if (!text) return { skills: [], location: '', visa: '', keywords: [] };
  let visa = '';
  for (const v of VISA_TYPES) { if (v.match.test(text)) { visa = v.label; break; } }

  const sortedStates = [...US_STATES].sort((a, b) => b.length - a.length);
  let location = '';
  for (const state of sortedStates) {
    const re = new RegExp(`\\b${state.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (re.test(text)) { location = state; break; }
  }

  const skills = KNOWN_SKILLS.filter(skill => {
    const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(text);
  });

  const stop = new Set(['in','with','and','or','not','the','a','an','for','of','at','to','from','on','is','are','has','have','been','senior','junior','lead','staff','engineer','developer','manager','architect','analyst','scientist','years','year','experience','yrs']);
  const used = new Set([...skills.map(s => s.toLowerCase()), visa.toLowerCase(), location.toLowerCase()]);
  const keywords = text.toLowerCase()
    .split(/[\s,+|]+/)
    .map(w => w.replace(/[^a-z0-9#.]/g, ''))
    .filter(w => w.length > 2 && !stop.has(w) && !used.has(w));

  return { skills, location, visa, keywords: [...new Set(keywords)] };
}

// ─── Example queries ───────────────────────────────────────────────────────────
const EXAMPLE_QUERIES = [
  'Snowflake AND Python AND Texas',
  '"Data Engineer" AND (H1B OR "Green Card")',
  'Java AND (AWS OR Azure) NOT Junior',
  'skill:Python AND visa:H1B',
];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function SearchBar({ value, onChange, onSearch, placeholder, resultCount }) {
  const [focused, setFocused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') onSearch?.(value);
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); }
  }, [value, onSearch]);

  const handleChip = useCallback((q) => { onChange?.(q); onSearch?.(q); }, [onChange, onSearch]);

  return (
    <div style={{ width: '100%' }}>
      {/* ── Input row ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 0,
          background: '#FFFFFF',
          border: `1.5px solid ${focused ? '#111827' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          boxShadow: focused ? '0 0 0 3px rgba(17,24,39,0.06)' : 'var(--shadow-xs)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          height: 48,
          overflow: 'hidden',
        }}
      >
        {/* Search icon */}
        <div style={{ padding: '0 12px 0 14px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Search size={16} style={{ color: focused ? '#111827' : 'var(--text-muted)' }} />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || 'Search — e.g. Python AND Texas AND H1B, or "Data Engineer" NOT Junior'}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit',
          }}
        />

        {/* Clear button */}
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.1 }}
              onClick={() => { onChange?.(''); onSearch?.(''); }}
              style={{
                padding: '0 8px', background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              }}
            >
              <X size={14} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Result count */}
        {resultCount !== undefined && !focused && value && (
          <span style={{
            padding: '0 12px', fontSize: 12, color: 'var(--text-muted)',
            fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap',
            borderLeft: '1px solid var(--border)', height: '100%',
            display: 'flex', alignItems: 'center',
          }}>
            {resultCount.toLocaleString()} results
          </span>
        )}

        {/* ⌘K */}
        <div style={{
          padding: '0 12px', display: 'flex', alignItems: 'center', gap: 3,
          fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
          flexShrink: 0, letterSpacing: '0.01em',
          borderLeft: '1px solid var(--border)', height: '100%',
        }}>
          ⌘K
        </div>

        {/* Search button */}
        <button
          onClick={() => onSearch?.(value)}
          className="btn btn-primary btn-sm"
          style={{ borderRadius: 0, height: '100%', padding: '0 20px', fontSize: 13.5 }}
        >
          Search
        </button>
      </div>

      {/* ── Bottom row: chips + help toggle ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
        {/* Example chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>Try:</span>
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => handleChip(q)}
              style={{
                padding: '3px 10px', borderRadius: 'var(--radius-full)',
                background: 'var(--bg-muted)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontSize: 11.5, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#111827'; e.currentTarget.style.color = '#111827'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Boolean help toggle */}
        <button
          onClick={() => setShowHelp(h => !h)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11.5, color: 'var(--text-muted)', background: 'none',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
            flexShrink: 0,
          }}
        >
          Boolean syntax
          {showHelp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* ── Boolean help panel ── */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              marginTop: 8, padding: '14px 16px',
              background: 'var(--bg-soft)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Boolean Search Syntax
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
              {[
                ['AND',         'Both terms required — Python AND AWS'],
                ['OR',          'Either term — H1B OR "Green Card"'],
                ['NOT or -',    'Exclude — Senior NOT Junior'],
                ['"phrase"',    'Exact phrase — "Data Engineer"'],
                ['(groups)',    'Group terms — (AWS OR Azure) AND Python'],
                ['skill:X',     'Search by field — skill:Snowflake'],
                ['visa:X',      'Filter visa — visa:H1B'],
                ['location:X',  'Filter location — location:Texas'],
              ].map(([op, desc]) => (
                <div key={op} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <code style={{
                    fontSize: 11, fontWeight: 600, color: '#5B21B6',
                    background: '#F5F3FF', padding: '1px 6px', borderRadius: 4,
                    flexShrink: 0, fontFamily: 'monospace',
                  }}>{op}</code>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Compile query AST to Supabase query ──────────────────────────────────────
export function buildSupabaseQuery(queryString, baseQuery) {
  if (!queryString?.trim()) {
    return baseQuery.order('last_updated', { ascending: false }).limit(100);
  }

  try {
    const tokens = tokenise(queryString);
    if (tokens.length === 0) {
      return baseQuery.order('last_updated', { ascending: false }).limit(100);
    }
    const pos = { i: 0 };
    const ast = parseExpr(tokens, pos);
    if (!ast) {
      return baseQuery.order('last_updated', { ascending: false }).limit(100);
    }

    let query = baseQuery;
    const fieldsToSearch = ['"Candidate Name"', 'Title', 'Skills', '"Current Location"', 'VISA'];

    function walk(node, isNegated = false) {
      if (!node) return;

      if (node.op === 'AND') {
        walk(node.left, isNegated);
        walk(node.right, isNegated);
      } else if (node.op === 'OR') {
        const leftTerms = [];
        const rightTerms = [];
        
        function collectOrTerms(n, termsList) {
          if (!n) return;
          if (n.op === 'TERM' || n.op === 'PHRASE') {
            termsList.push(n.value);
          } else if (n.op === 'FIELD') {
            termsList.push(n.value);
          } else {
            collectOrTerms(n.left, termsList);
            collectOrTerms(n.right, termsList);
          }
        }
        
        collectOrTerms(node.left, leftTerms);
        collectOrTerms(node.right, rightTerms);
        
        const allOrTerms = [...leftTerms, ...rightTerms];
        if (allOrTerms.length > 0) {
          const orFilterParts = [];
          allOrTerms.forEach(term => {
            fieldsToSearch.forEach(field => {
              orFilterParts.push(`${field}.ilike.%${term}%`);
            });
          });
          query = query.or(orFilterParts.join(','));
        }
      } else if (node.op === 'NOT') {
        walk(node.operand, !isNegated);
      } else if (node.op === 'TERM' || node.op === 'PHRASE') {
        const val = node.value;
        if (isNegated) {
          fieldsToSearch.forEach(field => {
            query = query.not(field, 'ilike', `%${val}%`);
          });
        } else {
          const parts = fieldsToSearch.map(field => `${field}.ilike.%${val}%`);
          query = query.or(parts.join(','));
        }
      } else if (node.op === 'FIELD') {
        const fieldMap = {
          skill: 'Skills',
          skills: 'Skills',
          visa: 'VISA',
          location: '"Current Location"',
          title: 'Title',
          name: '"Candidate Name"',
          email: 'Email',
          phone: '"Contact No"',
          linkedin: 'LinkedIn',
        };
        const mappedField = fieldMap[node.field];
        if (mappedField) {
          if (isNegated) {
            query = query.not(mappedField, 'ilike', `%${node.value}%`);
          } else {
            query = query.ilike(mappedField, `%${node.value}%`);
          }
        } else {
          const val = node.value;
          if (isNegated) {
            fieldsToSearch.forEach(field => {
              query = query.not(field, 'ilike', `%${val}%`);
            });
          } else {
            const parts = fieldsToSearch.map(field => `${field}.ilike.%${val}%`);
            query = query.or(parts.join(','));
          }
        }
      }
    }

    walk(ast);
    return query.limit(300);
  } catch (err) {
    console.error('[buildSupabaseQuery] Error compiling query:', err);
    return baseQuery.order('last_updated', { ascending: false }).limit(100);
  }
}

