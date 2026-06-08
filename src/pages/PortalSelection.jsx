import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, User, ArrowRight, Zap, Shield, Users } from "lucide-react";

const FEATURES = [
  { icon: <Zap size={14} />, label: "AI-Powered Search" },
  { icon: <Shield size={14} />, label: "Enterprise Security" },
  { icon: <Users size={14} />, label: "Collaborative Hiring" },
];

export default function PortalSelection() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-soft)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top bar */}
      <header style={{
        padding: "20px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: "var(--primary)",
            borderRadius: "var(--radius-md)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 15,
          }}>E</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", lineHeight: 1 }}>EzHire</div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1, marginTop: 2 }}>by Bharat Digitals</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {FEATURES.map(f => (
            <div key={f.label} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: "var(--radius-full)",
              background: "var(--bg-muted)", fontSize: 12,
              color: "var(--text-secondary)", border: "1px solid var(--border)",
            }}>
              {f.icon} {f.label}
            </div>
          ))}
        </div>
      </header>

      {/* Main */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 40px",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          style={{ textAlign: "center", marginBottom: 52 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: "var(--radius-full)",
            background: "var(--bg)", border: "1px solid var(--border)",
            fontSize: 12, color: "var(--text-secondary)",
            fontWeight: 500, marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
            Platform Online — All Systems Operational
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 14 }}>
            How would you like<br />to continue?
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
            EzHire is the modern operating system for recruitment teams and job seekers alike.
          </p>
        </motion.div>

        {/* Portal Cards */}
        <div style={{ display: "flex", gap: 20, alignItems: "stretch", maxWidth: 780, width: "100%" }}>
          <PortalCard
            delay={0.1}
            icon={<Briefcase size={26} />}
            iconBg="var(--primary)"
            title="Recruiter Portal"
            subtitle="For hiring teams, talent acquisition, and staffing agencies"
            features={["AI-powered candidate search", "Collaborative recruiting tools", "Resume management & parsing", "Analytics & insights"]}
            cta="Enter as Recruiter"
            onClick={() => navigate("/login/recruiter")}
          />
          <PortalCard
            delay={0.18}
            icon={<User size={26} />}
            iconBg="var(--accent)"
            title="Candidate Portal"
            subtitle="Upload your resume and get discovered by top recruiters"
            features={["30-second profile creation", "AI-powered resume parsing", "Automatic skill extraction", "Get matched to opportunities"]}
            cta="Submit Your Profile"
            onClick={() => navigate("/login/candidate")}
          />
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: "20px 40px",
        textAlign: "center",
        borderTop: "1px solid var(--border)",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          © 2025 Bharat Digitals. All rights reserved.
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          EzHire v1.0 · Powered by Supabase · Built with ♥ in India
        </div>
      </footer>
    </div>
  );
}

function PortalCard({ icon, iconBg, title, subtitle, features, cta, onClick, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0, 0, 0.2, 1] }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
      onClick={onClick}
      style={{
        flex: 1,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "32px",
        cursor: "pointer",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Icon */}
      <div style={{
        width: 52, height: 52,
        borderRadius: "var(--radius-lg)",
        background: iconBg,
        color: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        {icon}
      </div>

      <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.01em" }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>{subtitle}</p>

      {/* Feature list */}
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, flex: 1 }}>
        {features.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--bg-muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-muted)", display: "block" }} />
            </span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        className="btn btn-primary btn-full"
        style={{ justifyContent: "space-between", padding: "11px 16px", fontSize: 14 }}
      >
        {cta}
        <ArrowRight size={16} />
      </button>
    </motion.div>
  );
}
