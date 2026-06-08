import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Mail, Phone, MapPin, Link2, FileText, Heart,
  Copy, Check, ExternalLink, Sparkles, User, Briefcase,
  ClipboardList, Activity, Brain, ChevronRight, Star,
  Building2, Calendar, TrendingUp, Zap, Award,
} from 'lucide-react';

/* ─── Mock Candidate Data ────────────────────────────────── */

const MOCK_CANDIDATE = {
  id: '1',
  name: 'Priya Nair',
  title: 'Senior Data Engineer',
  location: 'San Francisco, CA',
  visa: 'H1B',
  email: 'priya.nair@email.com',
  phone: '+1 (415) 555-0194',
  linkedin: 'linkedin.com/in/priya-nair-data',
  resume_url: 'https://example.com/resume.pdf',
  skills: ['Snowflake', 'Python', 'AWS', 'Spark', 'dbt', 'Airflow', 'SQL', 'Kafka', 'Terraform', 'Docker', 'Kubernetes', 'Data Modeling'],
  experience: [
    {
      id: 1,
      company: 'Databricks',
      role: 'Senior Data Engineer',
      period: 'Jan 2022 – Present',
      location: 'San Francisco, CA',
      bullets: [
        'Architected a real-time streaming pipeline using Apache Kafka and Spark processing 50M events/day.',
        'Led migration of legacy ETL to dbt + Snowflake, reducing query latency by 62%.',
        'Mentored 3 junior engineers and led weekly data architecture reviews.',
      ],
    },
    {
      id: 2,
      company: 'Stripe',
      role: 'Data Engineer',
      period: 'Mar 2019 – Dec 2021',
      location: 'Remote',
      bullets: [
        'Built and maintained 40+ data pipelines using Airflow and Python.',
        'Designed dimensional data models supporting $500M+ revenue analytics.',
        'Collaborated with product teams to define KPIs and build self-serve dashboards.',
      ],
    },
    {
      id: 3,
      company: 'TCS (Tata Consultancy Services)',
      role: 'Data Analyst',
      period: 'Jun 2016 – Feb 2019',
      location: 'Mumbai, India',
      bullets: [
        'Developed SQL-based reporting solutions for 3 enterprise banking clients.',
        'Automated daily reporting workflows, saving ~20 hrs/week of manual effort.',
      ],
    },
  ],
  activity: [
    { id: 1, time: '2 hours ago',   action: 'Profile viewed by Emily Watkins',          icon: 'view' },
    { id: 2, time: '1 day ago',     action: 'Moved to Final Interview stage',            icon: 'stage' },
    { id: 3, time: '3 days ago',    action: 'Note added by James Patel',                 icon: 'note' },
    { id: 4, time: '5 days ago',    action: 'AI match score calculated: 94%',            icon: 'ai' },
    { id: 5, time: '1 week ago',    action: 'Resume parsed and indexed',                 icon: 'resume' },
    { id: 6, time: '2 weeks ago',   action: 'Profile added to database',                 icon: 'add' },
  ],
};

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
            value={candidate.linkedin}
            link={`https://${candidate.linkedin}`}
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
            href={link}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 13.5, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {value}
            <ExternalLink size={11} />
          </a>
        ) : (
          <div style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{value}</div>
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

function NotesTab() {
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (!notes.trim()) return;
    setSaved(true);
    toast.success('Notes saved!');
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="section-title">Add Note</div>
        <textarea
          rows={6}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Interview feedback, follow-up actions, general observations…"
          className="input"
          style={{ resize: 'vertical', lineHeight: 1.65, fontSize: 13.5, minHeight: 120 }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button onClick={save} className="btn btn-primary btn-sm">
            {saved ? <><Check size={13} /> Saved!</> : 'Save Note'}
          </button>
          {notes && (
            <button onClick={() => setNotes('')} className="btn btn-ghost btn-sm">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Static previous note */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="section-title">Previous Notes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { author: 'James Patel', time: '3 days ago', text: 'Strong technical skills — cleared the system design round with flying colors. Data modeling answers were very structured. Recommend moving to final round.' },
            { author: 'Emily Watkins', time: '1 week ago', text: 'Initial screen went well. Great communication, clear career progression. Salary expectation is $195K — within budget.' },
          ].map((note, i) => (
            <div
              key={i}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{note.author}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{note.time}</span>
              </div>
              <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.65, color: 'var(--text-secondary)' }}>{note.text}</p>
            </div>
          ))}
        </div>
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

function AIInsightsTab() {
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
            87<span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-muted)' }}>%</span>
          </div>
        </div>
        <div className="progress-bar" style={{ height: 8, marginBottom: 10 }}>
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: '87%' }}
            transition={{ duration: 0.8, ease: [0, 0, 0.2, 1], delay: 0.2 }}
            style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Snowflake ✓', 'Python ✓', 'AWS ✓', 'dbt ✓', 'Spark ✓'].map(s => (
            <span key={s} className="badge badge-green" style={{ fontSize: 11 }}>{s}</span>
          ))}
          <span className="badge badge-gray" style={{ fontSize: 11 }}>Scala –</span>
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
          <span className="badge badge-green" style={{ marginLeft: 'auto' }}>High</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { skill: 'Snowflake',  demand: 94, color: '#2563EB' },
            { skill: 'Python',     demand: 89, color: '#7C3AED' },
            { skill: 'AWS',        demand: 82, color: '#059669' },
            { skill: 'dbt',        demand: 76, color: '#D97706' },
          ].map(({ skill, demand, color }) => (
            <div key={skill}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{skill}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{demand}%</span>
              </div>
              <div className="progress-bar">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${demand}%` }}
                  transition={{ duration: 0.65, ease: [0, 0, 0.2, 1], delay: 0.3 }}
                  style={{ height: '100%', background: color, borderRadius: 99 }}
                />
              </div>
            </div>
          ))}
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
          {[
            { role: 'Senior Data Engineer',         match: '94%', color: '#16A34A' },
            { role: 'Data Engineering Lead',         match: '88%', color: '#2563EB' },
            { role: 'Analytics Engineer',            match: '82%', color: '#7C3AED' },
            { role: 'Staff Data Platform Engineer',  match: '79%', color: '#D97706' },
          ].map(({ role, match, color }) => (
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

  // In a real app you'd fetch by id; we use mock data
  const candidate = MOCK_CANDIDATE;

  const [activeTab, setActiveTab]     = useState('overview');
  const [isFavorite, setIsFavorite]   = useState(false);
  const [aiSummary, setAiSummary]     = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  const initials = candidate.name.split(' ').map(x => x[0]).join('').toUpperCase();
  const colorIdx = (candidate.name.charCodeAt(0) || 0) % GRADIENTS.length;

  const generateAISummary = () => {
    setGeneratingAI(true);
    setTimeout(() => {
      setAiSummary(
        `Priya Nair is a highly experienced Senior Data Engineer with 8+ years of expertise in building scalable data infrastructure at top-tier tech companies. She brings deep hands-on experience with the modern data stack — particularly Snowflake, dbt, Apache Spark, and Airflow — and has a strong track record of reducing pipeline latency, managing large-scale migrations, and mentoring engineering teams. Her background at Databricks and Stripe signals exposure to high-throughput, mission-critical data systems. She is an excellent fit for senior individual contributor or lead data engineering roles.`
      );
      setGeneratingAI(false);
      toast.success('AI Summary generated!');
    }, 1800);
  };

  const tabContent = {
    overview:   <OverviewTab candidate={candidate} aiSummary={aiSummary} />,
    experience: <ExperienceTab experience={candidate.experience} />,
    notes:      <NotesTab />,
    activity:   <ActivityTab activity={candidate.activity} />,
    ai:         <AIInsightsTab />,
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
              href={`https://${candidate.linkedin}`}
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
