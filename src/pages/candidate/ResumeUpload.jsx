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
  Plus,
  Trash2,
  Edit,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { extractTextFromFile, parseResumeText } from "../../lib/resumeParser";
import { submitCandidateProfile } from "../../lib/candidateUploadService";

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
   Candidate Editing Modal (Used in bulk review step)
   ════════════════════════════════════════════════════════ */
function EditCandidateModal({ candidate, onSave, onClose }) {
  const [form, setForm] = useState({
    ...candidate,
    skills: Array.isArray(candidate.skills)
      ? candidate.skills
      : (candidate.skills || "").split(",").map(s => s.trim()).filter(Boolean),
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

  return (
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
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card"
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Edit Candidate Profile</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input type="text" className="input" value={form.name || ""} onChange={set("name")} />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input type="email" className="input" value={form.email || ""} onChange={set("email")} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Phone</label>
            <input type="text" className="input" value={form.phone || ""} onChange={set("phone")} />
          </div>
          <div className="input-group">
            <label className="input-label">Location</label>
            <input type="text" className="input" value={form.location || ""} onChange={set("location")} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="input-group">
            <label className="input-label">LinkedIn URL</label>
            <input type="text" className="input" value={form.linkedin || ""} onChange={set("linkedin")} />
          </div>
          <div className="input-group">
            <label className="input-label">Visa Status</label>
            <select className="input" value={form.visa || ""} onChange={set("visa")}>
              <option value="">Select Visa Status</option>
              {VISA_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Current Title</label>
            <input type="text" className="input" value={form.title || ""} onChange={set("title")} />
          </div>
          <div className="input-group">
            <label className="input-label">Current Employer</label>
            <input type="text" className="input" value={form.currentEmployer || ""} onChange={set("currentEmployer")} />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Years of Experience</label>
          <input type="text" className="input" value={form.experience || ""} onChange={set("experience")} />
        </div>

        <div className="input-group">
          <label className="input-label">Skills</label>
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
                    width: 14,
                    height: 14
                  }}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add skill..."
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
                background: "transparent"
              }}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Summary</label>
          <textarea rows={3} className="input" value={form.summary || ""} onChange={set("summary")} style={{ resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Changes</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ROOT — ResumeUpload Component
   ════════════════════════════════════════════════════════ */
export default function ResumeUpload() {
  const navigate = useNavigate();

  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadMode, setUploadMode] = useState("single"); // "single" | "bulk"
  const [files, setFiles] = useState([]); // Array of selected files
  const [parsingProgress, setParsingProgress] = useState({}); // { [filename]: { progress: 0-100, status: 'pending'|'reading'|'done'|'failed' } }
  const [parsedRoster, setParsedRoster] = useState([]); // List of parsed candidate objects
  const [editingIndex, setEditingIndex] = useState(null); // Index of candidate in parsedRoster being edited
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0); // number of files submitted
  const [submitResult, setSubmitResult] = useState([]); // array of successfully submitted objects
  const [submitErrors, setSubmitErrors] = useState([]); // array of failure strings

  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag and Drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      if (uploadMode === "single") {
        setFiles([droppedFiles[0]]);
      } else {
        setFiles((prev) => [...prev, ...droppedFiles].slice(0, 20));
      }
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) {
      if (uploadMode === "single") {
        setFiles([selected[0]]);
      } else {
        setFiles((prev) => [...prev, ...selected].slice(0, 20));
      }
    }
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Switch tabs
  const handleModeChange = (mode) => {
    setUploadMode(mode);
    setFiles([]);
  };

  // Launch parsing logic
  const handleStartParsing = async () => {
    if (files.length === 0) return;
    setCurrentStep(2);

    const progressMap = {};
    files.forEach((file) => {
      progressMap[file.name] = { status: "pending", label: "Queueing file..." };
    });
    setParsingProgress(progressMap);

    const parsedResults = [];

    // Parse concurrently/sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setParsingProgress((prev) => ({
        ...prev,
        [file.name]: { status: "reading", label: "Extracting text..." },
      }));

      try {
        const text = await extractTextFromFile(file);
        setParsingProgress((prev) => ({
          ...prev,
          [file.name]: { status: "reading", label: "Structuring profile data..." },
        }));
        await new Promise((r) => setTimeout(r, 400)); // micro delay for visual satisfaction

        const data = parseResumeText(text, file.name);
        const candidateProfile = {
          ...data,
          id: `temp-${Date.now()}-${i}`,
          fileRef: file,
          rawText: text,
          skills: Array.isArray(data.skills)
            ? data.skills
            : (data.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
        };

        parsedResults.push(candidateProfile);
        setParsingProgress((prev) => ({
          ...prev,
          [file.name]: { status: "done", label: "Success" },
        }));
      } catch (err) {
        console.error("Parse fail:", err);
        setParsingProgress((prev) => ({
          ...prev,
          [file.name]: { status: "failed", label: "Could not parse" },
        }));
        // Insert empty fallback profile so candidate can still manually fill it in
        parsedResults.push({
          id: `temp-${Date.now()}-${i}`,
          name: file.name.split(".")[0] || "",
          email: "",
          phone: "",
          linkedin: "",
          location: "",
          visa: "",
          skills: [],
          experience: "",
          currentEmployer: "",
          title: "",
          summary: "",
          fileRef: file,
          rawText: "",
        });
      }
    }

    setParsedRoster(parsedResults);
    // Proceed to review
    await new Promise((r) => setTimeout(r, 600));
    setCurrentStep(3);
  };

  // Bulk Submit to database
  const handleBulkSubmit = async () => {
    setSubmitting(true);
    setCurrentStep(4);
    setSubmitProgress(0);
    const results = [];
    const errors = [];

    for (let i = 0; i < parsedRoster.length; i++) {
      const cand = parsedRoster[i];
      try {
        const res = await submitCandidateProfile({
          form: cand,
          file: cand.fileRef || null,
          resumeText: cand.rawText || "",
        });
        results.push(res);
      } catch (err) {
        console.error("Failed to insert candidate:", cand.name, err);
        errors.push(`${cand.name || "Unknown"}: ${err.message || "Database insert failed"}`);
      }
      setSubmitProgress(i + 1);
    }

    setSubmitResult(results);
    setSubmitErrors(errors);
    setSubmitting(false);
    toast.success(`${results.length} profiles successfully saved!`);
  };

  // Add Manual Profile to Roster
  const handleAddManualCandidate = () => {
    const newCand = {
      id: `manual-${Date.now()}`,
      name: "New Candidate",
      email: "",
      phone: "",
      linkedin: "",
      location: "",
      visa: "",
      skills: [],
      experience: "",
      currentEmployer: "",
      title: "",
      summary: "",
      fileRef: null,
      rawText: "",
    };
    setParsedRoster((prev) => [...prev, newCand]);
    setEditingIndex(parsedRoster.length); // Open editing immediately
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-soft)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
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
          <span className="ai-badge" style={{ marginLeft: 6 }}>
            <Sparkles size={10} />
            Hiring Portal
          </span>
        </div>

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

      {/* Stepper (Steps 1–3) */}
      {currentStep < 4 && (
        <div style={{ padding: "24px 40px 0", maxWidth: 600, margin: "0 auto", width: "100%" }}>
          <StepBar current={currentStep} />
        </div>
      )}

      {/* Main Body */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px 80px",
          overflow: "auto",
        }}
      >
        <AnimatePresence mode="wait">
          {/* STEP 1: UPLOAD */}
          {currentStep === 1 && (
            <motion.div
              key="upload-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              style={{ width: "100%", maxWidth: 640 }}
            >
              {/* Premium Gradient Hero Area */}
              <div
                style={{
                  textAlign: "center",
                  padding: "36px 24px",
                  borderRadius: "var(--radius-xl)",
                  background: "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
                  color: "#FFFFFF",
                  boxShadow: "var(--shadow-xl)",
                  marginBottom: 24,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Glowing accents */}
                <div
                  style={{
                    position: "absolute",
                    top: "-50%",
                    right: "-20%",
                    width: 250,
                    height: 250,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)",
                  }}
                />
                
                <h1 style={{ color: "#FFFFFF", fontSize: 26, marginBottom: 8, fontWeight: 700 }}>
                  Get hired with the power of AI
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 460, margin: "0 auto" }}>
                  Upload your resume to instantly extract key skills, structure your profile, and matching with premium SaaS teams.
                </p>
              </div>

              {/* Tabs for Upload Mode Selection */}
              <div
                style={{
                  display: "flex",
                  background: "var(--bg-muted)",
                  padding: 4,
                  borderRadius: "var(--radius-lg)",
                  marginBottom: 16,
                  border: "1px solid var(--border)",
                }}
              >
                <button
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: uploadMode === "single" ? "var(--bg)" : "transparent",
                    color: uploadMode === "single" ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: "pointer",
                    boxShadow: uploadMode === "single" ? "var(--shadow-xs)" : "none",
                    transition: "all 0.2s",
                  }}
                  onClick={() => handleModeChange("single")}
                >
                  Single Resume
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: uploadMode === "bulk" ? "var(--bg)" : "transparent",
                    color: uploadMode === "bulk" ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: "pointer",
                    boxShadow: uploadMode === "bulk" ? "var(--shadow-xs)" : "none",
                    transition: "all 0.2s",
                  }}
                  onClick={() => handleModeChange("bulk")}
                >
                  Bulk Resume parsing
                </button>
              </div>

              {/* Dropzone Area */}
              <div
                className={`dropzone${isDragOver ? " drag-over" : ""}`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                style={{ minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "center" }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={uploadMode === "bulk"}
                  accept=".pdf,.doc,.docx,.txt"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <UploadCloud size={32} style={{ color: "var(--text-secondary)" }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14.5 }}>
                      Drag and drop your {uploadMode === "single" ? "resume" : "resumes"} here
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                      or <span style={{ color: "var(--accent)", fontWeight: 500 }}>browse files</span>
                    </p>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Supports PDF, DOC, DOCX, TXT. {uploadMode === "bulk" && "Up to 20 files."}
                  </span>
                </div>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="card" style={{ padding: 16, marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>
                    Selected Files ({files.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" }}>
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          background: "var(--bg-soft)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <FileText size={15} style={{ color: "var(--text-secondary)" }} />
                          <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name}
                          </span>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => removeFile(idx)} style={{ color: "var(--error)", padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                className="btn btn-primary btn-lg btn-full"
                disabled={files.length === 0}
                onClick={handleStartParsing}
                style={{ marginTop: 24 }}
              >
                Proceed &amp; Parse
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: PARSING */}
          {currentStep === 2 && (
            <motion.div
              key="parsing-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              style={{ width: "100%", maxWidth: 520, textAlign: "center" }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "var(--bg-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
              </div>
              <h2 style={{ marginBottom: 6 }}>Structuring your profiles</h2>
              <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 28 }}>
                AI is extracting candidate structures, skills, and details...
              </p>

              <div className="card" style={{ padding: 20, textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(parsingProgress).map(([filename, state]) => (
                  <div
                    key={filename}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderBottom: "1px solid var(--border-soft)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <FileText size={15} style={{ color: "var(--text-secondary)" }} />
                      <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {filename}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{state.label}</span>
                      {state.status === "done" && <CheckCircle2 size={16} color="var(--success)" />}
                      {state.status === "reading" && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                      {state.status === "failed" && <XCircle size={16} color="var(--error)" />}
                      {state.status === "pending" && <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--border)" }} />}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: REVIEW / EDIT */}
          {currentStep === 3 && (
            <motion.div
              key="review-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              style={{ width: "100%", maxWidth: uploadMode === "single" ? 940 : 1080 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Review candidate profiles</h2>
                  <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 2 }}>
                    Verify or edit parsed fields. Email addresses are recommended for system insertion.
                  </p>
                </div>
                {uploadMode === "bulk" && (
                  <button className="btn btn-secondary btn-sm" onClick={handleAddManualCandidate}>
                    <Plus size={14} /> Add Candidate Manually
                  </button>
                )}
              </div>

              {/* Roster / Table for Bulk upload */}
              {uploadMode === "bulk" ? (
                <div className="card" style={{ padding: 16 }}>
                  <div className="table-wrap" style={{ border: "none" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Title</th>
                          <th>Visa</th>
                          <th>Skills</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRoster.map((cand, idx) => (
                          <tr key={cand.id}>
                            <td>
                              <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                                {cand.name || "—"}
                                {!cand.name && (
                                  <span style={{ color: "var(--error)", display: "flex", alignItems: "center" }} title="Missing Name">
                                    <AlertCircle size={14} />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {cand.email || "—"}
                                {!cand.email && (
                                  <span style={{ color: "var(--warning)", display: "flex", alignItems: "center" }} title="Email recommended">
                                    <AlertCircle size={14} />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{cand.title || "—"}</td>
                            <td>
                              {cand.visa ? (
                                <span className="badge badge-blue">{cand.visa}</span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 280 }}>
                                {cand.skills?.slice(0, 4).map((s) => (
                                  <span key={s} className="tag" style={{ fontSize: 10, padding: "1px 6px" }}>{s}</span>
                                ))}
                                {cand.skills?.length > 4 && (
                                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>+{cand.skills.length - 4}</span>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: 8 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingIndex(idx)} style={{ padding: 6 }}>
                                  <Edit size={13} />
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => setParsedRoster((prev) => prev.filter((_, i) => i !== idx))}
                                  style={{ padding: 6 }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {parsedRoster.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0" }}>
                              No profiles in list. Click "Add Candidate Manually" to insert one.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
                    <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
                      Back
                    </button>
                    <button className="btn btn-primary" onClick={handleBulkSubmit} disabled={parsedRoster.length === 0}>
                      Submit all profiles ({parsedRoster.length})
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Single Profile Editing Wizard Step (Full Form Review) */
                <div className="grid-2" style={{ gap: 24, gridTemplateColumns: "1.2fr 0.8fr", alignItems: "start" }}>
                  <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
                    <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>Profile Information</h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <input
                          type="text"
                          className="input"
                          value={parsedRoster[0]?.name || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedRoster((prev) => {
                              const next = [...prev];
                              next[0] = { ...next[0], name: val };
                              return next;
                            });
                          }}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Email</label>
                        <input
                          type="email"
                          className="input"
                          value={parsedRoster[0]?.email || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedRoster((prev) => {
                              const next = [...prev];
                              next[0] = { ...next[0], email: val };
                              return next;
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div className="input-group">
                        <label className="input-label">Phone</label>
                        <input
                          type="text"
                          className="input"
                          value={parsedRoster[0]?.phone || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedRoster((prev) => {
                              const next = [...prev];
                              next[0] = { ...next[0], phone: val };
                              return next;
                            });
                          }}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Location</label>
                        <input
                          type="text"
                          className="input"
                          value={parsedRoster[0]?.location || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedRoster((prev) => {
                              const next = [...prev];
                              next[0] = { ...next[0], location: val };
                              return next;
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div className="input-group">
                        <label className="input-label">LinkedIn URL</label>
                        <input
                          type="text"
                          className="input"
                          value={parsedRoster[0]?.linkedin || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedRoster((prev) => {
                              const next = [...prev];
                              next[0] = { ...next[0], linkedin: val };
                              return next;
                            });
                          }}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Visa Status</label>
                        <select
                          className="input"
                          value={parsedRoster[0]?.visa || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedRoster((prev) => {
                              const next = [...prev];
                              next[0] = { ...next[0], visa: val };
                              return next;
                            });
                          }}
                        >
                          <option value="">Select Visa Status</option>
                          {VISA_OPTIONS.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div className="input-group">
                        <label className="input-label">Current Title</label>
                        <input
                          type="text"
                          className="input"
                          value={parsedRoster[0]?.title || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedRoster((prev) => {
                              const next = [...prev];
                              next[0] = { ...next[0], title: val };
                              return next;
                            });
                          }}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Current Employer</label>
                        <input
                          type="text"
                          className="input"
                          value={parsedRoster[0]?.currentEmployer || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedRoster((prev) => {
                              const next = [...prev];
                              next[0] = { ...next[0], currentEmployer: val };
                              return next;
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Years of Experience</label>
                      <input
                        type="text"
                        className="input"
                        value={parsedRoster[0]?.experience || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setParsedRoster((prev) => {
                            const next = [...prev];
                            next[0] = { ...next[0], experience: val };
                            return next;
                          });
                        }}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Skills (comma-separated)</label>
                      <input
                        type="text"
                        className="input"
                        value={parsedRoster[0]?.skills?.join(", ") || ""}
                        onChange={(e) => {
                          const val = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                          setParsedRoster((prev) => {
                            const next = [...prev];
                            next[0] = { ...next[0], skills: val };
                            return next;
                          });
                        }}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Summary</label>
                      <textarea
                        rows={3}
                        className="input"
                        value={parsedRoster[0]?.summary || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setParsedRoster((prev) => {
                            const next = [...prev];
                            next[0] = { ...next[0], summary: val };
                            return next;
                            });
                        }}
                        style={{ resize: "vertical" }}
                      />
                    </div>
                  </div>

                  {/* Single Preview Side widget */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="card" style={{ padding: 24 }}>
                      <p className="section-title">Candidate Preview</p>
                      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                        <div
                          className="avatar avatar-md"
                          style={{
                            background: "var(--primary)",
                            width: 44,
                            height: 44,
                            fontSize: 16,
                          }}
                        >
                          {(parsedRoster[0]?.name || "?")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h4 style={{ margin: 0 }}>{parsedRoster[0]?.name || "—"}</h4>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{parsedRoster[0]?.title || "—"}</span>
                        </div>
                      </div>

                      <div className="divider" style={{ margin: "12px 0" }} />

                      {[
                        { label: "Email", value: parsedRoster[0]?.email || "—" },
                        { label: "Location", value: parsedRoster[0]?.location || "—" },
                        { label: "Visa", value: parsedRoster[0]?.visa || "—" },
                      ].map((row) => (
                        <div key={row.label} className="info-row">
                          <span className="info-label" style={{ minWidth: 70 }}>{row.label}</span>
                          <span className="info-value">{row.value}</span>
                        </div>
                      ))}
                    </div>

                    <button className="btn btn-primary btn-lg btn-full" onClick={handleBulkSubmit}>
                      Submit Profile
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Edit details popup modal */}
              {editingIndex !== null && (
                <EditCandidateModal
                  candidate={parsedRoster[editingIndex]}
                  onSave={(updated) => {
                    setParsedRoster((prev) => {
                      const next = [...prev];
                      next[editingIndex] = updated;
                      return next;
                    });
                    setEditingIndex(null);
                  }}
                  onClose={() => setEditingIndex(null)}
                />
              )}
            </motion.div>
          )}

          {/* STEP 4: SUCCESS / SUBMIT PROGRESS */}
          {currentStep === 4 && (
            <motion.div
              key="success-panel"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: "100%", maxWidth: 520, textAlign: "center" }}
            >
              {submitting ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <Loader2 size={36} style={{ animation: "spin 1s linear infinite" }} />
                  <h3>Submitting profiles...</h3>
                  <div className="w-full progress-bar" style={{ height: 6 }}>
                    <div
                      className="progress-fill"
                      style={{ width: `${(submitProgress / parsedRoster.length) * 100}%` }}
                    />
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Processed {submitProgress} of {parsedRoster.length} candidate profiles.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "var(--success-soft)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                    }}
                  >
                    <CheckCircle2 size={36} color="var(--success)" />
                  </div>

                  <h2>Submission Complete!</h2>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "8px 0 24px", lineHeight: 1.6 }}>
                    Successfully uploaded and parsed <strong>{submitResult.length}</strong> {submitResult.length === 1 ? "profile" : "profiles"}.
                    {submitErrors.length > 0 && ` Failed to process ${submitErrors.length} file(s).`}
                  </p>

                  {/* List of successfully submitted candidates */}
                  {submitResult.length > 0 && (
                    <div className="card" style={{ width: "100%", padding: 16, marginBottom: 24, textAlign: "left" }}>
                      <p className="section-title">Submitted Candidates</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {submitResult.map((res, i) => (
                          <div key={i} style={{ display: "flex", justifyBetween: true, alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{res.candidateName}</span>
                            <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>
                              {String(res.profileId).slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {submitErrors.length > 0 && (
                    <div className="card" style={{ width: "100%", padding: 16, borderColor: "var(--error-border)", background: "var(--error-soft)", marginBottom: 24, textAlign: "left" }}>
                      <p className="section-title" style={{ color: "var(--error)" }}>Errors</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {submitErrors.map((err, i) => (
                          <span key={i} style={{ fontSize: 12, color: "var(--error)" }}>{err}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn btn-secondary" onClick={() => navigate("/")}>
                      <Home size={15} /> Home
                    </button>
                    {uploadMode === "single" && submitResult[0]?.profileId && (
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          if (parsedRoster[0]?.email) {
                            localStorage.setItem("candidate_email", parsedRoster[0].email);
                          }
                          navigate("/candidate/profile");
                        }}
                      >
                        <Eye size={15} /> View Profile
                      </button>
                    )}
                    {uploadMode === "bulk" && (
                      <button className="btn btn-primary" onClick={() => window.location.reload()}>
                        Upload More
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
