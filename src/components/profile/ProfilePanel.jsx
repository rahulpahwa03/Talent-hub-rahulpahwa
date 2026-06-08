import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  ExternalLink,
  Copy,
  Heart,
  Sparkles,
  FileText,
  Download,
  X,
  ChevronRight,
  User,
  Plus,
  Brain,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { parseNaturalQuery } from "../ai/AISearchBar";
import { calculateMatchScore } from "../candidates/CandidateCard";

/* ─── Avatar helpers ─────────────────────────────────────── */
const AVATAR_COLORS = ["#2563EB", "#7C3AED", "#D97706", "#16A34A", "#E11D48"];

function getAvatarColor(name = "") {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
}

function getEmbeddableResumeUrl(url) {
  if (!url) return "";
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9\-_]+)/);
  if (openMatch) {
    return `https://drive.google.com/file/d/${openMatch[1]}/preview`;
  }
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9\-_]+)/);
  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  // Microsoft Office Online viewer for doc/docx
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

/* ─── Tabs config ────────────────────────────────────────── */
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "skills", label: "Skills" },
  { id: "ai", label: "AI Insights ✨" },
  { id: "resume", label: "Resume" },
  { id: "notes", label: "Notes" },
  { id: "activity", label: "Activity" },
];

/* ─── Mock notes (fallback) ──────────────────────────────── */
const MOCK_NOTES = [
  {
    id: 1,
    author: "Sarah Chen",
    initials: "SC",
    color: "#2563EB",
    date: "Jun 5, 2026",
    type: "text",
    text: "Strong candidate — excellent communication skills. Recommended for second round. Has deep React expertise and led a team of 6.",
  },
  {
    id: 2,
    author: "James Okafor",
    initials: "JO",
    color: "#16A34A",
    date: "Jun 3, 2026",
    type: "text",
    text: "Technical screen went well. Solid problem-solving, clean code. Minor concern on system design but manageable.",
  },
];

/* ─── Mock activity timeline ─────────────────────────────── */
const MOCK_ACTIVITY = [
  { id: 1, label: "Profile created", time: "Jun 1, 2026 · 9:12 AM", active: true },
  { id: 2, label: "Resume uploaded", time: "Jun 1, 2026 · 9:15 AM", active: true },
  { id: 3, label: "Viewed by recruiter", time: "Jun 3, 2026 · 2:48 PM", active: false },
  { id: 4, label: "Note added", time: "Jun 3, 2026 · 3:01 PM", active: false },
  { id: 5, label: "Favorited", time: "Jun 5, 2026 · 11:30 AM", active: false },
];

/* ─── Tailored Technical Questions Database ──────────────── */
function getTailoredQuestions(title = "", skills = []) {
  const topSkills = skills.slice(0, 4);
  const techQuestions = [];
  
  // Custom skill-based questions
  if (skills.some(s => s.toLowerCase() === "snowflake")) {
    techQuestions.push({
      q: "Explain how you would design an automated data ingestion pipeline into Snowflake. How do you choose clustering keys and optimize query performance for multi-terabyte datasets?",
      a: "Evaluate their experience with Snowpipe, COPY INTO, data loading best practices, and clustering key selection (avoiding over-clustering and utilizing high-query-filter columns)."
    });
  }
  if (skills.some(s => s.toLowerCase() === "python")) {
    techQuestions.push({
      q: "When processing large data structures in Python, how do you handle memory constraints and concurrency? Have you used generators, multiprocessing, or asyncio in production?",
      a: "Look for mentions of generator functions (yield) to stream data, pandas chunking, multiprocessing for CPU-bound tasks, and general awareness of Python's GIL limitations."
    });
  }
  if (skills.some(s => s.toLowerCase() === "aws")) {
    techQuestions.push({
      q: "How do you configure secure, principle-of-least-privilege IAM roles for serverless tasks (e.g. AWS Lambda) connecting to databases or storage? How do you manage API secrets?",
      a: "Assess usage of IAM roles rather than hardcoded access keys, AWS Secrets Manager or Parameter Store integration, and KMS encryption for sensitive data at rest."
    });
  }
  if (skills.some(s => s.toLowerCase() === "react")) {
    techQuestions.push({
      q: "What strategy do you use to optimize React render cycles in high-throughput dashboard pages? How do you leverage hooks like useMemo, useCallback, and windowing?",
      a: "Look for profiling workflows, React.memo, virtualized/windowed tables (like react-window) for large datasets, and techniques to prevent parent rerenders."
    });
  }
  if (skills.some(s => s.toLowerCase() === "java")) {
    techQuestions.push({
      q: "How do you diagnose and resolve memory leaks or garbage collection latency issues in a JVM-based microservice environment?",
      a: "Check for experience using heap dump analyzers (Eclipse MAT), profilers (JProfiler, VisualVM), JVM tuning flags (-Xmx, GC algorithm selections like G1GC or ZGC)."
    });
  }
  if (skills.some(s => s.toLowerCase() === "kubernetes" || s.toLowerCase() === "docker")) {
    techQuestions.push({
      q: "How do you configure pod resource limits and health probes (readiness/liveness) to ensure zero-downtime rolling updates in Kubernetes?",
      a: "Assess understanding of resource requests vs limits, configure probes correctly to avoid premature traffic routing, and rolling update strategy settings (maxSurge, maxUnavailable)."
    });
  }

  // Fallbacks if we don't have enough specific tech questions
  const fallbacks = [
    {
      q: `How do you structure code quality checks, automated testing (unit/integration), and CI/CD validation when deploying systems using ${topSkills[0] || "your primary technologies"}?`,
      a: `Look for usage of linting tools, testing frameworks (Jest, PyTest), automated build pipelines, and regression testing practices.`
    },
    {
      q: `Can you describe a challenging production bug or outage you faced in a system running ${topSkills[1] || "your core stack"}? What was your monitoring, triage, and post-mortem process?`,
      a: `Evaluate problem-solving methodologies, log analysis skills, post-mortem writeups, and structural changes to prevent recurrence.`
    },
    {
      q: `How do you approach API design (RESTful, GraphQL, etc.) when building services that need to interface with other systems? How do you handle schema versioning?`,
      a: `Look for adherence to design guidelines, versioning in URLs or headers, documentation (Swagger/OpenAPI), and backward compatibility strategies.`
    }
  ];

  let list = [...techQuestions];
  let fallbackIndex = 0;
  while (list.length < 3 && fallbackIndex < fallbacks.length) {
    list.push(fallbacks[fallbackIndex]);
    fallbackIndex++;
  }

  return list.slice(0, 3);
}

/* ─── AI Outreach Email Generator ───────────────────────── */
function generateOutreachEmail(name = "", title = "", skills = [], company = "", tone = "professional") {
  const cName = name || "there";
  const cTitle = title || "Talented Professional";
  const cEmployer = company ? `at ${company}` : "";
  const mainSkill = skills[0] || "technical background";
  
  if (tone === "friendly") {
    return `Hi ${cName},

Hope your week is off to a great start!

I came across your profile and was really impressed by your background as a ${cTitle}${cEmployer ? ` ${cEmployer}` : ""}. Your work with ${skills.slice(0, 3).join(", ")} stands out, and I think you'd be a fantastic fit for some exciting roles we are currently hiring for.

Our team is building next-generation platforms, and someone with your strong expertise in ${mainSkill} would play a key role in our success. 

Would you be open to a casual 10-minute chat sometime this week to share what you're looking for next? Let me know what days/times work best for you!

Best,
[Your Name]
EzHire Recruitment Team`;
  }
  
  if (tone === "quick") {
    return `Hi ${cName} - quick question for you.

I'm recruiting for a premium role looking for a strong ${cTitle} with deep expertise in ${skills.slice(0, 2).join(" & ")}. 

Your background${cEmployer ? ` ${cEmployer}` : ""} looks like a great match. Are you open to exploring new opportunities at the moment? 

If so, let me know when you might have 5 minutes for a quick intro call.

Thanks!
[Your Name]`;
  }

  // Default: professional
  return `Dear ${cName},

I hope this message finds you well.

I am currently leading a search for a senior-level position matching your experience. Given your impressive background as a ${cTitle}${cEmployer ? ` ${cEmployer}` : ""} and your specialized skills in ${skills.slice(0, 3).join(", ")}, I believe this opportunity would align well with your career path.

We are looking for someone who can drive engineering excellence and lead key initiatives in the ${mainSkill} space.

If you are open to discussing this opportunity, please let me know your availability for a brief introductory call, or feel free to share your updated resume.

Sincerely,
[Your Name]
EzHire Recruiting Agency`;
}

/* ─── Salary Estimator ──────────────────────────────────── */
function calculateSalaryEstimate(location = "", title = "", skills = []) {
  let baseMin = 90;
  let baseMax = 120;
  const t = (title || "").toLowerCase();
  
  if (t.includes("sr") || t.includes("senior") || t.includes("lead") || t.includes("architect") || t.includes("principal")) {
    baseMin = 135;
    baseMax = 180;
  } else if (t.includes("junior") || t.includes("jr") || t.includes("intern")) {
    baseMin = 65;
    baseMax = 90;
  }

  const loc = (location || "").toLowerCase();
  let multiplier = 1.0;
  if (loc.includes("san francisco") || loc.includes("sf") || loc.includes("california") || loc.includes("ca") || loc.includes("new york") || loc.includes("ny")) {
    multiplier = 1.25;
  } else if (loc.includes("dallas") || loc.includes("houston") || loc.includes("texas") || loc.includes("tx") || loc.includes("seattle") || loc.includes("boston")) {
    multiplier = 1.15;
  } else if (loc.includes("remote")) {
    multiplier = 1.05;
  } else if (loc.includes("india") || loc.includes("bangalore") || loc.includes("hyderabad") || loc.includes("pune") || loc.includes("bengaluru")) {
    baseMin = 25;
    baseMax = 45;
    multiplier = 1.0;
  }

  let bonus = 0;
  if (skills.some(s => ["snowflake", "aws", "kubernetes", "machine learning", "pytorch", "databricks"].includes(s.toLowerCase()))) {
    bonus = 15;
  }

  const finalMin = Math.round((baseMin * multiplier) + bonus);
  const finalMax = Math.round((baseMax * multiplier) + bonus);

  // If offshore currency
  const currencySymbol = (loc.includes("india") || loc.includes("bangalore") || loc.includes("hyderabad") || loc.includes("pune") || loc.includes("bengaluru")) ? "₹" : "$";
  const suffix = currencySymbol === "₹" ? " L" : "k"; // Lakhs vs Thousands
  
  return {
    min: `${currencySymbol}${finalMin}${suffix}`,
    max: `${currencySymbol}${finalMax}${suffix}`,
    verdict: finalMin >= 140 ? "Top-Tier Candidate" : finalMin >= 100 ? "Highly Competitive" : "Standard Fit",
  };
}

/* ─── Sub-components ─────────────────────────────────────── */
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="info-row">
      <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{icon}</span>
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        border: "2px solid #C4B5FD",
        borderTopColor: "#7C3AED",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════════
   ProfilePanel
   ════════════════════════════════════════════════════════════ */
export default function ProfilePanel({ candidate, onFavoriteToggle, onCandidateUpdate, query = "", filters = {} }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [localFavorite, setLocalFavorite] = useState(false);
  
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  // Notes States
  const [noteText, setNoteText] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [savedNotes, setSavedNotes] = useState([]);
  const [noteType, setNoteType] = useState("text"); // "text" or "table"
  const [tableInput, setTableInput] = useState("");
  const [tableRows, setTableRows] = useState(null);

  // AI Insights Tab States
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [emailTone, setEmailTone] = useState("professional");
  const [emailText, setEmailText] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const favorited = onFavoriteToggle ? !!candidate?.favorite : localFavorite;

  /* Reset state and load notes from Supabase when candidate changes */
  useEffect(() => {
    setActiveTab("overview");
    setSummary("");
    setSummaryLoading(false);
    setLocalFavorite(!!candidate?.favorite);

    // Reset notes inputs
    setNoteText("");
    setTableInput("");
    setTableRows(null);

    if (candidate) {
      if (candidate.notes) {
        try {
          const parsed = JSON.parse(candidate.notes);
          if (Array.isArray(parsed)) {
            setSavedNotes(parsed);
          } else {
            setSavedNotes([]);
          }
        } catch (e) {
          // If notes are saved as plain text, display as a single note
          setSavedNotes([
            {
              id: 1,
              author: "Recruiter",
              initials: "R",
              color: "#7C3AED",
              date: "Imported",
              type: "text",
              text: candidate.notes,
            },
          ]);
        }
      } else {
        // Fallback to mock notes for candidates without saved database notes
        setSavedNotes(MOCK_NOTES);
      }

      // Initialize AI insights data
      const skillsArr = candidate["Skills"]
        ? candidate["Skills"].split(/[|,]/).map((s) => s.trim()).filter(Boolean)
        : [];
      const qList = getTailoredQuestions(candidate["Title"], skillsArr);
      setQuestions(qList);

      const email = generateOutreachEmail(
        candidate["Candidate Name"],
        candidate["Title"],
        skillsArr,
        candidate["Employer"] || "",
        "professional"
      );
      setEmailTone("professional");
      setEmailText(email);
    } else {
      setSavedNotes([]);
      setQuestions([]);
      setEmailText("");
    }
  }, [candidate]);

  /* ── Empty state ─────────────────────────────── */
  if (!candidate) {
    return (
      <div className="empty-state" style={{ height: "100%" }}>
        <div className="empty-state-icon">
          <FileText size={24} style={{ color: "var(--text-muted)" }} />
        </div>
        <h4 style={{ color: "var(--text-secondary)", marginTop: 4 }}>Select a candidate</h4>
        <p style={{ fontSize: 13, maxWidth: 240, lineHeight: 1.6 }}>
          Click any candidate to view their full profile
        </p>
      </div>
    );
  }

  /* ── Derived data ────────────────────────────── */
  const name = candidate["Candidate Name"] || "Unknown";
  const title = candidate["Title"] || "";
  const location = candidate["Current Location"] || "";
  const visa = candidate["VISA"] || "";
  const email = candidate["Email"]?.trim() || "";
  const phone = candidate["Contact No"]?.trim() || "";
  const linkedin = candidate["LinkedIn"]?.trim() || "";
  const resumeUrl = candidate["resume_url"]?.trim() || "";

  const avatarColor = getAvatarColor(name);
  const initials = getInitials(name);

  const allSkills = candidate["Skills"]
    ? candidate["Skills"]
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const linkedinUrl = linkedin
    ? linkedin.startsWith("http")
      ? linkedin
      : `https://${linkedin}`
    : null;

  /* ── Handlers ────────────────────────────────── */
  const copyToClipboard = (value, label) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied!`, { duration: 2000 });
  };

  const handleGenerateSummary = () => {
    setSummaryLoading(true);
    setSummary("");
    setTimeout(() => {
      const topSkills = allSkills.slice(0, 3).join(", ") || "various technologies";
      const generated = `${name} is an experienced ${title || "professional"} with expertise in ${topSkills}. Located in ${location || "an undisclosed location"}, they hold ${visa ? `a ${visa} visa status` : "standard work authorization"}. This candidate brings strong industry knowledge and is well-positioned for mid-to-senior roles in their domain.`;
      setSummary(generated);
      setSummaryLoading(false);
    }, 1500);
  };

  // Parses tab-separated spreadsheet data
  const handleTableInputChange = (val) => {
    setTableInput(val);
    if (!val.trim()) {
      setTableRows(null);
      return;
    }
    const clean = val.replace(/\r\n/g, "\n");
    const lines = clean.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      setTableRows(null);
      return;
    }

    // Split columns by tabs (TSV from Excel/Sheets)
    const parsed = lines.map((line) => line.split("\t").map((cell) => cell.trim()));
    const validRows = parsed.filter((row) => row.some((cell) => cell.length > 0));

    if (validRows.length > 0) {
      setTableRows(validRows);
    } else {
      setTableRows(null);
    }
  };

  const handleSaveNote = async () => {
    let newNote = null;

    if (noteType === "table") {
      if (!tableRows || tableRows.length === 0) {
        toast.error("Please paste spreadsheet columns first");
        return;
      }
      newNote = {
        id: Date.now(),
        author: recruiterName.trim() || "Recruiter",
        initials: (recruiterName.trim() || "R").slice(0, 2).toUpperCase(),
        color: getAvatarColor(recruiterName.trim() || "Recruiter"),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        type: "table",
        text: noteText.trim(),
        tableData: {
          headers: tableRows[0],
          rows: tableRows.slice(1),
        },
      };
    } else {
      if (!noteText.trim()) return;
      newNote = {
        id: Date.now(),
        author: recruiterName.trim() || "Recruiter",
        initials: (recruiterName.trim() || "R").slice(0, 2).toUpperCase(),
        color: getAvatarColor(recruiterName.trim() || "Recruiter"),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        type: "text",
        text: noteText.trim(),
      };
    }

    const updatedNotes = [newNote, ...savedNotes];
    setSavedNotes(updatedNotes);

    // Save to Supabase
    if (candidate.id || candidate.candidate_uuid) {
      const dbId = candidate.id || candidate.candidate_uuid;
      const notesJson = JSON.stringify(updatedNotes);

      try {
        const { error } = await supabase
          .from("candidates")
          .update({ notes: notesJson })
          .or(`id.eq.${dbId},candidate_uuid.eq.${dbId}`);

        if (error) throw error;

        toast.success("Note saved!");

        // Update CandidateDatabase parent state so notes persist without reload
        if (onCandidateUpdate) {
          onCandidateUpdate({ ...candidate, notes: notesJson });
        }
      } catch (err) {
        console.error("[ProfilePanel] notes save error:", err);
        toast.error("Failed to save note to database.");
      }
    } else {
      toast.success("Note saved locally (Demo mode)");
    }

    // Reset inputs
    setNoteText("");
    setTableInput("");
    setTableRows(null);
  };

  const handleToneChange = (tone) => {
    setEmailTone(tone);
    setEmailLoading(true);
    setTimeout(() => {
      const email = generateOutreachEmail(
        candidate["Candidate Name"],
        candidate["Title"],
        allSkills,
        candidate["Employer"] || "",
        tone
      );
      setEmailText(email);
      setEmailLoading(false);
    }, 600);
  };

  const handleRegenerateQuestions = () => {
    setQuestionsLoading(true);
    setTimeout(() => {
      const qList = getTailoredQuestions(candidate["Title"], allSkills);
      const shuffled = [...qList].sort(() => 0.5 - Math.random());
      setQuestions(shuffled);
      setQuestionsLoading(false);
      toast.success("Questions updated!");
    }, 1000);
  };

  const matchResult = calculateMatchScore(candidate, query, filters);
  const salaryEst = calculateSalaryEstimate(location, title, allSkills);

  /* ── Render ──────────────────────────────────── */
  return (
    <motion.div
      key={name}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
      style={{
        height: "100%",
        overflowY: "auto",
        background: "var(--bg)",
        padding: "28px 28px 48px",
        scrollbarWidth: "thin",
        scrollbarColor: "#D1D5DB transparent",
      }}
    >
      {/* ══ SECTION 1 — Header ═══════════════════ */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 24 }}>
        {/* Large avatar */}
        <div className="avatar avatar-xl" style={{ background: avatarColor, flexShrink: 0 }}>
          {initials}
        </div>

        {/* Info block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ marginBottom: 2 }}>{name}</h2>
          <p style={{ fontSize: 16, margin: "0 0 10px", color: "var(--text-secondary)" }}>
            {title || "Candidate"}
          </p>

          {/* VISA + Location badges */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {visa && <span className="badge badge-blue">🛂 {visa}</span>}
            {location && <span className="badge badge-gray">📍 {location}</span>}
          </div>

          {/* Action buttons row */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
            {/* Copy Email */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => copyToClipboard(email, "Email")}
              disabled={!email}
            >
              <Copy size={12} />
              <Mail size={12} />
              Copy Email
            </button>

            {/* Copy Phone */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => copyToClipboard(phone, "Phone")}
              disabled={!phone}
            >
              <Copy size={12} />
              <Phone size={12} />
              Copy Phone
            </button>

            {/* LinkedIn */}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: "none" }}
              >
                <ExternalLink size={12} />
                LinkedIn
              </a>
            )}

            {/* View Resume Inline */}
            {resumeUrl && (
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab("resume")}>
                <FileText size={12} />
                View Resume
              </button>
            )}

            {/* Heart / Favorite */}
            <motion.button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (onFavoriteToggle && candidate) {
                  onFavoriteToggle(candidate.id || candidate.candidate_uuid);
                } else {
                  setLocalFavorite((f) => !f);
                }
              }}
              whileTap={{ scale: 0.88 }}
              style={{
                color: favorited ? "var(--error)" : undefined,
                borderColor: favorited ? "var(--error-border)" : undefined,
                background: favorited ? "var(--error-soft)" : undefined,
              }}
              title={favorited ? "Remove favorite" : "Add to favorites"}
            >
              <Heart
                size={13}
                style={{
                  fill: favorited ? "var(--error)" : "none",
                  color: favorited ? "var(--error)" : "var(--text-muted)",
                  transition: "fill 0.2s, color 0.2s",
                }}
              />
            </motion.button>

            {/* Generate AI Summary */}
            <button className="btn btn-ghost btn-sm" onClick={handleGenerateSummary} disabled={summaryLoading}>
              <Sparkles size={12} />
              Generate AI Summary
            </button>
          </div>
        </div>
      </div>

      {/* ══ SECTION 2 — Tabs ═════════════════════ */}
      <div className="tab-list" style={{ marginBottom: 24 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-trigger${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: Overview ════════════════════════ */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Contact Information */}
            <div style={{ marginBottom: 24 }}>
              <div className="section-title">Contact Information</div>
              <div className="card-sm" style={{ padding: "4px 16px" }}>
                <InfoRow icon={<Mail size={14} />} label="Email" value={email} />
                <InfoRow icon={<Phone size={14} />} label="Phone" value={phone} />
                <InfoRow icon={<MapPin size={14} />} label="Location" value={location} />
                <InfoRow icon={<Shield size={14} />} label="Visa" value={visa} />
              </div>
            </div>

            {/* AI Summary */}
            {(summaryLoading || summary) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: "#F5F3FF",
                  border: "1px solid #C4B5FD",
                  borderRadius: "var(--radius-lg)",
                  padding: "16px 18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Sparkles size={14} style={{ color: "#7C3AED" }} />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#7C3AED",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    AI Summary
                  </span>
                </div>
                {summaryLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Spinner />
                    <span style={{ fontSize: 13, color: "#7C3AED" }}>Generating summary…</span>
                  </div>
                ) : (
                  <p style={{ fontSize: 13.5, color: "#4C1D95", lineHeight: 1.7, margin: 0 }}>{summary}</p>
                )}
              </motion.div>
            )}

            {/* Prompt to generate if not yet started */}
            {!summaryLoading && !summary && (
              <div
                style={{
                  background: "#F5F3FF",
                  border: "1px dashed #C4B5FD",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 18px",
                  textAlign: "center",
                }}
              >
                <Sparkles size={20} style={{ color: "#C4B5FD", marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: "#7C3AED", margin: 0 }}>
                  Click <strong>Generate AI Summary</strong> above to create a profile snapshot
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ TAB: Skills ══════════════════════════ */}
        {activeTab === "skills" && (
          <motion.div
            key="skills"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div className="section-title" style={{ marginBottom: 0 }}>
                Skills
              </div>
              <span className="badge badge-gray font-mono">
                {allSkills.length} skill{allSkills.length !== 1 ? "s" : ""}
              </span>
            </div>

            {allSkills.length === 0 ? (
              <div className="empty-state" style={{ padding: "32px 0" }}>
                <p>No skills listed for this candidate</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {allSkills.map((skill, i) => (
                  <motion.span
                    key={i}
                    className="tag"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02, duration: 0.18 }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ TAB: AI Insights ═════════════════════ */}
        {activeTab === "ai" && (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            {/* Row 1: Match Score Breakdown */}
            <div className="card-sm" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Brain size={18} style={{ color: "#7C3AED" }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    {matchResult.isProfileStrength ? "Profile Completeness Strength" : "AI Search Fit Score"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: matchResult.isProfileStrength ? "#16A34A" : "#7C3AED",
                  }}
                >
                  {matchResult.score}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="progress-bar" style={{ height: 8, marginBottom: 16, background: "var(--border-soft)", borderRadius: 99, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${matchResult.score}%` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    background: matchResult.isProfileStrength
                      ? "linear-gradient(90deg, #10B981, #059669)"
                      : "linear-gradient(90deg, #7C3AED, #4F46E5)",
                  }}
                />
              </div>

              {/* Reasons & Gaps */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 6 }}>
                    Match Highlights
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {matchResult.reasons.map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-secondary)" }}>
                        <CheckCircle2 size={13} style={{ color: "#16A34A" }} />
                        <span>{r}</span>
                      </div>
                    ))}
                    {matchResult.reasons.length === 0 && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                        No specific matches found.
                      </div>
                    )}
                  </div>
                </div>

                {!matchResult.isProfileStrength && matchResult.gaps.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 6 }}>
                      Identified Gaps
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {matchResult.gaps.map((g, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-secondary)" }}>
                          <AlertTriangle size={13} style={{ color: "#D97706" }} />
                          <span>{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Salary Fit & Market Demand */}
            <div className="card-sm" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <TrendingUp size={18} style={{ color: "#16A34A" }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                  Market Demand & Compensation
                </span>
                <span className="badge badge-green" style={{ marginLeft: "auto", fontSize: 10.5 }}>
                  {salaryEst.verdict}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                    AI Estimated Salary Fit
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                    {salaryEst.min} - {salaryEst.max}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    Based on {location || "Remote"} title & tech
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                    Top Technical Strengths
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {allSkills.slice(0, 3).map((s, i) => (
                      <span key={i} className="badge badge-blue" style={{ fontSize: 10.5, padding: "2px 6px" }}>
                        {s}
                      </span>
                    ))}
                    {allSkills.length === 0 && (
                      <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontStyle: "italic" }}>
                        No skills listed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Technical Interview Guide */}
            <div className="card-sm" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Award size={18} style={{ color: "#7C3AED" }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    Technical Interview Guide
                  </span>
                </div>
                <button
                  onClick={handleRegenerateQuestions}
                  disabled={questionsLoading}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "2px 6px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                >
                  <RefreshCw size={11} style={{ animation: questionsLoading ? "spin 0.8s linear infinite" : "none" }} />
                  Regenerate
                </button>
              </div>

              {questionsLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 0" }}>
                  <Spinner />
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Analyzing candidate profile...</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {questions.map((qItem, idx) => (
                    <div key={idx} style={{ borderBottom: idx < questions.length - 1 ? "1px solid var(--border-soft)" : "none", paddingBottom: idx < questions.length - 1 ? 12 : 0 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#7C3AED", background: "#F5F3FF", padding: "1px 5px", borderRadius: 4, flexShrink: 0 }}>
                          Q{idx + 1}
                        </span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
                          {qItem.q}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 28, lineHeight: 1.4, background: "var(--bg-soft)", padding: "6px 10px", borderRadius: "var(--radius-md)", borderLeft: "2.5px solid var(--border)" }}>
                        <strong style={{ color: "var(--text-secondary)", fontSize: 11, display: "block", marginBottom: 2 }}>What to look for:</strong>
                        {qItem.a}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Row 4: Outreach Email Drafter */}
            <div className="card-sm" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={18} style={{ color: "#7C3AED" }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    AI Outreach Assistant
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(emailText, "Email Draft")}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "4px 8px", fontSize: 11.5 }}
                >
                  <Copy size={11} /> Copy Draft
                </button>
              </div>

              {/* Tone selector */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[
                  { id: "professional", label: "👔 Professional" },
                  { id: "friendly", label: "👋 Friendly" },
                  { id: "quick", label: "⚡ Quick Ping" },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => handleToneChange(tone.id)}
                    disabled={emailLoading}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-md)",
                      fontSize: 11.5,
                      fontWeight: 500,
                      cursor: "pointer",
                      border: "none",
                      background: emailTone === tone.id ? "#7C3AED" : "var(--bg-muted)",
                      color: emailTone === tone.id ? "#FFF" : "var(--text-secondary)",
                      transition: "all 0.15s",
                    }}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>

              {emailLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "30px 0" }}>
                  <Spinner />
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Drafting outreach message...</span>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <textarea
                    readOnly
                    rows={8}
                    value={emailText}
                    className="input"
                    style={{
                      width: "100%",
                      fontFamily: "monospace",
                      fontSize: 12,
                      background: "var(--bg-soft)",
                      padding: 12,
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      resize: "none",
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ TAB: Resume ══════════════════════════ */}
        {activeTab === "resume" && (
          <motion.div
            key="resume"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 650 }}
          >
            {resumeUrl ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
                {/* Header actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
                    Inline Document Viewer
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ textDecoration: "none", fontSize: 12, padding: "4px 10px" }}
                    >
                      <ExternalLink size={11} /> Open in New Tab
                    </a>
                    <a
                      href={resumeUrl}
                      download
                      className="btn btn-secondary btn-sm"
                      style={{ textDecoration: "none", fontSize: 12, padding: "4px 10px" }}
                    >
                      <Download size={11} /> Download
                    </a>
                  </div>
                </div>

                {/* Embedded Frame */}
                <div
                  style={{
                    flex: 1,
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    background: "#F8FAFC",
                    height: 780,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <iframe
                    src={getEmbeddableResumeUrl(resumeUrl)}
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                    title="Candidate Resume Preview"
                    allow="autoplay"
                  />
                </div>
              </div>
            ) : (
              <div className="dropzone" style={{ padding: "48px 32px" }}>
                <FileText size={36} style={{ color: "var(--text-muted)", margin: "0 auto 12px", display: "block" }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 6px" }}>
                  No resume on file
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px" }}>
                  A resume URL has not been provided for this candidate
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ TAB: Notes ═══════════════════════════ */}
        {activeTab === "notes" && (
          <motion.div
            key="notes"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Add Note Section */}
            <div className="card-sm" style={{ padding: 18, marginBottom: 24 }}>
              <div className="section-title">Add a Note</div>

              {/* Note Type Selector Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 16,
                  borderBottom: "1px solid var(--border-soft)",
                  paddingBottom: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setNoteType("text")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: "none",
                    background: noteType === "text" ? "var(--primary)" : "transparent",
                    color: noteType === "text" ? "#FFF" : "var(--text-secondary)",
                    transition: "all 0.15s",
                  }}
                >
                  ✍️ Text Note
                </button>
                <button
                  type="button"
                  onClick={() => setNoteType("table")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: "none",
                    background: noteType === "table" ? "var(--primary)" : "transparent",
                    color: noteType === "table" ? "#FFF" : "var(--text-secondary)",
                    transition: "all 0.15s",
                  }}
                >
                  📊 Paste Spreadsheet Table
                </button>
              </div>

              <div className="input-group" style={{ marginBottom: 10 }}>
                <label className="input-label">Your name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Sarah Chen"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                />
              </div>

              {noteType === "text" ? (
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label className="input-label">Note</label>
                  <textarea
                    rows={5}
                    className="input"
                    placeholder="Add recruiter notes, interview feedback, follow-up actions…"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    style={{ resize: "vertical", minHeight: 110 }}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label">Spreadsheet Tabular Data</label>
                    <textarea
                      rows={5}
                      className="input"
                      placeholder="Copy cells from Excel or Google Sheets (tab-separated) and paste them here..."
                      value={tableInput}
                      onChange={(e) => handleTableInputChange(e.target.value)}
                      style={{ resize: "vertical", minHeight: 90, fontFamily: "monospace", fontSize: 12 }}
                    />
                    <span className="input-hint">Spreadsheet data parsed automatically.</span>
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label">Description / Caption (Optional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Add context for this table..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                  </div>

                  {/* Live Table Preview */}
                  {tableRows && tableRows.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div className="input-label" style={{ marginBottom: 6 }}>Live Preview ({tableRows.length} rows)</div>
                      <div
                        style={{
                          overflowX: "auto",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          maxHeight: 200,
                        }}
                      >
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                          <thead>
                            <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border)" }}>
                              {tableRows[0].map((h, i) => (
                                <th
                                  key={i}
                                  style={{ padding: "6px 10px", fontWeight: 600, color: "var(--text-primary)" }}
                                >
                                  {h || `Col ${i + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tableRows.slice(1).map((row, rowIndex) => (
                              <tr
                                key={rowIndex}
                                style={{
                                  borderBottom: "1px solid var(--border-soft)",
                                  background: rowIndex % 2 === 1 ? "var(--bg-soft)" : "none",
                                }}
                              >
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} style={{ padding: "6px 10px", color: "var(--text-secondary)" }}>
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveNote}
                disabled={noteType === "text" ? !noteText.trim() : !tableRows}
              >
                Save Note
              </button>
            </div>

            {/* Notes list */}
            <div className="section-title">Previous Notes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {savedNotes.map((note) => (
                <div key={note.id} className="card-sm" style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div className="avatar avatar-sm" style={{ background: note.color || "#7C3AED" }}>
                      {note.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{note.author}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{note.date}</div>
                    </div>
                    {note.type === "table" && (
                      <span className="badge badge-blue" style={{ marginLeft: "auto", fontSize: 10 }}>
                        Table
                      </span>
                    )}
                  </div>

                  {note.type === "table" && note.tableData ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                      {note.text && (
                        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: 0, fontWeight: 500 }}>
                          {note.text}
                        </p>
                      )}
                      <div
                        style={{
                          overflowX: "auto",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
                          <thead>
                            <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border)" }}>
                              {note.tableData.headers.map((h, i) => (
                                <th
                                  key={i}
                                  style={{ padding: "8px 12px", fontWeight: 600, color: "var(--text-primary)" }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {note.tableData.rows.map((row, rowIndex) => (
                              <tr
                                key={rowIndex}
                                style={{
                                  borderBottom:
                                    rowIndex < note.tableData.rows.length - 1 ? "1px solid var(--border-soft)" : "none",
                                  background: rowIndex % 2 === 1 ? "var(--bg-soft)" : "none",
                                }}
                              >
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13.5, lineHeight: 1.65, margin: "4px 0 0", whiteSpace: "pre-wrap" }}>
                      {note.text}
                    </p>
                  )}
                </div>
              ))}
              {savedNotes.length === 0 && (
                <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text-muted)", fontSize: 13 }}>
                  No recruiter notes logged.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ TAB: Activity ════════════════════════ */}
        {activeTab === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="section-title">Candidate Activity</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {MOCK_ACTIVITY.map((item, idx) => (
                <div key={item.id} className="timeline-item" style={{ paddingBottom: 20 }}>
                  {/* Dot + connecting line */}
                  <div style={{ position: "relative", flexShrink: 0, width: 8 }}>
                    <div className={`timeline-dot${item.active ? " active" : ""}`} />
                    {idx < MOCK_ACTIVITY.length - 1 && <div className="timeline-line" />}
                  </div>

                  {/* Content */}
                  <div style={{ paddingTop: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
