import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Plus, Share2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

/* Derive a human-readable page title from the pathname */
function getPageTitle(pathname) {
  const segment = pathname.split('/').filter(Boolean).pop() || '';
  if (!segment) return 'Home';
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

const TICKER_ITEMS = [
  "🗽 NYC Temp: 80°F | Recruiter ROI is currently HOT! 🔥",
  "📈 Staffing News: Q3 US net hiring sentiment surges to 45%!",
  "⚠️ Bench Alert: Snowflake and React skills are in extremely high demand this week.",
  "💼 Sourcing Tip: A cup of coffee a day keeps the talent acquisition team awake.",
  "☀️ Austin Temp: 85°F | Sourcing fires are burning brighter than the Texas sun!"
];

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % TICKER_ITEMS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <header className="topbar" style={{ borderBottom: 'none' }}>
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

      {/* Staffing Ticker Sub-bar */}
      <div
        style={{
          background: 'linear-gradient(90deg, #F3F4F6, #EFF6FF)',
          borderBottom: '1px solid var(--border)',
          padding: '6px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 32,
          overflow: 'hidden',
          fontSize: '11.5px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4F46E5', flexShrink: 0 }}>
          <Sparkles size={13} style={{ fill: '#C7D2FE' }} />
          <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ezra Staffing Feed:</span>
        </div>
        <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div
            key={tickerIndex}
            style={{
              animation: 'fadeIn 0.5s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {TICKER_ITEMS[tickerIndex]}
          </div>
        </div>
      </div>
    </div>
  );
}
