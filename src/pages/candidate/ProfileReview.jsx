import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Link,
  MapPin,
  Shield,
  Edit3,
  UploadCloud,
  CheckCircle2,
  Clock,
  Eye,
  Briefcase,
  Building2,
  Calendar,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

const MOCK_PROFILE = {
  name: "John Smith",
  email: "john.smith@email.com",
  phone: "+1 (555) 234-5678",
  linkedin: "linkedin.com/in/johnsmith",
  location: "Dallas, TX",
  visa: "H1B",
  skills: ["Snowflake", "Python", "AWS", "dbt", "SQL", "Apache Spark", "Azure", "Databricks"],
  experience: "6 years",
  currentEmployer: "Accenture",
  title: "Senior Data Engineer",
  summary:
    "Senior Data Engineer with 6+ years building large-scale data pipelines using Snowflake, dbt and AWS. Strong background in financial services.",
};

const MOCK_ACTIVITIES = [
  { text: "Profile viewed by Talent Acquisition at Stripe", time: "2 hours ago" },
  { text: "Profile matches 3 new Senior Data Engineer positions", time: "5 hours ago" },
  { text: "Resume updated and parsed successfully", time: "1 day ago" },
  { text: "Profile visible to verified recruiters on EzHire", time: "2 days ago" },
];

export default function ProfileReview() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ ...MOCK_PROFILE, skills: MOCK_PROFILE.skills.join(", ") });

  /* Avatar color */
  const avatarColors = ["#4F46E5", "#0F766E", "#7C3AED", "#B45309", "#0369A1"];
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colorIdx = profile.name.charCodeAt(0) % avatarColors.length;

  const handleSave = () => {
    const parsedSkills = form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setProfile({
      ...form,
      skills: parsedSkills,
    });
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleCancel = () => {
    setForm({ ...profile, skills: profile.skills.join(", ") });
    setIsEditing(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-soft)",
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Top Bar / Brand */}
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          display: "flex",
          justifyContent: "between",
          alignItems: "center",
          marginBottom: 32,
        }}
        className="flex items-center justify-between"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFF",
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            E
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
              EzHire
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>
              by Bharat Digitals
            </span>
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate("/")}
        >
          Portal Selection
        </button>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 960,
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 24,
        }}
        className="grid-md-3-1"
      >
        {/* Main Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ padding: 32 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "between",
                alignItems: "start",
                gap: 20,
                flexWrap: "wrap",
              }}
              className="flex items-start justify-between"
            >
              <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                <div
                  className="avatar avatar-xl"
                  style={{
                    background: avatarColors[colorIdx],
                    fontSize: 24,
                    width: 64,
                    height: 64,
                  }}
                >
                  {initials}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h2 style={{ margin: 0, fontSize: 22 }}>{profile.name}</h2>
                    <span className="badge badge-green">
                      <span className="dot dot-green" />
                      Active
                    </span>
                  </div>
                  <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
                    {profile.title} at {profile.currentEmployer}
                  </p>
                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    <span className="flex items-center gap-1" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                      <MapPin size={13} />
                      {profile.location}
                    </span>
                    <span className="flex items-center gap-1" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                      <Shield size={13} />
                      Visa: {profile.visa}
                    </span>
                  </div>
                </div>
              </div>

              {!isEditing && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 size={14} />
                    Edit Profile
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate("/candidate/upload")}
                  >
                    <UploadCloud size={14} />
                    Update Resume
                  </button>
                </div>
              )}
            </div>

            <div className="divider" style={{ margin: "24px 0" }} />

            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
              Professional Summary
            </p>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              {profile.summary}
            </p>
          </motion.div>

          {/* Details / Edit Form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
            style={{ padding: 32 }}
          >
            {isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h3 style={{ marginBottom: 8 }}>Edit Profile Details</h3>
                <div className="grid-2" style={{ gap: 16 }}>
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input
                      type="text"
                      className="input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Phone</label>
                    <input
                      type="text"
                      className="input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">LinkedIn URL</label>
                    <input
                      type="text"
                      className="input"
                      value={form.linkedin}
                      onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Location</label>
                    <input
                      type="text"
                      className="input"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Visa Status</label>
                    <input
                      type="text"
                      className="input"
                      value={form.visa}
                      onChange={(e) => setForm({ ...form, visa: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Current Title</label>
                    <input
                      type="text"
                      className="input"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Current Employer</label>
                    <input
                      type="text"
                      className="input"
                      value={form.currentEmployer}
                      onChange={(e) => setForm({ ...form, currentEmployer: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Years of Experience</label>
                    <input
                      type="text"
                      className="input"
                      value={form.experience}
                      onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: 8 }}>
                  <label className="input-label">Skills (comma-separated)</label>
                  <input
                    type="text"
                    className="input"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Summary</label>
                  <textarea
                    rows={4}
                    className="input"
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
                  <button className="btn btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSave}>
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ marginBottom: 16 }}>Profile Information</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-secondary" />
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Email</p>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500 }}>{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-secondary" />
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Phone</p>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500 }}>{profile.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link size={16} className="text-secondary" />
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>LinkedIn</p>
                      <a
                        href={`https://${profile.linkedin}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: "var(--accent)" }}
                      >
                        {profile.linkedin}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-secondary" />
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Experience</p>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500 }}>{profile.experience}</p>
                    </div>
                  </div>
                </div>

                <div className="divider" style={{ margin: "24px 0" }} />

                <h4 style={{ marginBottom: 12 }}>Skills &amp; Technologies</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profile.skills.map((skill) => (
                    <span key={skill} className="tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar Status Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Status Box */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
            style={{ padding: 24, background: "var(--bg)" }}
          >
            <h4 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <CheckCircle2 size={16} color="var(--success)" />
              Profile Status
            </h4>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 8, marginBottom: 16 }}>
              Your profile is visible to recruiters looking for {profile.title} talent.
            </p>
            <div
              style={{
                background: "var(--bg-soft)",
                borderRadius: 8,
                padding: 12,
                border: "1px solid var(--border-soft)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Eye size={16} className="text-secondary" />
              <div>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600 }}>12 views</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>
                  by recruiters this week
                </p>
              </div>
            </div>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
            style={{ padding: 24 }}
          >
            <h4 style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px" }}>
              <Clock size={16} className="text-secondary" />
              Recent Updates
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
              {MOCK_ACTIVITIES.map((act, i) => (
                <div key={act.text} style={{ display: "flex", gap: 12, position: "relative" }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: i === 0 ? "var(--accent)" : "var(--border)",
                      marginTop: 5,
                      flexShrink: 0,
                      zIndex: 2,
                    }}
                  />
                  {i < MOCK_ACTIVITIES.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 3.5,
                        top: 10,
                        bottom: -16,
                        width: 1,
                        background: "var(--border-soft)",
                      }}
                    />
                  )}
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 12.5, color: "var(--text-primary)" }}>
                      {act.text}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>
                      {act.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
