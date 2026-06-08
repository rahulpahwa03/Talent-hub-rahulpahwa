import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowRight, Sparkles } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.34, 1.1, 0.64, 1] },
  },
};

const formVariants = {
  enter: { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0, 0, 0.2, 1] } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

function InputField({ icon: Icon, id, label, type = 'text', placeholder, value, onChange, autoComplete }) {
  return (
    <div className="input-group">
      <label className="input-label" htmlFor={id}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon
          size={15}
          color="var(--text-muted)"
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
        <input
          id={id}
          type={type}
          className="input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          style={{ paddingLeft: 36 }}
        />
      </div>
    </div>
  );
}

export default function CandidateLogin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signup');

  // Sign Up state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');

  // Sign In state
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  const handleSignUp = (e) => {
    e.preventDefault();
    navigate('/candidate/upload');
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    navigate('/candidate/profile');
  };

  return (
    <div
      className="page-center"
      style={{ background: 'var(--bg-soft)', padding: '24px 16px', minHeight: '100vh' }}
    >
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        style={{ width: '100%', maxWidth: 420 }}
      >
        {/* Logo block */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 18 }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: '#111827',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'white',
                  letterSpacing: '-0.04em',
                }}
              >
                E
              </span>
            </div>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
              }}
            >
              EzHire
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h1 style={{ fontSize: 24, marginBottom: 6 }}>Join EzHire</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Sparkles size={13} color="var(--accent)" />
              Get discovered by top recruiters
            </p>
          </motion.div>
        </div>

        {/* Card */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Tabs */}
          <div className="tab-list" style={{ padding: '0 24px' }}>
            <button
              className={`tab-trigger${activeTab === 'signup' ? ' active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
            <button
              className={`tab-trigger${activeTab === 'signin' ? ' active' : ''}`}
              onClick={() => setActiveTab('signin')}
            >
              Sign In
            </button>
          </div>

          {/* Form area */}
          <div style={{ padding: '28px 28px 32px', minHeight: 300, position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === 'signup' ? (
                <motion.form
                  key="signup"
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  onSubmit={handleSignUp}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <InputField
                    icon={User}
                    id="signup-name"
                    label="Full Name"
                    placeholder="Jane Doe"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    autoComplete="name"
                  />
                  <InputField
                    icon={Mail}
                    id="signup-email"
                    label="Email address"
                    type="email"
                    placeholder="jane@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <InputField
                    icon={Phone}
                    id="signup-phone"
                    label="Phone number"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    autoComplete="tel"
                  />

                  <p className="input-hint" style={{ marginTop: -4 }}>
                    By continuing, you agree to our{' '}
                    <a href="#" style={{ color: 'var(--accent)' }}>Terms of Service</a> and{' '}
                    <a href="#" style={{ color: 'var(--accent)' }}>Privacy Policy</a>.
                  </p>

                  <motion.button
                    type="submit"
                    className="btn btn-primary btn-lg btn-full"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    style={{ marginTop: 4 }}
                  >
                    Continue
                    <ArrowRight size={15} />
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="signin"
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  onSubmit={handleSignIn}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <InputField
                    icon={Mail}
                    id="signin-email"
                    label="Email address"
                    type="email"
                    placeholder="jane@example.com"
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <InputField
                    icon={Lock}
                    id="signin-password"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    autoComplete="current-password"
                  />

                  <div style={{ textAlign: 'right', marginTop: -6 }}>
                    <a href="#" style={{ fontSize: 12.5, color: 'var(--accent)' }}>
                      Forgot password?
                    </a>
                  </div>

                  <motion.button
                    type="submit"
                    className="btn btn-primary btn-lg btn-full"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    Sign In
                    <ArrowRight size={15} />
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom recruiter link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 13.5,
            color: 'var(--text-secondary)',
          }}
        >
          Are you a recruiter?{' '}
          <a
            href="/login/recruiter"
            style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}
            onClick={(e) => { e.preventDefault(); navigate('/login/recruiter'); }}
          >
            Sign in →
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
