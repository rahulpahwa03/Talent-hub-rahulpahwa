import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

/* ─── Avatar gradient palette (pick by charCode mod 5) ───── */
const AVATAR_COLORS = [
  "#2563EB", // blue
  "#7C3AED", // violet
  "#D97706", // amber
  "#16A34A", // green
  "#E11D48", // rose
];

function getAvatarColor(name = "") {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
}

export default function CandidateCard({ candidate, selected, onClick, onFavoriteToggle }) {
  const [localFavorite, setLocalFavorite] = useState(false);

  const favorited = onFavoriteToggle ? !!candidate.favorite : localFavorite;

  const name      = candidate["Candidate Name"] || "Unknown";
  const title     = candidate["Title"] || "";
  const location  = candidate["Current Location"] || "";
  const visa      = candidate["VISA"] || "";
  const email     = candidate["Email"]?.trim() || "";
  const linkedin  = candidate["LinkedIn"]?.trim() || "";
  const resumeUrl = candidate["resume_url"]?.trim() || "";

  /* Skills: parse pipe- or comma-separated */
  const allSkills = candidate["Skills"]
    ? candidate["Skills"].split(/[|,]/).map((s) => s.trim()).filter(Boolean)
    : [];
  const visibleSkills = allSkills.slice(0, 4);
  const extraCount    = allSkills.length - 4;

  const avatarColor = getAvatarColor(name);
  const initials    = getInitials(name);

  const handleFavorite = (e) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(candidate.id || candidate.candidate_uuid);
    } else {
      setLocalFavorite((prev) => !prev);
    }
  };

  return (
    <motion.div
      className={`cand-card${selected ? " selected" : ""}`}
      onClick={onClick}
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── Top row ───────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

        {/* Avatar */}
        <div
          className="avatar avatar-md"
          style={{ background: avatarColor, flexShrink: 0 }}
        >
          {initials}
        </div>

        {/* Name + Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="truncate text-primary"
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            {name}
          </div>
          <div
            className="truncate text-muted"
            style={{ fontSize: 12.5, marginTop: 1 }}
          >
            {title || "Candidate"}
          </div>

          {/* Meta row: location + visa */}
          {(location || visa) && (
            <div style={{ display: "flex", gap: 10, marginTop: 5, flexWrap: "wrap" }}>
              {location && (
                <span
                  className="text-muted"
                  style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}
                >
                  📍 {location}
                </span>
              )}
              {visa && (
                <span
                  className="text-muted"
                  style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}
                >
                  🛂 {visa}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status badges (top-right) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          {email && (
            <span className="badge badge-green">Email</span>
          )}
          {linkedin && (
            <span className="badge badge-blue">LinkedIn</span>
          )}
          {resumeUrl && (
            <span className="badge badge-gray">Resume</span>
          )}
        </div>
      </div>

      {/* ── Skills row ────────────────────────── */}
      {visibleSkills.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
          {visibleSkills.map((skill, i) => (
            <span key={i} className="tag">
              {skill}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="tag" style={{ color: "var(--text-muted)" }}>
              +{extraCount} more
            </span>
          )}
        </div>
      )}

      {/* ── Bottom row ────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        {/* Left: contact badges */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {email && (
            <span className="badge badge-green">✉ Email</span>
          )}
          {linkedin && (
            <span className="badge badge-blue">in LinkedIn</span>
          )}
          {resumeUrl && (
            <span className="badge badge-gray">📄 Resume</span>
          )}
        </div>

        {/* Right: heart / favorite */}
        <motion.button
          onClick={handleFavorite}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
            display: "flex",
            alignItems: "center",
            borderRadius: "var(--radius-sm)",
          }}
          whileTap={{ scale: 0.85 }}
          title={favorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={15}
            style={{
              color: favorited ? "var(--error)" : "var(--text-muted)",
              fill: favorited ? "var(--error)" : "none",
              transition: "color 0.2s, fill 0.2s",
            }}
          />
        </motion.button>
      </div>
    </motion.div>
  );
}
