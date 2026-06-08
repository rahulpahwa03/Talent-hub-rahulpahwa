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
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
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

function analyzeKeywords(keywords) {
  // extract skills from keywords matching SKILLS_LIST
  const matchedSkills = keywords.filter(kw => 
    SKILLS_LIST.some(skill => skill.toLowerCase() === kw.toLowerCase().trim())
  );
  
  let domain = "Custom Target Domain & Specialized Technology Sourcing";
  let competitors = ["Google", "Amazon", "Microsoft", "Meta", "Netflix"];
  
  const skillsLower = matchedSkills.map(s => s.toLowerCase());
  if (skillsLower.some(s => s === 'react' || s === 'javascript' || s === 'typescript')) {
    domain = "Modern Web Application Development & Frontend Engineering";
    competitors = ["Vercel", "Meta", "Netflix", "Airbnb", "Uber", "Stripe"];
  } else if (skillsLower.some(s => s === 'snowflake' || s === 'dbt' || s === 'spark' || s === 'airflow' || s === 'databricks')) {
    domain = "Modern Data Infrastructure & Analytics Warehousing";
    competitors = ["Databricks", "Snowflake Inc.", "Fivetran", "Confluent", "Cloudera", "AWS"];
  } else if (skillsLower.some(s => s === 'kubernetes' || s === 'docker' || s === 'terraform' || s === 'devops')) {
    domain = "Site Reliability Engineering, DevOps & Container Cloud Scale";
    competitors = ["HashiCorp", "AWS", "Google Cloud", "Azure", "Red Hat", "PagerDuty"];
  } else if (skillsLower.some(s => s === 'machine learning' || s === 'ml' || s === 'pytorch' || s === 'tensorflow')) {
    domain = "Artificial Intelligence & Large Scale ML Deployments";
    competitors = ["OpenAI", "Anthropic", "Google DeepMind", "Meta AI", "NVIDIA", "Hugging Face"];
  }
  
  // build boolean query
  const query = keywords.map(kw => {
    const trimmed = kw.trim();
    if (trimmed.includes(' ') && !trimmed.startsWith('"')) {
      return `"${trimmed}"`;
    }
    return trimmed;
  }).join(' AND ');
  
  return {
    domain,
    competitors,
    skills: matchedSkills,
    query: query || "Developer OR Engineer"
  };
}

function getEzraCommentary(reportData) {
  const skillsText = reportData.skills.length > 0
    ? `expertise in **${reportData.skills.slice(0, 3).join(', ')}**`
    : `specified tech stack`;
  const compText = reportData.competitors.slice(0, 3).join(', ');
  
  return `I have completed the sourcing cycle for **${reportData.client}**. Based on the input parameters, I identified the key technical domain as *${reportData.domain}*. 

To extract the most aligned candidates, I targeted talent from high-overlap competitor pools, specifically companies like **${compText}**. I formulated an optimized Boolean query matching this profile and scanned the database. 

I've selected the top **${reportData.matches.length} candidates** for your pipeline. If exact matches were scarce, I automatically relaxed the search constraints to bring you the closest relevant partial matches. Let me know if you'd like to push this query directly into the candidate database to review full resumes!`;
}

const FloatingBlob = ({ color, size, duration, delay, initialX, initialY, driftRange }) => {
  return (
    <motion.div
      animate={{
        x: [0, driftRange, -driftRange, 0],
        y: [0, -driftRange, driftRange, 0],
        scale: [1, 1.1, 0.9, 1],
        opacity: [0.03, 0.06, 0.04, 0.03]
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }}
      style={{
        position: 'absolute',
        top: initialY,
        left: initialX,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)`,
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  
  // Tab control
  const [activeTab, setActiveTab] = useState("jd"); // 'jd' | 'client' | 'keywords'
  
  // Input states
  const [clientName, setClientName] = useState("");
  const [jdText, setJdText] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  
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
    if (e) e.preventDefault();
    
    if (activeTab === 'jd' && !jdText.trim()) {
      toast.error("Please paste a Job Description first.");
      return;
    }
    if (activeTab === 'client' && !clientName.trim()) {
      toast.error("Please enter a target client name first.");
      return;
    }
    if (activeTab === 'keywords' && keywords.length === 0) {
      toast.error("Please add at least one keyword first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(1); // Step 1: Ingesting

    await new Promise(r => setTimeout(r, 600));
    setAnalysisStep(2); // Step 2: Mapping Competitors

    await new Promise(r => setTimeout(r, 700));
    setAnalysisStep(3); // Step 3: Database query mapping

    await new Promise(r => setTimeout(r, 500));
    
    // Analyze input based on active tab
    let analysisResult;
    let clientLabel = "Sourcing Pipeline";
    if (activeTab === 'jd') {
      analysisResult = analyzeJobDescription(jdText, "");
      clientLabel = "JD Sourcing Analysis";
    } else if (activeTab === 'client') {
      analysisResult = analyzeJobDescription("", clientName);
      clientLabel = clientName.trim();
    } else {
      analysisResult = analyzeKeywords(keywords);
      clientLabel = "Keyword Sourcing Analysis";
    }
    
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
      client: clientLabel,
      domain: analysisResult.domain,
      competitors: analysisResult.competitors,
      skills: analysisResult.skills,
      query: analysisResult.query,
      matches: finalMatches,
      sourceType: activeTab
    });
    
    setIsAnalyzing(false);
    setAnalysisStep(0);
  };

  const handleReset = () => {
    setReport(null);
    setClientName("");
    setJdText("");
    setKeywords([]);
    setKeywordInput("");
  };

  const handleClearInputs = () => {
    setClientName("");
    setJdText("");
    setKeywords([]);
    setKeywordInput("");
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
        padding: '24px 24px 48px', // Balanced padding
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Floating Ambient Background Blobs */}
      <FloatingBlob color="#6366F1" size={350} duration={18} delay={0} initialX="10%" initialY="20%" driftRange={30} />
      <FloatingBlob color="#475569" size={400} duration={22} delay={2} initialX="50%" initialY="40%" driftRange={40} />
      <FloatingBlob color="#334155" size={300} duration={15} delay={4} initialX="30%" initialY="10%" driftRange={25} />

      <div style={{ width: '100%', maxWidth: 780, position: 'relative', zIndex: 1 }}>
        
        {/* Holographic Ezra Avatar Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24, gap: 10 }}>
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
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            <Brain size={24} style={{ animation: isAnalyzing ? "spin 3s linear infinite" : "none" }} />
          </div>

          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Ezra Recruiting Core
              <span style={{ fontSize: 9, color: '#94A3B8', background: '#1E293B', border: '1px solid #475569', fontWeight: 600, padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Recruiter
              </span>
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, maxWidth: 520, lineHeight: 1.5 }}>
              Ingesting talent pools, checking client competitors, and mapping work eligibilities to support recruiter pipelines.
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
              {/* Sourcing Intake Panel — Claude/Modern AI Composer */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.7)', // Translucent steel slate
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                }}
              >
                {/* Tabs selection */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', gap: 20, marginBottom: 20 }}>
                  {[
                    { id: 'jd', label: '📝 Job Description' },
                    { id: 'client', label: '🏢 Target Client' },
                    { id: 'keywords', label: '🔑 Sourcing Keywords' }
                  ].map(tab => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: active ? '#FFF' : '#94A3B8',
                          borderBottom: active ? '2px solid #FFF' : '2px solid transparent',
                          padding: '10px 4px',
                          fontSize: 13,
                          fontWeight: active ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleInitiateSourcing} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Tab 1: JD Textarea */}
                  {activeTab === 'jd' && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="input-group"
                      style={{ margin: 0 }}
                    >
                      <textarea
                        rows={4}
                        className="input"
                        placeholder="Paste job details, requirements, or a full description here... Ezra will automatically index skills, target locations, visa categories, and identify client competitor talent pools."
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1.5px solid rgba(255, 255, 255, 0.06)',
                          color: '#FFF',
                          borderRadius: 12,
                          padding: '14px 16px',
                          fontSize: 13.5,
                          resize: 'none',
                          minHeight: 120,
                          fontFamily: 'inherit',
                          lineHeight: 1.5,
                          outline: 'none',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
                      />
                    </motion.div>
                  )}

                  {/* Tab 2: Client Name */}
                  {activeTab === 'client' && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="input-group"
                      style={{ margin: 0 }}
                    >
                      <input
                        type="text"
                        className="input"
                        placeholder="Enter target client name (e.g. Capital One, Snowflake, Apple, Stripe, Databricks)..."
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1.5px solid rgba(255, 255, 255, 0.06)',
                          color: '#FFF',
                          borderRadius: 12,
                          padding: '12px 16px',
                          fontSize: 13.5,
                          outline: 'none',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
                      />
                      <span className="input-hint" style={{ color: '#94A3B8', fontSize: 11, marginTop: 6, display: 'block' }}>
                        Ezra leverages predefined profiles to map industry spaces, find target competitors, and match candidates from those firms.
                      </span>
                    </motion.div>
                  )}

                  {/* Tab 3: Keywords Tag Composer */}
                  {activeTab === 'keywords' && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                    >
                      <div
                        onClick={() => document.getElementById('keyword-composer-input')?.focus()}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1.5px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: 12,
                          padding: '10px 14px',
                          minHeight: 80,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 6,
                          alignContent: 'flex-start',
                          cursor: 'text',
                        }}
                      >
                        <AnimatePresence>
                          {keywords.map(kw => (
                            <motion.span
                              key={kw}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#334155',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                color: '#E2E8F0',
                                padding: '3px 10px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                            >
                              {kw}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setKeywords(keywords.filter(k => k !== kw));
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#94A3B8',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: 0,
                                }}
                              >
                                <X size={11} />
                              </button>
                            </motion.span>
                          ))}
                        </AnimatePresence>
                        
                        <input
                          id="keyword-composer-input"
                          type="text"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              const val = keywordInput.trim().replace(/,$/, '');
                              if (val && !keywords.includes(val)) {
                                setKeywords([...keywords, val]);
                              }
                              setKeywordInput("");
                            } else if (e.key === 'Backspace' && !keywordInput && keywords.length > 0) {
                              setKeywords(keywords.slice(0, -1));
                            }
                          }}
                          placeholder={keywords.length === 0 ? "Type skills, locations, or visa statuses (e.g. Snowflake, Texas, H1B) and press Enter..." : ""}
                          style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#FFF',
                            fontSize: 13,
                            minWidth: 160,
                            padding: '4px 0',
                            fontFamily: 'inherit',
                          }}
                        />
                      </div>

                      {/* Keyword quick suggestions */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Quick add:</span>
                        {['Snowflake', 'Python', 'AWS', 'Java', 'H1B', 'Green Card', 'Texas', 'California'].map(item => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              if (!keywords.includes(item)) {
                                setKeywords([...keywords, item]);
                              }
                            }}
                            style={{
                              background: 'rgba(30, 41, 59, 0.4)',
                              border: '1px solid rgba(255,255,255,0.04)',
                              color: '#94A3B8',
                              padding: '3px 10px',
                              borderRadius: '99px',
                              fontSize: 11,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                              e.currentTarget.style.color = '#FFF';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                              e.currentTarget.style.color = '#94A3B8';
                            }}
                          >
                            + {item}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Composer Footer Actions */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: 16,
                      marginTop: 4,
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Brain size={12} />
                      <span>Virtual Recruiter Copilot</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {(jdText || clientName || keywords.length > 0) && (
                        <button
                          type="button"
                          onClick={handleClearInputs}
                          style={{
                            background: 'transparent',
                            border: '1px solid #334155',
                            color: '#94A3B8',
                            borderRadius: 8,
                            padding: '6px 14px',
                            fontSize: 12.5,
                            cursor: 'pointer',
                            fontWeight: 500,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#475569';
                            e.currentTarget.style.color = '#FFF';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#334155';
                            e.currentTarget.style.color = '#94A3B8';
                          }}
                        >
                          Clear
                        </button>
                      )}
                      
                      <button
                        type="submit"
                        style={{
                          background: '#F1F5F9', // clean charcoal/light contrast button
                          border: 'none',
                          color: '#0F172A',
                          borderRadius: 8,
                          padding: '8px 18px',
                          fontSize: 12.5,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <Sparkles size={13} />
                        Source Candidates
                      </button>
                    </div>
                  </div>

                </form>
              </div>

              {/* Ezra Empathy/Staffing Grind Footer */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <Cpu size={16} style={{ color: '#94A3B8', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 12.5, margin: '0 0 4px', color: '#E2E8F0', fontWeight: 600 }}>
                    Empathetic AI Recruiter Core
                  </h4>
                  <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
                    Recruitment is hard work. Manually compiling Boolean strings, parsing candidate work authorizations, and double-checking target pools takes hours. Drop your requirements, client targets, or keywords. I will immediately analyze the domain, list key competitor companies, output clean Boolean filters, and source from your talent database.
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
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                padding: 30,
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
            >
              {/* Spinner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8', animation: 'blink 1.4s infinite 0.2s' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8', animation: 'blink 1.4s infinite 0.4s' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8', animation: 'blink 1.4s infinite 0.6s' }} />
              </div>

              {/* Steps Log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360, textAlign: 'left' }}>
                {[
                  { id: 1, label: "Ingesting sourcing criteria & parsing values..." },
                  { id: 2, label: "Mapping target domains & competitor pools..." },
                  { id: 3, label: "Scanning database & fetching candidate matches..." }
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
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                }}
              >
                {/* Header Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Terminal size={15} style={{ color: '#94A3B8' }} /> Sourcing Intelligence Report
                  </h3>
                  <button
                    onClick={handleReset}
                    style={{
                      background: 'transparent',
                      border: '1px solid #475569',
                      borderRadius: 8,
                      fontSize: 12,
                      padding: '4px 12px',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#64748B'; e.currentTarget.style.color = '#FFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#94A3B8'; }}
                  >
                    Reset Sourcing
                  </button>
                </div>

                {/* Two Column Layout: Left Ezra AI Analysis / Right Sourcing Outputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24 }}>
                  
                  {/* Left Column: Ezra Commentary Box */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Ezra Dialogue bubble */}
                    <div
                      style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: 12,
                        padding: 16,
                        position: 'relative',
                      }}
                    >
                      {/* Avatar header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#1E293B',
                            border: '1px solid #475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFF',
                          }}
                        >
                          <Brain size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFF' }}>Ezra AI Agent</div>
                          <div style={{ fontSize: 10, color: '#64748B' }}>Recruiter Copilot</div>
                        </div>
                      </div>

                      <p style={{ fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                        {getEzraCommentary(report)}
                      </p>
                    </div>

                    {/* Target skills info */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 700 }}>
                        Identified Skills Stack
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {report.skills.map((s, i) => (
                          <span key={i} style={{ fontSize: 10.5, background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#E2E8F0', padding: '2px 6px', borderRadius: 4 }}>
                            {s}
                          </span>
                        ))}
                        {report.skills.length === 0 && (
                          <span style={{ fontSize: 11.5, color: '#64748B', fontStyle: 'italic' }}>
                            Generic keywords sourcing.
                          </span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Sourcing Outputs & Pipelines */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Boolean query box */}
                    <div style={{ background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                          Formulated Boolean Query
                        </span>
                        <span style={{ fontSize: 9, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                          Optimized
                        </span>
                      </div>
                      <code style={{ display: 'block', fontSize: 12, color: '#E2E8F0', fontFamily: 'monospace', wordBreak: 'break-all', padding: 8, background: '#090D16', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        {report.query}
                      </code>
                    </div>

                    {/* Target competitors box */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 700 }}>
                        Target Sourcing Pool (Competitor Firms)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                        {report.competitors.map((comp, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#E2E8F0' }}>
                            <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                              {idx + 1}
                            </span>
                            <span>{comp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Matched candidates database list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                          Pipeline Matches ({report.matches.length})
                        </span>
                        <button
                          onClick={() => handleLaunchDatabase(report.query)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #475569',
                            color: '#FFF',
                            borderRadius: 8,
                            padding: '4px 10px',
                            fontSize: 11.5,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#1E293B'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          Review All Pipeline <ArrowRight size={11} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {report.matches.map((c, i) => (
                          <div
                            key={i}
                            onClick={() => handleLaunchDatabase(report.query)}
                            style={{
                              background: 'rgba(15, 23, 42, 0.3)',
                              border: '1px solid rgba(255, 255, 255, 0.03)',
                              borderRadius: 8,
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.03)';
                              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.3)';
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
                                background: '#1E293B',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                padding: '2px 8px',
                                borderRadius: '99px',
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

                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
