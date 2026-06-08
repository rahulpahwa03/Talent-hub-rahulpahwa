import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BarChart2,
  Sparkles,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';

const NAV = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/recruiter/dashboard' },
      { label: 'Candidates', icon: Users, to: '/recruiter/candidates' },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div className="sidebar-logo">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--primary)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: '-0.02em',
                fontFamily: 'inherit',
              }}
            >
              E
            </span>
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              EzHire
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500, marginTop: 1 }}>
              by Bharat Digitals
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="sidebar-nav">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div className="nav-section">{section}</div>
            {items.map(({ label, icon: Icon, to, disabled, end }) =>
              disabled ? (
                <button
                  key={label}
                  className="nav-item"
                  disabled
                  style={{ opacity: 0.4, cursor: 'not-allowed' }}
                >
                  <Icon size={15} strokeWidth={1.8} />
                  {label}
                </button>
              ) : (
                <NavLink
                  key={label}
                  to={to}
                  end={end !== false}
                  className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                >
                  <Icon size={15} strokeWidth={1.8} />
                  {label}
                </NavLink>
              )
            )}
          </div>
        ))}
      </nav>

      {/* ── Footer / User ─────────────────────────────────── */}
      <div className="sidebar-footer">
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          {/* Avatar */}
          <div
            className="avatar avatar-sm"
            style={{ background: 'var(--primary)', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
          >
            R
          </div>

          {/* User info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="truncate"
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}
            >
              Recruiter User
            </div>
            <div
              className="truncate"
              style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}
            >
              recruiter@ezhire.com
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          className="nav-item"
          style={{ color: 'var(--error)', width: '100%' }}
          onClick={() => navigate('/login')}
        >
          <LogOut size={14} strokeWidth={1.8} />
          Log out
        </button>
      </div>
    </motion.aside>
  );
}
