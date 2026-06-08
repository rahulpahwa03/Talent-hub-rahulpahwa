import { useState, useEffect } from "react";
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
  Sparkles,
  ExternalLink,
  Download,
  AlertCircle,
  Loader2,
  Home,
  Save,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";

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

export default function ProfileReview() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(localStorage.getItem("candidate_email") || "");
  const [emailInput, setEmailInput] = useState("");
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Fetch candidate profile from Supabase
  const fetchProfile = async (targetEmail) => {
    if (!targetEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("Email", targetEmail.trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Map database columns to local profile state structure
        const skillsArray = data["Skills"]
          ? data["Skills"]
              .split(/[|,]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        const mappedProfile = {
          id: data.id || data.candidate_uuid,
          name: data["Candidate Name"] || "Unknown Candidate",
          email: data["Email"] || targetEmail,
          phone: data["Contact No"] || "",
          linkedin: data["LinkedIn"] || "",
          location: data["Current Location"] || "",
          visa: data["VISA"] || "Other",
          skills: skillsArray,
          experience: data["experience"] || data["Years of Experience"] || "",
          currentEmployer: data["current_employer"] || data["Employer"] || "",
          title: data["Title"] || "",
          summary: data["summary"] || data["resume_text"]?.slice(0, 300) || "",
          resume_url: data["resume_url"] || "",
          profile_status: data["profile_status"] || "Active",
          created_at: data["created_at"],
        };

        setProfile(mappedProfile);
        setForm({
          ...mappedProfile,
          skills: mappedProfile.skills.join(", "),
        });
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("[ProfileReview] Fetch error:", err);
      toast.error("Error loading profile details.");
    } finally {
      setLoading(false);
    }
  };

  // Run on mount or when email changes
  useEffect(() => {
    fetchProfile(email);
  }, [email]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setSaving(true);
    try {
      const cleanSkills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const dbUpdates = {
        "Candidate Name": form.name.trim(),
        "Email": form.email.trim(),
        "Contact No": form.phone.trim(),
        "LinkedIn": form.linkedin.trim(),
        "Current Location": form.location.trim(),
        "VISA": form.visa,
        "Title": form.title.trim(),
        "Skills": cleanSkills.join(", "),
        "summary": form.summary.trim(),
        "experience": form.experience.trim(),
        "last_updated": new Date().toISOString(),
      };

      const { error } = await supabase
        .from("candidates")
        .update(dbUpdates)
        .or(`id.eq.${profile.id},candidate_uuid.eq.${profile.id},Email.eq.${profile.email}`);

      if (error) throw error;

      const updatedProfile = {
        ...profile,
        ...form,
        skills: cleanSkills,
      };

      setProfile(updatedProfile);
      setIsEditing(false);

      // If email changed, update local cache
      if (form.email.trim() !== email) {
        localStorage.setItem("candidate_email", form.email.trim());
        setEmail(form.email.trim());
      }

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("[ProfileReview] Save error:", err);
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      ...profile,
      skills: profile.skills.join(", "),
    });
    setIsEditing(false);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["pdf", "doc", "docx"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error("Invalid file type. Please upload a PDF, DOC, or DOCX document.");
      return;
    }

    setUploadingResume(true);
    const toastId = toast.loading("Uploading resume...");

    try {
      const slug = (profile.name || "candidate")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const ts = Date.now();
      const fileName = `${slug}_${ts}.${ext}`;
      const path = `uploads/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("resumes")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(path);
      
      const newUrl = urlData?.publicUrl || "";

      const { error: dbErr } = await supabase
        .from("candidates")
        .update({
          "resume_url": newUrl,
          "resume_file_name": file.name,
          "last_updated": new Date().toISOString(),
        })
        .or(`id.eq.${profile.id},candidate_uuid.eq.${profile.id},Email.eq.${profile.email}`);

      if (dbErr) throw dbErr;

      toast.success("Resume updated successfully!", { id: toastId });
      
      setProfile(prev => ({
        ...prev,
        resume_url: newUrl,
      }));
    } catch (err) {
      console.error("[ProfileReview] Upload error:", err);
      toast.error(err.message || "Failed to upload resume.", { id: toastId });
    } finally {
      setUploadingResume(false);
    }
  };

  const handleLoadSubmittedEmail = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    localStorage.setItem("candidate_email", emailInput.trim());
    setEmail(emailInput.trim());
  };

  const handleClearEmail = () => {
    localStorage.removeItem("candidate_email");
    localStorage.removeItem("candidate_name");
    setEmail("");
    setProfile(null);
  };

  /* Avatar styling details */
  const avatarColors = ["#4F46E5", "#0F766E", "#7C3AED", "#B45309", "#0369A1"];
  const safeName = profile?.name || "?";
  const initials = safeName
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  const colorIdx = (safeName.charCodeAt(0) || 0) % avatarColors.length;

  const MOCK_ACTIVITIES = [
    { text: "Profile visible to verified recruiters on EzHire", time: "Just now" },
    { text: "Profile match checking completed", time: "1 hour ago" },
    { text: "Resume parsed successfully by AI parser", time: "2 hours ago" },
  ];

  // ── Loading state ──
  if (loading) {
    return (
      <div className="page-center" style={{ minHeight: "100vh", background: "var(--bg-soft)" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <Loader2 size={36} className="text-secondary" style={{ animation: "spin 1.2s linear infinite" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Fetching your profile...</p>
        </div>
      </div>
    );
  }

  // ── No email stored or candidate not found in database ──
  if (!email || !profile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-soft)",
          padding: "60px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ width: "100%", maxWidth: 440, padding: 32, textAlign: "center" }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--bg-soft)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <User size={24} style={{ color: "var(--text-muted)" }} />
          </div>

          <h2 style={{ marginBottom: 8 }}>Access Your Profile</h2>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
            {!email
              ? "Enter the email you used to submit your resume, or upload a new one to get started."
              : `We couldn't find a live profile associated with "${email}". Please double-check your email or upload again.`}
          </p>

          <form onSubmit={handleLoadSubmittedEmail} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="input-group" style={{ textAlign: "left" }}>
              <label className="input-label">Email address</label>
              <input
                type="email"
                className="input"
                required
                placeholder="jane@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" style={{ height: 38 }}>
              Load Profile
            </button>
          </form>

          <div className="divider" style={{ margin: "24px 0" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn btn-secondary btn-full" onClick={() => navigate("/candidate/upload")}>
              <UploadCloud size={15} /> Upload Resume &amp; Create Profile
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => navigate("/")}>
              <Home size={14} /> Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Dynamic Profile UI ──
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-soft)",
        padding: "32px 20px 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Top Bar / Brand */}
      <div
        style={{
          width: "100%",
          maxWidth: 1000,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
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
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>EzHire</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>by Bharat Digitals</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleClearEmail}>
            Switch Account
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/")}>
            <Home size={14} /> Home
          </button>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 1000,
          display: "grid",
          gridTemplateColumns: "1.9fr 1.1fr",
          gap: 24,
        }}
        className="grid-md-2"
      >
        {/* Left Column (Details and Resume) */}
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
                justifyContent: "space-between",
                alignItems: "start",
                gap: 20,
                flexWrap: "wrap",
              }}
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
                    {profile.title || "Job Seeker"} {profile.currentEmployer ? `at ${profile.currentEmployer}` : ""}
                  </p>
                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    {profile.location && (
                      <span className="flex items-center gap-1" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                        <MapPin size={13} />
                        {profile.location}
                      </span>
                    )}
                    {profile.visa && (
                      <span className="flex items-center gap-1" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                        <Shield size={13} />
                        Visa: {profile.visa}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!isEditing && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                    <Edit3 size={14} /> Edit Profile
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate("/candidate/upload")}>
                    <UploadCloud size={14} /> Update Resume
                  </button>
                </div>
              )}
            </div>

            <div className="divider" style={{ margin: "24px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                Professional Summary
              </p>
              {isEditing ? (
                <textarea
                  rows={4}
                  className="input"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  style={{ width: "100%", resize: "vertical", marginTop: 4 }}
                />
              ) : (
                <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  {profile.summary || "No professional summary provided."}
                </p>
              )}
            </div>
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
                <h3 style={{ fontSize: 16, margin: "0 0 8px", fontWeight: 600 }}>Edit Profile Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                    <select
                      className="input"
                      value={form.visa}
                      onChange={(e) => setForm({ ...form, visa: e.target.value })}
                    >
                      {["US Citizen", "Green Card", "H1B", "H4 EAD", "OPT/CPT", "TN Visa", "L1", "Other"].map(
                        (v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                    <label className="input-label">Years of Experience</label>
                    <input
                      type="text"
                      className="input"
                      value={form.experience}
                      onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Skills (comma-separated)</label>
                  <input
                    type="text"
                    className="input"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
                  <button className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: 16, margin: "0 0 16px", fontWeight: 600 }}>Profile Information</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500 }}>{profile.phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link size={16} className="text-secondary" />
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>LinkedIn</p>
                      {profile.linkedin ? (
                        <a
                          href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://${profile.linkedin}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: "var(--accent)" }}
                        >
                          {profile.linkedin}
                        </a>
                      ) : (
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500 }}>—</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-secondary" />
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Experience</p>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500 }}>{profile.experience || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="divider" style={{ margin: "24px 0" }} />

                <h4 style={{ fontSize: 14, margin: "0 0 12px", fontWeight: 600 }}>Skills &amp; Technologies</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profile.skills.map((skill) => (
                    <span key={skill} className="tag">
                      {skill}
                    </span>
                  ))}
                  {profile.skills.length === 0 && (
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>No skills listed.</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Resume Inline Previewer Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
            style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 15, margin: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <Eye size={16} style={{ color: "var(--accent)" }} /> Resume Preview
              </h3>
              {profile.resume_url && (
                <div style={{ display: "flex", gap: 8 }}>
                  <label
                    className={`btn btn-secondary btn-sm ${uploadingResume ? "disabled" : ""}`}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 5, margin: 0 }}
                  >
                    {uploadingResume ? (
                      <Loader2 size={12} className="spin-animate" style={{ animation: "spin 0.8s linear infinite" }} />
                    ) : (
                      <UploadCloud size={12} />
                    )}
                    Update Resume
                    <input
                      type="file"
                      onChange={handleResumeUpload}
                      disabled={uploadingResume}
                      style={{ display: "none" }}
                      accept=".pdf,.doc,.docx"
                    />
                  </label>
                  <a
                    href={profile.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: "none" }}
                  >
                    <ExternalLink size={12} /> Open File
                  </a>
                  <a
                    href={profile.resume_url}
                    download
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: "none" }}
                  >
                    <Download size={12} /> Download
                  </a>
                </div>
              )}
            </div>

            {profile.resume_url ? (
              <div
                style={{
                  height: 700,
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  background: "#F8FAFC",
                }}
              >
                <iframe
                  src={getEmbeddableResumeUrl(profile.resume_url)}
                  width="100%"
                  height="100%"
                  style={{ border: "none" }}
                  title="Resume Document Preview"
                  allow="autoplay"
                />
              </div>
            ) : (
              <div
                className="dropzone"
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  border: "2px dashed var(--border)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-soft)",
                }}
              >
                <UploadCloud size={32} style={{ color: "var(--text-muted)", marginBottom: 12, margin: "0 auto" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 4px" }}>
                  No resume on file
                </p>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 16px" }}>
                  Upload your resume to complete your profile and let recruiters discover you.
                </p>
                <label
                  className={`btn btn-primary ${uploadingResume ? "disabled" : ""}`}
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  {uploadingResume ? (
                    <Loader2 size={13} className="spin-animate" style={{ animation: "spin 0.8s linear infinite" }} />
                  ) : (
                    <UploadCloud size={13} />
                  )}
                  Upload Resume Document
                  <input
                    type="file"
                    onChange={handleResumeUpload}
                    disabled={uploadingResume}
                    style={{ display: "none" }}
                    accept=".pdf,.doc,.docx"
                  />
                </label>
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
            <h4 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 14, fontWeight: 600 }}>
              <CheckCircle2 size={16} color="var(--success)" />
              Profile Status
            </h4>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 8, marginBottom: 16, lineHeight: 1.6 }}>
              Your profile is visible to recruiters looking for {profile.title || "technology"} talent.
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
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>by recruiters this week</p>
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
            <h4 style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>
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
                    <p style={{ margin: "0 0 2px", fontSize: 12.5, color: "var(--text-primary)" }}>{act.text}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{act.time}</p>
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
