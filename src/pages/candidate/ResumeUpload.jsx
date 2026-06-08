import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Mail,
  Phone,
  Link,
  MapPin,
  Briefcase,
  Building2,
  Clock,
  Code2,
  Sparkles,
  ArrowRight,
  Home,
  Eye,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { extractTextFromFile, parseResumeText } from "../../lib/resumeParser";
import { submitCandidateProfile } from "../../lib/candidateUploadService";

/* ─── Fallback demo data (used if parsing yields nothing) ── */
const DEMO_PARSED = {
  name: "",
  email: "",
  phone: "",
  linkedin: "",
  location: "",
  visa: "Other",
  skills: [],
  experience: "",
  currentEmployer: "",
  title: "",
  summary: "",
};

/* ─── Parsing steps ───────────────────────────────────── */
const PARSE_STEPS = [
  { label: "Extracting text from document", delay: 0 },
  { label: "Identifying contact information", delay: 500 },
  { label: "Detecting skills and technologies", delay: 1000 },
  { label: "Parsing work experience", delay: 1500 },
  { label: "Building your profile", delay: 2000 },
];

/* ─── Visa options ────────────────────────────────────── */
const VISA_OPTIONS = [
  "US Citizen",
  "Green Card",
  "H1B",
  "H4 EAD",
  "OPT/CPT",
  "TN Visa",
  "L1",
  "Other",
];

/* ─── Step label map ──────────────────────────────────── */
const STEP_LABELS = ["Upload", "Parsing", "Review", "Complete"];

/* ════════════════════════════════════════════════════════
   Helper: Step Progress Bar
   ════════════════════════════════════════════════════════ */
function StepBar({ current }) {
  return (
    <div className="steps" style={{ padding: "0 8px" }}>
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isDone = current > stepNum;
        const isActive = current === stepNum;
        return (
          <div key={label} className="flex items-center" style={{ flex: i < 3 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                className={`step-dot ${isDone ? "done" : isActive ? "active" : "todo"}`}
              >
                {isDone ? <CheckCircle2 size={13} /> : stepNum}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--text-primary)" : isDone ? "var(--text-secondary)" : "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < 3 && (
              <div
                className={`step-line ${isDone ? "done" : ""}`}
                style={{ marginBottom: 18 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP 1 — Upload Resume
   ════════════════════════════════════════════════════════ */
function StepUpload({ file, onFileSelect, onContinue }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileSelect(dropped);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.38, ease: [0, 0, 0.2, 1] }}
      style={{ width: "100%", maxWidth: 560 }}
    >
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ marginBottom: 8 }}>Upload your resume</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Our AI will extract your information automatically
        </p>
      </div>

      {/* Dropzone */}
      <div
        className={`dropzone${isDragOver ? " drag-over" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => !file && inputRef.current?.click()}
        style={{ cursor: file ? "default" : "pointer" }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.rtf"
          style={{ display: "none" }}
          onChange={(e) => e.target.files[0] && onFileSelect(e.target.files[0])}
        />

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              key="file-selected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "var(--radius-lg)",
                  background: "var(--success-soft)",
                  border: "1px solid var(--success-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={22} color="var(--success)" />
              </div>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--text-primary)",
                    marginBottom: 2,
                  }}
                >
                  {file.name}
                </p>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  {formatSize(file.size)}
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelect(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                style={{ marginTop: 4 }}
              >
                Choose a different file
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="upload-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "var(--radius-xl)",
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                <UploadCloud size={26} color="var(--text-secondary)" />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)", marginBottom: 4 }}>
                  Drag and drop your resume here
                </p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  or{" "}
                  <span style={{ color: "var(--accent)", fontWeight: 500, cursor: "pointer" }}>
                    browse files
                  </span>
                </p>
              </div>
              {/* Accepted formats */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                {["PDF", "DOC", "DOCX", "TXT"].map((fmt) => (
                  <span key={fmt} className="tag">
                    {fmt}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Continue Button */}
      <motion.div
        style={{ marginTop: 24 }}
        animate={{ opacity: file ? 1 : 0.4 }}
        transition={{ duration: 0.2 }}
      >
        <button
          className="btn btn-primary btn-lg btn-full"
          disabled={!file}
          onClick={onContinue}
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP 2 — Parsing Progress (REAL parser)
   ════════════════════════════════════════════════════════ */
function StepParsing({ file, onComplete }) {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setCompletedSteps([]);
      const advance = (i) => { if (!cancelled) setCompletedSteps((prev) => [...prev, i]); };

      advance(0); // Extracting text
      try {
        const rawText = await extractTextFromFile(file);
        advance(1); // Identifying contact info
        await delay(300);
        const parsed = parseResumeText(rawText, file.name);
        advance(2); // Detecting skills
        await delay(200);
        advance(3); // Parsing experience
        await delay(200);
        advance(4); // Building profile
        await delay(400);
        if (!cancelled) onComplete(parsed, rawText);
      } catch (err) {
        console.error('Resume parsing failed:', err);
        if (!cancelled) {
          setError('Could not read this file. Please fill in your details manually.');
          await delay(800);
          [0, 1, 2, 3, 4].forEach(i => advance(i));
          await delay(400);
          if (!cancelled) onComplete({
            name: '', email: '', phone: '', linkedin: '', location: '',
            visa: '', skills: [], experience: '', currentEmployer: '', title: '', summary: '',
          }, '');
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, [file, onComplete]);

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.38, ease: [0, 0, 0.2, 1] }}
      style={{ width: "100%", maxWidth: 480, textAlign: "center" }}
    >
      {/* Pulsing icon */}
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        style={{
          width: 72, height: 72,
          borderRadius: "var(--radius-2xl)",
          background: "var(--bg-soft)",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px",
        }}
      >
        <FileText size={30} color="var(--text-secondary)" />
      </motion.div>

      <h2 style={{ marginBottom: 8 }}>Reading your resume</h2>
      <p style={{ fontSize: 13.5, marginBottom: 36 }}>
        {error
          ? <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><AlertCircle size={14} />{error}</span>
          : 'Extracting your information…'}
      </p>

      {/* Parse step list */}
      <div className="card" style={{ padding: "20px 24px", textAlign: "left", display: "flex", flexDirection: "column", gap: 0 }}>
        {PARSE_STEPS.map((step, i) => {
          const isDone = completedSteps.includes(i);
          const isActive = !isDone && completedSteps.length === i;
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 0",
                borderBottom: i < PARSE_STEPS.length - 1 ? "1px solid var(--border-soft)" : "none",
              }}
            >
              <div style={{ width: 22, height: 22, flexShrink: 0 }}>
                <AnimatePresence mode="wait">
                  {isDone ? (
                    <motion.div key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                      <CheckCircle2 size={20} color="var(--success)" />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Loader2 size={20} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
                    </motion.div>
                  ) : (
                    <motion.div key="idle" style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--border)" }} />
                  )}
                </AnimatePresence>
              </div>
              <span style={{ fontSize: 13.5, color: isDone ? "var(--text-primary)" : isActive ? "var(--accent)" : "var(--text-muted)", fontWeight: isDone || isActive ? 500 : 400, transition: "color 0.3s" }}>
                {step.label}
              </span>
              {isDone && <span className="badge badge-green" style={{ marginLeft: "auto", fontSize: 10.5 }}>Done</span>}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ════════════════════════════════════════════════════════
   STEP 3 — Review Extracted Data
   ════════════════════════════════════════════════════════ */
function StepReview({ parsedData, onSubmit }) {
  const [form, setForm] = useState({
    ...parsedData,
    skills: Array.isArray(parsedData.skills)
      ? parsedData.skills
      : (parsedData.skills || "").split(",").map(s => s.trim()).filter(Boolean),
    notes: parsedData.notes || "",
  });

  const [skillInput, setSkillInput] = useState("");

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleAddSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, s] }));
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  /* Avatar colour */
  const avatarColors = ["#4F46E5", "#0F766E", "#7C3AED", "#B45309", "#0369A1"];
  const safeName = form.name || "?";
  const initials = safeName
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  const colorIdx = (safeName.charCodeAt(0) || 0) % avatarColors.length;

  const AiBadge = () => (
    <span className="ai-badge" style={{ marginLeft: 6 }}>
      <Sparkles size={9} />
      AI Extracted
    </span>
  );

  const Field = ({ label, icon: Icon, fieldKey, type = "text", children }) => (
    <div className="input-group" style={{ margin: 0 }}>
      <label className="input-label" style={{ display: "flex", alignItems: "center" }}>
        {label}
        <AiBadge />
      </label>
      {children || (
        <div style={{ position: "relative" }}>
          {Icon && (
            <Icon
              size={14}
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
          )}
          <input
            type={type}
            className="input"
            value={form[fieldKey] || ""}
            onChange={set(fieldKey)}
            style={{ paddingLeft: Icon ? 32 : undefined }}
          />
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.38, ease: [0, 0, 0.2, 1] }}
      style={{ width: "100%", maxWidth: 940 }}
    >
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ marginBottom: 8 }}>Review extracted information</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          We've pre-filled your details. Edit anything that looks off.
        </p>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: "start", gridTemplateColumns: "1.2fr 0.8fr" }}>
        {/* ── Left: Editable fields grouped into clean cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Card 1: Personal Info */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <h3 style={{ fontSize: 15, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
              <User size={16} style={{ color: "var(--accent)" }} /> Personal Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Full Name" icon={User} fieldKey="name" />
              <Field label="Email" icon={Mail} fieldKey="email" type="email" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Phone" icon={Phone} fieldKey="phone" />
              <Field label="Location" icon={MapPin} fieldKey="location" />
            </div>
            <Field label="LinkedIn URL" icon={Link} fieldKey="linkedin" />
          </div>

          {/* Card 2: Career & Visa */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <h3 style={{ fontSize: 15, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
              <Briefcase size={16} style={{ color: "var(--accent)" }} /> Career &amp; Work Eligibility
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Current Title" icon={Briefcase} fieldKey="title" />
              <Field label="Current Employer" icon={Building2} fieldKey="currentEmployer" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Years of Experience" icon={Clock} fieldKey="experience" />
              
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ display: "flex", alignItems: "center" }}>
                  Visa Status
                  <AiBadge />
                </label>
                <select className="input" value={form.visa || "Other"} onChange={set("visa")}>
                  {VISA_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Skills & Summary */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <h3 style={{ fontSize: 15, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
              <Code2 size={16} style={{ color: "var(--accent)" }} /> Skills &amp; Profile Summary
            </h3>
            
            {/* Interactive Skills Chip Editor */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ display: "flex", alignItems: "center" }}>
                <Code2 size={13} style={{ marginRight: 5 }} />
                Skills
                <AiBadge />
              </label>
              
              <div 
                style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: 6, 
                  padding: "8px 12px", 
                  border: "1px solid var(--border)", 
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg)",
                  minHeight: 44,
                  alignItems: "center"
                }}
              >
                {form.skills.map((s) => (
                  <span 
                    key={s} 
                    className="tag" 
                    style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: 5,
                      padding: "4px 8px 4px 10px",
                      background: "var(--bg-soft)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-full)",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--text-primary)"
                    }}
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      style={{
                        border: "none",
                        background: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        width: 14,
                        height: 14
                      }}
                    >
                      <XCircle size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={form.skills.length === 0 ? "Type skill and press Enter or comma..." : "Add skill..."}
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  onBlur={handleAddSkill}
                  style={{
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    flex: 1,
                    minWidth: 100,
                    padding: "4px 0",
                    background: "transparent"
                  }}
                />
              </div>
              <span className="input-hint">Type a skill and press Enter or comma (,) to add. Click X to remove.</span>
            </div>

            {/* Editable Summary field */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ display: "flex", alignItems: "center" }}>
                Professional Summary
                <AiBadge />
              </label>
              <textarea
                rows={4}
                className="input"
                value={form.summary || ""}
                onChange={set("summary")}
                placeholder="Brief summary of your professional background..."
                style={{ resize: "vertical", minHeight: 90 }}
              />
            </div>

            {/* Editable Notes field */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ display: "flex", alignItems: "center" }}>
                Notes / Additional Comments
                <AiBadge />
              </label>
              <textarea
                rows={3}
                className="input"
                value={form.notes || ""}
                onChange={set("notes")}
                placeholder="Add notes, recruiter comments, or specific search keywords..."
                style={{ resize: "vertical", minHeight: 70 }}
              />
            </div>
          </div>
        </div>

        {/* ── Right: Profile Preview Card ── */}
        <div style={{ position: "sticky", top: 84, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <p className="section-title" style={{ marginBottom: 16 }}>
              Profile Preview
            </p>

            {/* Header */}
            <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
              <div
                className="avatar avatar-xl"
                style={{ background: avatarColors[colorIdx], fontSize: initials.length > 2 ? 16 : 22 }}
              >
                {initials}
              </div>
              <div>
                <h3 style={{ marginBottom: 2 }}>{form.name || "—"}</h3>
                <p style={{ fontSize: 13, margin: 0, color: "var(--text-secondary)" }}>{form.title || "—"}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <span className="badge badge-blue">{form.visa || "—"}</span>
                  <span className="badge badge-green">
                    <span className="dot dot-green" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="divider" style={{ marginBottom: 12 }} />

            {/* Info rows */}
            {[
              { label: "Email", value: form.email, icon: Mail },
              { label: "Location", value: form.location, icon: MapPin },
              { label: "Employer", value: form.currentEmployer, icon: Building2 },
              { label: "Experience", value: form.experience, icon: Clock },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="info-row">
                <span className="info-label flex items-center gap-2">
                  <Icon size={12} />
                  {label}
                </span>
                <span className="info-value text-sm">{value || "—"}</span>
              </div>
            ))}

            <div className="divider" style={{ margin: "12px 0" }} />

            {/* Skills preview */}
            <p className="section-title" style={{ marginBottom: 8 }}>
              Skills
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {form.skills.slice(0, 8).map((s) => (
                <span key={s} className="badge badge-gray">
                  {s}
                </span>
              ))}
              {form.skills.length > 8 && (
                <span className="badge badge-gray" style={{ color: "var(--text-muted)" }}>
                  +{form.skills.length - 8} more
                </span>
              )}
              {form.skills.length === 0 && (
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No skills added yet</span>
              )}
            </div>
          </div>

          {/* CTA */}
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={() => onSubmit(form)}
          >
            Submit Profile
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   STEP 4 — Success
   ════════════════════════════════════════════════════════ */
function StepSuccess({ result, error: submitError }) {
  const navigate = useNavigate();

  if (submitError) {
    return (
      <motion.div
        key="step4-error"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: "100%", maxWidth: 480, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <div style={{
          width: 88, height: 88, borderRadius: "50%",
          background: "#FFF1F2", border: "2px solid #FECDD3",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28,
        }}>
          <XCircle size={42} color="#E11D48" />
        </div>
        <h2 style={{ marginBottom: 8 }}>Submission Failed</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.7 }}>
          {submitError}
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => window.location.reload()}>
          <RefreshCw size={16} /> Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        width: "100%", maxWidth: 480, textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
      }}
    >
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 340, damping: 22 }}
        style={{
          width: 88, height: 88, borderRadius: "50%",
          background: "var(--success-soft)", border: "2px solid var(--success-border)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28,
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 400, damping: 20 }}
        >
          <CheckCircle2 size={42} color="var(--success)" />
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35 }}>
        <h1 style={{ marginBottom: 8 }}>Profile Submitted!</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
          {result?.candidateName
            ? <><strong>{result.candidateName}</strong>'s profile is now live in the EzHire talent network.<br /></>
            : "Your profile has been added to the EzHire talent network.\n"}
          Recruiters can now discover you.
        </p>

        {/* Stats chips */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          {result?.profileId && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: "var(--radius-lg)",
              background: "var(--bg-soft)", border: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Profile ID</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", fontFamily: "monospace" }}>
                {String(result.profileId).slice(0, 8).toUpperCase()}
              </span>
            </div>
          )}
          {result?.resumeUrl && (
            <a
              href={result.resumeUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: "var(--radius-lg)",
                background: "#F0FDF4", border: "1px solid #BBF7D0",
                color: "#15803D", fontSize: 13, fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <FileText size={13} /> Resume Uploaded <ExternalLink size={11} />
            </a>
          )}
          {!result?.resumeUrl && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: "var(--radius-lg)",
              background: "var(--bg-soft)", border: "1px solid var(--border)",
              color: "var(--text-muted)", fontSize: 13,
            }}>
              <FileText size={13} /> Profile saved (resume storage not configured)
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate("/")}>
            <Home size={16} /> Back to Home
          </button>
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/candidate/profile")}>
            <Eye size={16} /> View Profile
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}


/* ════════════════════════════════════════════════════════
   ROOT — ResumeUpload
   ════════════════════════════════════════════════════════ */
export default function ResumeUpload() {
  const [currentStep, setCurrentStep]   = useState(1);
  const [file, setFile]                 = useState(null);
  const [parsedData, setParsedData]     = useState(null);
  const [rawText, setRawText]           = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError]   = useState('');

  const handleFileSelect = (f) => setFile(f);

  const handleContinue = () => {
    if (!file) return;
    setCurrentStep(2);
  };

  const handleParsingComplete = (data, text) => {
    const normalized = {
      ...data,
      skills: Array.isArray(data.skills)
        ? data.skills
        : (data.skills || '').split(',').map(s => s.trim()).filter(Boolean),
    };
    setParsedData(normalized);
    setRawText(text || '');
    setCurrentStep(3);
  };

  const handleSubmit = async (form) => {
    setSubmitting(true);
    setCurrentStep(4);
    try {
      const result = await submitCandidateProfile({
        form: {
          ...form,
          skills: typeof form.skills === 'string'
            ? form.skills.split(',').map(s => s.trim()).filter(Boolean)
            : form.skills,
        },
        file,
        resumeText: rawText,
      });
      setSubmitResult(result);
      if (form.email) {
        localStorage.setItem('candidate_email', form.email.trim());
      }
      if (form.name) {
        localStorage.setItem('candidate_name', form.name.trim());
      }
      toast.success('Profile saved to EzHire!');
    } catch (err) {
      console.error('[ResumeUpload] Submit failed:', err);
      setSubmitError(
        err?.message?.includes('insert_candidate')
          ? 'Database not configured yet — please run supabase_setup.sql in your Supabase SQL editor.'
          : (err?.message || 'Submission failed. Please try again.')
      );
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ─────────────────────────────────── */}
      <header
        style={{
          height: 60,
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
          gap: 12,
          flexShrink: 0,
          background: "var(--bg)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 800,
              color: "white",
            }}
          >
            E
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
            Ez<span style={{ color: "var(--accent)" }}>Hire</span>
          </span>
        </div>

        {/* Step counter chip */}
        {currentStep < 4 && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-muted)",
              background: "var(--bg-muted)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-full)",
              padding: "4px 12px",
            }}
          >
            Step {currentStep} of 4
          </div>
        )}
      </header>

      {/* ── Step Progress (only steps 1–3) ─────────── */}
      {currentStep < 4 && (
        <div
          style={{
            padding: "24px 40px 0",
            maxWidth: 560,
            margin: "0 auto",
            width: "100%",
          }}
        >
          <StepBar current={currentStep} />
        </div>
      )}

      {/* ── Main content ───────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: currentStep === 4 ? "center" : "flex-start",
          justifyContent: "center",
          padding: "40px 24px 60px",
          overflow: "auto",
        }}
      >
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <StepUpload
              key="upload"
              file={file}
              onFileSelect={handleFileSelect}
              onContinue={handleContinue}
            />
          )}
          {currentStep === 2 && file && (
            <StepParsing key="parsing" file={file} onComplete={handleParsingComplete} />
          )}
          {currentStep === 3 && parsedData && (
            <StepReview key="review" parsedData={parsedData} onSubmit={handleSubmit} />
          )}
          {currentStep === 4 && (
            submitting ? (
              <motion.div
                key="submitting"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "var(--bg-soft)", border: "2px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Loader2 size={28} color="var(--text-secondary)" />
                </motion.div>
                <div>
                  <h3 style={{ margin: 0 }}>Saving your profile…</h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
                    Uploading resume and saving to database
                  </p>
                </div>
              </motion.div>
            ) : (
              <StepSuccess key="success" result={submitResult} error={submitError} />
            )
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
