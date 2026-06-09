import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Search,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Cpu,
  Layers,
  Send,
  UserCheck,
  RefreshCw,
  FileText,
  AlertCircle,
  X,
  MapPin,
  Shield,
  Mail,
  Heart,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  ExternalLink,
  Plus,
  Trash2,
  MessageSquare,
  ChevronRight,
  Clipboard,
  SlidersHorizontal,
  Download,
  Info,
  Phone,
  Link as LinkIcon,
  File,
  User,
  Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

/* ─── Static Constants ────────────────────────────────────── */
const ANALYTICS_PERIODS = ['7d', '30d', '90d', '1y'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const GROWTH_DATA = MONTHS.map((month, i) => ({
  month,
  candidates: [2100, 2800, 3200, 4100, 4800, 5200, 6100, 7300, 8200, 9100, 9800, 11200][i],
}));

const UPLOAD_DATA = MONTHS.map((month, i) => ({
  month,
  resumes: [180, 220, 310, 280, 340, 420, 380, 450, 490, 520, 480, 610][i],
}));

const DEMO_SKILLS = [
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

const SUGGESTED_CHIPS = [
  "Snowflake Engineers in Texas with H1B",
  "Senior Java Developer Spring Boot",
  "Python Data Engineer AWS 5+ years",
];

const VISA_OPTIONS = [
  "All",
  "US Citizen",
  "Green Card",
  "H1B",
  "H4 EAD",
  "OPT/CPT",
  "TN Visa",
  "L1",
  "Other",
];

/* ─── Avatar Gradient helper ─── */
const AVATAR_COLORS = [
  { bg: "#F0EEFF", text: "#5B4FCC" },
  { bg: "#E1F5EE", text: "#0F6E56" },
  { bg: "#E6F1FB", text: "#185FA5" },
  { bg: "#FAECE7", text: "#993C1D" },
  { bg: "#FAEEDA", text: "#854F0B" },
];

function getAvatarColor(name) {
  const code = (name || "").charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

/* Helper to generate embeddable resume link */
function getEmbeddableResumeUrl(url) {
  if (!url) return "";
  const lowercaseUrl = url.toLowerCase();
  if (
    lowercaseUrl.endsWith(".docx") ||
    lowercaseUrl.endsWith(".doc") ||
    lowercaseUrl.includes(".docx?") ||
    lowercaseUrl.includes(".doc?")
  ) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return url;
}

/* ════════════════════════════════════════════════════════
   MAIN WORKSPACE COMPONENT
   ════════════════════════════════════════════════════════ */
export default function RecruiterDashboard({ activeTab }) {
  const navigate = useNavigate();

  // Unified Database State
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchVal, setSearchVal] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    visa: "All",
    location: "",
    skills: [],
    experience: 0,
    hasEmail: false,
    hasLinkedIn: false,
    hasResume: false,
    favoritesOnly: false,
  });

  const [sortOrder, setSortOrder] = useState("newest");
  const [skillInput, setSkillInput] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState({ to: "", subject: "", body: "" });
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isAskCandidateOpen, setIsAskCandidateOpen] = useState(false);
  const [resumePreviewUrl, setResumePreviewUrl] = useState(null);

  // New Candidate Form State
  const [newCandidateForm, setNewCandidateForm] = useState({
    name: "", email: "", phone: "", linkedin: "", location: "",
    visa: "", title: "", currentEmployer: "", experience: "", skills: "", summary: "",
  });
  const [newCandidateFile, setNewCandidateFile] = useState(null);
  const [addingCandidate, setAddingCandidate] = useState(false);

  // Analytics Tab period
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30d");

  // Ezra AI Chat state
  const [isEzraOpen, setIsEzraOpen] = useState(false);
  const [ezraMessages, setEzraMessages] = useState([
    {
      sender: "ezra",
      text: "Hello, I am Ezra, your AI recruiting assistant. You can search the candidate database using natural language or filter candidates easily.",
      time: "10:00 AM",
    },
  ]);
  const [ezraInput, setEzraInput] = useState("");
  const [isEzraTyping, setIsEzraTyping] = useState(false);

  // Load candidates on mount
  useEffect(() => {
    async function fetchDb() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('candidates').select('*');
        if (error) throw error;
        setCandidates(data || []);
      } catch (err) {
        console.error("DB error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDb();
  }, []);

  // Real database metrics calculation
  const calculatedMetrics = useMemo(() => {
    const total = candidates.length;
    const parsed = candidates.filter(c => c.resume_url).length;
    const favorites = candidates.filter(c => c.favorite).length;
    const optCp = candidates.filter(c => (c.VISA || '').toLowerCase() === 'opt/cpt').length;
    const h1b = candidates.filter(c => (c.VISA || '').toLowerCase() === 'h1b').length;
    return {
      total,
      parsed,
      favorites,
      optCp,
      h1b,
    };
  }, [candidates]);

  // Fuzzy Search Engine for 15,000 resumes easily
  const processedCandidates = useMemo(() => {
    let result = [...candidates];

    if (searchVal.trim()) {
      const keywords = searchVal.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter(c => {
        const name = (c['Candidate Name'] || '').toLowerCase();
        const title = (c['Title'] || '').toLowerCase();
        const skills = (c['Skills'] || '').toLowerCase();
        const summary = (c['summary'] || '').toLowerCase();
        const text = (c['resume_text'] || '').toLowerCase();
        const visa = (c['VISA'] || '').toLowerCase();
        const loc = (c['Current Location'] || '').toLowerCase();

        return keywords.every(kw => 
          name.includes(kw) ||
          title.includes(kw) ||
          skills.includes(kw) ||
          summary.includes(kw) ||
          visa.includes(kw) ||
          loc.includes(kw) ||
          text.includes(kw)
        );
      });
    }

    // Visa filter
    if (activeFilters.visa !== "All") {
      result = result.filter(c => (c['VISA'] || '').toLowerCase() === activeFilters.visa.toLowerCase());
    }

    // Location filter
    if (activeFilters.location.trim()) {
      const loc = activeFilters.location.toLowerCase();
      result = result.filter(c => (c['Current Location'] || '').toLowerCase().includes(loc));
    }

    // Skills filter (must match all tagged skills)
    if (activeFilters.skills.length > 0) {
      result = result.filter(c => {
        const cSkills = (c['Skills'] || '').toLowerCase();
        return activeFilters.skills.every(s => cSkills.includes(s.toLowerCase()));
      });
    }

    // Flags filters
    if (activeFilters.hasEmail) result = result.filter(c => c['Email']);
    if (activeFilters.hasLinkedIn) result = result.filter(c => c['LinkedIn']);
    if (activeFilters.hasResume) result = result.filter(c => c['resume_url']);
    if (activeFilters.favoritesOnly) result = result.filter(c => c['favorite']);

    // Sort matching logic
    if (sortOrder === "newest") {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortOrder === "experience-desc") {
      result.sort((a, b) => parseInt(b.experience || 0) - parseInt(a.experience || 0));
    } else if (sortOrder === "experience-asc") {
      result.sort((a, b) => parseInt(a.experience || 0) - parseInt(b.experience || 0));
    }

    return result;
  }, [candidates, searchVal, activeFilters, sortOrder]);

  // AI Sourcing apply queries
  const handleApplyAISearch = (query) => {
    setSearchVal(query);
    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
    const visaMatch = VISA_OPTIONS.find(v => keywords.some(k => k === v.toLowerCase()));
    
    setActiveFilters(prev => ({
      ...prev,
      visa: visaMatch || "All",
      skills: keywords.filter(k => k !== 'engineers' && k !== 'developer' && k !== 'senior').slice(0, 2),
    }));
    toast.success("AI search filters applied!");
  };

  // Ezra chat handler (smart hardcoded AI selling point)
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!ezraInput.trim()) return;

    const userMsg = { sender: "user", text: ezraInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setEzraMessages(prev => [...prev, userMsg]);
    const query = ezraInput.toLowerCase();
    setEzraInput("");

    setIsEzraTyping(true);
    await new Promise(r => setTimeout(r, 1000));

    let reply = "";
    if (query.includes("h1b") || query.includes("visa")) {
      reply = "I scanned the database and filtered for **H1B Visa** holders. I found relevant profiles containing active matching credentials.";
      setActiveFilters(prev => ({ ...prev, visa: "H1B" }));
    } else if (query.includes("snowflake") || query.includes("data engineer")) {
      reply = "I configured filters for **Snowflake** skills and updated the candidate roster view.";
      setActiveFilters(prev => ({ ...prev, skills: [...prev.skills, "Snowflake"] }));
    } else if (query.includes("email") || query.includes("outreach")) {
      reply = "I can help you draft candidate outreach campaigns. Select a candidate and click 'Draft Outreach Email' to launch the template composer.";
    } else {
      reply = "Based on our parsing model, I optimized our search indexes to bring you the closest matching profiles in real-time.";
    }

    setEzraMessages(prev => [...prev, {
      sender: "ezra",
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setIsEzraTyping(false);
  };

  // Recruiter add candidate submit
  const handleAddCandidateSubmit = async (e) => {
    e.preventDefault();
    if (!newCandidateForm.name.trim()) return toast.error("Name is required");
    if (!newCandidateForm.email.trim()) return toast.error("Email is required");

    setAddingCandidate(true);
    try {
      let resumeUrl = "";
      if (newCandidateFile) {
        const fileName = `${Date.now()}_${newCandidateFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("resumes")
          .upload(`uploads/${fileName}`, newCandidateFile);
        
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(`uploads/${fileName}`);
          resumeUrl = urlData?.publicUrl || "";
        }
      }

      const { data, error } = await supabase.rpc('insert_candidate', {
        p_name: newCandidateForm.name,
        p_email: newCandidateForm.email,
        p_phone: newCandidateForm.phone,
        p_linkedin: newCandidateForm.linkedin,
        p_location: newCandidateForm.location,
        p_visa: newCandidateForm.visa,
        p_title: newCandidateForm.title,
        p_skills: newCandidateForm.skills,
        p_experience: newCandidateForm.experience,
        p_employer: newCandidateForm.currentEmployer,
        p_summary: newCandidateForm.summary,
        p_resume_url: resumeUrl,
        p_resume_file: newCandidateFile?.name || "",
        p_resume_text: newCandidateForm.summary,
        p_notes: null,
        p_source: "recruiter_add",
      });

      if (error) throw error;

      toast.success("Candidate added successfully!");
      setIsAddCandidateOpen(false);
      setNewCandidateForm({
        name: "", email: "", phone: "", linkedin: "", location: "",
        visa: "", title: "", currentEmployer: "", experience: "", skills: "", summary: "",
      });
      setNewCandidateFile(null);
      
      // Reload candidates
      const { data: refreshed } = await supabase.from('candidates').select('*');
      if (refreshed) setCandidates(refreshed);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add candidate");
    } finally {
      setAddingCandidate(false);
    }
  };

  // Toggle favorite helper
  const handleToggleFavorite = async (cand) => {
    const nextFav = !cand.favorite;
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ favorite: nextFav })
        .eq('id', cand.id);
      if (error) throw error;

      setCandidates(prev => prev.map(c => c.id === cand.id ? { ...c, favorite: nextFav } : c));
      if (selectedCandidate?.id === cand.id) {
        setSelectedCandidate(prev => ({ ...prev, favorite: nextFav }));
      }
      toast.success(nextFav ? "Added to favorites" : "Removed from favorites");
    } catch (err) {
      console.error(err);
    }
  };

  // Save recruiter note
  const handleNoteSave = async (cand, text) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ notes: text })
        .eq('id', cand.id);
      if (error) throw error;

      setCandidates(prev => prev.map(c => c.id === cand.id ? { ...c, notes: text } : c));
      toast.success("Note saved");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "var(--bg-soft)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Tab Selector subnav */}
      <div
        style={{
          background: "var(--bg)",
          padding: "0 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexShrink: 0,
        }}
      >
        {[
          { id: "dashboard", label: "Workspace" },
          { id: "analytics", label: "Analytics Reports" },
        ].map((tab) => {
          const isActive = activeTab === tab.id || (activeTab === "candidates" && tab.id === "dashboard");
          return (
            <button
              key={tab.id}
              className={`tab-trigger ${isActive ? "active" : ""}`}
              onClick={() => navigate(`/recruiter/${tab.id}`)}
              style={{
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                padding: "12px 18px",
              }}
            >
              {tab.label}
            </button>
          );
        })}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsAskCandidateOpen(true)}>
            <Share2 size={12} />
            Ask Candidate to be Added
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsAddCandidateOpen(true)}>
            <Plus size={12} />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <AnimatePresence mode="wait">
          {/* TAB 1: WORKSPACE (Combined Dashboard & Database) */}
          {(activeTab === "dashboard" || activeTab === "candidates") && (
            <motion.div
              key="workspace-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}
            >
              {/* Metrics bar at the top */}
              <div
                style={{
                  background: "var(--bg)",
                  padding: "16px 24px",
                  borderBottom: "1px solid var(--border)",
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 16,
                  flexShrink: 0,
                }}
              >
                {[
                  { label: "Total Candidates", value: calculatedMetrics.total, bg: "#EFF6FF", text: "#2563EB" },
                  { label: "Resumes Parsed", value: calculatedMetrics.parsed, bg: "#F5F3FF", text: "#7C3AED" },
                  { label: "Favorites List", value: calculatedMetrics.favorites, bg: "#FFF1F2", text: "#E11D48" },
                  { label: "H1B Candidates", value: calculatedMetrics.h1b, bg: "#FFFBEB", text: "#D97706" },
                  { label: "OPT / CPT Candidates", value: calculatedMetrics.optCp, bg: "#F0FDF4", text: "#16A34A" },
                ].map((m, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "var(--radius-md)",
                      background: m.bg, color: m.text, display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 13,
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{m.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{m.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Roster & Grid Layout body */}
              <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                
                {/* Left side filters panel */}
                <div
                  style={{
                    width: 240,
                    borderRight: "1px solid var(--border)",
                    background: "var(--bg)",
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                    padding: 20,
                    gap: 18,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                      Filters
                    </h4>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: 2, fontSize: 11 }}
                      onClick={() => setActiveFilters({
                        visa: "All", location: "", skills: [], experience: 0,
                        hasEmail: false, hasLinkedIn: false, hasResume: false, favoritesOnly: false,
                      })}
                    >
                      Clear
                    </button>
                  </div>

                  {/* Visa Status */}
                  <div className="input-group">
                    <label className="input-label">Visa Status</label>
                    <select
                      className="input"
                      value={activeFilters.visa}
                      onChange={(e) => setActiveFilters({ ...activeFilters, visa: e.target.value })}
                    >
                      {VISA_OPTIONS.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div className="input-group">
                    <label className="input-label">Location (State/City)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Texas, Dallas"
                      value={activeFilters.location}
                      onChange={(e) => setActiveFilters({ ...activeFilters, location: e.target.value })}
                    />
                  </div>

                  {/* Skills tags composer */}
                  <div className="input-group">
                    <label className="input-label">Skills</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Type & press Enter..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && skillInput.trim()) {
                          e.preventDefault();
                          if (!activeFilters.skills.includes(skillInput.trim())) {
                            setActiveFilters({ ...activeFilters, skills: [...activeFilters.skills, skillInput.trim()] });
                          }
                          setSkillInput("");
                        }
                      }}
                    />
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                      {activeFilters.skills.map(s => (
                        <span key={s} className="tag">
                          {s}
                          <button
                            type="button"
                            style={{ background: "none", border: "none", color: "var(--text-muted)", marginLeft: 4 }}
                            onClick={() => setActiveFilters({ ...activeFilters, skills: activeFilters.skills.filter(x => x !== s) })}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Flags checkboxes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {[
                      { label: "Has Email", key: "hasEmail" },
                      { label: "Has LinkedIn", key: "hasLinkedIn" },
                      { label: "Has Resume", key: "hasResume" },
                      { label: "Favorites Only", key: "favoritesOnly" },
                    ].map(f => (
                      <label key={f.key} className="checkbox-label" style={{ fontSize: 12.5 }}>
                        <input
                          type="checkbox"
                          checked={activeFilters[f.key]}
                          onChange={(e) => setActiveFilters({ ...activeFilters, [f.key]: e.target.checked })}
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Middle candidate card directory */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  
                  {/* Search query row */}
                  <div
                    style={{
                      padding: 16,
                      borderBottom: "1px solid var(--border)",
                      background: "var(--bg)",
                      display: "flex",
                      gap: 12,
                    }}
                  >
                    <div className="search-bar flex-1" style={{ maxWidth: 540 }}>
                      <Search size={14} style={{ color: "var(--text-muted)" }} />
                      <input
                        type="text"
                        placeholder="Search resumes... e.g. Snowflake AND Python"
                        value={searchVal}
                        onChange={(e) => setSearchVal(e.target.value)}
                      />
                    </div>

                    <select
                      className="input"
                      style={{ width: 140 }}
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <option value="newest">Newest</option>
                      <option value="experience-desc">Exp (high to low)</option>
                      <option value="experience-asc">Exp (low to high)</option>
                    </select>

                    <button
                      className="btn btn-secondary"
                      onClick={() => setIsEzraOpen(!isEzraOpen)}
                      style={{ display: "flex", gap: 6 }}
                    >
                      <MessageSquare size={14} />
                      Ask Ezra
                    </button>
                  </div>

                  {/* Candidates Cards directory grid */}
                  <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                    {loading ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                        <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
                      </div>
                    ) : processedCandidates.length === 0 ? (
                      <div className="empty-state">
                        <Info size={32} />
                        <p>No candidates match your filters.</p>
                      </div>
                    ) : (
                      <div className="candidates-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
                        {processedCandidates.map((cand) => {
                          const colorInfo = getAvatarColor(cand['Candidate Name']);
                          return (
                            <div
                              key={cand.id}
                              className={`cand-card ${selectedCandidate?.id === cand.id ? "selected" : ""}`}
                              onClick={() => setSelectedCandidate(cand)}
                              style={{ display: "flex", flexDirection: "column", gap: 12, padding: 18 }}
                            >
                              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <div
                                  className="avatar avatar-md"
                                  style={{
                                    background: colorInfo.bg,
                                    color: colorInfo.text,
                                    width: 42, height: 42, fontSize: 14,
                                  }}
                                >
                                  {cand['Candidate Name'] ? cand['Candidate Name'].split(' ').slice(0, 2).map(n => n[0]).join('') : "?"}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {cand['Candidate Name']}
                                  </h4>
                                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {cand['Title'] || "Technical Consultant"}
                                  </p>
                                </div>

                                <button
                                  style={{ background: "none", border: "none", color: cand.favorite ? "var(--error)" : "var(--text-muted)", cursor: "pointer" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(cand);
                                  }}
                                >
                                  <Heart size={14} fill={cand.favorite ? "var(--error)" : "none"} />
                                </button>
                              </div>

                              <div style={{ display: "flex", gap: 6 }}>
                                {cand['VISA'] && <span className="badge badge-blue">{cand['VISA']}</span>}
                                {cand.experience && <span className="badge badge-gray">{cand.experience} yrs exp</span>}
                              </div>

                              {/* Skills Pills */}
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {(cand['Skills'] || "").split(/[|,]/).slice(0, 4).map((s, idx) => (
                                  <span key={idx} className="tag" style={{ fontSize: 10, padding: "1px 6px" }}>{s.trim()}</span>
                                ))}
                              </div>

                              <div className="divider" style={{ margin: "4px 0" }} />

                              {/* Direct Contact info and Resume button */}
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                                <div style={{ display: "flex", gap: 6 }}>
                                  {cand['Email'] && (
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      title="Copy Email"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(cand['Email']);
                                        toast.success("Email copied");
                                      }}
                                      style={{ padding: 4 }}
                                    >
                                      <Mail size={12} />
                                    </button>
                                  )}
                                  {cand['Contact No'] && (
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      title="Copy Contact"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(cand['Contact No']);
                                        toast.success("Contact copied");
                                      }}
                                      style={{ padding: 4 }}
                                    >
                                      <Phone size={12} />
                                    </button>
                                  )}
                                  {cand['LinkedIn'] && (
                                    <a
                                      href={cand['LinkedIn'].startsWith("http") ? cand['LinkedIn'] : `https://${cand['LinkedIn']}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="btn btn-ghost btn-sm"
                                      style={{ padding: 4 }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <LinkIcon size={12} />
                                    </a>
                                  )}
                                </div>

                                {cand.resume_url && (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setResumePreviewUrl(cand.resume_url);
                                    }}
                                    style={{ fontSize: 11, padding: "4px 8px" }}
                                  >
                                    View Resume
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Collapsible right sidebar details drawer */}
              <AnimatePresence>
                {selectedCandidate && (
                  <motion.div
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    style={{
                      position: "fixed",
                      right: 0,
                      top: 56,
                      bottom: 0,
                      width: 400,
                      borderLeft: "1px solid var(--border)",
                      background: "var(--bg)",
                      display: "flex",
                      flexDirection: "column",
                      overflowY: "auto",
                      padding: 24,
                      gap: 20,
                      zIndex: 30,
                      boxShadow: "var(--shadow-xl)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Profile Overview</h3>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCandidate(null)} style={{ padding: 4 }}>
                        <X size={16} />
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div
                        className="avatar avatar-lg"
                        style={{
                          background: getAvatarColor(selectedCandidate['Candidate Name']).bg,
                          color: getAvatarColor(selectedCandidate['Candidate Name']).text,
                          width: 48, height: 48,
                        }}
                      >
                        {selectedCandidate['Candidate Name'] ? selectedCandidate['Candidate Name'].split(' ').slice(0, 2).map(n => n[0]).join('') : "?"}
                      </div>
                      <div>
                        <h4 style={{ margin: 0 }}>{selectedCandidate['Candidate Name']}</h4>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{selectedCandidate['Title']}</p>
                      </div>
                    </div>

                    <div className="divider" />

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { label: "Email", value: selectedCandidate['Email'] || "—", icon: Mail },
                        { label: "Phone", value: selectedCandidate['Contact No'] || "—", icon: Phone },
                        { label: "Visa", value: selectedCandidate['VISA'] || "—", icon: Shield },
                      ].map((item) => (
                        <div key={item.label} className="info-row" style={{ padding: "4px 0" }}>
                          <span className="info-label flex items-center gap-2" style={{ minWidth: 90 }}>
                            <item.icon size={12} />
                            {item.label}
                          </span>
                          <span className="info-value" style={{ fontSize: 12.5 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="divider" />

                    <div>
                      <p className="section-title">Summary</p>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {selectedCandidate.summary || "No summary profile populated."}
                      </p>
                    </div>

                    <div>
                      <p className="section-title">Recruiter Notes</p>
                      <textarea
                        rows={3}
                        className="input"
                        placeholder="Add notes... (auto-saves)"
                        defaultValue={selectedCandidate.notes || ""}
                        onBlur={(e) => handleNoteSave(selectedCandidate, e.target.value)}
                        style={{ fontSize: 12, resize: "vertical" }}
                      />
                    </div>

                    <button
                      className="btn btn-secondary btn-full"
                      onClick={() => {
                        setEmailDraft({
                          to: selectedCandidate.Email || "",
                          subject: `Staffing Opportunity: ${selectedCandidate.Title || "Role"}`,
                          body: `Hello ${selectedCandidate['Candidate Name']},\n\nWe reviewed your credentials and found them matching our active projects. Please let us know if you are open for a brief introductory discussion.`,
                        });
                        setIsEmailModalOpen(true);
                      }}
                    >
                      Draft Outreach Email
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsible right sidebar Ezra Chatbot */}
              <AnimatePresence>
                {isEzraOpen && (
                  <motion.div
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    className="ezra-panel"
                    style={{ position: "fixed", right: 0, top: 56, bottom: 0, zIndex: 30, boxShadow: "var(--shadow-xl)" }}
                  >
                    <div className="ezra-header">
                      <div className="ezra-avatar">E</div>
                      <div>
                        <h4 style={{ margin: 0 }}>Ezra AI</h4>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Sourcing assistant active</span>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setIsEzraOpen(false)} style={{ marginLeft: "auto", padding: 4 }}>
                        <X size={16} />
                      </button>
                    </div>

                    <div className="ezra-messages">
                      {ezraMessages.map((msg, i) => (
                        <div key={i} className={msg.sender === "user" ? "msg-user" : "msg-ezra"}>
                          {msg.sender === "ezra" && <div className="msg-ezra-mini-avatar">E</div>}
                          <div className="msg-ezra-content">
                            <div className={msg.sender === "user" ? "msg-user-bubble" : "msg-ezra-bubble"}>
                              {msg.text}
                            </div>
                            <span className="msg-time">{msg.time}</span>
                          </div>
                        </div>
                      ))}
                      {isEzraTyping && (
                        <div className="msg-ezra">
                          <div className="msg-ezra-mini-avatar">E</div>
                          <div className="typing-indicator">
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                          </div>
                        </div>
                      )}
                    </div>

                    {ezraMessages.length === 1 && (
                      <div className="ezra-chips">
                        {SUGGESTED_CHIPS.map((chip, i) => (
                          <button key={i} className="prompt-chip" onClick={() => handleApplyAISearch(chip)}>
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleSendChat} className="ezra-input-bar">
                      <input
                        type="text"
                        placeholder="Ask Ezra..."
                        value={ezraInput}
                        onChange={(e) => setEzraInput(e.target.value)}
                        className="ezra-input"
                      />
                      <button type="submit" className="ezra-send-btn">
                        <Send size={14} />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* TAB 2: ANALYTICS REPORTS */}
          {activeTab === "analytics" && (
            <motion.div
              key="analytics-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              style={{ padding: "24px 32px", overflowY: "auto", flex: 1 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h2>Analytics Insights</h2>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                    Recruiter productivity and talent growth trends
                  </p>
                </div>

                <div style={{ display: "flex", gap: 4, background: "var(--bg-muted)", borderRadius: "var(--radius-md)", padding: 4 }}>
                  {ANALYTICS_PERIODS.map(p => (
                    <button
                      key={p}
                      className="btn btn-ghost btn-sm"
                      onClick={() => setAnalyticsPeriod(p)}
                      style={{
                        background: analyticsPeriod === p ? "var(--bg)" : "transparent",
                        color: analyticsPeriod === p ? "var(--text-primary)" : "var(--text-muted)",
                        boxShadow: analyticsPeriod === p ? "var(--shadow-xs)" : "none",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid line graphs */}
              <div className="grid-2" style={{ gap: 20, marginBottom: 24 }}>
                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ marginBottom: 12 }}>Profiles Database Growth</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={GROWTH_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="candidates" stroke="var(--primary)" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ marginBottom: 12 }}>Resumes Extraction Trends</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={UPLOAD_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Bar dataKey="resumes" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tables row */}
              <div className="grid-2" style={{ gap: 20 }}>
                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ marginBottom: 12 }}>Top Matching Skills</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {DEMO_SKILLS.slice(0, 5).map(s => (
                      <div key={s.name} style={{ display: "flex", justifyBetween: true, alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                        <div style={{ flex: 1, height: 6, background: "var(--bg-muted)", borderRadius: 3, margin: "0 12px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${s.pct}%`, background: "var(--primary)" }} />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ marginBottom: 12 }}>Leaderboard Productivity</h4>
                  <div className="table-wrap" style={{ border: "none" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Recruiter Name</th>
                          <th>Added</th>
                          <th>Searches</th>
                        </tr>
                      </thead>
                      <tbody>
                        {RECRUITERS.map(r => (
                          <tr key={r.name}>
                            <td>{r.name}</td>
                            <td>{r.added}</td>
                            <td>{r.searches}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Add Candidate Modal ──────────────────────────────── */}
      <AnimatePresence>
        {isAddCandidateOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(17, 24, 39, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card"
              style={{
                width: "100%",
                maxWidth: 600,
                maxHeight: "90vh",
                overflowY: "auto",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Add New Candidate</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsAddCandidateOpen(false)} style={{ padding: 4 }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddCandidateSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={newCandidateForm.name}
                      onChange={(e) => setNewCandidateForm({ ...newCandidateForm, name: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input
                      type="email"
                      className="input"
                      required
                      value={newCandidateForm.email}
                      onChange={(e) => setNewCandidateForm({ ...newCandidateForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Contact No</label>
                    <input
                      type="text"
                      className="input"
                      value={newCandidateForm.phone}
                      onChange={(e) => setNewCandidateForm({ ...newCandidateForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">LinkedIn URL</label>
                    <input
                      type="text"
                      className="input"
                      value={newCandidateForm.linkedin}
                      onChange={(e) => setNewCandidateForm({ ...newCandidateForm, linkedin: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Location</label>
                    <input
                      type="text"
                      className="input"
                      value={newCandidateForm.location}
                      onChange={(e) => setNewCandidateForm({ ...newCandidateForm, location: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Visa Status</label>
                    <select
                      className="input"
                      value={newCandidateForm.visa}
                      onChange={(e) => setNewCandidateForm({ ...newCandidateForm, visa: e.target.value })}
                    >
                      <option value="">Select Visa</option>
                      {VISA_OPTIONS.slice(1).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Title / Role</label>
                    <input
                      type="text"
                      className="input"
                      value={newCandidateForm.title}
                      onChange={(e) => setNewCandidateForm({ ...newCandidateForm, title: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Employer</label>
                    <input
                      type="text"
                      className="input"
                      value={newCandidateForm.currentEmployer}
                      onChange={(e) => setNewCandidateForm({ ...newCandidateForm, currentEmployer: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Years of Experience</label>
                    <input
                      type="text"
                      className="input"
                      value={newCandidateForm.experience}
                      onChange={(e) => setNewCandidateForm({ ...newCandidateForm, experience: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Resume Document</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setNewCandidateFile(e.target.files[0])}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Skills (comma-separated)</label>
                  <input
                    type="text"
                    className="input"
                    value={newCandidateForm.skills}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, skills: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Professional Summary</label>
                  <textarea
                    rows={3}
                    className="input"
                    value={newCandidateForm.summary}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, summary: e.target.value })}
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
                  <button className="btn btn-secondary" type="button" onClick={() => setIsAddCandidateOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" type="submit" disabled={addingCandidate}>
                    {addingCandidate ? "Saving..." : "Add Profile"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Ask Candidate to be Added Modal ────────────────────── */}
      <AnimatePresence>
        {isAskCandidateOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(17, 24, 39, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card"
              style={{ width: "100%", maxWidth: 520, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Request Candidate Profile Upload</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsAskCandidateOpen(false)} style={{ padding: 4 }}>
                  <X size={16} />
                </button>
              </div>

              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Share this portal link with candidates. They can parse their resumes, review extraction fields, and complete their submission instantly. No login required.
              </p>

              <div className="input-group">
                <label className="input-label">Portal Share Link</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    className="input"
                    readOnly
                    value={`${window.location.origin}/candidate/upload`}
                    style={{ background: "var(--bg-muted)" }}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/candidate/upload`);
                      toast.success("Portal link copied");
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Email Invitation Template</label>
                <textarea
                  rows={5}
                  className="input"
                  readOnly
                  value={`Hello,\n\nPlease click the link below to submit your resume and complete your profile in our staffing system:\n\n${window.location.origin}/candidate/upload\n\nBest regards,\nRecruiting Team`}
                  style={{ background: "var(--bg-muted)", fontSize: 12.5, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(`Hello,\n\nPlease click the link below to submit your resume and complete your profile in our staffing system:\n\n${window.location.origin}/candidate/upload\n\nBest regards,\nRecruiting Team`);
                    toast.success("Invitation copied");
                  }}
                >
                  Copy Template
                </button>
                <button className="btn btn-primary" onClick={() => setIsAskCandidateOpen(false)}>
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Outreach Email Modal ───────────────────────────── */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(17, 24, 39, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card"
              style={{ width: "100%", maxWidth: 520, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Outreach Template Composer</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsEmailModalOpen(false)} style={{ padding: 4 }}>
                  <X size={16} />
                </button>
              </div>

              <div className="input-group">
                <label className="input-label">To</label>
                <input
                  type="text"
                  className="input"
                  value={emailDraft.to}
                  onChange={(e) => setEmailDraft({ ...emailDraft, to: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Subject</label>
                <input
                  type="text"
                  className="input"
                  value={emailDraft.subject}
                  onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Message Body</label>
                <textarea
                  rows={6}
                  className="input"
                  value={emailDraft.body}
                  onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(emailDraft.body);
                    toast.success("Outreach template copied");
                  }}
                  style={{ display: "flex", gap: 5 }}
                >
                  <Clipboard size={14} />
                  Copy Text
                </button>
                <button className="btn btn-primary" onClick={() => setIsEmailModalOpen(false)}>
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Document / Resume previewer modal ───────────────── */}
      <AnimatePresence>
        {resumePreviewUrl && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(17, 24, 39, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card"
              style={{
                width: "90%",
                maxWidth: 900,
                height: "90vh",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Resume Document Preview</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setResumePreviewUrl(null)} style={{ padding: 4 }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ flex: 1, overflow: "hidden", background: "var(--bg-muted)", borderRadius: "var(--radius-lg)" }}>
                <iframe
                  src={getEmbeddableResumeUrl(resumePreviewUrl)}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="Resume Viewer"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
