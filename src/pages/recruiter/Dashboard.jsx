import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Search,
  ArrowRight,
  Briefcase,
  Building,
  CheckCircle2,
  Cpu,
  Layers,
  Send,
  Terminal,
  UserCheck,
  RefreshCw,
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { applyBooleanSearch } from '../../components/ai/AISearchBar';
import { calculateMatchScore } from '../../components/candidates/CandidateCard';

// ─── Constants & Predefined Mappings ────────────────────────
const CLIENT_DATABASE = {
  "snowflake": {
    domain: "Cloud Data Warehousing & Cloud Data SaaS",
    competitors: ["Databricks", "AWS (Amazon)", "Google Cloud (GCP)", "Cloudera", "Confluent"],
    suggestedQuery: "Snowflake AND (dbt OR SQL) AND AWS",
  },
  "capital one": {
    domain: "FinTech, Consumer Banking & Cloud Financial Platforms",
    competitors: ["JPMorgan Chase", "Bank of America", "Citi", "Discover", "American Express"],
    suggestedQuery: "Java AND AWS AND Spring Boot",
  },
  "apple": {
    domain: "Consumer Electronics, Mobile OS & Edge AI Engineering",
    competitors: ["Google (Alphabet)", "Microsoft", "Meta (Facebook)", "Amazon", "Netflix"],
    suggestedQuery: "Swift OR iOS OR Objective-C",
  },
  "stripe": {
    domain: "Merchant Payment Infrastructure & Developer APIs",
    competitors: ["PayPal", "Adyen", "Block (Square)", "Braintree", "Klarna"],
    suggestedQuery: "(Ruby OR Go OR Python) AND API",
  },
  "databricks": {
    domain: "Unified Analytics, Delta Lake & Spark AI Platforms",
    competitors: ["Snowflake", "Cloudera", "AWS (Amazon)", "Google Cloud", "HPE"],
    suggestedQuery: "(Spark OR Scala OR Python) AND Databricks",
  }
};

const SKILLS_LIST = [
  'Snowflake','Python','AWS','Java','React','Kubernetes','Docker',
  'TypeScript','JavaScript','Node','NodeJS','Angular','Vue','Go','Golang',
  'Spark','Kafka','Airflow','dbt','Terraform','SQL','NoSQL',
  'PostgreSQL','MySQL','MongoDB','Redis','Azure','GCP',
  'Machine Learning','ML','Deep Learning','TensorFlow','PyTorch',
  'Data Engineering','Data Science','DevOps','Spring Boot'
];

function analyzeJobDescription(jdText, clientName = "") {
  const text = jdText.toLowerCase();
  
  // Extract matching tech terms
  const matchedSkills = SKILLS_LIST.filter(skill => {
    const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(text);
  });
  
  let domain = "Enterprise Software & Cloud Systems Engineering";
  let competitors = ["Amazon Web Services", "Microsoft", "Google Cloud", "Salesforce", "Oracle"];
  
  const clientLower = clientName.toLowerCase().trim();
  const matchedClientKey = Object.keys(CLIENT_DATABASE).find(key => clientLower.includes(key));
  
  if (matchedClientKey) {
    const data = CLIENT_DATABASE[matchedClientKey];
    domain = data.domain;
    competitors = data.competitors;
  } else {
    // Skills-based domain inference
    if (matchedSkills.includes("React") || matchedSkills.includes("JavaScript") || matchedSkills.includes("TypeScript")) {
      domain = "Modern Web Application Development & Frontend Engineering";
      competitors = ["Vercel", "Meta (React core)", "Netflix", "Airbnb", "Uber", "Stripe"];
    } else if (matchedSkills.includes("Snowflake") || matchedSkills.includes("dbt") || matchedSkills.includes("Spark") || matchedSkills.includes("Airflow")) {
      domain = "Modern Data Infrastructure & Analytics Warehousing";
      competitors = ["Databricks", "Snowflake Inc.", "Fivetran", "Confluent", "Cloudera", "AWS"];
    } else if (matchedSkills.includes("Kubernetes") || matchedSkills.includes("Docker") || matchedSkills.includes("Terraform") || matchedSkills.includes("DevOps")) {
      domain = "Site Reliability Engineering, DevOps & Container Cloud Scale";
      competitors = ["HashiCorp", "AWS", "Google Cloud Platform", "Azure", "Red Hat", "PagerDuty"];
    } else if (matchedSkills.includes("Machine Learning") || matchedSkills.includes("PyTorch") || matchedSkills.includes("TensorFlow")) {
      domain = "Artificial Intelligence & Large Scale ML Deployments";
      competitors = ["OpenAI", "Anthropic", "Google DeepMind", "Meta AI", "NVIDIA", "Hugging Face"];
    }
  }
  
  // Compile boolean search query
  let query = "";
  if (matchedSkills.length > 0) {
    const top3 = matchedSkills.slice(0, 3);
    query = top3.join(" AND ");
  } else {
    query = "Developer OR Engineer";
  }
  
  return {
    domain,
    competitors,
    skills: matchedSkills,
    query
  };
}

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  
  // Input states
  const [clientName, setClientName] = useState("");
  const [jdText, setJdText] = useState("");
  
  // Generation States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [report, setReport] = useState(null);

  // Load candidate base once
  useEffect(() => {
    supabase
      .from('candidates')
      .select('*')
      .then(({ data }) => {
        if (data) setCandidates(data);
      });
  }, []);

  const handleInitiateSourcing = async (e) => {
    e.preventDefault();
    if (!clientName.trim() && !jdText.trim()) {
      toast.error("Please enter a client name or paste a Job Description.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(1); // Step 1: Ingesting

    await new Promise(r => setTimeout(r, 600));
    setAnalysisStep(2); // Step 2: Mapping Competitors

    await new Promise(r => setTimeout(r, 700));
    setAnalysisStep(3); // Step 3: Database query mapping

    await new Promise(r => setTimeout(r, 500));
    
    // Analyze input
    const analysisResult = analyzeJobDescription(jdText, clientName);
    
    // Run boolean search local match
    const matches = applyBooleanSearch(analysisResult.query, candidates)
      .map(c => {
        const scoreRes = calculateMatchScore(c, analysisResult.query, {});
        return { ...c, matchScore: scoreRes.score };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    setReport({
      client: clientName.trim() || "Unspecified Client",
      domain: analysisResult.domain,
      competitors: analysisResult.competitors,
      skills: analysisResult.skills,
      query: analysisResult.query,
      matches,
    });
    
    setIsAnalyzing(false);
    setAnalysisStep(0);
  };

  const handleReset = () => {
    setReport(null);
    setClientName("");
    setJdText("");
  };

  const handleLaunchDatabase = (queryToRun) => {
    navigate(`/recruiter/candidates?q=${encodeURIComponent(queryToRun)}`);
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 56px)',
        background: '#0B0F19',
        color: '#F3F4F6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '50px 24px 80px',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Matrix Glows */}
      <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: -50, right: 50, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: 840, zIndex: 1, position: 'relative' }}>
        
        {/* Holographic Ezra Avatar Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40, gap: 12 }}>
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 20px rgba(124, 58, 237, 0.2), inset 0 0 15px rgba(124, 58, 237, 0.1)",
                "0 0 35px rgba(124, 58, 237, 0.45), inset 0 0 25px rgba(124, 58, 237, 0.2)",
                "0 0 20px rgba(124, 58, 237, 0.2), inset 0 0 15px rgba(124, 58, 237, 0.1)",
              ]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(79, 70, 229, 0.1) 100%)",
              border: "1.5px solid #8B5CF6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#A78BFA",
              backdropFilter: "blur(5px)",
            }}
          >
            <Brain size={28} style={{ animation: isAnalyzing ? "spin 3s linear infinite" : "none" }} />
          </motion.div>

          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Ezra Recruiting Core
              <span style={{ fontSize: 9.5, color: '#A78BFA', background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.3)', fontWeight: 600, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Holographic AI
              </span>
            </h2>
            <p style={{ fontSize: 13.5, color: '#9CA3AF', margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
              Ingesting talent pools, checking client competitors, and mapping work eligibilities for US staffing teams.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STATE 1: Ezra Input Console */}
          {!isAnalyzing && !report && (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {/* Sourcing Intake Panel */}
              <div
                style={{
                  background: 'rgba(17, 24, 39, 0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(124, 58, 237, 0.18)',
                  borderRadius: 20,
                  padding: 28,
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                }}
              >
                <form onSubmit={handleInitiateSourcing} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Option 1: Client Target */}
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ color: '#D1D5DB', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building size={14} style={{ color: '#A78BFA' }} /> Target Client Name
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Capital One, Snowflake, Apple..."
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(124, 58, 237, 0.25)',
                        color: '#FFF',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: 13.5,
                      }}
                    />
                    <span className="input-hint" style={{ color: '#6B7280' }}>
                      Helps Ezra analyze target domains and competitor pools.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(229, 231, 235, 0.08)' }} />
                    <span style={{ fontSize: 11, color: '#4B5563', fontWeight: 600 }}>OR PASTE JOB DETAILS</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(229, 231, 235, 0.08)' }} />
                  </div>

                  {/* Option 2: Job Description */}
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ color: '#D1D5DB', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Briefcase size={14} style={{ color: '#A78BFA' }} /> Job Description (JD) / Requirements
                    </label>
                    <textarea
                      rows={6}
                      className="input"
                      placeholder="Paste details of the role here (e.g., 'React developer with AWS experience and handling database scale')..."
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(124, 58, 237, 0.25)',
                        color: '#FFF',
                        borderRadius: 10,
                        padding: '12px 14px',
                        fontSize: 13.5,
                        resize: 'vertical',
                        minHeight: 120,
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  {/* Initiate Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      height: 48,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                      border: 'none',
                      fontSize: 14.5,
                      fontWeight: 600,
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      boxShadow: '0 8px 25px rgba(124, 58, 237, 0.25)',
                      marginTop: 6,
                    }}
                  >
                    <Sparkles size={16} />
                    Initiate Ezra Sourcing Core
                  </button>
                </form>
              </div>

              {/* Ezra Empathy/Staffing Grind Footer */}
              <div
                style={{
                  background: 'rgba(17, 24, 39, 0.35)',
                  border: '1.5px dashed rgba(124, 58, 237, 0.15)',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <Cpu size={18} style={{ color: '#A78BFA', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 13, margin: '0 0 4px', color: '#D1D5DB', fontWeight: 600 }}>
                    Staffing Intel Alert
                  </h4>
                  <p style={{ fontSize: 12.5, color: '#9CA3AF', lineHeight: 1.6, margin: 0 }}>
                    US Staffing is competitive. Running search strings manually, checking candidate visa validity, and guessing local proximity wastes submittal slots. Drop your requirements above. I will map client competitors to scrape talent from, construct a boolean string, and match profiles instantly.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 2: Sourcing Loading Steps */}
          {isAnalyzing && (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'rgba(17, 24, 39, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(124, 58, 237, 0.18)',
                borderRadius: 20,
                padding: 40,
                textAlign: 'center',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
              }}
            >
              {/* Spinner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7C3AED', animation: 'blink 1.4s infinite 0.2s' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7C3AED', animation: 'blink 1.4s infinite 0.4s' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7C3AED', animation: 'blink 1.4s infinite 0.6s' }} />
              </div>

              {/* Steps Log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360, textAlign: 'left' }}>
                {[
                  { id: 1, label: "Ingesting job criteria & client parameters..." },
                  { id: 2, label: "Mapping industry boundaries & sourcing competitors..." },
                  { id: 3, label: "Executing indexing query against candidate table..." }
                ].map((step) => {
                  const active = analysisStep === step.id;
                  const completed = analysisStep > step.id;
                  return (
                    <div
                      key={step.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        color: completed ? '#A78BFA' : active ? '#FFF' : '#4B5563',
                        fontWeight: active ? 600 : 400,
                        fontSize: 13,
                        transition: 'color 0.2s',
                      }}
                    >
                      {completed ? (
                        <CheckCircle2 size={15} style={{ color: '#10B981', flexShrink: 0 }} />
                      ) : active ? (
                        <RefreshCw size={13} className="spin-animate" style={{ animation: "spin 1s linear infinite", color: '#7C3AED', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #4B5563', flexShrink: 0 }} />
                      )}
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STATE 3: Intelligence Report */}
          {report && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {/* Intel Dashboard Card */}
              <div
                style={{
                  background: 'rgba(17, 24, 39, 0.75)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                  borderRadius: 20,
                  padding: 28,
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* Header Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Terminal size={16} style={{ color: '#A78BFA' }} /> Intel Core Analysis
                  </h3>
                  <button
                    onClick={handleReset}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12, padding: '3px 8px', color: '#A78BFA', borderColor: 'rgba(124, 58, 237, 0.2)' }}
                  >
                    Reset Sourcing
                  </button>
                </div>

                {/* Grid stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 20, marginBottom: 20 }}>
                  
                  {/* Left block: Domain & Client info */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(124, 58, 237, 0.1)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      Client &amp; Domain
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginBottom: 2 }}>
                      {report.client}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#A78BFA', lineHeight: 1.4 }}>
                      {report.domain}
                    </div>

                    <div className="divider" style={{ background: 'rgba(255,255,255,0.06)', margin: '14px 0' }} />

                    {/* Extracted skills */}
                    <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Target Skills
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {report.skills.map((s, i) => (
                        <span key={i} style={{ fontSize: 11, background: 'rgba(124, 58, 237, 0.15)', color: '#C4B5FD', padding: '2px 6px', borderRadius: 4 }}>
                          {s}
                        </span>
                      ))}
                      {report.skills.length === 0 && (
                        <span style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                          No specific skills extracted.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right block: Competitor source list */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(124, 58, 237, 0.1)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Target Competitor Sourcing Pools
                    </div>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 10px', lineHeight: 1.4 }}>
                      Recruiters should target talent currently employed at these companies:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {report.competitors.map((comp, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#D1D5DB' }}>
                          <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.15)', color: '#A78BFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                            {idx + 1}
                          </span>
                          <span>{comp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Boolean Query Panel */}
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(124, 58, 237, 0.25)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Ezra's Formulated Boolean String
                    </span>
                    <span style={{ fontSize: 9.5, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>
                      DB Optimized
                    </span>
                  </div>
                  <code style={{ display: 'block', fontSize: 13, color: '#C4B5FD', fontFamily: 'monospace', wordBreak: 'break-all', padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                    {report.query}
                  </code>
                </div>

                {/* Live matched candidates list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Talent Database Matches ({report.matches.length})
                    </span>
                    <button
                      onClick={() => handleLaunchDatabase(report.query)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11.5, gap: 5, padding: '4px 10px', height: 'auto', background: '#7C3AED' }}
                    >
                      Review Pipeline <ArrowRight size={11} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {report.matches.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => handleLaunchDatabase(report.query)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.4)',
                          border: '1px solid rgba(229, 231, 235, 0.06)',
                          borderRadius: 10,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)';
                          e.currentTarget.style.background = 'rgba(124, 58, 237, 0.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.06)';
                          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>
                            {c["Candidate Name"]}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }} className="truncate">
                            {c["Title"] || "Specialist"} · 📍 {c["Current Location"] || "—"} · 🛂 {c["VISA"] || "—"}
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: '#7C3AED',
                            background: '#F5F3FF',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            flexShrink: 0,
                            marginLeft: 12,
                          }}
                        >
                          {c.matchScore}% Match
                        </div>
                      </div>
                    ))}

                    {report.matches.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 10 }}>
                        <AlertCircle size={20} style={{ color: '#4B5563', marginBottom: 6, margin: '0 auto 6px' }} />
                        <h5 style={{ margin: 0, color: '#9CA3AF' }}>No exact profile matches</h5>
                        <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
                          We have no candidates indexed under the generated boolean query.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
