import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Check, ArrowRight } from 'lucide-react';

const features = [
  'AI-powered candidate matching and ranking',
  'Real-time pipeline analytics and reporting',
  'Collaborative hiring workflows for your team',
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0, 0, 0.2, 1] },
  }),
};

const slideLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0, 0, 0.2, 1] },
  },
};

export default function RecruiterLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = (e) => {
    e.preventDefault();
    navigate('/recruiter/dashboard');
  };

  const handleGuest = () => {
    navigate('/recruiter/dashboard');
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Left Brand Panel ── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={slideLeft}
        style={{
          flex: '0 0 50%',
          background: '#111827',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -80,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: -100,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: 'white',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.04em' }}>
                E
              </span>
            </div>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.03em',
              }}
            >
              EzHire
            </span>
          </div>
        </motion.div>

        {/* Center content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
            <h1
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              The modern operating system for{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #60A5FA, #818CF8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                recruitment
              </span>
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: 15, lineHeight: 1.7 }}>
              Streamline hiring, reduce time-to-offer, and build world-class teams — all from one unified platform.
            </p>
          </motion.div>

          {/* Feature bullets */}
          <motion.ul
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {features.map((feat, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(37,99,235,0.25)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <Check size={11} color="#60A5FA" strokeWidth={3} />
                </div>
                <span style={{ color: '#D1D5DB', fontSize: 14, lineHeight: 1.6 }}>{feat}</span>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Testimonial */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 28,
          }}
        >
          <p
            style={{
              color: '#E5E7EB',
              fontSize: 14,
              lineHeight: 1.75,
              fontStyle: 'italic',
              marginBottom: 14,
            }}
          >
            "EzHire cut our average time-to-hire from 6 weeks to 12 days. The pipeline visibility alone is worth every penny."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600,
                color: 'white',
              }}
            >
              S
            </div>
            <div>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>
                Sarah Langton
              </p>
              <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>
                Head of Talent, Nexora Health
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Right Auth Panel ── */}
      <div
        style={{
          flex: '0 0 50%',
          background: 'var(--bg-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: [0, 0, 0.2, 1] }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Card */}
          <div className="card" style={{ padding: '36px 36px 32px' }}>
            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ marginBottom: 6 }}>Welcome back</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Sign in to EzHire Recruiter Portal
              </p>
            </div>

            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Email */}
              <div className="input-group">
                <label className="input-label" htmlFor="email">
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={15}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    id="email"
                    type="email"
                    className="input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: 36 }}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="input-group">
                <label className="input-label" htmlFor="password">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={15}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: 36, paddingRight: 40 }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: 11,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 2,
                      color: 'var(--text-muted)',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <a href="#" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>

              {/* Sign In button */}
              <motion.button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                style={{ marginTop: 4 }}
              >
                Sign in to EzHire
                <ArrowRight size={15} />
              </motion.button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '22px 0',
              }}
            >
              <div className="divider" style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>or</span>
              <div className="divider" style={{ flex: 1 }} />
            </div>

            {/* Guest button */}
            <motion.button
              type="button"
              onClick={handleGuest}
              className="btn btn-secondary btn-lg btn-full"
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
            >
              Continue as Guest
            </motion.button>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
