import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Sparkles,
  Brain,
  TrendingUp,
  UserCheck,
  FileText,
  ArrowRight,
  ShieldCheck,
  Users,
  Briefcase,
  Layers,
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  "Snowflake AND Texas AND H1B",
  '"Senior Java Developer" AND USC',
  "Python NOT Junior AND Dallas",
  "React AND AWS AND Green Card",
];

const STATS = [
  { label: 'Total Candidates', value: '48,291', icon: Users, color: '#3B82F6' },
  { label: 'Resumes Parsed', value: '41,203', icon: FileText, color: '#8B5CF6' },
  { label: 'Active Recruiters', value: '12', icon: UserCheck, color: '#10B981' },
];

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/recruiter/candidates?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const handleChipClick = (q) => {
    navigate(`/recruiter/candidates?q=${encodeURIComponent(q)}`);
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'var(--bg-soft)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px 80px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 28 }}>
        
        {/* Header Console */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 8px 20px rgba(124, 58, 237, 0.2)',
              marginBottom: 8,
            }}
          >
            <Brain size={20} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: 0,
              background: 'linear-gradient(135deg, #111827, #374151)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            EzHire Talent Search
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: 14.5, color: 'var(--text-secondary)', margin: 0 }}
          >
            Search candidate profiles, resume texts, and work eligibility instantly.
          </motion.p>
        </div>

        {/* Big Search Console */}
        <motion.form
          onSubmit={handleSearchSubmit}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 100 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFFFFF',
            border: '1.5px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,0.04), var(--shadow-sm)',
            height: 54,
            overflow: 'hidden',
            padding: '0 6px 0 16px',
            transition: 'all 0.2s',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = '#7C3AED';
            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.1), 0 10px 30px rgba(0,0,0,0.04)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.04), var(--shadow-sm)';
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginRight: 12 }} />
          <input
            type="text"
            placeholder="Type search — e.g. Snowflake AND Texas AND H1B, or Java NOT Junior..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              background: 'transparent',
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              borderRadius: 12,
              height: 42,
              padding: '0 20px',
              fontSize: 13.5,
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              border: 'none',
            }}
          >
            Search DB
          </button>
        </motion.form>

        {/* Suggestion Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: -8,
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Try:</span>
          {SUGGESTED_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => handleChipClick(q)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#7C3AED';
                e.currentTarget.style.color = '#7C3AED';
                e.currentTarget.style.background = '#F5F3FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              }}
            >
              {q}
            </button>
          ))}
        </motion.div>

        {/* Ezra Recruiter Empathy Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'linear-gradient(135deg, #FFFFFF, #FBFBFE)',
            border: '1px solid rgba(124, 58, 237, 0.15)',
            borderRadius: 20,
            padding: 28,
            boxShadow: '0 10px 35px rgba(124, 58, 237, 0.03), var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle purple background glow */}
          <div
            style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: '#F5F3FF',
                border: '1.5px solid #7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7C3AED',
                flexShrink: 0,
                boxShadow: '0 0 10px rgba(124, 58, 237, 0.1)',
                position: 'relative',
              }}
            >
              <Sparkles size={18} style={{ fill: '#7C3AED' }} />
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '2px solid #FFF',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Ezra
                <span style={{ fontSize: 9.5, color: '#7C3AED', background: '#F5F3FF', fontWeight: 600, padding: '1px 5px', borderRadius: 4 }}>
                  US STAFFING COPILOT
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                Active &amp; connected to resumes bucket
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p
              style={{
                fontSize: 13.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                margin: 0,
                fontStyle: 'italic',
                borderLeft: '3px solid #7C3AED',
                paddingLeft: 12,
              }}
            >
              "Hey recruiter! I get it. The staffing grind is real—spending hours cross-referencing OPT/H1B dates, filtering candidates who ghost, verifying actual local addresses, and crafting outreach messages that get lost in inboxes... it's exhausting. 
              <br /><br />
              I'm here to handle the noise. I've analyzed all candidate records in our database and indexed their resumes. Type what you need above—like 'Java local in Dallas' or 'Snowflake on H1B'—or check out the direct searches below. Let's make some submittals today!"
            </p>
          </div>

          {/* Quick Staffing Shortcuts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Direct Recruiter Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { text: "Local Texas Candidates", query: "Texas" },
                { text: "Snowflake Engineers on H1B", query: "Snowflake AND visa:H1B" },
                { text: "US Citizens & Green Cards", query: "visa:US Citizen OR visa:Green Card" },
                { text: "Python/AWS Developers", query: "Python AND AWS" }
              ].map((act, i) => (
                <button
                  key={i}
                  onClick={() => handleChipClick(act.query)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(229, 231, 235, 0.7)',
                    background: '#FFF',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#7C3AED';
                    e.currentTarget.style.color = '#7C3AED';
                    e.currentTarget.style.background = '#FBFBFE';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.7)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = '#FFF';
                  }}
                >
                  {act.text}
                  <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Mini Stats Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '16px 24px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          {STATS.map((stat, i) => {
            const IconComp = stat.icon;
            return (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  borderRight: i < STATS.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  paddingRight: i < STATS.length - 1 ? 32 : 0,
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${stat.color}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.color,
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

      </div>
    </div>
  );
}
