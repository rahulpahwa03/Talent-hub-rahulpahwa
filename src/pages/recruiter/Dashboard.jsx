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
  AlertCircle
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
      competitors = ["Vercel", "Meta", "Netflix", "Airbnb", "Uber", "Stripe"];
    } else if (matchedSkills.includes("Snowflake") || matchedSkills.includes("dbt") || matchedSkills.includes("Spark") || matchedSkills.includes("Airflow")) {
      domain = "Modern Data Infrastructure & Analytics Warehousing";
      competitors = ["Databricks", "Snowflake Inc.", "Fivetran", "Confluent", "Cloudera", "AWS"];
    } else if (matchedSkills.includes("Kubernetes") || matchedSkills.includes("Docker") || matchedSkills.includes("Terraform") || matchedSkills.includes("DevOps")) {
      domain = "Site Reliability Engineering, DevOps & Container Cloud Scale";
      competitors = ["HashiCorp", "AWS", "Google Cloud", "Azure", "Red Hat", "PagerDuty"];
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
    let matches = applyBooleanSearch(analysisResult.query, candidates)
      .map(c => {
        const scoreRes = calculateMatchScore(c, analysisResult.query, {});
        return { ...c, matchScore: scoreRes.score };
      });

    // Ezra should always show the most relevant profiles from the database; never return 0 results
    if (matches.length === 0 && candidates.length > 0) {
      matches = candidates
        .map(c => {
          const scoreRes = calculateMatchScore(c, analysisResult.query, {});
          return { ...c, matchScore: scoreRes.score };
        })
        .sort((a, b) => b.matchScore - a.matchScore);
    } else {
      matches = matches.sort((a, b) => b.matchScore - a.matchScore);
    }

    const finalMatches = matches.slice(0, 3);

    setReport({
      client: clientName.trim() || "Unspecified Client",
      domain: analysisResult.domain,
      competitors: analysisResult.competitors,
      skills: analysisResult.skills,
      query: analysisResult.query,
      matches: finalMatches,
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
        background: '#0F172A', // Pure slate-dark background
        color: '#F1F5F9', // Light slate text
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 24px 40px', // More compact padding to fit screen
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: 780, position: 'relative' }}>
        
        {/* Holographic Ezra Avatar Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 20, gap: 10 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#1E293B", // Steel slate background
              border: "1.5px solid #475569", // Charcoal border
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#F1F5F9",
            }}
          >
            <Brain size={24} style={{ animation: isAnalyzing ? "spin 3s linear infinite" : "none" }} />
          </div>

          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 2px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Ezra Recruiting Core
              <span style={{ fontSize: 9, color: '#94A3B8', background: '#1E293B', border: '1px solid #475569', fontWeight: 600, padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Holographic AI
              </span>
            </h2>
            <p style={{ fontSize: 12.5, color: '#94A3B8', margin: 0, maxWidth: 480, lineHeight: 1.5 }}>
              Ingesting talent pools, checking client competitors, and mapping work eligibilities for US staffing teams.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STATE 1: Ezra Input Console */}
          {!isAnalyzing && !report && (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Sourcing Intake Panel */}
              <div
                style={{
                  background: '#1E293B', // Steel slate card background
                  border: '1px solid #334155', // Neutral slate border
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <form onSubmit={handleInitiateSourcing} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Option 1: Client Target */}
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ color: '#E2E8F0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                      <Building size={13} style={{ color: '#94A3B8' }} /> Target Client Name
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Capital One, Snowflake, Apple..."
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      style={{
                        background: '#0F172A',
                        border: '1px solid #475569',
                        color: '#FFF',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 13,
                      }}
                    />
                    <span className="input-hint" style={{ color: '#94A3B8', fontSize: 10.5 }}>
                      Helps Ezra analyze target domains and competitor pools.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 1, background: '#334155' }} />
                    <span style={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>OR PASTE JOB DETAILS</span>
                    <div style={{ flex: 1, height: 1, background: '#334155' }} />
                  </div>

                  {/* Option 2: Job Description */}
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ color: '#E2E8F0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                      <Briefcase size={13} style={{ color: '#94A3B8' }} /> Job Description (JD) / Requirements
                    </label>
                    <textarea
                      rows={3} // Compact rows to fit screen
                      className="input"
                      placeholder="Paste details of the role here..."
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      style={{
                        background: '#0F172A',
                        border: '1px solid #475569',
                        color: '#FFF',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 13,
                        resize: 'vertical',
                        minHeight: 80,
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  {/* Initiate Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      height: 40,
                      borderRadius: 8,
                      background: '#0F172A',
                      border: '1.5px solid #475569',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      marginTop: 4,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1F2937'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#0F172A'; }}
                  >
                    <Sparkles size={14} />
                    Initiate Ezra Sourcing Core
                  </button>
                </form>
              </div>

              {/* Ezra Empathy/Staffing Grind Footer */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px dashed #334155',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <Cpu size={16} style={{ color: '#94A3B8', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 12.5, margin: '0 0 2px', color: '#E2E8F0', fontWeight: 600 }}>
                    Staffing Intel Alert
                  </h4>
                  <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
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
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                borderRadius: 12,
                padding: 30,
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
            >
              {/* Spinner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#64748B', animation: 'blink 1.4s infinite 0.2s' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#64748B', animation: 'blink 1.4s infinite 0.4s' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#64748B', animation: 'blink 1.4s infinite 0.6s' }} />
              </div>

              {/* Steps Log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360, textAlign: 'left' }}>
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
                        gap: 10,
                        color: completed ? '#10B981' : active ? '#FFF' : '#475569',
                        fontWeight: active ? 600 : 400,
                        fontSize: 12.5,
                        transition: 'color 0.2s',
                      }}
                    >
                      {completed ? (
                        <CheckCircle2 size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                      ) : active ? (
                        <RefreshCw size={12} style={{ animation: "spin 1s linear infinite", color: '#94A3B8', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #475569', flexShrink: 0 }} />
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Intel Dashboard Card */}
              <div
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Header Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Terminal size={15} style={{ color: '#94A3B8' }} /> Intel Core Analysis
                  </h3>
                  <button
                    onClick={handleReset}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11.5, padding: '3px 8px', color: '#94A3B8', borderColor: '#475569' }}
                  >
                    Reset Sourcing
                  </button>
                </div>

                {/* Grid stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1.75fr', gap: 16, marginBottom: 16 }}>
                  
                  {/* Left block: Domain & Client info */}
                  <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      Client &amp; Domain
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 2 }}>
                      {report.client}
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.4 }}>
                      {report.domain}
                    </div>

                    <div className="divider" style={{ background: '#334155', margin: '10px 0' }} />

                    {/* Extracted skills */}
                    <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Target Skills
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {report.skills.map((s, i) => (
                        <span key={i} style={{ fontSize: 10.5, background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', padding: '2px 5px', borderRadius: 4 }}>
                          {s}
                        </span>
                      ))}
                      {report.skills.length === 0 && (
                        <span style={{ fontSize: 11.5, color: '#64748B', fontStyle: 'italic' }}>
                          No specific skills extracted.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right block: Competitor source list */}
                  <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      Target Competitor Sourcing Pools
                    </div>
                    <p style={{ fontSize: 11.5, color: '#94A3B8', margin: '0 0 8px', lineHeight: 1.4 }}>
                      Recruiters should target talent currently employed at:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {report.competitors.map((comp, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#E2E8F0' }}>
                          <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#1E293B', border: '1px solid #334155', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                            {idx + 1}
                          </span>
                          <span>{comp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Boolean Query Panel */}
                <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Ezra's Formulated Boolean String
                    </span>
                    <span style={{ fontSize: 9, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>
                      DB Optimized
                    </span>
                  </div>
                  <code style={{ display: 'block', fontSize: 12, color: '#FFF', fontFamily: 'monospace', wordBreak: 'break-all', padding: 6, background: '#090D16', borderRadius: 4, border: '1px solid #334155' }}>
                    {report.query}
                  </code>
                </div>

                {/* Live matched candidates list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Talent Database Matches ({report.matches.length})
                    </span>
                    <button
                      onClick={() => handleLaunchDatabase(report.query)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11.5, gap: 4, padding: '4px 10px', height: 'auto', background: '#0F172A', border: '1px solid #475569' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#1E293B'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#0F172A'; }}
                    >
                      Review Pipeline <ArrowRight size={11} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {report.matches.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => handleLaunchDatabase(report.query)}
                        style={{
                          background: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#475569';
                          e.currentTarget.style.background = '#1E293B';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#334155';
                          e.currentTarget.style.background = '#0F172A';
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFF' }}>
                            {c["Candidate Name"]}
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }} className="truncate">
                            {c["Title"] || "Specialist"} · 📍 {c["Current Location"] || "—"} · 🛂 {c["VISA"] || "—"}
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#FFF',
                            background: '#334155',
                            border: '1px solid #475569',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            flexShrink: 0,
                            marginLeft: 12,
                          }}
                        >
                          {c.matchScore}% Match
                        </div>
                      </div>
                    ))}
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
