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
} from "lucide-react";
import { supabase } from "../../lib/supabase";

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
export default function ProfilePanel({ candidate, onFavoriteToggle, onCandidateUpdate }) {
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
    } else {
      setSavedNotes([]);
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
                    height: 600,
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
