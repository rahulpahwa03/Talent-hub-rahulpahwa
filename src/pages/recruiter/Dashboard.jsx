import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Heart, FileText, Download, Eye, ExternalLink,
  Briefcase, Shield, Clock, MapPin, Plus, Share2, MessageSquare,
  Clipboard, ChevronRight, Bookmark, BookmarkCheck, AlertTriangle,
  Upload, Zap, BarChart2, Send, RefreshCw, CheckCircle2,
  Loader2, DollarSign, Info, Link as LinkIcon, Trash2, Star,
  BookOpen, History, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import {
  filterCandidates, searchCandidatesDB, addRecentSearch,
  getRecentSearches, getSavedSearches, saveSearch, removeSavedSearch,
  EXPERIENCE_RANGES, VISA_OPTIONS, WORK_PREF_OPTIONS, AVAILABILITY_OPTIONS,
} from '../../lib/searchService';
import SkeletonCard from '../../components/ui/SkeletonCard';
import ExportMenu from '../../components/ui/ExportMenu';

/* ─── Analytics Constants ───────────────────────────────────────────────────── */
const ANALYTICS_PERIODS = ['7d', '30d', '90d', '1y'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const GROWTH_DATA = MONTHS.map((month, i) => ({
  month,
  candidates: [2100,3800,5200,7100,8800,9900,11100,12300,13200,14100,14800,15482][i],
}));
const UPLOAD_DATA = MONTHS.map((month, i) => ({
  month,
  resumes: [180,290,410,580,740,820,980,1150,1290,1320,1380,1420][i],
}));
const DEMO_SKILLS = [
  { name:'Snowflake', pct:94 }, { name:'Python', pct:88 }, { name:'AWS', pct:85 },
  { name:'React', pct:79 },     { name:'Java', pct:74 },
];
const RECRUITERS = [
  { name:'Alice Johnson', added:342, searches:189 },
  { name:'Bob Smith',     added:298, searches:167 },
  { name:'Carol Davis',   added:287, searches:154 },
  { name:'David Lee',     added:276, searches:143 },
  { name:'Emma Wilson',   added:264, searches:138 },
];

/* ─── Mock Pool ──────────────────────────────────────────────────────────────── */
const HIGH_FIDELITY_POOL = [
  {
    id:'pool-1', 'Candidate Name':'Suresh Balakrishnan', Title:'Cloud/Azure Architect',
    VISA:'GC', Skills:'Azure, AWS, GCP, Kubernetes, Terraform, Java, Python, Node.js, Snowflake, Databricks, SQL',
    'Current Location':'Austin, TX', Email:'suresh.bala@email.com', 'Contact No':'+1 (512) 849-2034',
    LinkedIn:'https://linkedin.com/in/sureshbala', resume_url:'/demo_resume.pdf',
    summary:'Senior Cloud Architect with 11+ years leading migration and systems design pipelines on AWS and Azure.',
    notes:'Top candidate.', created_at:'2026-06-01T08:00:00Z', favorite:true, experience:11,
    work_preference:'Remote', availability:'Immediate', relocation:true,
  },
  {
    id:'pool-2', 'Candidate Name':'Mohini Missula', Title:'Java / AI Engineer',
    VISA:'H1B', Skills:'Java, Spring Boot, Microservices, Python, LangChain, OpenAI API, RAG, Vector DBs, AWS, Docker',
    'Current Location':'Dallas, TX', Email:'mohini.m@email.com', 'Contact No':'+1 (214) 603-8821',
    LinkedIn:'https://linkedin.com/in/mohinim', resume_url:'/demo_resume.pdf',
    summary:'AI Backend Specialist pivoting enterprise Java microservices into generative workflows.',
    notes:'Speaks well.', created_at:'2026-06-03T09:30:00Z', favorite:false, experience:7,
    work_preference:'Hybrid', availability:'15 Days', relocation:false,
  },
  {
    id:'pool-3', 'Candidate Name':'Anandh Arumugan', Title:'Senior Product Designer',
    VISA:'USC', Skills:'Figma, Design Systems, Prototyping, User Research, React, CSS, Framer, Storybook',
    'Current Location':'New York, NY', Email:'anandh.a@email.com', 'Contact No':'+1 (917) 441-7703',
    LinkedIn:'https://linkedin.com/in/anandhdesigns', resume_url:'',
    summary:'Product UX Specialist with 9 years designing interface architectures for fintech.',
    notes:'Design portfolio is exceptional.', created_at:'2026-06-04T12:00:00Z', favorite:true, experience:9,
    work_preference:'Remote', availability:'30 Days', relocation:true,
  },
  {
    id:'pool-4', 'Candidate Name':'Maheshwari Kakkireni', Title:'Senior AEM Developer',
    VISA:'H1B', Skills:'Adobe AEM, Sling, OSGi, JCR, Java, Maven, REST APIs, HTML5, CSS3, JavaScript',
    'Current Location':'Chicago, IL', Email:'mahesh.k@email.com', 'Contact No':'+1 (312) 557-9900',
    LinkedIn:'https://linkedin.com/in/maheshwariak', resume_url:'/demo_resume.pdf',
    summary:'Senior Content Solutions Architect specializing in Adobe Experience Manager.',
    notes:'Available starting mid-July.', created_at:'2026-06-05T14:15:00Z', favorite:false, experience:6,
    work_preference:'Onsite', availability:'15 Days', relocation:false,
  },
  {
    id:'pool-5', 'Candidate Name':'Muhammad Suleman', Title:'Data Engineer',
    VISA:'OPT', Skills:'Python, Scala, Apache Spark, Kafka, Airflow, dbt, SQL, PostgreSQL, AWS, Docker',
    'Current Location':'San Jose, CA', Email:'muhammad.suleman@email.com', 'Contact No':'+1 (408) 555-0192',
    LinkedIn:'https://linkedin.com/in/muhammadsuleman', resume_url:'/demo_resume.pdf',
    summary:'Data Sourcing Specialist with 4 years building high-velocity pipelines.',
    notes:'OPT holder, requires sponsorship.', created_at:'2026-06-06T11:00:00Z', favorite:false, experience:4,
    work_preference:'Remote', availability:'Immediate', relocation:true,
  },
];

/* ─── Styling Helpers ────────────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  { bg:'#EFF6FF', text:'#2563EB', border:'#BFDBFE' },
  { bg:'#F5F3FF', text:'#7C3AED', border:'#C4B5FD' },
  { bg:'#F0FDF4', text:'#16A34A', border:'#BBF7D0' },
  { bg:'#FFFBEB', text:'#D97706', border:'#FDE68A' },
  { bg:'#FFF1F2', text:'#E11D48', border:'#FECDD3' },
];
function getAvatar(name) {
  const code = (name || '').charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}
function initials(name) {
  return (name || '').split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase();
}

/* Visa badge styling */
const VISA_COLORS = {
  'USC':    { bg:'#ECFDF5', text:'#065F46', border:'#A7F3D0' },
  'GC':     { bg:'#EFF6FF', text:'#1E40AF', border:'#BFDBFE' },
  'H1B':    { bg:'#FFF7ED', text:'#9A3412', border:'#FED7AA' },
  'OPT':    { bg:'#F5F3FF', text:'#5B21B6', border:'#DDD6FE' },
  'CPT':    { bg:'#FDF4FF', text:'#7E22CE', border:'#E9D5FF' },
};
function getVisaColor(visa) {
  const v = (visa || '').toUpperCase();
  if (v.includes('CITIZEN') || v.includes('USC')) return VISA_COLORS['USC'];
  if (v.includes('GREEN') || v === 'GC') return VISA_COLORS['GC'];
  if (v.includes('H1B') || v.includes('H-1B')) return VISA_COLORS['H1B'];
  if (v.includes('OPT')) return VISA_COLORS['OPT'];
  if (v.includes('CPT')) return VISA_COLORS['CPT'];
  return { bg:'#F7F6FB', text:'#6B6B8A', border:'#E8E6F0' };
}

/* Work preference colors */
const WORK_COLORS = {
  'Remote': { bg:'#F0FDF4', text:'#166534', border:'#BBF7D0' },
  'Hybrid': { bg:'#FFF7ED', text:'#9A3412', border:'#FED7AA' },
  'Onsite': { bg:'#EFF6FF', text:'#1E40AF', border:'#BFDBFE' },
};
function getWorkColor(pref) {
  return WORK_COLORS[pref] || { bg:'#F7F6FB', text:'#6B6B8A', border:'#E8E6F0' };
}

const SKILL_COLORS = [
  { bg:'#F0EEFF', text:'#5B4FCC' },
  { bg:'#E1F5EE', text:'#0F6E56' },
  { bg:'#E6F1FB', text:'#185FA5' },
  { bg:'#FAECE7', text:'#993C1D' },
  { bg:'#FAEEDA', text:'#854F0B' },
];
function getSkillColor(i) { return SKILL_COLORS[i % 5]; }

function getEmbeddableUrl(url) {
  if (!url) return '';
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9\-_]+)/);
  if (openMatch) return `https://drive.google.com/file/d/${openMatch[1]}/preview`;
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9\-_]+)/);
  if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  const lc = url.toLowerCase();
  if (lc.endsWith('.docx') || lc.endsWith('.doc') || lc.includes('.docx?') || lc.includes('.doc?')) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return url;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000*60*60*24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff/7)}w ago`;
  if (diff < 365) return `${Math.floor(diff/30)}mo ago`;
  return d.toLocaleDateString('en-US', { month:'short', year:'numeric' });
}

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

/* ─── Pill Toggle Component ─────────────────────────────────────────────────── */
function PillGroup({ label, options, selected, onToggle, multi = true }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <span style={{ fontSize:11, fontWeight:600, color:'#A0A0B8', textTransform:'uppercase', letterSpacing:'0.06em' }}>
        {label}
      </span>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
        {options.map(opt => {
          const isActive = multi ? selected.includes(opt) : selected === opt;
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              style={{
                padding:'5px 12px',
                fontSize:12,
                fontWeight:500,
                borderRadius:99,
                border:`1.5px solid ${isActive ? '#6C5CE7' : '#E8E6F0'}`,
                background: isActive ? '#F0EEFF' : '#fff',
                color: isActive ? '#5B4FCC' : '#6B6B8A',
                cursor:'pointer',
                transition:'all 0.12s ease',
                userSelect:'none',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Smart Search Bar ───────────────────────────────────────────────────────── */
function SmartSearchBar({ value, onChange, onSaveSearch }) {
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState([]);
  const [saved, setSaved] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setRecent(getRecentSearches());
    setSaved(getSavedSearches());
  }, [focused]);

  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasHistory = recent.length > 0 || saved.length > 0;
  const showMenu = showDropdown && !value.trim() && hasHistory;

  return (
    <div ref={containerRef} style={{ position:'relative', flex:1, maxWidth:640 }}>
      <div style={{
        display:'flex', alignItems:'center', gap:10,
        height:40, padding:'0 14px',
        background:'#fff',
        border:`1.5px solid ${focused ? '#6C5CE7' : '#E8E6F0'}`,
        borderRadius:12,
        boxShadow: focused ? '0 0 0 3px rgba(108,92,231,0.1)' : 'none',
        transition:'all 0.15s ease',
      }}>
        <Search size={14} style={{ color: focused ? '#6C5CE7' : '#A0A0B8', flexShrink:0 }} />
        <input
          ref={inputRef}
          type="text"
          placeholder='Search candidates… e.g. "Java AND Spring NOT Angular"'
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => { setFocused(true); setShowDropdown(true); }}
          onBlur={() => setFocused(false)}
          style={{
            border:'none', outline:'none', flex:1, fontSize:13.5,
            fontFamily:'Inter, sans-serif', color:'#1A1A2E', background:'transparent',
          }}
        />
        {value && (
          <button
            onMouseDown={e => { e.preventDefault(); onChange(''); }}
            style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:'#A0A0B8', display:'flex' }}
          >
            <X size={13} />
          </button>
        )}
        {value.trim() && (
          <button
            onMouseDown={e => { e.preventDefault(); onSaveSearch(value); }}
            title="Save this search"
            style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:'#A0A0B8', display:'flex' }}
          >
            <Bookmark size={13} />
          </button>
        )}
      </div>

      {/* Dropdown: Recent + Saved */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity:0, y:-4 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-4 }}
            transition={{ duration:0.12 }}
            style={{
              position:'absolute', top:'calc(100% + 6px)', left:0, right:0,
              background:'#fff', border:'1px solid #E8E6F0', borderRadius:12,
              boxShadow:'0 8px 32px rgba(0,0,0,0.1)', zIndex:300,
              padding:'8px 0', maxHeight:280, overflowY:'auto',
            }}
          >
            {saved.length > 0 && (
              <>
                <div style={{ padding:'4px 14px 8px', fontSize:10, fontWeight:700, color:'#A0A0B8', textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:5 }}>
                  <Bookmark size={10} /> Saved Searches
                </div>
                {saved.slice(0,5).map(s => (
                  <button
                    key={s.id}
                    onMouseDown={e => { e.preventDefault(); onChange(s.query); setShowDropdown(false); }}
                    style={{
                      width:'100%', padding:'8px 14px', background:'none', border:'none',
                      textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center',
                      justifyContent:'space-between', gap:8,
                      fontSize:13, color:'#1A1A2E', fontFamily:'Inter, sans-serif',
                      transition:'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F7F6FB'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <Star size={12} style={{ color:'#F59E0B' }} />
                      {s.name}
                    </span>
                    <button
                      onMouseDown={e => { e.stopPropagation(); e.preventDefault(); removeSavedSearch(s.id); setSaved(getSavedSearches()); }}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:'#C4BFEA', display:'flex' }}
                    >
                      <X size={11} />
                    </button>
                  </button>
                ))}
                <div style={{ height:1, background:'#F0EFF8', margin:'4px 14px 6px' }} />
              </>
            )}
            {recent.length > 0 && (
              <>
                <div style={{ padding:'4px 14px 8px', fontSize:10, fontWeight:700, color:'#A0A0B8', textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:5 }}>
                  <History size={10} /> Recent Searches
                </div>
                {recent.slice(0,6).map((q, i) => (
                  <button
                    key={i}
                    onMouseDown={e => { e.preventDefault(); onChange(q); setShowDropdown(false); }}
                    style={{
                      width:'100%', padding:'8px 14px', background:'none', border:'none',
                      textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:7,
                      fontSize:13, color:'#6B6B8A', fontFamily:'Inter, sans-serif',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F7F6FB'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <History size={11} style={{ color:'#C4BFEA', flexShrink:0 }} />
                    {q}
                  </button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Resume Section ─────────────────────────────────────────────────────────── */
function ResumeSection({ candidate, onPreview }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const resumeUrl = (candidate.resume_url || candidate['Resume URL'] || '').trim();
  const hasResume = resumeUrl.length > 5;

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file || !supabase) return;
    setUploading(true);
    try {
      const fileName = `uploads/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('resumes').upload(fileName, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
      toast.success('Resume uploaded successfully!');
      // Reload page to reflect new URL
      window.location.reload();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleDownload() {
    const a = document.createElement('a');
    a.href = resumeUrl;
    a.download = candidate['resume_file_name'] || `${candidate['Candidate Name'] || 'resume'}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (hasResume) {
    return (
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        <button
          onClick={() => onPreview(resumeUrl)}
          style={btnStyle('#F0EEFF', '#5B4FCC', '#D4CFFA')}
        >
          <Eye size={11} /> Preview
        </button>
        <a
          href={resumeUrl}
          target="_blank"
          rel="noreferrer"
          style={{ ...btnStyle('#E6F1FB', '#185FA5', '#BFDBFE'), textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}
        >
          <ExternalLink size={11} /> Open
        </a>
        <button onClick={handleDownload} style={btnStyle('#E1F5EE', '#0F6E56', '#BBF7D0')}>
          <Download size={11} /> Download
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'8px 12px',
      background:'#FFFBEB', border:'1px dashed #FCD34D', borderRadius:8,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <AlertTriangle size={12} style={{ color:'#D97706', flexShrink:0 }} />
        <span style={{ fontSize:11, color:'#92400E', fontWeight:500 }}>No Resume Attached</span>
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{ ...btnStyle('#FFF7ED', '#9A3412', '#FED7AA'), fontSize:10.5 }}
      >
        <Upload size={10} />
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display:'none' }} onChange={handleUpload} />
    </div>
  );
}

function btnStyle(bg, text, border) {
  return {
    padding:'5px 10px', fontSize:11.5, fontWeight:500,
    background: bg, color: text, border:`1px solid ${border}`,
    borderRadius:7, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4,
    transition:'opacity 0.1s', userSelect:'none', whiteSpace:'nowrap',
  };
}

/* ─── Candidate Card ─────────────────────────────────────────────────────────── */
function CandidateCard({ candidate: c, onViewProfile, onPreviewResume, onToggleFavorite, selected, onSelect, searchQuery }) {
  const [hovered, setHovered] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const avatarColor = getAvatar(c['Candidate Name']);
  const resumeUrl = (c.resume_url || c['Resume URL'] || '').trim();
  const hasResume = resumeUrl.length > 5;
  let skillList = [];
  const rawSkills = c['Skills'] || c.skills || '';
  if (Array.isArray(rawSkills)) {
    skillList = rawSkills.map(s => (s || '').trim()).filter(Boolean);
  } else if (typeof rawSkills === 'string') {
    skillList = rawSkills.split(/[|,]/).map(s => s.trim()).filter(Boolean);
  }
  const visaColor = getVisaColor(c['VISA'] || c.visa || '');
  const workColor = getWorkColor(c.work_preference || c.workPref || '');
  const expYears = parseInt(c.experience_years || c.experience || 0);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:'#fff',
        border: selected ? '1.5px solid #6C5CE7' : `1.5px solid ${hovered ? '#C4BFEA' : '#E8E6F0'}`,
        borderRadius:16,
        padding:'20px',
        display:'flex',
        flexDirection:'column',
        gap:14,
        cursor:'default',
        transition:'all 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 24px rgba(108,92,231,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
        position:'relative',
        boxSizing:'border-box',
      }}
    >
      {/* Selection checkbox */}
      <button
        onClick={e => { e.stopPropagation(); onSelect(c.id); }}
        style={{
          position:'absolute', top:14, right:14,
          width:18, height:18, borderRadius:5,
          border:`1.5px solid ${selected ? '#6C5CE7' : '#C4BFEA'}`,
          background: selected ? '#6C5CE7' : '#fff',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all 0.12s ease',
        }}
      >
        {selected && <svg width="10" height="10" viewBox="0 0 12 12"><path fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m2 6 3 3 5-5"/></svg>}
      </button>

      {/* TOP: Avatar + Name + Title + Exp */}
      <div style={{ display:'flex', gap:12, alignItems:'flex-start', paddingRight:28 }}>
        <div style={{
          width:46, height:46, borderRadius:'50%', flexShrink:0,
          background:avatarColor.bg, color:avatarColor.text,
          border:`1.5px solid ${avatarColor.border}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:15, fontWeight:700, userSelect:'none',
        }}>
          {initials(c['Candidate Name'])}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <h4 style={{ margin:0, fontSize:14.5, fontWeight:700, color:'#1A1A2E', lineHeight:1.3 }}>
              {c['Candidate Name'] || 'Unknown'}
            </h4>
            {expYears > 0 && (
              <span style={{
                fontSize:10.5, fontWeight:600, padding:'2px 8px',
                background:'#F7F6FB', color:'#6B6B8A', borderRadius:99,
                border:'1px solid #E8E6F0', whiteSpace:'nowrap',
              }}>
                {expYears} yrs
              </span>
            )}
          </div>
          <p style={{ margin:'3px 0 0', fontSize:12.5, color:'#6B6B8A', fontWeight:500, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
            {c['Title'] || c.role || 'Technical Consultant'}
          </p>
        </div>
      </div>

      {/* MIDDLE: Skills pills */}
      {skillList.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {skillList.slice(0,6).map((s, i) => {
            const col = getSkillColor(i);
            return (
              <span key={i} style={{
                padding:'3px 9px', fontSize:11, fontWeight:500,
                background:col.bg, color:col.text, borderRadius:99,
                border:'none', whiteSpace:'nowrap',
              }}>
                {s}
              </span>
            );
          })}
          {skillList.length > 6 && (
            <span style={{ padding:'3px 9px', fontSize:11, color:'#A0A0B8', background:'#F7F6FB', borderRadius:99, border:'1px solid #E8E6F0' }}>
              +{skillList.length - 6}
            </span>
          )}
        </div>
      )}

      {/* Badges row: Visa + Work Pref + Availability */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {(c['VISA'] || c.visa) && (
          <span style={{
            padding:'3px 10px', fontSize:11, fontWeight:600, borderRadius:99,
            background:visaColor.bg, color:visaColor.text, border:`1px solid ${visaColor.border}`,
            whiteSpace:'nowrap',
          }}>
            {c['VISA'] || c.visa}
          </span>
        )}
        {(c.work_preference || c.workPref) && (
          <span style={{
            padding:'3px 10px', fontSize:11, fontWeight:500, borderRadius:99,
            background:workColor.bg, color:workColor.text, border:`1px solid ${workColor.border}`,
            whiteSpace:'nowrap',
          }}>
            {c.work_preference || c.workPref}
          </span>
        )}
        {(c.availability || c.availableFrom) && (
          <span style={{
            padding:'3px 10px', fontSize:11, fontWeight:500, borderRadius:99,
            background:'#F0FDF4', color:'#166534', border:'1px solid #BBF7D0',
            whiteSpace:'nowrap',
          }}>
            <Clock size={9} style={{ marginRight:4, verticalAlign:'middle' }} />
            {c.availability || c.availableFrom}
          </span>
        )}
      </div>

      {/* Resume section */}
      <ResumeSection candidate={c} onPreview={onPreviewResume} />

      {/* BOTTOM: Action buttons */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:2 }}>
        <button
          onClick={() => onViewProfile(c)}
          style={{
            flex:1, height:34, fontSize:12.5, fontWeight:600,
            background:'#6C5CE7', color:'#fff', border:'none', borderRadius:9,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5,
            transition:'background 0.12s', minWidth:90,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#5A4BD1'}
          onMouseLeave={e => e.currentTarget.style.background = '#6C5CE7'}
        >
          <Eye size={12} /> View Profile
        </button>

        <button
          onClick={() => onToggleFavorite(c)}
          title={c.favorite ? 'Remove bookmark' : 'Bookmark'}
          style={{
            width:34, height:34, borderRadius:9, flexShrink:0,
            background: c.favorite ? '#FFF1F2' : '#fff',
            border:`1.5px solid ${c.favorite ? '#FECDD3' : '#E8E6F0'}`,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.12s ease',
          }}
        >
          <Heart size={13} fill={c.favorite ? '#E11D48' : 'none'} color={c.favorite ? '#E11D48' : '#A0A0B8'} />
        </button>
      </div>

      {/* Last updated */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:-6 }}>
        <span style={{ fontSize:10.5, color:'#C4BFEA' }}>
          {formatDate(c.created_at || c.last_updated)}
        </span>
        {c['Current Location'] && (
          <span style={{ fontSize:10.5, color:'#C4BFEA', display:'flex', alignItems:'center', gap:3 }}>
            <MapPin size={9} />
            {c['Current Location']}
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN RECRUITER DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function RecruiterDashboard({ activeTab }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  /* Data state */
  const [allCandidates, setAllCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  /* Search state */
  const [searchVal, setSearchVal] = useState(urlQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  /* Filter state — new clean system */
  const [filterVisa, setFilterVisa] = useState([]);
  const [filterWorkPref, setFilterWorkPref] = useState([]);
  const [filterAvailability, setFilterAvailability] = useState([]);
  const [filterExpRange, setFilterExpRange] = useState(null);
  const [filterRelocation, setFilterRelocation] = useState(null); // null | true | false

  /* Selection */
  const [selectedIds, setSelectedIds] = useState(new Set());

  /* Sort */
  const [sortOrder, setSortOrder] = useState('newest');

  /* Modals */
  const [resumePreviewUrl, setResumePreviewUrl] = useState(null);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isAskCandidateOpen, setIsAskCandidateOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState({ to:'', subject:'', body:'' });

  /* Add Candidate form */
  const [newCandidateForm, setNewCandidateForm] = useState({
    name:'', email:'', phone:'', linkedin:'', location:'',
    visa:'', title:'', currentEmployer:'', experience:'', skills:'', summary:'',
    workPref:'', availability:'',
  });
  const [newCandidateFile, setNewCandidateFile] = useState(null);
  const [addingCandidate, setAddingCandidate] = useState(false);

  /* Analytics */
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');

  /* Sync URL with search */
  useEffect(() => { setSearchVal(urlQuery); }, [urlQuery]);

  const handleSearchChange = useCallback((val) => {
    setSearchVal(val);
    setSearchParams(val ? { q: val } : {});
    setCurrentPage(1);
  }, [setSearchParams]);

  /* Load candidates on mount */
  useEffect(() => {
    async function fetchDb() {
      try {
        setLoading(true);
        if (!supabase) {
          setAllCandidates(HIGH_FIDELITY_POOL);
          return;
        }
        const { data, error } = await supabase.from('candidates').select('*');
        const dbData = data || [];
        const merged = [...dbData];
        HIGH_FIDELITY_POOL.forEach(item => {
          if (!merged.some(c => c.Email === item.Email)) merged.push(item);
        });
        setAllCandidates(merged);
        if (error) console.warn('DB fetch partial error:', error);
      } catch (err) {
        console.error('DB error:', err);
        setAllCandidates(HIGH_FIDELITY_POOL);
      } finally {
        setLoading(false);
      }
    }
    fetchDb();
  }, []);

  /* Processed candidates — search + filter + sort */
  const processedCandidates = useMemo(() => {
    let result = filterCandidates(allCandidates, {
      query: searchVal,
      visa: filterVisa,
      workPref: filterWorkPref,
      availability: filterAvailability,
      experienceRange: filterExpRange,
      relocation: filterRelocation,
    });

    if (!searchVal.trim()) {
      // Sort only when no search query (search service handles ranking)
      if (sortOrder === 'newest') {
        result = [...result].sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0));
      } else if (sortOrder === 'experience-desc') {
        result = [...result].sort((a,b) => parseInt(b.experience||0) - parseInt(a.experience||0));
      } else if (sortOrder === 'experience-asc') {
        result = [...result].sort((a,b) => parseInt(a.experience||0) - parseInt(b.experience||0));
      }
    }

    return result;
  }, [allCandidates, searchVal, filterVisa, filterWorkPref, filterAvailability, filterExpRange, filterRelocation, sortOrder]);

  /* Reset pagination on filter/search change */
  useEffect(() => { setCurrentPage(1); }, [searchVal, filterVisa, filterWorkPref, filterAvailability, filterExpRange, filterRelocation, sortOrder]);

  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedCandidates.slice(start, start + ITEMS_PER_PAGE);
  }, [processedCandidates, currentPage]);

  const totalPages = Math.ceil(processedCandidates.length / ITEMS_PER_PAGE);

  /* Selected candidates objects */
  const selectedCandidates = useMemo(() =>
    allCandidates.filter(c => selectedIds.has(c.id)), [allCandidates, selectedIds]);

  /* Metrics */
  const metrics = useMemo(() => ({
    total:         allCandidates.length > 100 ? 15482 : allCandidates.length,
    bookmarked:    allCandidates.filter(c => c.favorite).length,
    withResume:    allCandidates.filter(c => (c.resume_url || '').length > 5).length,
    matchQuality:  '94.6%',
    activeSearches:843,
  }), [allCandidates]);

  /* Toggle filter helpers */
  function toggleMultiFilter(val, setter) {
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  }
  function toggleExpRange(range) {
    setFilterExpRange(prev => prev?.label === range.label ? null : range);
  }
  function toggleRelocation(val) {
    setFilterRelocation(prev => prev === val ? null : val);
  }

  const activeFilterCount = filterVisa.length + filterWorkPref.length + filterAvailability.length +
    (filterExpRange ? 1 : 0) + (filterRelocation !== null ? 1 : 0);

  function clearAllFilters() {
    setFilterVisa([]);
    setFilterWorkPref([]);
    setFilterAvailability([]);
    setFilterExpRange(null);
    setFilterRelocation(null);
  }

  /* Bookmark toggle */
  async function handleToggleFavorite(cand) {
    const nextFav = !cand.favorite;
    if (supabase && !String(cand.id).startsWith('pool-')) {
      await supabase.from('candidates').update({ favorite: nextFav }).eq('id', cand.id);
    }
    setAllCandidates(prev => prev.map(c => c.id === cand.id ? { ...c, favorite: nextFav } : c));
    toast.success(nextFav ? '⭐ Bookmarked' : 'Bookmark removed');
  }

  /* Selection */
  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  /* Save search */
  function handleSaveSearch(query) {
    const saved = saveSearch(query, query);
    if (saved) toast.success('Search saved!');
  }

  /* View profile */
  function handleViewProfile(cand) {
    if (cand.id && !String(cand.id).startsWith('pool-')) {
      navigate(`/recruiter/candidates/${cand.id}`);
    } else {
      toast('Full profile page only available for database candidates.');
    }
  }

  /* Add candidate submit */
  async function handleAddCandidateSubmit(e) {
    e.preventDefault();
    if (!newCandidateForm.name.trim()) return toast.error('Name is required');
    if (!newCandidateForm.email.trim()) return toast.error('Email is required');
    setAddingCandidate(true);
    try {
      let resumeUrl = '';
      if (!supabase) {
        setAllCandidates(prev => [{
          id: `pool-new-${Date.now()}`,
          'Candidate Name': newCandidateForm.name,
          Email: newCandidateForm.email,
          'Contact No': newCandidateForm.phone,
          LinkedIn: newCandidateForm.linkedin,
          'Current Location': newCandidateForm.location,
          VISA: newCandidateForm.visa || 'USC',
          Title: newCandidateForm.title || 'Consultant',
          Skills: newCandidateForm.skills,
          experience: newCandidateForm.experience || 1,
          summary: newCandidateForm.summary,
          resume_url: '/demo_resume.pdf',
          created_at: new Date().toISOString(),
          favorite: false,
          work_preference: newCandidateForm.workPref,
          availability: newCandidateForm.availability,
        }, ...prev]);
        toast.success('Candidate added (Demo Mode)!');
        setIsAddCandidateOpen(false);
        return;
      }
      if (newCandidateFile) {
        const fn = `uploads/${Date.now()}_${newCandidateFile.name}`;
        const { error: upErr } = await supabase.storage.from('resumes').upload(fn, newCandidateFile);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fn);
          resumeUrl = urlData?.publicUrl || '';
        }
      }
      const { error } = await supabase.rpc('insert_candidate', {
        p_name: newCandidateForm.name, p_email: newCandidateForm.email,
        p_phone: newCandidateForm.phone, p_linkedin: newCandidateForm.linkedin,
        p_location: newCandidateForm.location, p_visa: newCandidateForm.visa,
        p_title: newCandidateForm.title, p_skills: newCandidateForm.skills,
        p_experience: newCandidateForm.experience, p_employer: newCandidateForm.currentEmployer,
        p_summary: newCandidateForm.summary, p_resume_url: resumeUrl,
        p_resume_file: newCandidateFile?.name || '', p_resume_text: newCandidateForm.summary,
        p_notes: null, p_source: 'recruiter_add',
      });
      if (error) throw error;
      toast.success('Candidate added successfully!');
      setIsAddCandidateOpen(false);
      setNewCandidateForm({ name:'', email:'', phone:'', linkedin:'', location:'', visa:'', title:'', currentEmployer:'', experience:'', skills:'', summary:'', workPref:'', availability:'' });
      setNewCandidateFile(null);
      const { data: refreshed } = await supabase.from('candidates').select('*');
      if (refreshed) {
        const merged = [...refreshed];
        HIGH_FIDELITY_POOL.forEach(item => { if (!merged.some(c => c.Email === item.Email)) merged.push(item); });
        setAllCandidates(merged);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to add candidate');
    } finally {
      setAddingCandidate(false);
    }
  }

  /* ── Render ── */
  return (
    <div style={{ height:'calc(100vh - 56px)', background:'var(--bg-soft)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Sub-nav tabs */}
      <div style={{ background:'var(--bg)', padding:'0 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
        {[
          { id:'dashboard', label:'Workspace' },
          { id:'analytics', label:'Analytics' },
        ].map(tab => {
          const isActive = activeTab === tab.id || (activeTab === 'candidates' && tab.id === 'dashboard');
          return (
            <button
              key={tab.id}
              onClick={() => navigate(`/recruiter/${tab.id}`)}
              style={{
                padding:'12px 18px', fontSize:13.5, fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background:'none', border:'none', cursor:'pointer',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                transition:'color 0.15s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsAskCandidateOpen(true)} style={{ display:'flex', gap:5 }}>
            <Share2 size={12} /> Share Portal
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsAddCandidateOpen(true)} style={{ display:'flex', gap:5 }}>
            <Plus size={12} /> Add Candidate
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <AnimatePresence mode="wait">

          {/* ── WORKSPACE TAB ── */}
          {(activeTab === 'dashboard' || activeTab === 'candidates') && (
            <motion.div key="workspace" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ display:'flex', flex:1, flexDirection:'column', overflow:'hidden' }}
            >
              {/* Metrics bar */}
              <div style={{
                background:'var(--bg)', padding:'14px 24px',
                borderBottom:'1px solid var(--border)',
                display:'flex', gap:24, flexShrink:0, overflowX:'auto',
              }}>
                {[
                  { label:'Total Candidates', value: metrics.total.toLocaleString(), color:'#2563EB', bg:'#EFF6FF' },
                  { label:'Bookmarked',        value: metrics.bookmarked,            color:'#E11D48', bg:'#FFF1F2' },
                  { label:'With Resume',        value: metrics.withResume,           color:'#16A34A', bg:'#F0FDF4' },
                  { label:'Active Searches',    value: metrics.activeSearches,       color:'#D97706', bg:'#FFFBEB' },
                  { label:'Match Quality',      value: metrics.matchQuality,         color:'#7C3AED', bg:'#F5F3FF' },
                ].map((m, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:m.bg, color:m.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Zap size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize:10.5, color:'var(--text-muted)', fontWeight:500 }}>{m.label}</div>
                      <div style={{ fontSize:17, fontWeight:700, color:'var(--text-primary)', lineHeight:1.2 }}>{m.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Roster layout: sidebar + main */}
              <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

                {/* ── LEFT FILTERS SIDEBAR ── */}
                <div style={{
                  width:232, flexShrink:0, borderRight:'1px solid var(--border)',
                  background:'var(--bg)', overflowY:'auto', padding:'18px 16px',
                  display:'flex', flexDirection:'column', gap:20,
                }}>
                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#A0A0B8', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      Filters
                      {activeFilterCount > 0 && (
                        <span style={{ marginLeft:6, background:'#6C5CE7', color:'#fff', borderRadius:99, padding:'1px 7px', fontSize:10 }}>
                          {activeFilterCount}
                        </span>
                      )}
                    </span>
                    {activeFilterCount > 0 && (
                      <button onClick={clearAllFilters} style={{ fontSize:11, color:'#6C5CE7', background:'none', border:'none', cursor:'pointer', fontWeight:500 }}>
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Experience */}
                  <PillGroup
                    label="Experience"
                    options={EXPERIENCE_RANGES.map(r => r.label)}
                    selected={filterExpRange?.label || ''}
                    onToggle={label => toggleExpRange(EXPERIENCE_RANGES.find(r => r.label === label))}
                    multi={false}
                  />

                  {/* Work Preference */}
                  <PillGroup
                    label="Work Preference"
                    options={WORK_PREF_OPTIONS}
                    selected={filterWorkPref}
                    onToggle={v => toggleMultiFilter(v, setFilterWorkPref)}
                  />

                  {/* Visa Status */}
                  <PillGroup
                    label="Visa Status"
                    options={VISA_OPTIONS}
                    selected={filterVisa}
                    onToggle={v => toggleMultiFilter(v, setFilterVisa)}
                  />

                  {/* Availability */}
                  <PillGroup
                    label="Availability"
                    options={AVAILABILITY_OPTIONS}
                    selected={filterAvailability}
                    onToggle={v => toggleMultiFilter(v, setFilterAvailability)}
                  />

                  {/* Relocation */}
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:'#A0A0B8', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      Relocation
                    </span>
                    <div style={{ display:'flex', gap:5 }}>
                      {['Yes', 'No'].map(v => {
                        const val = v === 'Yes';
                        const isActive = filterRelocation === val;
                        return (
                          <button
                            key={v}
                            onClick={() => toggleRelocation(val)}
                            style={{
                              flex:1, padding:'5px 0', fontSize:12, fontWeight:500, borderRadius:99,
                              border:`1.5px solid ${isActive ? '#6C5CE7' : '#E8E6F0'}`,
                              background: isActive ? '#F0EEFF' : '#fff',
                              color: isActive ? '#5B4FCC' : '#6B6B8A',
                              cursor:'pointer', transition:'all 0.12s ease',
                            }}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height:1, background:'#F0EFF8' }} />

                  {/* Sort */}
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:'#A0A0B8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Sort By</span>
                    <select
                      value={sortOrder}
                      onChange={e => setSortOrder(e.target.value)}
                      style={{
                        height:36, padding:'0 12px', fontSize:12.5, borderRadius:9,
                        border:'1.5px solid #E8E6F0', background:'#fff', color:'#1A1A2E',
                        fontFamily:'Inter, sans-serif', cursor:'pointer', outline:'none',
                      }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="experience-desc">Most Experience</option>
                      <option value="experience-asc">Least Experience</option>
                    </select>
                  </div>
                </div>

                {/* ── MAIN CONTENT: Search + Cards ── */}
                <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

                  {/* Search + controls row */}
                  <div style={{
                    padding:'12px 20px', borderBottom:'1px solid var(--border)',
                    background:'var(--bg)', display:'flex', gap:10, alignItems:'center', flexShrink:0,
                  }}>
                    <SmartSearchBar
                      value={searchVal}
                      onChange={(val) => {
                        handleSearchChange(val);
                        if (val.trim().length > 2) addRecentSearch(val.trim());
                      }}
                      onSaveSearch={handleSaveSearch}
                    />

                    {/* Result count */}
                    {!loading && (
                      <span style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap', flexShrink:0 }}>
                        {processedCandidates.length.toLocaleString()} results
                      </span>
                    )}

                    {/* Export */}
                    <ExportMenu
                      allCandidates={allCandidates}
                      selectedCandidates={selectedCandidates}
                      searchResults={processedCandidates}
                    />

                    {/* Selected indicator */}
                    {selectedIds.size > 0 && (
                      <span style={{
                        padding:'5px 12px', background:'#F0EEFF', color:'#5B4FCC',
                        borderRadius:99, fontSize:12, fontWeight:600, whiteSpace:'nowrap',
                      }}>
                        {selectedIds.size} selected
                      </span>
                    )}
                  </div>

                  {/* Card grid */}
                  <div style={{ flex:1, overflowY:'auto', padding:'20px', background:'var(--bg-soft)' }}>
                    {loading ? (
                      <div style={{
                        display:'grid',
                        gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))',
                        gap:14,
                      }}>
                        {Array.from({ length:12 }).map((_, i) => <SkeletonCard key={i} />)}
                      </div>
                    ) : processedCandidates.length === 0 ? (
                      <div style={{
                        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                        height:300, gap:12, color:'var(--text-muted)',
                      }}>
                        <Search size={40} style={{ opacity:0.25 }} />
                        <p style={{ fontSize:14, margin:0 }}>No candidates match your search or filters.</p>
                        <button onClick={() => { handleSearchChange(''); clearAllFilters(); }} className="btn btn-secondary btn-sm">
                          Clear all filters
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{
                          display:'grid',
                          gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))',
                          gap:14,
                        }}>
                          {paginatedCandidates.map(cand => (
                            <CandidateCard
                              key={cand.id}
                              candidate={cand}
                              onViewProfile={handleViewProfile}
                              onPreviewResume={setResumePreviewUrl}
                              onToggleFavorite={handleToggleFavorite}
                              selected={selectedIds.has(cand.id)}
                              onSelect={toggleSelect}
                              searchQuery={searchVal}
                            />
                          ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div style={{
                            display:'flex', alignItems:'center', justifyContent:'space-between',
                            padding:'16px 0 0', marginTop:8,
                            borderTop:'1px solid var(--border)',
                          }}>
                            <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>
                              Showing <strong>{((currentPage-1)*ITEMS_PER_PAGE)+1}</strong>–<strong>{Math.min(currentPage*ITEMS_PER_PAGE, processedCandidates.length)}</strong> of <strong>{processedCandidates.length.toLocaleString()}</strong>
                            </span>
                            <div style={{ display:'flex', gap:5 }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setCurrentPage(p => Math.max(p-1, 1))}
                                disabled={currentPage === 1}
                              >
                                Previous
                              </button>
                              {(() => {
                                const pages = [];
                                for (let i = 1; i <= totalPages; i++) {
                                  if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
                                    pages.push(i);
                                  } else if (pages[pages.length-1] !== '...') {
                                    pages.push('...');
                                  }
                                }
                                return pages.map((p, idx) =>
                                  p === '...' ? (
                                    <span key={`d${idx}`} style={{ alignSelf:'center', color:'var(--text-muted)', padding:'0 4px' }}>…</span>
                                  ) : (
                                    <button
                                      key={p}
                                      className={`btn ${currentPage === p ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                                      onClick={() => setCurrentPage(p)}
                                      style={{ minWidth:32, padding:'4px 8px' }}
                                    >
                                      {p}
                                    </button>
                                  )
                                );
                              })()}
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))}
                                disabled={currentPage === totalPages}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ padding:'24px 32px', overflowY:'auto', flex:1 }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <div>
                  <h2 style={{ margin:0 }}>Analytics Insights</h2>
                  <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>Recruiter productivity and talent growth trends</p>
                </div>
                <div style={{ display:'flex', gap:4, background:'var(--bg-muted)', borderRadius:'var(--radius-md)', padding:4 }}>
                  {ANALYTICS_PERIODS.map(p => (
                    <button key={p} className="btn btn-ghost btn-sm" onClick={() => setAnalyticsPeriod(p)}
                      style={{ background: analyticsPeriod===p ? 'var(--bg)' : 'transparent', color: analyticsPeriod===p ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: analyticsPeriod===p ? 'var(--shadow-xs)' : 'none' }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-2" style={{ gap:20, marginBottom:24 }}>
                <div className="card" style={{ padding:20 }}>
                  <h4 style={{ marginBottom:12 }}>Database Growth</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={GROWTH_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} />
                      <Line type="monotone" dataKey="candidates" stroke="var(--primary)" strokeWidth={2} dot={{ r:2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="card" style={{ padding:20 }}>
                  <h4 style={{ marginBottom:12 }}>Resumes Parsed</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={UPLOAD_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} />
                      <Bar dataKey="resumes" fill="var(--primary)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid-2" style={{ gap:20 }}>
                <div className="card" style={{ padding:20 }}>
                  <h4 style={{ marginBottom:12 }}>Top Skills in Pipeline</h4>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {DEMO_SKILLS.map(s => (
                      <div key={s.name} style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ fontSize:13, fontWeight:500, width:100, flexShrink:0 }}>{s.name}</span>
                        <div style={{ flex:1, height:6, background:'var(--bg-muted)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${s.pct}%`, background:'var(--primary)', borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:11, color:'var(--text-secondary)', width:36, textAlign:'right' }}>{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card" style={{ padding:20 }}>
                  <h4 style={{ marginBottom:12 }}>Recruiter Leaderboard</h4>
                  {RECRUITERS.map((r, i) => (
                    <div key={r.name} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom: i < RECRUITERS.length-1 ? '1px solid var(--border-soft)' : 'none' }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'#C4BFEA', width:18 }}>#{i+1}</span>
                      <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{r.name}</span>
                      <span style={{ fontSize:12, color:'var(--text-muted)' }}>{r.added} added</span>
                      <span style={{ fontSize:12, color:'var(--text-muted)' }}>{r.searches} searches</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── MODALS ── */}

      {/* Resume Preview Modal */}
      <AnimatePresence>
        {resumePreviewUrl && (
          <div style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              className="card"
              style={{ width:'90%', maxWidth:900, height:'90vh', padding:20, display:'flex', flexDirection:'column', gap:12 }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>Resume Preview</h3>
                <div style={{ display:'flex', gap:8 }}>
                  <a href={resumePreviewUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display:'flex', gap:5 }}>
                    <ExternalLink size={12} /> Open
                  </a>
                  <button onClick={() => setResumePreviewUrl(null)} className="btn btn-ghost btn-sm" style={{ padding:5 }}>
                    <X size={15} />
                  </button>
                </div>
              </div>
              <div style={{ flex:1, overflow:'hidden', background:'var(--bg-muted)', borderRadius:'var(--radius-lg)' }}>
                <iframe src={getEmbeddableUrl(resumePreviewUrl)} style={{ width:'100%', height:'100%', border:'none' }} title="Resume" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Candidate Modal */}
      <AnimatePresence>
        {isAddCandidateOpen && (
          <div style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              className="card"
              style={{ width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:16 }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>Add New Candidate</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsAddCandidateOpen(false)} style={{ padding:4 }}><X size={16} /></button>
              </div>
              <form onSubmit={handleAddCandidateSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="input-group"><label className="input-label">Full Name *</label><input type="text" className="input" required value={newCandidateForm.name} onChange={e => setNewCandidateForm({...newCandidateForm, name:e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">Email *</label><input type="email" className="input" required value={newCandidateForm.email} onChange={e => setNewCandidateForm({...newCandidateForm, email:e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">Phone</label><input type="text" className="input" value={newCandidateForm.phone} onChange={e => setNewCandidateForm({...newCandidateForm, phone:e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">LinkedIn</label><input type="text" className="input" value={newCandidateForm.linkedin} onChange={e => setNewCandidateForm({...newCandidateForm, linkedin:e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">Title</label><input type="text" className="input" value={newCandidateForm.title} onChange={e => setNewCandidateForm({...newCandidateForm, title:e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">Years of Experience</label><input type="text" className="input" value={newCandidateForm.experience} onChange={e => setNewCandidateForm({...newCandidateForm, experience:e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">Visa Status</label>
                    <select className="input" value={newCandidateForm.visa} onChange={e => setNewCandidateForm({...newCandidateForm, visa:e.target.value})}>
                      <option value="">Select Visa</option>
                      {['USC','GC','H1B','OPT','CPT','H4 EAD','TN','L1','Other'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="input-group"><label className="input-label">Work Preference</label>
                    <select className="input" value={newCandidateForm.workPref} onChange={e => setNewCandidateForm({...newCandidateForm, workPref:e.target.value})}>
                      <option value="">Select</option>
                      {WORK_PREF_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="input-group"><label className="input-label">Availability</label>
                    <select className="input" value={newCandidateForm.availability} onChange={e => setNewCandidateForm({...newCandidateForm, availability:e.target.value})}>
                      <option value="">Select</option>
                      {AVAILABILITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="input-group"><label className="input-label">Resume (PDF/DOC)</label><input type="file" accept=".pdf,.doc,.docx" onChange={e => setNewCandidateFile(e.target.files[0])} /></div>
                </div>
                <div className="input-group"><label className="input-label">Skills (comma-separated)</label><input type="text" className="input" value={newCandidateForm.skills} onChange={e => setNewCandidateForm({...newCandidateForm, skills:e.target.value})} /></div>
                <div className="input-group"><label className="input-label">Summary</label><textarea rows={3} className="input" value={newCandidateForm.summary} onChange={e => setNewCandidateForm({...newCandidateForm, summary:e.target.value})} style={{ resize:'vertical' }} /></div>
                <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
                  <button className="btn btn-secondary" type="button" onClick={() => setIsAddCandidateOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" type="submit" disabled={addingCandidate}>{addingCandidate ? 'Saving…' : 'Add Candidate'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Portal Modal */}
      <AnimatePresence>
        {isAskCandidateOpen && (
          <div style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              className="card"
              style={{ width:'100%', maxWidth:520, padding:24, display:'flex', flexDirection:'column', gap:16 }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>Share Candidate Portal</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsAskCandidateOpen(false)} style={{ padding:4 }}><X size={16} /></button>
              </div>
              <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
                Share this link with candidates to let them upload their resume and complete their profile automatically.
              </p>
              <div className="input-group">
                <label className="input-label">Portal Link</label>
                <div style={{ display:'flex', gap:8 }}>
                  <input type="text" className="input" readOnly value={`${window.location.origin}/candidate/upload`} style={{ background:'var(--bg-muted)' }} />
                  <button className="btn btn-secondary" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/candidate/upload`); toast.success('Link copied!'); }}>Copy</button>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button className="btn btn-primary" onClick={() => setIsAskCandidateOpen(false)}>Done</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Outreach Email Modal */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <div style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
            <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}
              className="card"
              style={{ width:'100%', maxWidth:520, padding:24, display:'flex', flexDirection:'column', gap:16 }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>Outreach Template</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsEmailModalOpen(false)} style={{ padding:4 }}><X size={16} /></button>
              </div>
              <div className="input-group"><label className="input-label">To</label><input type="text" className="input" value={emailDraft.to} onChange={e => setEmailDraft({...emailDraft, to:e.target.value})} /></div>
              <div className="input-group"><label className="input-label">Subject</label><input type="text" className="input" value={emailDraft.subject} onChange={e => setEmailDraft({...emailDraft, subject:e.target.value})} /></div>
              <div className="input-group"><label className="input-label">Body</label><textarea rows={6} className="input" value={emailDraft.body} onChange={e => setEmailDraft({...emailDraft, body:e.target.value})} /></div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button className="btn btn-secondary" onClick={() => { navigator.clipboard.writeText(emailDraft.body); toast.success('Copied!'); }} style={{ display:'flex', gap:5 }}>
                  <Clipboard size={13} /> Copy
                </button>
                <button className="btn btn-primary" onClick={() => setIsEmailModalOpen(false)}>Done</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
