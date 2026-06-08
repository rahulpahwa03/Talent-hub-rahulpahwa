import { useState } from "react";
import {
  Mail, Phone, MapPin, Link2, FileText,
  Briefcase, Copy, Check, ExternalLink, User, Star,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview",  icon: <User size={13} /> },
  { id: "skills",   label: "Skills",    icon: <Star size={13} /> },
  { id: "resume",   label: "Resume",    icon: <FileText size={13} /> },
  { id: "notes",    label: "Notes",     icon: <Briefcase size={13} /> },
];

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="btn-icon" title="Copy">
      {copied
        ? <Check size={12} style={{ color: "#10b981" }} />
        : <Copy size={12} />}
    </button>
  );
}

function InfoRow({ icon, label, value, action }) {
  if (!value) return null;
  return (
    <div className="info-row">
      <div className="info-row-icon" style={{
        background: "rgba(139,92,246,0.1)",
        color: "#a78bfa",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginBottom: 3 }}>
          {label}
        </div>
        <div style={{
          fontSize: 13.5, color: "var(--text-primary)",
          wordBreak: "break-word",
        }}>
          {value}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function ProfilePanel({ candidate }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  if (!candidate) {
    return (
      <div style={{
        height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 16, textAlign: "center", padding: 40,
      }}>
        {/* Decorative orb */}
        <div style={{
          width: 120, height: 120, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 44, marginBottom: 8,
        }}>
          👤
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-secondary)" }}>
          Select a candidate
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 260, lineHeight: 1.6 }}>
          Click any candidate from the list to view their full profile here.
        </div>
      </div>
    );
  }

  const name = candidate["Candidate Name"] || "Unknown";
  const initials = name.split(" ").slice(0, 2).map(x => x[0]).join("").toUpperCase();

  const GRADIENTS = [
    "linear-gradient(135deg, #7c3aed, #d946ef)",
    "linear-gradient(135deg, #2563eb, #7c3aed)",
    "linear-gradient(135deg, #0891b2, #7c3aed)",
    "linear-gradient(135deg, #059669, #0891b2)",
    "linear-gradient(135deg, #d946ef, #f43f5e)",
  ];
  const colorIdx = (name.charCodeAt(0) || 0) % GRADIENTS.length;

  const skills = candidate["Skills"]
    ?.split(/[|,]/).map(s => s.trim()).filter(Boolean) || [];

  const linkedinUrl = candidate["LinkedIn"]
    ? (candidate["LinkedIn"].startsWith("http") ? candidate["LinkedIn"] : `https://${candidate["LinkedIn"]}`)
    : null;

  const saveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ padding: "28px 28px 40px" }}>

      {/* ── Header ───────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 18,
        marginBottom: 28,
      }}>
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: GRADIENTS[colorIdx],
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 800, color: "white",
          flexShrink: 0,
          boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            fontSize: 22, fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "var(--text-primary)",
            margin: "0 0 4px",
            letterSpacing: "-0.02em",
          }}>
            {name}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 10px" }}>
            {candidate["Title"] || "Candidate"}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {candidate["VISA"] && (
              <span className="badge-cyan">🛂 {candidate["VISA"]}</span>
            )}
            {candidate["Current Location"] && (
              <span style={{
                display: "inline-flex", gap: 4, padding: "3px 10px",
                borderRadius: 99, fontSize: 11, fontWeight: 500,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}>
                📍 {candidate["Current Location"]}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {linkedinUrl && (
            <a
              href={linkedinUrl} target="_blank" rel="noreferrer"
              className="btn-ghost"
              style={{ fontSize: 12, gap: 5, textDecoration: "none", color: "var(--text-secondary)" }}>
              <Link2 size={13} style={{ color: "#0ea5e9" }} />
              LinkedIn
            </a>
          )}
        </div>
      </div>

      {/* ── Tab Bar ──────────────────────────── */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ─────────────────────── */}
      {activeTab === "overview" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <InfoRow
            icon={<Mail size={15} />}
            label="Email"
            value={candidate["Email"]}
            action={candidate["Email"] && <CopyBtn value={candidate["Email"]} />}
          />
          <InfoRow
            icon={<Phone size={15} />}
            label="Phone"
            value={candidate["Contact No"]}
            action={candidate["Contact No"] && <CopyBtn value={candidate["Contact No"]} />}
          />
          <InfoRow
            icon={<MapPin size={15} />}
            label="Location"
            value={candidate["Current Location"]}
          />

          {/* LinkedIn special row */}
          <div className="info-row">
            <div className="info-row-icon" style={{ background: "rgba(14,165,233,0.1)", color: "#38bdf8" }}>
              <Link2 size={15} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginBottom: 3 }}>
                LinkedIn
              </div>
              {linkedinUrl ? (
                <a href={linkedinUrl} target="_blank" rel="noreferrer"
                   style={{ fontSize: 13, color: "#67e8f9", textDecoration: "none",
                            display: "flex", alignItems: "center", gap: 5 }}>
                  {candidate["LinkedIn"].replace(/https?:\/\//, "").slice(0, 40)}
                  <ExternalLink size={11} />
                </a>
              ) : (
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Not available</span>
              )}
            </div>
            {candidate["LinkedIn"] && <CopyBtn value={candidate["LinkedIn"]} />}
          </div>

          {/* Resume row */}
          <div className="info-row">
            <div className="info-row-icon" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>
              <FileText size={15} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginBottom: 3 }}>
                Resume
              </div>
              {candidate.resume_url ? (
                <a href={candidate.resume_url} target="_blank" rel="noreferrer"
                   style={{ fontSize: 13, color: "#67e8f9", textDecoration: "none",
                            display: "flex", alignItems: "center", gap: 5 }}>
                  View Resume
                  <ExternalLink size={11} />
                </a>
              ) : (
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Not uploaded</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Skills Tab ───────────────────────── */}
      {activeTab === "skills" && (
        <div className="animate-fade-in">
          {skills.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>
              No skills listed
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                {skills.length} skills found
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skills.map((skill, i) => (
                  <span
                    key={i}
                    className="skill-pill animate-fade-slide-up"
                    style={{ animationDelay: `${i * 25}ms` }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Resume Tab ───────────────────────── */}
      {activeTab === "resume" && (
        <div className="animate-fade-in">
          {candidate.resume_url ? (
            <div style={{
              padding: 24, borderRadius: 18,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid var(--border-subtle)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>
                Resume Available
              </div>
              <a
                href={candidate.resume_url}
                target="_blank" rel="noreferrer"
                className="btn-primary"
                style={{ textDecoration: "none", display: "inline-flex", marginTop: 8 }}>
                <ExternalLink size={15} />
                Open Resume
              </a>
            </div>
          ) : (
            <div style={{
              padding: 32, borderRadius: 18,
              background: "rgba(255,255,255,0.025)",
              border: "2px dashed var(--border-subtle)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>📤</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                No Resume Uploaded
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                Upload a resume for this candidate
              </div>
              <button className="btn-primary">
                Upload Resume
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Notes Tab ────────────────────────── */}
      {activeTab === "notes" && (
        <div className="animate-fade-in">
          <textarea
            rows={10}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add recruiter notes, interview feedback, follow-up actions…"
            className="input-base"
            style={{
              resize: "vertical", lineHeight: 1.6,
              borderRadius: 14, fontSize: 13,
              minHeight: 180,
            }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={saveNotes} className="btn-primary">
              {notesSaved ? <><Check size={14} /> Saved!</> : "Save Notes"}
            </button>
            {notes && (
              <button onClick={() => setNotes("")} className="btn-ghost">
                Clear
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}