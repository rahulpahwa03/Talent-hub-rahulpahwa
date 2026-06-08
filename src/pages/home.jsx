import { Search, Sparkles, ArrowRight, Zap, Users, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const QUICK_TAGS = [
  "Snowflake", "Python", "AWS", "React", "Data Engineer",
  "Java", "Kubernetes", "Machine Learning",
];

const STATS = [
  { icon: <Users size={16} />, label: "Candidates", value: "50K+" },
  { icon: <Database size={16} />, label: "Resumes", value: "32K+" },
  { icon: <Zap size={16} />, label: "Avg. Match Time", value: "< 2s" },
];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (q = query) => {
    const term = q.trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden"
         style={{ background: "var(--bg-base)" }}>

      {/* ── Ambient Orbs ──────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        overflow: "hidden",
      }}>
        {/* Top-left purple orb */}
        <div style={{
          position: "absolute", left: "-15%", top: "-10%",
          width: 700, height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        {/* Bottom-right fuchsia orb */}
        <div style={{
          position: "absolute", right: "-10%", bottom: "-15%",
          width: 600, height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(217,70,239,0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        {/* Center cyan orb */}
        <div style={{
          position: "absolute", left: "40%", top: "30%",
          width: 400, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
        }} />

        {/* Grid lines */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
        }} />
      </div>

      {/* ── Navbar ───────────────────────────────── */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 48px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Logo mark */}
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed, #d946ef)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, color: "white",
            boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
          }}>T</div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, color: "var(--text-primary)" }}>
            Talent<span className="gradient-text">Hub</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="https://github.com" target="_blank" rel="noreferrer"
             className="btn-ghost" style={{ fontSize: 12.5 }}>
            Docs
          </a>
          <button
            onClick={() => navigate("/search?q=React")}
            className="btn-primary"
            style={{ padding: "9px 20px", fontSize: 13 }}>
            Launch App
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────── */}
      <main style={{
        position: "relative", zIndex: 10,
        flex: 1,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px 80px",
        textAlign: "center",
      }}>

        {/* Badge */}
        <div className="animate-fade-slide-up" style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "6px 16px",
          borderRadius: 100,
          background: "rgba(139,92,246,0.08)",
          border: "1px solid rgba(139,92,246,0.2)",
          fontSize: 12.5, fontWeight: 500,
          color: "#c4b5fd",
          marginBottom: 36,
        }}>
          <Sparkles size={13} style={{ color: "#d946ef" }} />
          AI-Powered Talent Intelligence Platform
          <span style={{
            background: "linear-gradient(90deg, #7c3aed, #d946ef)",
            color: "white",
            fontSize: 10, fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 100,
            letterSpacing: "0.05em",
          }}>NEW</span>
        </div>

        {/* Heading */}
        <h1 className="animate-fade-slide-up delay-100" style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "clamp(48px, 8vw, 92px)",
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
          margin: "0 0 4px",
          maxWidth: 820,
        }}>
          Find World-Class
        </h1>
        <h1 className="animate-fade-slide-up delay-200" style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "clamp(48px, 8vw, 92px)",
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #a78bfa 0%, #d946ef 45%, #7c3aed 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          margin: "0 0 32px",
        }}>
          Talent, Instantly
        </h1>

        <p className="animate-fade-slide-up delay-300" style={{
          fontSize: 18,
          color: "var(--text-secondary)",
          maxWidth: 560,
          lineHeight: 1.7,
          marginBottom: 56,
        }}>
          Search candidates by skills, visa status, location, and experience.
          One workspace. Real-time results.
        </p>

        {/* ── Search Box ── */}
        <div className="animate-fade-slide-up delay-300" style={{ width: "100%", maxWidth: 700 }}>
          <div className="search-wrap" style={{ padding: 8, gap: 8 }}>
            <Search size={20} style={{
              marginLeft: 16, color: "#8b5cf6", flexShrink: 0,
            }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search skills, title, visa status, location…"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 15.5,
                color: "var(--text-primary)",
                padding: "10px 8px",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => handleSearch()}
              className="btn-primary"
              style={{ flexShrink: 0, padding: "12px 28px", borderRadius: 11 }}>
              Search
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* ── Quick Tags ── */}
        <div className="animate-fade-slide-up delay-400" style={{
          display: "flex", flexWrap: "wrap", gap: 10,
          justifyContent: "center", marginTop: 24,
        }}>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleSearch(tag)}
              style={{
                padding: "7px 16px",
                borderRadius: 100,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text-secondary)",
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)";
                e.currentTarget.style.color = "#c4b5fd";
                e.currentTarget.style.background = "rgba(139,92,246,0.1)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* ── Stats ── */}
        <div className="animate-fade-slide-up delay-500" style={{
          display: "flex", gap: 0,
          marginTop: 72,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 18,
          overflow: "hidden",
          backdropFilter: "blur(20px)",
        }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              padding: "20px 40px",
              textAlign: "center",
              borderRight: i < STATS.length - 1 ? "1px solid var(--border-subtle)" : "none",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                justifyContent: "center",
                fontSize: 22, fontWeight: 800,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: "var(--text-primary)",
              }}>
                {s.value}
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                justifyContent: "center",
                fontSize: 12, color: "var(--text-muted)",
                marginTop: 4, fontWeight: 500,
              }}>
                {s.icon}
                {s.label}
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* ── Footer ────────────────────────────────── */}
      <footer style={{
        position: "relative", zIndex: 10,
        textAlign: "center",
        padding: "16px",
        fontSize: 12,
        color: "var(--text-muted)",
      }}>
        Built by <span style={{ color: "#a78bfa", fontWeight: 600 }}>Rahul Pahwa</span>
      </footer>

    </div>
  );
}