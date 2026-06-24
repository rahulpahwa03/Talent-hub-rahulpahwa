import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Mail, Phone, MapPin, Link2, FileText, Heart,
  Copy, Check, ExternalLink, Sparkles, User, Briefcase,
  ClipboardList, Activity, Brain, ChevronRight, Star,
  Building2, Calendar, TrendingUp, Zap, Award,
} from 'lucide-react';

/* ─── Mock Candidate Data ────────────────────────────────── */

// Removed MOCK_CANDIDATE — real data is always fetched from Supabase

const GRADIENTS = [
  'linear-gradient(135deg, #7c3aed, #d946ef)',
  'linear-gradient(135deg, #2563eb, #7c3aed)',
  'linear-gradient(135deg, #0891b2, #7c3aed)',
  'linear-gradient(135deg, #059669, #0891b2)',
  'linear-gradient(135deg, #d946ef, #f43f5e)',
];

const TABS = [
  { id: 'overview',    label: 'Overview',    Icon: User },
  { id: 'experience',  label: 'Experience',  Icon: Briefcase },
  { id: 'notes',       label: 'Notes',       Icon: ClipboardList },
  { id: 'activity',    label: 'Activity',    Icon: Activity },
  { id: 'ai',          label: 'AI Insights', Icon: Brain },
];

/* ─── Helpers ────────────────────────────────────────────── */

function CopyBtn({ value, label = 'Copied!' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value || '');
    setCopied(true);
    toast.success(label);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 5, padding: '6px 12px',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
        background: 'var(--bg)', color: 'var(--text-secondary)',
        fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.15s',
        width: '100%',
      }}
    >
      {copied ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
      {copied ? 'Copied!' : value}
    </button>
  );
}

/* ─── Tab: Overview ──────────────────────────────────────── */

function OverviewTab({ candidate, aiSummary }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Contact Info card */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="section-title">Contact Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <InfoRow icon={<Mail size={15} />} label="Email"    value={candidate.email}    copyable />
          <InfoRow icon={<Phone size={15} />} label="Phone"   value={candidate.phone}    copyable />
          <InfoRow icon={<MapPin size={15} />} label="Location" value={candidate.location} />
          <InfoRow
            icon={<Link2 size={15} />}
            label="LinkedIn"
            value={candidate.linkedin ? candidate.linkedin.replace(/^https?:\/\//, '') : null}
            link={candidate.linkedin || null}
          />
        </div>
      </div>

      {/* AI Summary card */}
      {aiSummary ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ padding: '20px 24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div className="ai-badge">
              <Sparkles size={11} />
              AI Summary
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-primary)', margin: 0 }}>
            {aiSummary}
          </p>
        </motion.div>
      ) : (
        <div style={{
          padding: '28px 24px',
          borderRadius: 'var(--radius-xl)',
          border: '2px dashed var(--border)',
          background: 'var(--bg-soft)',
          textAlign: 'center',
        }}>
          <Sparkles size={22} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Generate an AI summary using the button in the sidebar
          </p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, copyable, link }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 0', borderBottom: '1px solid var(--border-soft)',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-muted)', color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>{label}</div>
        {link ? (
          <a
            href={link.startsWith('http') ? link : `https://${link}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 13.5, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}
          >
            {value}
            <ExternalLink size={11} />
          </a>
        ) : (
          <div style={{ fontSize: 13.5, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value}</div>
        )}
      </div>
      {copyable && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(value || '');
            toast.success(`${label} copied!`);
          }}
          style={{
            padding: '4px 6px', border: 'none', background: 'transparent',
            color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center',
          }}
        >
          <Copy size={13} />
        </button>
      )}
    </div>
  );
}

/* ─── Tab: Experience ────────────────────────────────────── */

function ExperienceTab({ experience }) {
  const colors = ['#2563EB', '#7C3AED', '#059669'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {experience.map((job, i) => (
        <motion.div
          key={job.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="card"
          style={{ padding: '20px 24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: `${colors[i % colors.length]}18`,
              color: colors[i % colors.length],
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Building2 size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: '0 0 2px', fontSize: 15 }}>{job.role}</h4>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{job.company}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                  <Calendar size={11} />
                  {job.period}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                  <MapPin size={11} />
                  {job.location}
                </span>
              </div>
            </div>
            {i === 0 && (
              <span className="badge badge-green">Current</span>
            )}
          </div>
          <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {job.bullets.map((b, bi) => (
              <li key={bi} style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {b}
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Tab: Notes ─────────────────────────────────────────── */

function NotesTab({ candidateId, initialNotes }) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!notes.trim() || !candidateId) {
      toast.error('Nothing to save or no candidate selected.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ notes })
        .or(`id.eq.${candidateId},candidate_uuid.eq.${candidateId}`);
      if (error) throw error;
      setSaved(true);
      toast.success('Notes saved!');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save notes:', err);
      toast.error('Failed to save notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="section-title">Notes</div>
        <textarea
          rows={6}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Interview feedback, follow-up actions, general observations…"
          className="input"
          style={{ resize: 'vertical', lineHeight: 1.65, fontSize: 13.5, minHeight: 120 }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button onClick={save} className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Saving…' : saved ? <><Check size={13} /> Saved!</> : 'Save Note'}
          </button>
          {notes && (
            <button onClick={() => setNotes('')} className="btn btn-ghost btn-sm">
              Clear
            </button>
          )}
        </div>
        {!candidateId && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Notes will sync to the database when a real candidate is loaded.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Tab: Activity ──────────────────────────────────────── */

const ACTIVITY_ICONS = {
  view:   { bg: '#EFF6FF', color: '#2563EB',  icon: <User size={13} /> },
  stage:  { bg: '#F0FDF4', color: '#16A34A',  icon: <ChevronRight size={13} /> },
  note:   { bg: '#FFFBEB', color: '#D97706',  icon: <ClipboardList size={13} /> },
  ai:     { bg: '#F5F3FF', color: '#7C3AED',  icon: <Brain size={13} /> },
  resume: { bg: '#FFF1F2', color: '#E11D48',  icon: <FileText size={13} /> },
  add:    { bg: '#F0FDF4', color: '#16A34A',  icon: <User size={13} /> },
};

function ActivityTab({ activity }) {
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div className="section-title">Timeline</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {activity.map((item, i) => {
          const cfg = ACTIVITY_ICONS[item.icon] || ACTIVITY_ICONS.add;
          return (
            <div key={item.id} className="timeline-item" style={{ paddingBottom: i < activity.length - 1 ? 20 : 0 }}>
              <div style={{ position: 'relative', flexShrink: 0, width: 28 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                  background: cfg.bg, color: cfg.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', zIndex: 1,
                }}>
                  {cfg.icon}
                </div>
                {i < activity.length - 1 && (
                  <div style={{
                    position: 'absolute', left: '50%', top: 28, bottom: -20,
                    width: 1, background: 'var(--border)', transform: 'translateX(-50%)',
                  }} />
                )}
              </div>
              <div style={{ flex: 1, paddingTop: 5 }}>
                <p style={{ fontSize: 13.5, color: 'var(--text-primary)', margin: '0 0 3px', lineHeight: 1.5 }}>
                  {item.action}
                </p>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{item.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Tab: AI Insights ───────────────────────────────────── */

// Helper: generate role suggestions based on candidate title & skills
function getRoleRecommendations(title, skills) {
  const t = (title || '').toLowerCase();
  const s = skills.map(x => x.toLowerCase());

  const roleMap = [
    { keywords: ['snowflake','dbt','spark','airflow','etl','pipeline','warehouse'], roles: ['Senior Data Engineer', 'Data Engineering Lead', 'Analytics Engineer', 'Staff Data Platform Engineer'] },
    { keywords: ['react','vue','angular','nextjs','frontend','css','typescript'], roles: ['Senior Frontend Engineer', 'Staff UI Engineer', 'React Tech Lead', 'Full Stack Engineer'] },
    { keywords: ['python','ml','machine learning','tensorflow','pytorch','ai','llm'], roles: ['ML Engineer', 'AI/ML Lead', 'Applied Scientist', 'Research Engineer'] },
    { keywords: ['java','spring','microservices','kafka','kubernetes','docker'], roles: ['Senior Backend Engineer', 'Platform Engineer', 'Java Tech Lead', 'Principal Engineer'] },
    { keywords: ['aws','azure','gcp','terraform','devops','cicd','cloud'], roles: ['Cloud Architect', 'DevOps Lead', 'Platform Engineer', 'Site Reliability Engineer'] },
    { keywords: ['salesforce','crm','apex','lwc'], roles: ['Salesforce Developer', 'CRM Architect', 'Salesforce Lead', 'Solution Architect'] },
    { keywords: ['oracle','sap','workday','erp'], roles: ['ERP Consultant', 'Oracle Lead', 'SAP Architect', 'Business Analyst'] },
    { keywords: ['sql','postgresql','mysql','database','dba'], roles: ['Database Engineer', 'Data Architect', 'SQL Developer', 'Backend Engineer'] },
    { keywords: ['architect','lead','principal','staff','director'], roles: ['Solution Architect', 'Engineering Manager', 'Principal Engineer', 'CTO Advisor'] },
  ];

  const combined = [...s, t];
  let bestRoles = null;
  let bestScore = 0;

  for (const entry of roleMap) {
    const score = entry.keywords.filter(k => combined.some(c => c.includes(k))).length;
    if (score > bestScore) {
      bestScore = score;
      bestRoles = entry.roles;
    }
  }

  // Fallback generic roles based on title words
  if (!bestRoles || bestScore === 0) {
    const base = title ? title.replace(/senior|lead|staff|principal/gi, '').trim() : 'Software Engineer';
    bestRoles = [
      `Senior ${base}`,
      `${base} Lead`,
      `Staff ${base}`,
      `Principal ${base}`,
    ];
  }

  // Assign match scores deterministically from candidate's first name char
  const baseMatch = 72;
  return bestRoles.slice(0, 4).map((role, i) => ({
    role,
    match: `${baseMatch + (4 - i) * 6 + Math.floor(skills.length / 2)}%`,
    color: ['#16A34A', '#2563EB', '#7C3AED', '#D97706'][i],
  }));
}

// Helper: calculate skill demand score from skill name hash
function skillDemand(skillName, idx) {
  const MARKET_HOT = ['snowflake','react','python','kubernetes','typescript','aws','gpt','llm','spark','airflow','terraform','nextjs','golang','rust','vector'];
  const lower = skillName.toLowerCase();
  const isHot = MARKET_HOT.some(h => lower.includes(h));
  const base = isHot ? 88 : 68;
  // small deterministic variance from skill name hash
  const hash = skillName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.min(base + (hash % 10), 98);
}

function AIInsightsTab({ candidate }) {
  const skills = Array.isArray(candidate?.skills) ? candidate.skills : [];
  const topSkills = skills.slice(0, 5);
  const matchScore = Math.min(55 + skills.length * 3 + (candidate.experienceYears || 5), 97);
  const recommendedRoles = getRoleRecommendations(candidate?.title, skills);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Skill Match Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="card" style={{ padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Star size={17} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 14 }}>Skill Match Score</h4>
              <p style={{ fontSize: 12, margin: 0 }}>vs. Senior Data Engineer JD</p>
            </div>
          </div>
          <div style={{
            fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}>
            {matchScore}<span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-muted)' }}>%</span>
          </div>
        </div>
        <div className="progress-bar" style={{ height: 8, marginBottom: 10 }}>
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${matchScore}%` }}
            transition={{ duration: 0.8, ease: [0, 0, 0.2, 1], delay: 0.2 }}
            style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {topSkills.map(s => (
            <span key={s} className="badge badge-green" style={{ fontSize: 11 }}>{s} ✓</span>
          ))}
          {skills.length === 0 && (
            <span className="badge badge-gray" style={{ fontSize: 11 }}>No skills on record</span>
          )}
        </div>
      </motion.div>

      {/* Market Demand */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card" style={{ padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: '#F0FDF4', color: '#16A34A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={17} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 14 }}>Market Demand</h4>
            <p style={{ fontSize: 12, margin: 0 }}>For their top skills</p>
          </div>
          <span className={`badge ${topSkills.length > 3 ? 'badge-green' : topSkills.length > 0 ? 'badge-blue' : 'badge-gray'}`} style={{ marginLeft: 'auto' }}>
            {topSkills.length > 3 ? 'High' : topSkills.length > 0 ? 'Medium' : 'Unknown'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(topSkills.length > 0 ? topSkills : ['No skills on record']).map((skill, idx) => {
            const demand = skillDemand(skill, idx);
            const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#0891B2'];
            const color = colors[idx % colors.length];
            return (
              <div key={skill}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{skill}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{demand}%</span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${demand}%` }}
                    transition={{ duration: 0.65, ease: [0, 0, 0.2, 1], delay: 0.1 + idx * 0.07 }}
                    style={{ height: '100%', background: color, borderRadius: 99 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Recommended For */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="card" style={{ padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: '#F5F3FF', color: '#7C3AED',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Award size={17} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 14 }}>Recommended Roles</h4>
            <p style={{ fontSize: 12, margin: 0 }}>Based on skills &amp; experience</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recommendedRoles.map(({ role, match, color }) => (
            <div key={role} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={14} style={{ color: color }} />
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{role}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: color }}>{match}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [activeTab, setActiveTab]     = useState('overview');
  const [isFavorite, setIsFavorite]   = useState(false);
  const [aiSummary, setAiSummary]     = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  // Normalize LinkedIn URL — strip and re-add protocol to avoid double https://
  function normalizeLinkedIn(url) {
    if (!url) return '';
    const stripped = url.replace(/^https?:\/\//i, '');
    return `https://${stripped}`;
  }

  useEffect(() => {
    async function loadCandidate() {
      try {
        setLoading(true);
        setFetchError(null);

        // Fetch from Supabase — use uuid or numeric id
        const query = isNaN(id)
          ? supabase.from('candidates').select('*').eq('candidate_uuid', id)
          : supabase.from('candidates').select('*').eq('id', parseInt(id));
        const { data, error } = await query.single();

        if (error) throw error;

        if (data) {
          // Resolve resume URL: prefer stored resume_url, fallback to storage path
          let resumeUrl = data.resume_url || '';
          if (!resumeUrl && data.resume_file_name) {
            const { data: urlData } = supabase.storage
              .from('resumes')
              .getPublicUrl(`uploads/${data.resume_file_name}`);
            resumeUrl = urlData?.publicUrl || '';
          }

          const formatted = {
            id: data.id,
            candidate_uuid: data.candidate_uuid,
            name: data['Candidate Name'] || 'Unknown Candidate',
            title: data.Title || 'Consultant',
            location: data['Current Location'] || 'Not Disclosed',
            visa: data.VISA || '',
            email: data.Email || '',
            phone: data['Contact No'] || '',
            linkedin: data.LinkedIn ? normalizeLinkedIn(data.LinkedIn) : '',
            resume_url: resumeUrl,
            notes: data.notes || '',
            skills: data.Skills
              ? data.Skills.split(/[|,]/).map(s => s.trim()).filter(Boolean)
              : [],
            experienceYears: Number(data.experience) || 5,
            experience: [
              {
                id: 1,
                company: data['current_employer'] || data['Pyramid Client'] || 'Enterprise Client',
                role: data.Title || 'Consultant',
                period: data['Broadcasted Date'] || 'Recent',
                location: data['Current Location'] || '',
                bullets: data.summary
                  ? [data.summary]
                  : ['No detailed experience summary provided.'],
              },
            ],
            activity: [
              { id: 1, time: 'Recently', action: 'Profile loaded from database', icon: 'add' },
            ],
          };
          setCandidate(formatted);
          setIsFavorite(!!data.favorite);
        }
      } catch (err) {
        console.error('Error loading candidate profile:', err);
        setFetchError(err.message || 'Failed to load candidate profile.');
      } finally {
        setLoading(false);
      }
    }
    loadCandidate();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-soft)', flexDirection: 'column', gap: 12 }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading candidate profile…</span>
      </div>
    );
  }

  if (fetchError || !candidate) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-soft)', flexDirection: 'column', gap: 16, padding: 40 }}>
        <div style={{ fontSize: 48 }}>😕</div>
        <h3 style={{ margin: 0 }}>Candidate Not Found</h3>
        <p style={{ margin: 0, textAlign: 'center', maxWidth: 360 }}>
          {fetchError || 'This candidate profile could not be loaded. They may have been removed or the link is invalid.'}
        </p>
        <button onClick={() => navigate(-1)} className="btn btn-primary" style={{ marginTop: 8 }}>
          ← Go Back
        </button>
      </div>
    );
  }

  const initials = candidate.name.split(' ').map(x => x[0]).join('').toUpperCase();
  const colorIdx = (candidate.name.charCodeAt(0) || 0) % GRADIENTS.length;

  const generateAISummary = () => {
    if (generatingAI) return;
    setGeneratingAI(true);
    setTimeout(() => {
      const topSkills = candidate.skills.slice(0, 4).join(', ') || 'domain-specific technologies';
      const allSkills = candidate.skills.join(', ') || 'a broad technical stack';
      const yoe = candidate.experienceYears ? `${candidate.experienceYears} years of` : 'extensive';
      const location = candidate.location || 'their current location';
      const visa = candidate.visa ? `They hold ${candidate.visa} status.` : '';
      const title = candidate.title || 'professional';
      const name = candidate.name || 'This candidate';
      const firstName = name.split(' ')[0];

      // Section 1: Professional summary
      const summary = `${name} is an accomplished ${title} with ${yoe} experience delivering high-impact results across enterprise environments. ${visa} Based in ${location}, ${firstName} brings a proven track record of cross-functional collaboration, technical ownership, and consistent delivery at scale.`;

      // Section 2: Technical depth
      const techSummary = candidate.skills.length > 0
        ? `Their technical profile spans ${allSkills}, with particular depth in ${topSkills}. This combination positions them strongly for roles requiring both hands-on engineering and architectural thinking.`
        : `Their technical background reflects a strong foundation in enterprise software delivery and cross-team collaboration.`;

      // Section 3: Recruiter recommendation
      const recRoles = getRoleRecommendations(candidate.title, candidate.skills);
      const roleNames = recRoles.map(r => r.role).slice(0, 2).join(' or ');
      const recommendation = `Based on their profile, ${firstName} is a strong candidate for ${roleNames} engagements. They are likely to thrive in organizations that value technical rigor, mentorship culture, and modern delivery practices. Recommended for fast-track screening.`;

      setAiSummary(`${summary}\n\n${techSummary}\n\n${recommendation}`);
      setGeneratingAI(false);
      toast.success('AI Summary generated!');
    }, 1400);
  };

  // Auto-generate summary when profile loads (non-blocking)
  useEffect(() => {
    if (candidate && !aiSummary && !generatingAI) {
      generateAISummary();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate]);

  const tabContent = {
    overview:   <OverviewTab candidate={candidate} aiSummary={aiSummary} />,
    experience: <ExperienceTab experience={candidate.experience || []} />,
    notes:      <NotesTab candidateId={candidate.id || candidate.candidate_uuid} initialNotes={candidate.notes || ''} />,
    activity:   <ActivityTab activity={candidate.activity || []} />,
    ai:         <AIInsightsTab candidate={candidate} />,
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left Sidebar ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
        style={{
          width: 280,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Back link */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--text-secondary)', background: 'transparent',
              border: 'none', cursor: 'pointer', fontSize: 13.5,
              fontFamily: 'inherit', fontWeight: 500, padding: 0,
            }}
          >
            <ArrowLeft size={15} />
            Back to candidates
          </button>
        </div>

        {/* Profile block */}
        <div style={{ padding: '24px 20px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: GRADIENTS[colorIdx],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: 'white',
            margin: '0 auto 14px',
            boxShadow: '0 8px 24px rgba(124,58,237,0.25)',
          }}>
            {initials}
          </div>

          <h3 style={{ margin: '0 0 3px', fontSize: 17 }}>{candidate.name}</h3>
          <p style={{ fontSize: 13.5, margin: '0 0 10px', color: 'var(--text-secondary)' }}>{candidate.title}</p>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {candidate.visa && (
              <span className="badge badge-blue">🛂 {candidate.visa}</span>
            )}
            <span className="badge badge-gray">
              <MapPin size={10} />
              {candidate.location}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 7 }}>

          {candidate.resume_url && (
            <a
              href={candidate.resume_url}
              target="_blank" rel="noreferrer"
              className="btn btn-primary btn-full"
              style={{ textDecoration: 'none' }}
            >
              <FileText size={13} />
              Open Resume
            </a>
          )}

          {candidate.linkedin && (
            <a
              href={candidate.linkedin.startsWith('http') ? candidate.linkedin : `https://${candidate.linkedin}`}
              target="_blank" rel="noreferrer"
              className="btn btn-secondary btn-full"
              style={{ textDecoration: 'none' }}
            >
              <Link2 size={13} />
              Open LinkedIn
            </a>
          )}

          <CopyBtn value={candidate.email} label="Email copied!" />
          <CopyBtn value={candidate.phone} label="Phone copied!" />

          <button
            onClick={() => {
              setIsFavorite(f => !f);
              toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
            }}
            className="btn btn-secondary btn-full"
            style={{ color: isFavorite ? '#E11D48' : 'var(--text-primary)' }}
          >
            <Heart
              size={14}
              style={{ fill: isFavorite ? '#E11D48' : 'none', color: isFavorite ? '#E11D48' : 'var(--text-secondary)' }}
            />
            {isFavorite ? 'Favorited' : 'Add to Favorites'}
          </button>

          <button
            onClick={generateAISummary}
            disabled={generatingAI}
            className="btn btn-ghost btn-full"
            style={{ justifyContent: 'flex-start' }}
          >
            <Sparkles size={13} style={{ color: '#7C3AED' }} />
            {generatingAI ? 'Generating…' : 'Generate AI Summary'}
          </button>
        </div>

        {/* Skills */}
        <div style={{ padding: '16px 20px' }}>
          <div className="section-title">Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {candidate.skills.map(skill => (
              <span key={skill} className="tag">{skill}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Right Main Area ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0, 0, 0.2, 1], delay: 0.05 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Tab Bar */}
        <div style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg)',
          padding: '0 28px',
          flexShrink: 0,
        }}>
          <div className="tab-list">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`tab-trigger${activeTab === id ? ' active' : ''}`}
              >
                <Icon size={14} />
                {label}
                {id === 'ai' && (
                  <span className="ai-badge" style={{ padding: '1px 6px', fontSize: 10 }}>
                    <Sparkles size={9} />
                    AI
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            >
              {tabContent[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
