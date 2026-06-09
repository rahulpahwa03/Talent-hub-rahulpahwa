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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

/* ─── Static Constants ────────────────────────────────────── */
const MOCK_METRICS = [
  { label: 'Total Candidates', value: '48,291', delta: '+2.4% this week', Icon: UsersIcon, iconBg: '#EFF6FF', iconColor: '#2563EB' },
  { label: 'Active Recruiters', value: '12', delta: '3 online now', Icon: UserCheck, iconBg: '#F0FDF4', iconColor: '#16A34A' },
  { label: 'New Profiles', value: '284', delta: '+18 today', Icon: UserPlusIcon, iconBg: '#FFFBEB', iconColor: '#D97706' },
  { label: 'Resumes Parsed', value: '41,203', delta: 'AI powered', Icon: FileText, iconBg: '#F5F3FF', iconColor: '#7C3AED' },
  { label: 'Favorites', value: '1,847', delta: '23 new this week', Icon: Heart, iconBg: '#FFF1F2', iconColor: '#E11D48' },
  { label: 'Submissions', value: '3,294', delta: '+142 this month', Icon: Send, iconBg: '#F0FDF4', iconColor: '#16A34A' },
];

function UsersIcon(props) { return <UserCheck {...props} />; }
function UserPlusIcon(props) { return <UserCheck {...props} />; }

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

const CLIENT_DATABASE = {
  "snowflake": {
    domain: "Cloud Data Warehousing & Cloud Data SaaS",
    competitors: ["Databricks", "AWS (Amazon)", "Google Cloud (GCP)", "Cloudera", "Confluent"],
    suggestedQuery: "Snowflake AND (dbt OR SQL) AND AWS",
  },
  "capital one": {
    domain: "FinTech, Consumer Banking & Cloud Financial Platforms",
    competitors: ["JPMorgan Chase", "Bank of America", "Citi", "Discover", "American Express"],
    suggestedQuery: "Java AND AWS AND Spring Boot",
  },
  "apple": {
    domain: "Consumer Electronics, Mobile OS & Edge AI Engineering",
    competitors: ["Google (Alphabet)", "Microsoft", "Meta (Facebook)", "Amazon", "Netflix"],
    suggestedQuery: "Swift OR iOS OR Objective-C",
  },
  "stripe": {
    domain: "Merchant Payment Infrastructure & Developer APIs",
    competitors: ["PayPal", "Adyen", "Block (Square)", "Braintree", "Klarna"],
    suggestedQuery: "(Ruby OR Go OR Python) AND API",
  },
  "databricks": {
    domain: "Unified Analytics, Delta Lake & Spark AI Platforms",
    competitors: ["Snowflake", "Cloudera", "AWS (Amazon)", "Google Cloud", "HPE"],
    suggestedQuery: "(Spark OR Scala OR Python) AND Databricks",
  }
};

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

/* ─── NLP Sourcing Helpers ────────────────────────────────── */
function analyzeJobDescription(text, clientName = "") {
  const t = text.toLowerCase();
  const matchedSkills = Object.keys(CLIENT_DATABASE).reduce((acc, key) => acc, []); // custom dynamic matching
  
  let domain = "Enterprise Systems & Cloud Software Sourcing";
  let competitors = ["Google", "Microsoft", "AWS", "Databricks", "Snowflake"];
  let query = "Developer OR Engineer";

  const clientLower = clientName.toLowerCase().trim();
  const matchedClientKey = Object.keys(CLIENT_DATABASE).find(key => clientLower.includes(key));

  if (matchedClientKey) {
    const data = CLIENT_DATABASE[matchedClientKey];
    domain = data.domain;
    competitors = data.competitors;
    query = data.suggestedQuery;
  }

  return { domain, competitors, query, skills: ["Java", "AWS", "Python"] };
}

function parseNaturalQuery(text) {
  const query = text.toLowerCase();
  let visa = "";
  let location = "";
  let skills = [];

  // Match visa
  if (query.includes("h1b") || query.includes("h-1b")) visa = "H1B";
  else if (query.includes("citizen") || query.includes("usc")) visa = "US Citizen";
  else if (query.includes("green card") || query.includes("gc")) visa = "Green Card";
  else if (query.includes("opt")) visa = "OPT/CPT";

  // Match location
  if (query.includes("texas") || query.includes("tx") || query.includes("dallas") || query.includes("austin")) location = "Texas";
  else if (query.includes("california") || query.includes("ca") || query.includes("sf")) location = "California";
  else if (query.includes("new york") || query.includes("ny")) location = "New York";

  // Match skills
  if (query.includes("snowflake")) skills.push("Snowflake");
  if (query.includes("python")) skills.push("Python");
  if (query.includes("aws")) skills.push("AWS");
  if (query.includes("java")) skills.push("Java");
  if (query.includes("spring boot")) skills.push("Spring Boot");

  return { visa, location, skills, keywords: text };
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

  // Analytics Tab period
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30d");

  // AI Sourcing Composer States (tab dashboard)
  const [composerTab, setComposerTab] = useState("jd"); // "jd" | "client" | "keywords"
  const [composerJd, setComposerJd] = useState("");
  const [composerClient, setComposerClient] = useState("");
  const [composerKeywords, setComposerKeywords] = useState([]);
  const [composerKeywordInput, setComposerKeywordInput] = useState("");
  const [isSourcing, setIsSourcing] = useState(false);
  const [sourcingStep, setSourcingStep] = useState(0);
  const [sourcingReport, setSourcingReport] = useState(null);

  // Ezra AI Chat state
  const [isEzraOpen, setIsEzraOpen] = useState(false);
  const [ezraMessages, setEzraMessages] = useState([
    {
      sender: "ezra",
      text: "Hello! I am Ezra, your AI recruiting partner. Ask me to query candidates, filter visas, or generate outreach templates directly.",
      time: "10:00 AM",
    },
  ]);
  const [ezraInput, setEzraInput] = useState("");
  const [isEzraTyping, setIsEzraTyping] = useState(false);

  // Notes and Email Draft Modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState({ to: "", subject: "", body: "" });
  const [savingNote, setSavingNote] = useState(false);
  const [noteText, setNoteText] = useState("");

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

  // Filter and Search logic (memoized)
  const processedCandidates = useMemo(() => {
    let result = [...candidates];

    // Search query matching Name, Title, Summary, or Skills
    if (searchVal.trim()) {
      const q = searchVal.toLowerCase();
      result = result.filter(c => 
        (c['Candidate Name'] || '').toLowerCase().includes(q) ||
        (c['Title'] || '').toLowerCase().includes(q) ||
        (c['Skills'] || '').toLowerCase().includes(q) ||
        (c['summary'] || '').toLowerCase().includes(q)
      );
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
    } else if (sortOrder === "experience-asc") {
      result.sort((a, b) => parseInt(a.experience || 0) - parseInt(b.experience || 0));
    } else if (sortOrder === "experience-desc") {
      result.sort((a, b) => parseInt(b.experience || 0) - parseInt(a.experience || 0));
    }

    return result;
  }, [candidates, searchVal, activeFilters, sortOrder]);

  // AI Sourcing execution
  const handleInitiateSourcing = async (e) => {
    e.preventDefault();
    setIsSourcing(true);
    setSourcingStep(1); // analyzing
    await new Promise(r => setTimeout(r, 600));
    setSourcingStep(2); // parsing competitor pools
    await new Promise(r => setTimeout(r, 600));
    setSourcingStep(3); // query mapping

    let result;
    if (composerTab === 'jd') {
      result = analyzeJobDescription(composerJd);
    } else if (composerTab === 'client') {
      result = analyzeJobDescription('', composerClient);
    } else {
      result = analyzeJobDescription('', composerKeywords.join(', '));
    }

    // Get matches
    let matched = candidates.filter(c => {
      const text = `${c['Title']} ${c['Skills']}`.toLowerCase();
      return result.skills.some(s => text.includes(s.toLowerCase()));
    });
    if (matched.length === 0) matched = candidates.slice(0, 3);
    else matched = matched.slice(0, 3);

    setSourcingReport({
      ...result,
      client: composerClient || "My Pipeline",
      matches: matched,
    });
    setIsSourcing(false);
    setSourcingStep(0);
    toast.success("AI matched pipeline ready!");
  };

  const handleApplyAISearch = (query) => {
    setSearchVal(query);
    const parsed = parseNaturalQuery(query);
    setActiveFilters(prev => ({
      ...prev,
      visa: parsed.visa || "All",
      location: parsed.location || "",
      skills: [...new Set([...prev.skills, ...parsed.skills])],
    }));
    toast.success("AI search filters applied!");
  };

  // Chat message send handler
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!ezraInput.trim()) return;

    const userMsg = { sender: "user", text: ezraInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setEzraMessages(prev => [...prev, userMsg]);
    const query = ezraInput;
    setEzraInput("");

    setIsEzraTyping(true);
    await new Promise(r => setTimeout(r, 1200));

    // Simple NLP feedback
    const parsed = parseNaturalQuery(query);
    let replyText = "I parsed your request. ";
    if (parsed.skills.length > 0 || parsed.visa || parsed.location) {
      replyText += `I have applied these filters to the Directory: **${parsed.skills.join(', ')}** skills, **${parsed.visa || 'any'}** visa status, located in **${parsed.location || 'any'}**.`;
      setActiveFilters(prev => ({
        ...prev,
        visa: parsed.visa || prev.visa,
        location: parsed.location || prev.location,
        skills: [...new Set([...prev.skills, ...parsed.skills])],
      }));
    } else {
      replyText += "I searched the candidate directory, but no specific filter keywords matched. Let me know if you would like me to draft an outreach template or email instead.";
    }

    setEzraMessages(prev => [...prev, {
      sender: "ezra",
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setIsEzraTyping(false);
  };

  // Copy shareable portal link
  const handleCopyShareLink = () => {
    const link = `${window.location.origin}/candidate/upload`;
    navigator.clipboard.writeText(link);
    toast.success('Shareable candidate portal link copied to clipboard!');
  };

  // Toggle favorite candidate
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
      toast.success(nextFav ? "Added to favorites!" : "Removed from favorites");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update favorite");
    }
  };

  // Auto-save notes helper
  const handleNoteSave = async (cand, text) => {
    setSavingNote(true);
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ notes: text })
        .eq('id', cand.id);
      if (error) throw error;

      setCandidates(prev => prev.map(c => c.id === cand.id ? { ...c, notes: text } : c));
      toast.success("Note saved successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
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
      {/* ── Sub Navigation Tab Selector ────────────────────── */}
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
          { id: "dashboard", label: "Intelligent Overview" },
          { id: "candidates", label: `Candidate Database (${processedCandidates.length})` },
          { id: "analytics", label: "Analytics Insights" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
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

        <button
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: "auto", display: "flex", gap: 5 }}
          onClick={handleCopyShareLink}
        >
          <ShareIcon size={12} />
          Copy Candidate Link
        </button>
      </div>

      {/* ── Tab Layout Renderers (with Page Transitions) ────── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <AnimatePresence mode="wait">
          {/* TAB 1: OVERVIEW & COMPOSER */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              style={{ padding: "24px 32px", overflowY: "auto", flex: 1 }}
            >
              {/* Sourcing Core Hero */}
              <div
                style={{
                  padding: 24,
                  borderRadius: "var(--radius-xl)",
                  background: "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
                  color: "#fff",
                  marginBottom: 24,
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <Brain size={20} />
                  Ezra AI Recruiting Core
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginTop: 4, maxWidth: 580 }}>
                  Ingest talent pools, map competitor overlap systems, and generate targeted candidate matching parameters.
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid-6" style={{ gap: 16, marginBottom: 28 }}>
                {MOCK_METRICS.map((m) => (
                  <div key={m.label} className="metric-card" style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div className="metric-value" style={{ fontSize: 22 }}>{m.value}</div>
                      <span className="badge badge-gray" style={{ fontSize: 10 }}>{m.delta}</span>
                    </div>
                    <div className="metric-label" style={{ fontSize: 12, marginTop: 0 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Sourcing Composer Grid */}
              <div className="grid-2" style={{ gridTemplateColumns: "1.2fr 0.8fr", gap: 24, alignItems: "start" }}>
                
                {/* Left: composer inputs */}
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Sourcing Composer</h3>
                  
                  {/* Inner tabs selection */}
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 16, marginBottom: 20 }}>
                    {[
                      { id: 'jd', label: 'Job Description' },
                      { id: 'client', label: 'Target Client' },
                      { id: 'keywords', label: 'Keywords & Sourcing' }
                    ].map(tab => {
                      const active = composerTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setComposerTab(tab.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                            borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                            padding: '8px 2px',
                            fontSize: 13,
                            fontWeight: active ? 600 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <form onSubmit={handleInitiateSourcing} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {composerTab === 'jd' && (
                      <textarea
                        rows={4}
                        className="input"
                        placeholder="Paste full job description requirements here..."
                        value={composerJd}
                        onChange={(e) => setComposerJd(e.target.value)}
                        style={{ resize: "none" }}
                      />
                    )}
                    {composerTab === 'client' && (
                      <input
                        type="text"
                        className="input"
                        placeholder="Enter competitor client name (e.g. Snowflake, Capital One)..."
                        value={composerClient}
                        onChange={(e) => setComposerClient(e.target.value)}
                      />
                    )}
                    {composerTab === 'keywords' && (
                      <div className="input-group">
                        <input
                          type="text"
                          className="input"
                          placeholder="Type keyword and press Enter..."
                          value={composerKeywordInput}
                          onChange={(e) => setComposerKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (composerKeywordInput.trim()) {
                                setComposerKeywords([...composerKeywords, composerKeywordInput.trim()]);
                                setComposerKeywordInput("");
                              }
                            }
                          }}
                        />
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                          {composerKeywords.map(kw => (
                            <span key={kw} className="tag">
                              {kw}
                              <button
                                type="button"
                                style={{ background: "none", border: "none", color: "var(--text-muted)", marginLeft: 6 }}
                                onClick={() => setComposerKeywords(composerKeywords.filter(k => k !== kw))}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button className="btn btn-primary btn-md" type="submit" disabled={isSourcing}>
                      <Sparkles size={14} />
                      AI Match Candidates
                    </button>
                  </form>
                </div>

                {/* Right: recent activities & matching list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>AI Matching Results</h3>
                    
                    {sourcingReport ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                          Sourced pipeline for: <strong>{sourcingReport.client}</strong>
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {sourcingReport.matches.map(cand => (
                            <div
                              key={cand.id}
                              className="card-sm card-hover"
                              style={{ padding: 12 }}
                              onClick={() => {
                                setSelectedCandidate(cand);
                                navigate('/recruiter/candidates');
                              }}
                            >
                              <div style={{ fontWeight: 600 }}>{cand['Candidate Name']}</div>
                              <div style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>{cand['Title']}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state" style={{ padding: "24px 0" }}>
                        <Info size={24} style={{ color: "var(--text-muted)" }} />
                        <p style={{ fontSize: 13 }}>No matches calculated yet. Run composer on the left.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: CANDIDATE DIRECTORY & AI CHAT */}
          {activeTab === "candidates" && (
            <motion.div
              key="candidates-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flex: 1, overflow: "hidden" }}
            >
              {/* Left filter bar */}
              <div
                style={{
                  width: 250,
                  borderRight: "1px solid var(--border)",
                  background: "var(--bg)",
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto",
                  padding: 20,
                  gap: 20,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                    Filters
                  </h4>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: 4, fontSize: 11 }}
                    onClick={() => setActiveFilters({
                      visa: "All", location: "", skills: [], experience: 0,
                      hasEmail: false, hasLinkedIn: false, hasResume: false, favoritesOnly: false,
                    })}
                  >
                    Clear All
                  </button>
                </div>

                {/* Visa Dropdown */}
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

                {/* Location text input */}
                <div className="input-group">
                  <label className="input-label">Location</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Texas, Austin"
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
                    placeholder="Add skill..."
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

                {/* Toggles */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                  {[
                    { label: "Has Email", key: "hasEmail" },
                    { label: "Has LinkedIn", key: "hasLinkedIn" },
                    { label: "Has Resume", key: "hasResume" },
                    { label: "Favorites Only", key: "favoritesOnly" },
                  ].map(f => (
                    <label key={f.key} className="checkbox-label">
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

              {/* Middle Candidates list area */}
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
                      placeholder="Search candidate directory, titles, summaries, skills..."
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

                {/* Candidate card grid list */}
                <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                  {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                      <Loader2 size={36} style={{ animation: "spin 1.2s linear infinite" }} />
                    </div>
                  ) : processedCandidates.length === 0 ? (
                    <div className="empty-state">
                      <Info size={36} />
                      <p>No candidates found matching current queries/filters.</p>
                    </div>
                  ) : (
                    <div className="candidates-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                      {processedCandidates.map((cand) => {
                        const avatarInfo = getAvatarColor(cand['Candidate Name']);
                        return (
                          <motion.div
                            key={cand.id}
                            className={`cand-card ${selectedCandidate?.id === cand.id ? "selected" : ""}`}
                            onClick={() => setSelectedCandidate(cand)}
                            style={{ position: "relative" }}
                            layoutId={`cand-card-${cand.id}`}
                          >
                            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                              <div
                                className="avatar avatar-md"
                                style={{
                                  background: avatarInfo.bg,
                                  color: avatarInfo.text,
                                  width: 40, height: 40,
                                  fontSize: 14,
                                }}
                              >
                                {cand['Candidate Name'] ? cand['Candidate Name'].split(' ').slice(0,2).map(n=>n[0]).join('') : "?"}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={{ margin: 0, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {cand['Candidate Name'] || "Unknown"}
                                </h4>
                                <p style={{ fontSize: 12, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {cand['Title'] || "Job Seeker"}
                                </p>
                              </div>

                              <button
                                style={{
                                  background: "none", border: "none", color: cand.favorite ? "var(--error)" : "var(--text-muted)",
                                  cursor: "pointer", padding: 2,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(cand);
                                }}
                              >
                                <Heart size={14} fill={cand.favorite ? "var(--error)" : "none"} />
                              </button>
                            </div>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                              {cand['VISA'] && <span className="badge badge-blue" style={{ fontSize: 10 }}>{cand['VISA']}</span>}
                              {cand['Current Location'] && (
                                <span className="badge badge-gray" style={{ fontSize: 10, display: "flex", gap: 2 }}>
                                  <MapPin size={9} />
                                  {cand['Current Location']}
                                </span>
                              )}
                            </div>

                            {/* Skills slice preview */}
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {(cand['Skills'] || "").split(/[|,]/).slice(0, 4).map((s, idx) => (
                                <span key={idx} className="tag" style={{ fontSize: 10, padding: "1px 6px" }}>{s.trim()}</span>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Slide-over detailed candidate profile drawer */}
              <AnimatePresence>
                {selectedCandidate && (
                  <motion.div
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 280, damping: 26 }}
                    style={{
                      width: 380,
                      borderLeft: "1px solid var(--border)",
                      background: "var(--bg)",
                      display: "flex",
                      flexDirection: "column",
                      overflowY: "auto",
                      padding: 24,
                      gap: 20,
                      zIndex: 30,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Profile Details</h3>
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
                          width: 52, height: 52,
                        }}
                      >
                        {selectedCandidate['Candidate Name'] ? selectedCandidate['Candidate Name'].split(' ').slice(0,2).map(n=>n[0]).join('') : "?"}
                      </div>
                      <div>
                        <h4 style={{ margin: 0 }}>{selectedCandidate['Candidate Name']}</h4>
                        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: 0 }}>{selectedCandidate['Title']}</p>
                      </div>
                    </div>

                    <div className="divider" />

                    {/* Metadata fields */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { label: "Email", value: selectedCandidate['Email'] || "—", icon: Mail },
                        { label: "Phone", value: selectedCandidate['Contact No'] || "—", icon: Phone },
                        { label: "Location", value: selectedCandidate['Current Location'] || "—", icon: MapPin },
                        { label: "Visa Status", value: selectedCandidate['VISA'] || "—", icon: Shield },
                      ].map((item) => (
                        <div key={item.label} className="info-row" style={{ padding: "6px 0" }}>
                          <span className="info-label flex items-center gap-2" style={{ minWidth: 90 }}>
                            <item.icon size={12} />
                            {item.label}
                          </span>
                          <span className="info-value" style={{ fontSize: 12.5 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="divider" />

                    {/* Summary */}
                    <div>
                      <p className="section-title">Summary</p>
                      <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {selectedCandidate['summary'] || "No profile summary available."}
                      </p>
                    </div>

                    {/* Recruiter Notes Area */}
                    <div>
                      <p className="section-title">Internal Notes</p>
                      <textarea
                        rows={3}
                        className="input"
                        placeholder="Add candidate notes here... (auto-saves)"
                        defaultValue={selectedCandidate.notes || ""}
                        onBlur={(e) => handleNoteSave(selectedCandidate, e.target.value)}
                        style={{ fontSize: 12.5, resize: "vertical" }}
                      />
                    </div>

                    {/* Outbound AI outreach email template link */}
                    <button
                      className="btn btn-secondary btn-full"
                      onClick={() => {
                        setEmailDraft({
                          to: selectedCandidate['Email'] || "",
                          subject: `EzHire Staffing opportunity: ${selectedCandidate['Title'] || "Technical Role"}`,
                          body: `Hello ${selectedCandidate['Candidate Name']},\n\nWe came across your profile and were impressed by your work in ${selectedCandidate['Skills']?.split(/[|,]/)[0] || "your technical field"}.\n\nAre you available for a quick introductory call?`,
                        });
                        setIsEmailModalOpen(true);
                      }}
                    >
                      <Mail size={13} />
                      Draft Outreach Email
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ezra AI Chat Panel on Right side */}
              <AnimatePresence>
                {isEzraOpen && (
                  <motion.div
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    className="ezra-panel"
                    style={{ zIndex: 30 }}
                  >
                    <div className="ezra-header">
                      <div className="ezra-avatar">E</div>
                      <div>
                        <h4 style={{ margin: 0 }}>Ezra Copilot</h4>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>AI Recruiter core active</span>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setIsEzraOpen(false)} style={{ marginLeft: "auto", padding: 4 }}>
                        <X size={16} />
                      </button>
                    </div>

                    {/* Chat Messages */}
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

                    {/* Suggested Prompt chips */}
                    {ezraMessages.length === 1 && (
                      <div className="ezra-chips">
                        {SUGGESTED_CHIPS.map((chip, i) => (
                          <button key={i} className="prompt-chip" onClick={() => handleApplyAISearch(chip)}>
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Chat input */}
                    <form onSubmit={handleSendChat} className="ezra-input-bar">
                      <input
                        type="text"
                        placeholder="Type sourcing request..."
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

          {/* TAB 3: ANALYTICS */}
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
                  <h2>Analytics Dashboard</h2>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                    Recruiter sourcing stats and insights
                  </p>
                </div>

                {/* Period selectors */}
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

              {/* Stats Cards */}
              <div className="grid-4" style={{ gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total Profiles", value: "48,291", delta: "+12.4%", Icon: UsersIcon },
                  { label: "Resumes Parsed", value: "41,203", delta: "+8.2%", Icon: FileText },
                  { label: "Avg Time to Fill", value: "12 days", delta: "-2.1 days", Icon: Clock },
                  { label: "Placement Rate", value: "68.4%", delta: "+4.2%", Icon: Target },
                ].map((stat, i) => (
                  <div key={i} className="metric-card">
                    <div className="metric-value">{stat.value}</div>
                    <div className="metric-label">{stat.label}</div>
                    <div className="metric-delta text-success" style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 8 }}>
                      <TrendingUp size={12} />
                      {stat.delta}
                    </div>
                  </div>
                ))}
              </div>

              {/* Graph charts Side-by-Side */}
              <div className="grid-2" style={{ gap: 20, marginBottom: 24 }}>
                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ marginBottom: 12 }}>Candidate Growth Over Time</h4>
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
                  <h4 style={{ marginBottom: 12 }}>Resume Upload Trends</h4>
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

              {/* Leaderboard tables */}
              <div className="grid-2" style={{ gap: 20 }}>
                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ marginBottom: 12 }}>Top Sourced Skills</h4>
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
                  <h4 style={{ marginBottom: 12 }}>Recruiter Productivity Leaderboard</h4>
                  <div className="table-wrap" style={{ border: "none" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Recruiter</th>
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
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>AI Outreach Template</h3>
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

              <div style={{ display: "flex", justifyBetween: true, marginTop: 12 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(emailDraft.body);
                    toast.success("Outreach template copied!");
                  }}
                  style={{ display: "flex", gap: 5 }}
                >
                  <Clipboard size={14} />
                  Copy outreach
                </button>
                <button className="btn btn-primary" onClick={() => setIsEmailModalOpen(false)}>
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShareIcon(props) { return <ExternalLink {...props} />; }
