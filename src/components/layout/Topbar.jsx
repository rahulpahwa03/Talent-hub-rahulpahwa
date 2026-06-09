import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Plus, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

/* Derive a human-readable page title from the pathname */
function getPageTitle(pathname) {
  const segment = pathname.split('/').filter(Boolean).pop() || '';
  if (!segment) return 'Home';
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/recruiter/candidates?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleCopyShareLink = () => {
    const link = `${window.location.origin}/candidate/upload`;
    navigator.clipboard.writeText(link);
    toast.success('Shareable candidate portal link copied to clipboard!');
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="topbar">
      {/* ── Left: Page title ──────────────────────────────── */}
      <div style={{ flexShrink: 0 }}>
        <h4 style={{ margin: 0, fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>
          {pageTitle}
        </h4>
      </div>

      {/* ── Center: Search bar ────────────────────────────── */}
      <div className="search-bar flex-1" style={{ maxWidth: 480, margin: '0 auto' }}>
        <Search size={15} strokeWidth={1.8} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search candidates, skills, visa…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          aria-label="Search"
        />
      </div>

      {/* ── Right: Actions ────────────────────────────────── */}
      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
        {/* Copy Share Link */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleCopyShareLink}
          title="Copy shareable link for candidates to upload resumes"
        >
          <Share2 size={13} strokeWidth={2.2} />
          Share Link
        </button>

        {/* New Candidate */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/candidate/upload')}
        >
          <Plus size={13} strokeWidth={2.2} />
          New Candidate
        </button>

        {/* Notification bell */}
        <button
          className="btn btn-ghost btn-sm"
          style={{ position: 'relative', padding: '5px 8px' }}
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={1.8} />
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 16,
              height: 16,
              background: 'var(--error)',
              borderRadius: 'var(--radius-full)',
              fontSize: 9,
              fontWeight: 700,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              border: '1.5px solid var(--bg)',
            }}
          >
            3
          </span>
        </button>

        {/* User avatar */}
        <div
          className="avatar avatar-sm"
          style={{ background: 'var(--primary)', cursor: 'pointer' }}
          title="Recruiter User"
        >
          R
        </div>
      </div>
    </header>
  );
}
