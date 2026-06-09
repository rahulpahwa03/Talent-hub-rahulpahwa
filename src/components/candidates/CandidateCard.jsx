import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles, Check } from "lucide-react";
import { parseNaturalQuery } from "../ai/AISearchBar";

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

/* ─── Match Score / Profile Strength Calculator ─────────── */
export function calculateMatchScore(candidate, query = "", filters = {}) {
  if (!candidate) {
    return { score: 50, isProfileStrength: true, details: [], reasons: [] };
  }
  const hasSkills = candidate["Skills"] ? true : false;
  const hasResume = !!(
    (candidate["resume_url"] || "").trim() ||
    (candidate["Resume URL"] || "").trim() ||
    (candidate["Resume"] || "").trim()
  );
  const hasLinkedIn = !!((candidate["LinkedIn"] || "").trim() || (candidate["linkedin"] || "").trim());
  const hasEmail = !!(candidate["Email"] || "").trim();
  const hasPhone = !!(candidate["Contact No"] || "").trim();
  const hasLocation = !!(candidate["Current Location"] || "").trim();
  const hasVisa = !!(candidate["VISA"] || "").trim();

  // Check if we have active search queries or filters
  const hasActiveSkillsFilter = filters && filters.skills && filters.skills.length > 0;
  const hasActiveVisaFilter = !!filters.visa;
  const hasActiveLocationFilter = !!filters.location;

  let hasActiveQuery = false;
  let parsedQuery = { skills: [], visa: "", location: "" };
  if (query && query.trim()) {
    hasActiveQuery = true;
    parsedQuery = parseNaturalQuery(query);
  }

  const hasAnyActiveCriteria =
    hasActiveSkillsFilter ||
    hasActiveVisaFilter ||
    hasActiveLocationFilter ||
    (hasActiveQuery && (parsedQuery.skills.length > 0 || parsedQuery.visa || parsedQuery.location));

  // Case A: Idle (No search query/filters active) -> Calculate Profile Strength
  if (!hasAnyActiveCriteria) {
    let strength = 30; // base score
    const details = [];
    if (hasResume) { strength += 20; details.push("Resume uploaded"); }
    if (hasLinkedIn) { strength += 15; details.push("LinkedIn linked"); }
    if (hasEmail) { strength += 15; details.push("Email provided"); }
    if (hasPhone) { strength += 10; details.push("Phone number provided"); }
    if (hasSkills) { strength += 10; details.push("Skills listed"); }
    return {
      score: strength,
      isProfileStrength: true,
      details,
      reasons: ["Complete contact details", "Ready for recruitment"]
    };
  }

  // Case B: Active matching (Search query or filters are applied)
  const candSkills = (candidate["Skills"] || "").toLowerCase();
  const candLocation = (candidate["Current Location"] || "").toLowerCase();
  const candVisa = (candidate["VISA"] || "").toLowerCase();

  // Combine query and filter requirements
  let reqSkills = [...(filters.skills || [])];
  if (parsedQuery.skills) {
    parsedQuery.skills.forEach(s => {
      if (!reqSkills.some(rs => rs.toLowerCase() === s.toLowerCase())) {
        reqSkills.push(s);
      }
    });
  }
  
  let reqVisa = filters.visa || parsedQuery.visa || "";
  let reqLocation = filters.location || parsedQuery.location || "";

  reqSkills = reqSkills.map(s => s.toLowerCase());

  let totalPoints = 0;
  let maxPoints = 0;
  const reasons = [];
  const gaps = [];

  // 1. Skill Match (Weight: 50 points)
  if (reqSkills.length > 0) {
    maxPoints += reqSkills.length * 20;
    reqSkills.forEach(reqSkill => {
      if (candSkills.includes(reqSkill)) {
        totalPoints += 20;
        reasons.push(`Matches skill: ${reqSkill.charAt(0).toUpperCase() + reqSkill.slice(1)}`);
      } else {
        gaps.push(reqSkill.charAt(0).toUpperCase() + reqSkill.slice(1));
      }
    });
  } else if (hasSkills) {
    maxPoints += 30;
    totalPoints += 30;
    reasons.push("Has relevant technical skills");
  }

  // 2. Visa Match (Weight: 25 points)
  if (reqVisa) {
    maxPoints += 30;
    const cleanReq = reqVisa.toLowerCase();
    if (candVisa.includes(cleanReq) || cleanReq.includes(candVisa)) {
      totalPoints += 30;
      reasons.push(`Matches Visa filter: ${reqVisa}`);
    } else if (candVisa && (candVisa.includes("usc") || candVisa.includes("us citizen") || candVisa.includes("green card") || candVisa.includes("permanent resident"))) {
      totalPoints += 25;
      reasons.push(`Permanent residency covers visa need (${candidate["VISA"]})`);
    } else {
      gaps.push(`Expected Visa: ${reqVisa}`);
    }
  } else if (hasVisa) {
    maxPoints += 20;
    totalPoints += 20;
    reasons.push(`Visa listed: ${candidate["VISA"]}`);
  }

  // 3. Location Match (Weight: 25 points)
  if (reqLocation) {
    maxPoints += 30;
    const cleanLoc = reqLocation.toLowerCase();
    if (candLocation.includes(cleanLoc) || cleanLoc.includes(candLocation)) {
      totalPoints += 30;
      reasons.push(`Matches location: ${reqLocation}`);
    } else {
      gaps.push(`Location mismatch (requires relocation to ${reqLocation})`);
    }
  } else if (hasLocation) {
    maxPoints += 20;
    totalPoints += 20;
    reasons.push(`Located in ${candidate["Current Location"]}`);
  }

  let pct = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 80;
  if (pct > 99) pct = 99;
  if (pct < 35) pct = 35;

  return {
    score: pct,
    isProfileStrength: false,
    reasons,
    gaps,
  };
}

export default function CandidateCard({ candidate, selected, onClick, onFavoriteToggle, query = "", filters = {} }) {
  const [localFavorite, setLocalFavorite] = useState(false);

  const favorited = onFavoriteToggle ? !!candidate.favorite : localFavorite;

  const name      = candidate["Candidate Name"] || "Unknown";
  const title     = candidate["Title"] || "";
  const location  = candidate["Current Location"] || "";
  const visa      = candidate["VISA"] || "";
  const email     = candidate["Email"]?.trim() || "";
  const linkedin  = candidate["LinkedIn"]?.trim() || "";
  const resumeUrl = candidate["resume_url"]?.trim() || "";

  const matchResult = calculateMatchScore(candidate, query, filters);

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

          {/* Meta row: visa only */}
          {visa && (
            <div style={{ display: "flex", gap: 10, marginTop: 5, flexWrap: "wrap" }}>
              <span
                className="text-muted"
                style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}
              >
                🛂 {visa}
              </span>
            </div>
          )}
        </div>

        {/* Status badges (top-right) - AI Match Score badge */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: "var(--radius-full)",
              fontSize: "11px",
              fontWeight: 700,
              background: matchResult.isProfileStrength ? "#F0FDF4" : "#F5F3FF",
              color: matchResult.isProfileStrength ? "#16A34A" : "#7C3AED",
              border: matchResult.isProfileStrength ? "1px solid #BBF7D0" : "1px solid #D8B4FE",
              boxShadow: "var(--shadow-xs)",
              whiteSpace: "nowrap",
            }}
          >
            {matchResult.isProfileStrength ? (
              <>
                <Check size={10} strokeWidth={2.5} />
                <span>{matchResult.score}% Strength</span>
              </>
            ) : (
              <>
                <Sparkles size={10} style={{ fill: "#7C3AED" }} />
                <span>{matchResult.score}% Match</span>
              </>
            )}
          </div>
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
