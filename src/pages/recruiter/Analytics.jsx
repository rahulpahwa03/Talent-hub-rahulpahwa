import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, FileText, Clock, Target } from 'lucide-react';

/* ─── Mock Data ──────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const GROWTH_DATA = MONTHS.map((month, i) => ({
  month,
  candidates: [2100, 2800, 3200, 4100, 4800, 5200, 6100, 7300, 8200, 9100, 9800, 11200][i],
}));

const UPLOAD_DATA = MONTHS.map((month, i) => ({
  month,
  resumes: [180, 220, 310, 280, 340, 420, 380, 450, 490, 520, 480, 610][i],
}));

const SKILLS = [
  { name: 'Snowflake',        pct: 89 },
  { name: 'Python',           pct: 82 },
  { name: 'AWS',              pct: 76 },
  { name: 'React',            pct: 71 },
  { name: 'Java',             pct: 65 },
  { name: 'Kubernetes',       pct: 58 },
  { name: 'Machine Learning', pct: 52 },
  { name: 'Docker',           pct: 47 },
];

const RECRUITERS = [
  { name: 'Alice Johnson', added: 142, searches: 89, notes: 34 },
  { name: 'Bob Smith',     added: 98,  searches: 67, notes: 28 },
  { name: 'Carol Davis',   added: 87,  searches: 54, notes: 19 },
  { name: 'David Lee',     added: 76,  searches: 43, notes: 22 },
  { name: 'Emma Wilson',   added: 64,  searches: 38, notes: 15 },
];

const METRICS = [
  {
    label: 'Total Profiles',
    value: '48,291',
    delta: '+12.4%',
    positive: true,
    Icon: Users,
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    label: 'Resumes Parsed',
    value: '41,203',
    delta: '+8.2%',
    positive: true,
    Icon: FileText,
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
  },
  {
    label: 'Time to Fill (avg)',
    value: '12 days',
    delta: '-2.1 days',
    positive: true,
    Icon: Clock,
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
  },
  {
    label: 'Placement Rate',
    value: '68.4%',
    delta: '+4.2%',
    positive: true,
    Icon: Target,
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
  },
];

const PERIODS = ['7d', '30d', '90d', '1y'];

/* ─── Motion Variants ────────────────────────────────────── */

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0, 0, 0.2, 1], delay: i * 0.05 },
  }),
};

/* ─── Custom Tooltip ─────────────────────────────────────── */

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '8px 14px',
      boxShadow: 'var(--shadow-md)',
      fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: 'var(--text-secondary)' }}>
          {p.value.toLocaleString()}
        </div>
      ))}
    </div>
  );
}

/* ─── Skill Bar Row ──────────────────────────────────────── */

function SkillBar({ skill, index }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>
          {skill.name}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {skill.pct}%
        </span>
      </div>
      <div style={{
        height: 6,
        background: 'var(--bg-muted)',
        borderRadius: 99,
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${skill.pct}%` }}
          transition={{ duration: 0.65, ease: [0, 0, 0.2, 1], delay: 0.3 + index * 0.04 }}
          style={{
            height: '100%',
            background: '#111827',
            borderRadius: 99,
          }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */

export default function Analytics() {
  const [period, setPeriod] = useState('30d');

  return (
    <>
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Analytics</h2>
          <p style={{ marginTop: 2 }}>Recruitment metrics and insights</p>
        </div>

        {/* Period selector */}
        <div style={{
          display: 'flex',
          gap: 4,
          background: 'var(--bg-muted)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
        }}>
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '5px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: period === p ? 600 : 450,
                cursor: 'pointer',
                border: 'none',
                fontFamily: 'inherit',
                transition: 'all 0.15s var(--ease)',
                background: period === p ? '#fff' : 'transparent',
                color: period === p ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: period === p ? 'var(--shadow-xs)' : 'none',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Page Body ───────────────────────────────────── */}
      <div className="page-body">

        {/* ── Metric Strip ──────────────────────────────── */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              className="metric-card"
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <div className="metric-icon" style={{ background: m.iconBg }}>
                <m.Icon size={18} color={m.iconColor} strokeWidth={1.8} />
              </div>
              <div className="metric-value">{m.value}</div>
              <div className="metric-label">{m.label}</div>
              <div className="metric-delta" style={{ color: m.positive ? 'var(--success)' : 'var(--error)' }}>
                {m.positive
                  ? <TrendingUp size={11} strokeWidth={2.2} />
                  : <TrendingDown size={11} strokeWidth={2.2} />}
                {m.delta}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Charts Row ────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Candidate Growth — Line */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="card"
          >
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0 }}>Candidate Growth</h3>
              <p style={{ fontSize: 12.5, marginTop: 2, color: 'var(--text-muted)' }}>
                Total profiles added over time
              </p>
            </div>
            <div style={{ padding: '20px 22px 24px' }}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={GROWTH_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="candidates"
                    stroke="#111827"
                    strokeWidth={2}
                    dot={{ fill: '#111827', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#111827' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Resume Upload Trends — Bar */}
          <motion.div
            custom={5}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="card"
          >
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0 }}>Resume Upload Trends</h3>
              <p style={{ fontSize: 12.5, marginTop: 2, color: 'var(--text-muted)' }}>
                Monthly resume uploads
              </p>
            </div>
            <div style={{ padding: '20px 22px 24px' }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={UPLOAD_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="resumes"
                    fill="#111827"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* ── Bottom Row ────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Top Skills in Demand */}
          <motion.div
            custom={6}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="card"
          >
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0 }}>Top Skills in Demand</h3>
              <p style={{ fontSize: 12.5, marginTop: 2, color: 'var(--text-muted)' }}>
                Based on active job requirements
              </p>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {SKILLS.map((skill, i) => (
                <SkillBar key={skill.name} skill={skill} index={i} />
              ))}
            </div>
          </motion.div>

          {/* Recruiter Activity Table */}
          <motion.div
            custom={7}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="card"
          >
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0 }}>Recruiter Activity</h3>
              <p style={{ fontSize: 12.5, marginTop: 2, color: 'var(--text-muted)' }}>
                Performance overview for the period
              </p>
            </div>
            <div style={{ padding: '0' }}>
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Recruiter</th>
                      <th style={{ textAlign: 'right' }}>Candidates Added</th>
                      <th style={{ textAlign: 'right' }}>Searches</th>
                      <th style={{ textAlign: 'right' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECRUITERS.map((r, i) => {
                      const initials = r.name.split(' ').map(x => x[0]).join('');
                      const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#E11D48'];
                      return (
                        <tr key={r.name}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <div style={{
                                width: 28, height: 28,
                                borderRadius: 'var(--radius-sm)',
                                background: colors[i % colors.length],
                                color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10.5, fontWeight: 700, flexShrink: 0,
                              }}>
                                {initials}
                              </div>
                              <span style={{ fontWeight: 500 }}>{r.name}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.added}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{r.searches}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{r.notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
