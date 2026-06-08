import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Users,
  UserCheck,
  UserPlus,
  FileText,
  Heart,
  Send,
  TrendingUp,
  Search,
  PlusCircle,
  Zap,
  BarChart2,
} from 'lucide-react';

/* ─── Mock Data ────────────────────────────────────────── */

const METRICS = [
  {
    label: 'Total Candidates',
    value: '48,291',
    delta: '+2.4% this week',
    positive: true,
    Icon: Users,
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    label: 'Active Recruiters',
    value: '12',
    delta: '3 online now',
    positive: true,
    Icon: UserCheck,
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
  },
  {
    label: 'New Profiles',
    value: '284',
    delta: '+18 today',
    positive: true,
    Icon: UserPlus,
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
  },
  {
    label: 'Resumes Parsed',
    value: '41,203',
    delta: 'AI powered',
    positive: null,
    Icon: FileText,
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
  },
  {
    label: 'Favorites',
    value: '1,847',
    delta: '23 new this week',
    positive: true,
    Icon: Heart,
    iconBg: '#FFF1F2',
    iconColor: '#E11D48',
  },
  {
    label: 'Submissions',
    value: '3,294',
    delta: '+142 this month',
    positive: true,
    Icon: Send,
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
  },
];

const ACTIVITIES = [
  {
    id: 1,
    time: '2 min ago',
    action: 'New candidate Sarah Johnson added to pipeline',
    recruiter: 'Emily Watkins',
    active: true,
  },
  {
    id: 2,
    time: '11 min ago',
    action: 'Resume parsed for Michael Chen — 94% match score',
    recruiter: 'AI Engine',
    active: false,
  },
  {
    id: 3,
    time: '34 min ago',
    action: 'Note added to David Kumar',
    recruiter: 'James Patel',
    active: false,
  },
  {
    id: 4,
    time: '1 hr ago',
    action: 'Priya Nair moved to Final Interview stage',
    recruiter: 'Olivia Chen',
    active: false,
  },
  {
    id: 5,
    time: '2 hr ago',
    action: 'Bulk import of 47 profiles from LinkedIn',
    recruiter: 'Emily Watkins',
    active: false,
  },
  {
    id: 6,
    time: '3 hr ago',
    action: 'AI match run on "Senior Snowflake Engineer" role',
    recruiter: 'AI Engine',
    active: false,
  },
  {
    id: 7,
    time: '5 hr ago',
    action: 'Alex Rivera shortlisted for DevOps Lead',
    recruiter: 'James Patel',
    active: false,
  },
  {
    id: 8,
    time: 'Yesterday',
    action: 'New job posting published: Data Scientist (Remote)',
    recruiter: 'Olivia Chen',
    active: false,
  },
];

const SKILLS = [
  { name: 'Snowflake', pct: 89 },
  { name: 'Python', pct: 82 },
  { name: 'AWS', pct: 76 },
  { name: 'React', pct: 71 },
  { name: 'Java', pct: 65 },
  { name: 'Kubernetes', pct: 58 },
];

/* ─── Framer Motion Variants ───────────────────────────── */

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0, 0, 0.2, 1], delay: i * 0.05 },
  }),
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0, 0, 0.2, 1], delay: 0.32 + i * 0.07 },
  }),
};

/* ─── Sub-components ────────────────────────────────────── */

function MetricCard({ metric, index }) {
  const { label, value, delta, positive, Icon, iconBg, iconColor } = metric;

  const deltaColor =
    positive === true
      ? 'var(--success)'
      : positive === false
      ? 'var(--error)'
      : 'var(--text-muted)';

  return (
    <motion.div
      className="metric-card"
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <div
        className="metric-icon"
        style={{ background: iconBg }}
      >
        <Icon size={18} color={iconColor} strokeWidth={1.8} />
      </div>

      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>

      <div className="metric-delta" style={{ color: deltaColor }}>
        {positive === true && <TrendingUp size={11} strokeWidth={2.2} />}
        {delta}
      </div>
    </motion.div>
  );
}

function ActivityTimeline() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {ACTIVITIES.map((item, i) => (
        <div key={item.id} className="timeline-item" style={{ paddingBottom: i < ACTIVITIES.length - 1 ? '20px' : 0 }}>
          {/* dot + line column */}
          <div style={{ position: 'relative', flexShrink: 0, width: 8 }}>
            <div className={`timeline-dot${item.active ? ' active' : ''}`} />
            {i < ACTIVITIES.length - 1 && <div className="timeline-line" />}
          </div>

          {/* content */}
          <div style={{ flex: 1, paddingTop: 0 }}>
            <p
              style={{
                fontSize: '13.5px',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {item.action}
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 3,
              }}
            >
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {item.time}
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-disabled)' }}>·</span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {item.recruiter}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillsChart() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {SKILLS.map((skill) => (
        <div key={skill.name}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 5,
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {skill.name}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {skill.pct}%
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${skill.pct}%` }}
              transition={{ duration: 0.6, ease: [0, 0, 0.2, 1], delay: 0.5 }}
              style={{ background: 'var(--accent)' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickActions({ navigate }) {
  const actions = [
    {
      label: 'Search Candidates',
      Icon: Search,
      onClick: () => navigate('/recruiter/candidates'),
      variant: 'btn-primary',
    },
    {
      label: 'Add Candidate',
      Icon: PlusCircle,
      onClick: () => {},
      variant: 'btn-secondary',
    },
    {
      label: 'Run AI Match',
      Icon: Zap,
      onClick: () => {},
      variant: 'btn-secondary',
    },
    {
      label: 'View Analytics',
      Icon: BarChart2,
      onClick: () => {},
      variant: 'btn-secondary',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {actions.map(({ label, Icon, onClick, variant }) => (
        <button
          key={label}
          className={`btn ${variant} btn-full`}
          onClick={onClick}
          style={{ justifyContent: 'flex-start' }}
        >
          <Icon size={14} strokeWidth={2} />
          {label}
        </button>
      ))}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */

export default function RecruiterDashboard() {
  const navigate = useNavigate();

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p style={{ marginTop: 2 }}>Welcome back. Here's what's happening today.</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {}}
        >
          <Sparkles size={13} strokeWidth={2} />
          Run AI Search
        </button>
      </div>

      {/* Page Body */}
      <div className="page-body">

        {/* ── Metric Grid ──────────────────────────────────── */}
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {METRICS.map((metric, i) => (
            <MetricCard key={metric.label} metric={metric} index={i} />
          ))}
        </div>

        {/* ── Two-column section ───────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            alignItems: 'flex-start',
          }}
        >
          {/* LEFT — Recent Activity (60%) */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="card"
            style={{ flex: '0 0 60%', minWidth: 0 }}
          >
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0 }}>Recent Activity</h3>
              <span className="badge badge-gray">Live</span>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <ActivityTimeline />
            </div>
          </motion.div>

          {/* RIGHT — stacked sub-cards (40%) */}
          <div style={{ flex: '0 0 calc(40% - 20px)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Top Skills in Demand */}
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              className="card"
            >
              <div
                style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <h3 style={{ margin: 0 }}>Top Skills in Demand</h3>
              </div>
              <div style={{ padding: '20px 22px' }}>
                <SkillsChart />
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              className="card"
            >
              <div
                style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <h3 style={{ margin: 0 }}>Quick Actions</h3>
              </div>
              <div style={{ padding: '16px 22px 20px' }}>
                <QuickActions navigate={navigate} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
