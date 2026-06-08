import { Search, SlidersHorizontal, Copy, Check, ChevronLeft } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ProfilePanel from "../components/ProfilePanel";
import CandidateList from "../components/CandidateList";
import FiltersPanel from "../components/FiltersPanel";
import { buildSupabaseQuery } from "../components/ai/AISearchBar";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery]       = useState(searchParams.get("q") || "");
  const [inputVal, setInputVal] = useState(searchParams.get("q") || "");
  const [loading, setLoading]   = useState(false);
  const [candidates, setCandidates]           = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showFilters, setShowFilters]         = useState(true);
  const [emailsCopied, setEmailsCopied]       = useState(false);
  const [filters, setFilters] = useState({
    visa: "", location: "",
    hasLinkedIn: false, hasEmail: false, hasResume: false,
  });

  const applyFilters = useCallback((data, f) => {
    let result = data || [];
    if (f.visa)       result = result.filter(c => c["VISA"]?.toLowerCase().includes(f.visa.toLowerCase()));
    if (f.location)   result = result.filter(c => c["Current Location"]?.toLowerCase().includes(f.location.toLowerCase()));
    if (f.hasLinkedIn) result = result.filter(c => c["LinkedIn"]?.trim());
    if (f.hasEmail)   result = result.filter(c => c["Email"]?.trim());
    if (f.hasResume)  result = result.filter(c => c.resume_url?.trim() || c.resume_file_name?.trim());
    return result;
  }, []);

  async function searchCandidates(searchQuery = query) {
    setLoading(true);
    try {
      const baseQuery = supabase.from('candidates').select('*');
      const compiledQuery = buildSupabaseQuery(searchQuery, baseQuery);
      const { data, error } = await compiledQuery;
      if (!error) {
        const filtered = applyFilters(data, filters);
        setCandidates(filtered);
        setSelectedCandidate(filtered.length > 0 ? filtered[0] : null);
      }
    } catch (err) {
      console.error('[SearchPage] Search failed:', err);
    } finally {
      setLoading(false);
    }
  }

  // Re-filter on filter change without new network call
  useEffect(() => {
    if (query) searchCandidates();
  }, [filters]);

  // Initial load
  useEffect(() => {
    if (query) searchCandidates(query);
  }, [query]);

  const handleSearch = () => {
    const term = inputVal.trim();
    if (!term) return;
    setQuery(term);
  };

  const copyAllEmails = () => {
    const emails = candidates.map(c => c["Email"]).filter(Boolean).join(";");
    navigator.clipboard.writeText(emails);
    setEmailsCopied(true);
    setTimeout(() => setEmailsCopied(false), 2000);
  };

  const activeFilterCount = [
    filters.visa, filters.location,
    filters.hasLinkedIn, filters.hasEmail, filters.hasResume,
  ].filter(Boolean).length;

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-base)",
      overflow: "hidden",
    }}>

      {/* ── Top Bar ─────────────────────────────── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 20px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(3,2,15,0.8)",
        backdropFilter: "blur(20px)",
        flexShrink: 0,
        zIndex: 20,
      }}>
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none", cursor: "pointer",
            flexShrink: 0,
          }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "linear-gradient(135deg, #7c3aed, #d946ef)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: "white",
          }}>T</div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700, fontSize: 15,
            color: "var(--text-primary)",
          }}>
            Talent<span style={{
              background: "linear-gradient(135deg, #a78bfa, #d946ef)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Hub</span>
          </span>
        </button>

        <div style={{ width: 1, height: 24, background: "var(--border-subtle)" }} />

        {/* Search bar */}
        <div className="search-wrap" style={{
          flex: 1, maxWidth: 600,
          padding: "0 6px",
        }}>
          <Search size={16} style={{ marginLeft: 12, color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search skills, title, visa, location…"
            style={{
              flex: 1,
              background: "transparent", border: "none", outline: "none",
              fontSize: 14, color: "var(--text-primary)",
              padding: "10px 10px",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={handleSearch}
            className="btn-primary"
            style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, flexShrink: 0 }}>
            Search
          </button>
        </div>

        {/* Count + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexShrink: 0 }}>
          {!loading && candidates.length > 0 && (
            <div style={{
              fontSize: 12.5, fontWeight: 600,
              color: "var(--text-muted)",
            }}>
              <span style={{ color: "#a78bfa", fontSize: 15 }}>{candidates.length.toLocaleString()}</span>
              {" "}results
            </div>
          )}

          <button
            onClick={copyAllEmails}
            className="btn-ghost"
            style={{ fontSize: 12, gap: 6 }}>
            {emailsCopied ? <Check size={13} style={{ color: "#10b981" }} /> : <Copy size={13} />}
            {emailsCopied ? "Copied!" : "Copy Emails"}
          </button>

          <button
            onClick={() => setShowFilters(v => !v)}
            className="btn-ghost"
            style={{
              fontSize: 12, gap: 6,
              ...(showFilters ? {
                background: "rgba(139,92,246,0.12)",
                borderColor: "rgba(139,92,246,0.3)",
                color: "#c4b5fd",
              } : {}),
            }}>
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{
                background: "linear-gradient(135deg, #7c3aed, #d946ef)",
                color: "white", fontSize: 10, fontWeight: 700,
                padding: "1px 6px", borderRadius: 99,
              }}>{activeFilterCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Filters sidebar */}
        {showFilters && (
          <div style={{
            width: 220,
            borderRight: "1px solid var(--border-subtle)",
            background: "rgba(3,2,15,0.6)",
            flexShrink: 0,
            overflow: "hidden",
          }}>
            <FiltersPanel filters={filters} setFilters={setFilters} />
          </div>
        )}

        {/* Candidate list */}
        <div style={{
          width: 340,
          borderRight: "1px solid var(--border-subtle)",
          background: "rgba(6,5,20,0.4)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}>
          {/* List header */}
          <div style={{
            padding: "14px 16px 10px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Candidates
            </span>
            {!loading && candidates.length > 0 && (
              <span className="badge-cyan">{candidates.length.toLocaleString()}</span>
            )}
          </div>

          {/* List body */}
          <div className="scroll-area" style={{ flex: 1, padding: 12 }}>
            {loading ? (
              /* Loading skeletons */
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{
                    borderRadius: 14,
                    border: "1px solid var(--border-subtle)",
                    padding: 14,
                  }}>
                    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 13, borderRadius: 6, marginBottom: 8, width: "70%" }} />
                        <div className="skeleton" style={{ height: 11, borderRadius: 6, width: "50%" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[80, 60, 70].map((w, j) => (
                        <div key={j} className="skeleton" style={{ height: 22, borderRadius: 99, width: w }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : candidates.length === 0 && query ? (
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                height: "60%", gap: 12, textAlign: "center",
              }}>
                <div style={{ fontSize: 32 }}>🔍</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
                  No results found
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Try a different search term
                </div>
              </div>
            ) : !query ? (
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                height: "60%", gap: 12, textAlign: "center",
              }}>
                <div style={{ fontSize: 36 }}>✨</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
                  Start searching
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Search for candidates above
                </div>
              </div>
            ) : (
              <CandidateList
                candidates={candidates}
                selectedCandidate={selectedCandidate}
                setSelectedCandidate={setSelectedCandidate}
              />
            )}
          </div>
        </div>

        {/* Profile panel */}
        <div className="scroll-area" style={{ flex: 1, background: "rgba(3,2,15,0.3)" }}>
          <ProfilePanel candidate={selectedCandidate} />
        </div>
      </div>
    </div>
  );
}