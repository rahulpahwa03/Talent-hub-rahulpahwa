import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, SlidersHorizontal, ArrowRight, Clock, MapPin, Mail, Bookmark, Sparkles, X,
  ChevronRight, Send, Check, Copy, RotateCcw, FileText, Shield, Briefcase, ChevronDown,
  Calendar, Building, ExternalLink, Award, Sparkle
} from 'lucide-react';

// ─── Color System Constants ──────────────────────────────────
const BRAND_PURPLE = '#6C5CE7';
const PAGE_BG = '#F7F6FB';
const CARD_BG = '#FFFFFF';
const BORDER_DEFAULT = '#E8E6F0';
const BORDER_HOVER = '#C4BFEA';
const TEXT_PRIMARY = '#1A1A2E';
const TEXT_SECONDARY = '#6B6B8A';
const TEXT_MUTED = '#A0A0B8';

// Status badge colors
const STATUS_STYLES = {
  "Available Now": { bg: '#E6F9F1', text: '#0D7A4E', dot: '#12B76A' },
  "On Project": { bg: '#FFF4E5', text: '#9A5000', dot: '#F59E0B' },
  "Available Soon": { bg: '#EEF2FF', text: '#3730A3', dot: '#6C5CE7' },
  "Not Available": { bg: '#F4F4F5', text: '#71717A', dot: '#A1A1AA' },
};

// Skill tag colors
const SKILL_COLORS = [
  { bg: '#F0EEFF', text: '#5B4FCC' }, // Purple
  { bg: '#E1F5EE', text: '#0F6E56' }, // Teal
  { bg: '#E6F1FB', text: '#185FA5' }, // Blue
  { bg: '#FAECE7', text: '#993C1D' }, // Coral
  { bg: '#FAEEDA', text: '#854F0B' }, // Amber
];

function getSkillColor(index) {
  return SKILL_COLORS[index % SKILL_COLORS.length];
}

const AVATAR_COLORS = [
  { bg: '#F0EEFF', text: '#5B4FCC' }, // Purple
  { bg: '#E1F5EE', text: '#0F6E56' }, // Teal
  { bg: '#E6F1FB', text: '#185FA5' }  // Blue
];

function getAvatarStyle(candidateId) {
  const hash = candidateId.charCodeAt(candidateId.length - 1) || 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ─── Mock Candidate Seed Data ────────────────────────────────
const INITIAL_CANDIDATES = [
  {
    id: "cand-1",
    name: "Suresh Kumar",
    initials: "SK",
    role: "Senior Java & Cloud Engineer",
    status: "Available Now",
    location: "Austin, TX",
    visa: "H1B",
    experience: 8,
    workPreference: "Remote",
    summary: "8+ years experienced Java Cloud Developer specializing in high-throughput microservices using Spring Boot, AWS (ECS, RDS, Lambda), and Terraform. Excellent track record of optimizing DB performance by 40%.",
    skills: {
      Cloud: ["AWS", "Terraform", "Docker", "Kubernetes"],
      Backend: ["Java", "Spring Boot", "REST APIs", "SQL"],
      Frontend: ["React", "HTML5", "CSS3"],
      Data: ["PostgreSQL", "Redis", "Kafka"]
    },
    timeline: [
      { year: "2022 - Present", company: "Capital One", role: "Lead Cloud Engineer" },
      { year: "2019 - 2022", company: "Infosys", role: "Senior Java Developer" },
      { year: "2017 - 2019", company: "Tech Mahindra", role: "Software Engineer" }
    ],
    notes: "Solid coding fundamentals. Strong System Design knowledge. Highly communicative. Preferred candidate.",
    email: "suresh.kumar@example.com",
    phone: "+1 (512) 555-0192",
    bookmarked: true
  },
  {
    id: "cand-2",
    name: "Elena Rostova",
    initials: "ER",
    role: "Python Machine Learning Engineer",
    status: "On Project",
    location: "San Francisco, CA",
    visa: "Green Card",
    experience: 6,
    workPreference: "Hybrid",
    summary: "Deep Learning engineer with 6 years of expertise building and productionalizing NLP and recommendation pipelines. Extensive work with PyTorch, AWS SageMaker, and FastAPI backend services.",
    skills: {
      Cloud: ["AWS", "Docker", "SageMaker"],
      Backend: ["Python", "FastAPI", "Flask", "Django"],
      Frontend: ["JavaScript", "TypeScript"],
      Data: ["PyTorch", "TensorFlow", "Pandas", "PostgreSQL", "Redis"]
    },
    timeline: [
      { year: "2021 - Present", company: "Stripe", role: "ML Engineer" },
      { year: "2018 - 2021", company: "Accenture", role: "Data Scientist" }
    ],
    notes: "Passed machine learning coding round. Excellent understanding of transformer models. On project until end of month.",
    email: "elena.r@example.com",
    phone: "+1 (415) 555-0183",
    bookmarked: false
  },
  {
    id: "cand-3",
    name: "Marcus Vance",
    initials: "MV",
    role: "AEM Front-End Developer",
    status: "Available Soon",
    location: "Chicago, IL",
    visa: "US Citizen",
    experience: 5,
    workPreference: "Onsite",
    summary: "Front-End Adobe Experience Manager (AEM) developer. Expert in React components, AEM HTL, OSGi configurations, and building pixel-perfect responsive designs for large enterprises.",
    skills: {
      Cloud: ["Azure", "AEM Cloud"],
      Backend: ["Java", "OSGi", "HTL"],
      Frontend: ["React", "CSS3", "JavaScript", "Webpack", "Tailwind"],
      Data: ["JCR", "Sling", "SQL"]
    },
    timeline: [
      { year: "2023 - Present", company: "Deloitte", role: "AEM Component Developer" },
      { year: "2020 - 2023", company: "Wunderman Thompson", role: "UI Engineer" }
    ],
    notes: "Strong CSS/HTL skills. Experience working with major corporate clients. Relocation to Chicago office preferred.",
    email: "marcus.vance@example.com",
    phone: "+1 (312) 555-0174",
    bookmarked: false
  },
  {
    id: "cand-4",
    name: "Sarah Chen",
    initials: "SC",
    role: "Lead Product Designer",
    status: "Available Now",
    location: "New York, NY",
    visa: "TN",
    experience: 10,
    workPreference: "Remote",
    summary: "10+ years of leading user experience and interface design for enterprise dashboard tools. Expert in Figma library systems, responsive web application UX layouts, and high-fidelity prototyping.",
    skills: {
      Cloud: ["Design Systems"],
      Backend: ["HTML5", "CSS3"],
      Frontend: ["Figma", "UI/UX", "Prototyping", "Wireframing"],
      Data: ["User Research", "Usability Testing"]
    },
    timeline: [
      { year: "2021 - Present", company: "Squarespace", role: "Lead UX Designer" },
      { year: "2018 - 2021", company: "InVision", role: "Senior Product Designer" },
      { year: "2014 - 2018", company: "Freelance", role: "Interaction Designer" }
    ],
    notes: "Incredible portfolio. Clear presentation skills. Located in NYC but operates fully remote.",
    email: "sarah.chen@example.com",
    phone: "+1 (212) 555-0145",
    bookmarked: false
  },
  {
    id: "cand-5",
    name: "David Mueller",
    initials: "DM",
    role: "Senior .NET & Solutions Architect",
    status: "Not Available",
    location: "Dallas, TX",
    visa: "US Citizen",
    experience: 12,
    workPreference: "Hybrid",
    summary: "12+ years design & development of large scale corporate .NET solutions. Expert in C#, ASP.NET Core, Azure Cloud Infrastructure, Microservices, and SQL Server database tuning.",
    skills: {
      Cloud: ["Azure", "Docker", "IIS"],
      Backend: [".NET Core", "C#", "ASP.NET", "Entity Framework"],
      Frontend: ["JavaScript", "HTML5"],
      Data: ["SQL Server", "CosmosDB", "Redis"]
    },
    timeline: [
      { year: "2020 - Present", company: "American Airlines", role: "Solutions Architect" },
      { year: "2017 - 2020", company: "Sabre", role: "Senior .NET Developer" },
      { year: "2012 - 2017", company: "Tyler Technologies", role: "Software Engineer" }
    ],
    notes: "Currently not available. Keeping in touch for potential future leadership roles.",
    email: "david.m@example.com",
    phone: "+1 (214) 555-0136",
    bookmarked: false
  },
  {
    id: "cand-6",
    name: "Suresh Malhotra",
    initials: "SM",
    role: "Data Engineer (Spark/AWS)",
    status: "Available Now",
    location: "Remote / Chicago, IL",
    visa: "OPT",
    experience: 4,
    workPreference: "Remote",
    summary: "4 years as a Data Engineer specializing in large-scale Apache Spark pipelines, dbt model transformations, Snowflake warehousing, and AWS S3/EMR data lakes.",
    skills: {
      Cloud: ["AWS", "Airflow", "Docker"],
      Backend: ["Python", "SQL", "Scala"],
      Frontend: ["CSS", "HTML"],
      Data: ["Apache Spark", "Snowflake", "dbt", "S3", "EMR"]
    },
    timeline: [
      { year: "2023 - Present", company: "TransUnion", role: "Data Engineer" },
      { year: "2022 - 2023", company: "Cognizant", role: "Associate Data Analyst" }
    ],
    notes: "OPT visa expires in 18 months. Highly analytical. Quick learner. Code challenge score: 95%.",
    email: "suresh.malhotra@example.com",
    phone: "+1 (312) 555-0157",
    bookmarked: false
  }
];

const DEFAULT_FILTERS = {
  skillQuery: "",
  visa: { H1B: false, GC: false, USC: false, OPT: false, TN: false, CPT: false },
  availability: "All",
  workPreferences: [],
  location: "",
  experience: 0
};

// ─── Outreach Email Template Builder ─────────────────────────
function generateOutreachEmail(candidate) {
  const firstName = candidate.name.split(" ")[0];
  const skillsList = Object.values(candidate.skills).flat().slice(0, 3).join(", ");
  
  const subjects = [
    `Role: ${candidate.role} opportunity`,
    `Contract: ${candidate.role} position`,
    `Quick question re: your ${skillsList} background`
  ];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];

  const templates = [
    `Hi ${firstName},\n\nI saw your profile and wanted to connect. We are looking for a ${candidate.role} with strong expertise in ${skillsList}.\n\nYour experience at ${candidate.timeline[0]?.company || "your current employer"} stands out. This is a ${candidate.workPreference.toLowerCase()} role based in ${candidate.location}.\n\nLet me know if you are open to a brief chat this week. Send over your resume if you have it handy.\n\nBest,\nRecruiter`,
    `Hello ${firstName},\n\nAre you looking for new opportunities? We have an open role for a ${candidate.role} requiring experience with ${skillsList}.\n\nYour background in ${candidate.location} looks like a solid fit for the team's needs. We are offering a ${candidate.workPreference.toLowerCase()} setup.\n\nIf you're interested, reply with your contact number or availability. Thanks.\n\nBest,\nRecruiter`,
    `Hi ${firstName},\n\nReaching out because I'm hiring for a ${candidate.role} position. Your profile shows solid experience in ${skillsList}, especially your recent stint at ${candidate.timeline[0]?.company || "your employer"}.\n\nThis position is ${candidate.workPreference.toLowerCase()} in ${candidate.location}.\n\nLet me know if you'd like to discuss the team details. Let's connect.\n\nRegards,\nRecruiter`
  ];
  const body = templates[Math.floor(Math.random() * templates.length)];

  return { subject, body };
}

export default function CandidateDatabase() {
  const navigate = useNavigate();

  // ─── Core State Management ─────────────────────────────────
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState("Newest");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // Drawer notes state
  const [localNotes, setLocalNotes] = useState("");
  const [savingStatus, setSavingStatus] = useState(""); // "" | "saving" | "saved"
  const saveTimer = useRef(null);

  // Email draft composer modal state
  const [emailModalData, setEmailModalData] = useState({
    isOpen: false,
    to: "",
    subject: "",
    body: "",
    candidate: null
  });

  // UI toggle states
  const [ezraOpen, setEzraOpen] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeEzraQueryBanner, setActiveEzraQueryBanner] = useState(null);
  const [generatingSummaryId, setGeneratingSummaryId] = useState(null);

  // Ezra chat history state
  const [ezraMessages, setEzraMessages] = useState([
    {
      sender: "ezra",
      text: "Hey — I'm Ezra. Tell me what you're looking for and I'll pull the right candidates. You can ask in plain English.",
      timestamp: "10:00 AM",
      matches: []
    }
  ]);
  const [ezraSuggestedPrompts, setEzraSuggestedPrompts] = useState([
    "Show me available Java developers",
    "Find H1B candidates in Texas",
    "Draft a submission for my shortlist",
    "Who's been on bench the longest?"
  ]);
  const [ezraInput, setEzraInput] = useState("");
  const chatEndRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ezraMessages]);

  // Sync drawer notes when active candidate changes
  useEffect(() => {
    if (selectedCandidate) {
      setLocalNotes(selectedCandidate.notes || "");
      setSavingStatus("");
    }
  }, [selectedCandidate]);

  // ─── Filter & Sort Processing ──────────────────────────────
  const processedCandidates = useMemo(() => {
    return candidates.filter(c => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchRole = c.role.toLowerCase().includes(q);
        const matchSkills = Object.values(c.skills).flat().some(s => s.toLowerCase().includes(q));
        if (!matchName && !matchRole && !matchSkills) return false;
      }

      // 2. Sidebar Skill Search
      if (filters.skillQuery.trim()) {
        const sq = filters.skillQuery.toLowerCase();
        const hasSkill = Object.values(c.skills).flat().some(s => s.toLowerCase().includes(sq));
        if (!hasSkill) return false;
      }

      // 3. Visa checkboxes
      const activeVisas = Object.entries(filters.visa).filter(([_, active]) => active).map(([name]) => name);
      if (activeVisas.length > 0) {
        if (!activeVisas.includes(c.visa)) return false;
      }

      // 4. Availability radio
      if (filters.availability !== 'All') {
        if (c.status !== filters.availability) return false;
      }

      // 5. Work preference toggle pills
      if (filters.workPreferences.length > 0) {
        if (!filters.workPreferences.includes(c.workPreference)) return false;
      }

      // 6. Location input
      if (filters.location.trim()) {
        const loc = filters.location.toLowerCase();
        if (!c.location.toLowerCase().includes(loc)) return false;
      }

      // 7. Experience Range slider (Filters candidate experience >= slider value)
      if (c.experience < filters.experience) return false;

      return true;
    });
  }, [candidates, searchQuery, filters]);

  const sortedCandidates = useMemo(() => {
    const list = [...processedCandidates];
    if (sortBy === "Newest") {
      list.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === "Experience ↑") {
      list.sort((a, b) => a.experience - b.experience);
    } else if (sortBy === "Experience ↓") {
      list.sort((a, b) => b.experience - a.experience);
    } else if (sortBy === "Availability") {
      const getRank = (status) => {
        switch (status) {
          case 'Available Now': return 1;
          case 'Available Soon': return 2;
          case 'On Project': return 3;
          case 'Not Available': return 4;
          default: return 5;
        }
      };
      list.sort((a, b) => getRank(a.status) - getRank(b.status));
    }
    return list;
  }, [processedCandidates, sortBy]);

  // ─── Actions & Handlers ────────────────────────────────────
  const handleToggleBookmark = (id) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === id) {
        const nextState = !c.bookmarked;
        toast.success(nextState ? `${c.name} bookmarked!` : `${c.name} removed from bookmarks.`);
        return { ...c, bookmarked: nextState };
      }
      return c;
    }));
  };

  const handleNotesChange = (e, candidateId) => {
    const text = e.target.value;
    setLocalNotes(text);
    setSavingStatus("saving");

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      setCandidates(prev => prev.map(c => {
        if (c.id === candidateId) {
          return { ...c, notes: text };
        }
        return c;
      }));
      setSavingStatus("saved");
      setTimeout(() => {
        setSavingStatus("");
      }, 2000);
    }, 800);
  };

  const handleCopyProfile = (candidate) => {
    const skillsText = Object.entries(candidate.skills)
      .map(([cat, list]) => `${cat}: ${list.join(", ")}`)
      .join("\n");
    const timelineText = candidate.timeline
      .map(item => `${item.year} - ${item.role} at ${item.company}`)
      .join("\n");
    
    const textDetails = `
Name: ${candidate.name}
Role: ${candidate.role}
Status: ${candidate.status}
Location: ${candidate.location}
Visa: ${candidate.visa}
Experience: ${candidate.experience} yrs
Work Preference: ${candidate.workPreference}
AI Summary: ${candidate.summary}

Skills:
${skillsText}

Experience Timeline:
${timelineText}

Recruiter Notes:
${candidate.notes || ""}
    `.trim();

    navigator.clipboard.writeText(textDetails);
    toast.success("Profile details copied to clipboard!");
  };

  const handleOpenEmailComposer = (candidate) => {
    const email = generateOutreachEmail(candidate);
    setEmailModalData({
      isOpen: true,
      to: candidate.email,
      subject: email.subject,
      body: email.body,
      candidate: candidate
    });
  };

  const handleRegenerateEmail = () => {
    if (!emailModalData.candidate) return;
    const email = generateOutreachEmail(emailModalData.candidate);
    setEmailModalData(prev => ({
      ...prev,
      subject: email.subject,
      body: email.body
    }));
    toast.success("New draft generated!");
  };

  const handleRegenerateAISummary = (candidateId) => {
    setGeneratingSummaryId(candidateId);
    setTimeout(() => {
      setCandidates(prev => prev.map(c => {
        if (c.id === candidateId) {
          const summaries = [
            `Top performing developer with ${c.experience} years exp. Deep expertise in ${Object.values(c.skills).flat().slice(0, 3).join(', ')}. Strong communicative builder.`,
            `Highly skilled engineer specializing in ${Object.values(c.skills).flat().slice(0, 4).join(', ')}. Seasoned experience at ${c.timeline[0]?.company}. Available immediately.`,
            `Specialist in ${c.role} roles with over ${c.experience} years. Proven architect for ${c.location} targets. Strong fit.`
          ];
          return { ...c, summary: summaries[Math.floor(Math.random() * summaries.length)] };
        }
        return c;
      }));
      setGeneratingSummaryId(null);
      toast.success("AI Summary updated!");
    }, 1200);
  };

  const handleClearFilters = () => {
    setIsLoading(true);
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
    setActiveEzraQueryBanner(null);
    setTimeout(() => setIsLoading(false), 500);
    toast.success("Filters cleared.");
  };

  const toggleVisaFilter = (visaKey) => {
    setFilters(f => ({
      ...f,
      visa: { ...f.visa, [visaKey]: !f.visa[visaKey] }
    }));
  };

  const toggleWorkPrefFilter = (pref) => {
    const active = filters.workPreferences.includes(pref);
    const updated = active
      ? filters.workPreferences.filter(p => p !== pref)
      : [...filters.workPreferences, pref];
    setFilters(f => ({ ...f, workPreferences: updated }));
  };

  // Helper count for active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.skillQuery.trim()) count++;
    if (filters.location.trim()) count++;
    if (filters.experience > 0) count++;
    if (filters.availability !== 'All') count++;
    count += Object.values(filters.visa).filter(Boolean).length;
    count += filters.workPreferences.length;
    return count;
  }, [filters]);

  // ─── Ezra Query Parser Engine ──────────────────────────────
  const handleEzraResponse = (queryText) => {
    if (!queryText.trim()) return;

    const lowerQuery = queryText.toLowerCase();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    setEzraMessages(prev => [...prev, { sender: "user", text: queryText, timestamp }]);
    setEzraSuggestedPrompts([]); // Hide chips on interaction
    setEzraInput("");

    // Simulate typing
    setTimeout(() => {
      let replyText = "";
      let matches = [];
      let emailDraft = null;
      let clarifying = false;

      // 1. Available Java Developers
      if (lowerQuery.includes("java") && (lowerQuery.includes("avail") || lowerQuery.includes("now") || lowerQuery.includes("bench"))) {
        matches = candidates.filter(c => c.name === "Suresh Kumar" || c.name === "Suresh Malhotra");
        setFilters(f => ({
          ...f,
          skillQuery: "Java",
          availability: "Available Now"
        }));
        setActiveEzraQueryBanner("Available Java developers");
        replyText = `I've updated the grid filters to display **Java Developers** who are **Available Now**. Here are the matching profiles from our talent pool:`;
      }
      // 2. H1B in Texas
      else if (lowerQuery.includes("h1b") && (lowerQuery.includes("texas") || lowerQuery.includes("tx"))) {
        matches = candidates.filter(c => c.name === "Suresh Kumar");
        setFilters(f => ({
          ...f,
          visa: { ...DEFAULT_FILTERS.visa, H1B: true },
          location: "Texas"
        }));
        setActiveEzraQueryBanner("H1B candidates in Texas");
        replyText = `I have updated your grid filters for **H1B candidates in Texas**. Here is the best profile:`;
      }
      // 3. Bench longest
      else if (lowerQuery.includes("bench") || lowerQuery.includes("longest") || lowerQuery.includes("available longest")) {
        replyText = `Based on bench duration and availability, here are the top candidates who are available now, sorted by experience:\n\n1. **Suresh Kumar** (8 yrs, Austin, TX) - Available Now\n2. **Sarah Chen** (10 yrs, New York, NY) - Available Now\n3. **Suresh Malhotra** (4 yrs, Chicago, IL) - Available Now\n\nWould you like me to draft an outreach email for any of them?`;
      }
      // 4. Clarifying Suresh query
      else if (lowerQuery.includes("suresh") && !lowerQuery.includes("kumar") && !lowerQuery.includes("malhotra")) {
        clarifying = true;
        replyText = `I found two candidates named Suresh in our system: **Suresh Kumar** (Senior Java & Cloud Engineer) and **Suresh Malhotra** (Data Engineer). Which one would you like to know more about?`;
      }
      // 5. Brief summary of Suresh Kumar
      else if (lowerQuery.includes("suresh") && lowerQuery.includes("kumar")) {
        const target = candidates.find(c => c.name === "Suresh Kumar");
        replyText = `**${target.name}** is a **${target.role}** based in **${target.location}** (${target.visa}).\n\n• Experience: ${target.experience} years\n• Current status: ${target.status}\n• Core stack: ${Object.values(target.skills).flat().slice(0, 5).join(", ")}\n\nWould you like me to draft an outreach email or add him to your shortlist?`;
      }
      // 6. Brief summary of Suresh Malhotra
      else if (lowerQuery.includes("suresh") && lowerQuery.includes("malhotra")) {
        const target = candidates.find(c => c.name === "Suresh Malhotra");
        replyText = `**${target.name}** is a **${target.role}** based in **${target.location}** (${target.visa}).\n\n• Experience: ${target.experience} years\n• Current status: ${target.status}\n• Core stack: ${Object.values(target.skills).flat().slice(0, 5).join(", ")}\n\nWould you like me to draft an outreach email or add him to your shortlist?`;
      }
      // 7. General email draft request
      else if (lowerQuery.includes("draft") || lowerQuery.includes("email") || lowerQuery.includes("submission")) {
        let target = selectedCandidate;
        
        if (lowerQuery.includes("kumar")) {
          target = candidates.find(c => c.name === "Suresh Kumar");
        } else if (lowerQuery.includes("malhotra")) {
          target = candidates.find(c => c.name === "Suresh Malhotra");
        } else if (lowerQuery.includes("elena")) {
          target = candidates.find(c => c.name === "Elena Rostova");
        } else if (lowerQuery.includes("marcus")) {
          target = candidates.find(c => c.name === "Marcus Vance");
        } else if (lowerQuery.includes("sarah")) {
          target = candidates.find(c => c.name === "Sarah Chen");
        } else if (lowerQuery.includes("david")) {
          target = candidates.find(c => c.name === "David Mueller");
        }

        if (target) {
          const email = generateOutreachEmail(target);
          replyText = `Here is a tailored outreach email for **${target.name}** following our standard direct outbox guidelines:`;
          emailDraft = {
            candidateId: target.id,
            name: target.name,
            to: target.email,
            subject: email.subject,
            body: email.body
          };
        } else {
          replyText = `Which candidate would you like me to draft an email for? Please select a profile or specify their name.`;
        }
      }
      // 8. Shortlist commands
      else if (lowerQuery.includes("shortlist") || lowerQuery.includes("bookmark") || lowerQuery.includes("save")) {
        let target = selectedCandidate;
        if (lowerQuery.includes("kumar")) target = candidates.find(c => c.name === "Suresh Kumar");
        else if (lowerQuery.includes("malhotra")) target = candidates.find(c => c.name === "Suresh Malhotra");
        else if (lowerQuery.includes("elena")) target = candidates.find(c => c.name === "Elena Rostova");
        else if (lowerQuery.includes("marcus")) target = candidates.find(c => c.name === "Marcus Vance");
        else if (lowerQuery.includes("sarah")) target = candidates.find(c => c.name === "Sarah Chen");
        else if (lowerQuery.includes("david")) target = candidates.find(c => c.name === "David Mueller");

        if (target) {
          setCandidates(prev => prev.map(c => {
            if (c.id === target.id) {
              return { ...c, bookmarked: true };
            }
            return c;
          }));
          replyText = `I have marked **${target.name}** as bookmarked and added them to your shortlist.`;
        } else {
          replyText = `Please tell me the name of the candidate you'd like to shortlist!`;
        }
      }
      // 9. General Java Developers
      else if (lowerQuery.includes("java")) {
        matches = candidates.filter(c => Object.values(c.skills).flat().some(s => s.toLowerCase() === 'java'));
        setFilters(f => ({ ...f, skillQuery: "Java" }));
        setActiveEzraQueryBanner("Java developers");
        replyText = `I filtered the grid for **Java**. Here are the candidates matching your request:`;
      }
      // 10. Default fallback
      else {
        replyText = `Nothing exact matches your request — want me to widen the search, or specify another candidate name or skill?`;
      }

      setEzraMessages(prev => [...prev, {
        sender: "ezra",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matches,
        emailDraft,
        clarifying
      }]);
    }, 600);
  };

  const getStatusBadge = (status) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES["Not Available"];
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
        style={{ background: style.bg, color: style.text }}
      >
        <span
          className={status === 'Available Now' ? 'pulse-dot' : ''}
          style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot }}
        />
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F7F6FB] text-[#1A1A2E] font-sans antialiased">
      {/* ── Custom CSS Animations Block ──────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; box-shadow: 0 0 0 0 rgba(18, 183, 106, 0.4); }
          70% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 6px rgba(18, 183, 106, 0); }
          100% { transform: scale(0.95); opacity: 0.5; box-shadow: 0 0 0 0 rgba(18, 183, 106, 0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(108, 92, 231, 0.15); }
          50% { box-shadow: 0 0 15px rgba(108, 92, 231, 0.45); }
        }
        .pulse-dot {
          animation: pulse 2s infinite;
        }
        .ezra-glow:hover {
          animation: glow 1.5s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E8E6F0;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #C4BFEA;
        }
        .shimmer-bg {
          background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      ` }} />

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E8E6F0] flex items-center justify-between px-4 md:px-6 shadow-sm">
        {/* Left wordmark logo */}
        <div 
          onClick={() => navigate('/recruiter/dashboard')}
          className="flex items-center gap-2 font-sans font-bold text-[18px] text-[#1A1A2E] cursor-pointer tracking-tight"
        >
          EzH<span style={{ color: BRAND_PURPLE }}>i</span>re
        </div>

        {/* Center Search bar */}
        <div className="hidden sm:block w-full max-w-[480px] relative mx-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0A0B8]" />
          <input
            type="text"
            placeholder="Search by name, skill, or role…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F6FB] border border-[#E8E6F0] rounded-xl py-2 pl-10 pr-4 text-[13px] text-[#1A1A2E] placeholder-[#A0A0B8] focus:border-[#C4BFEA] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Sorting */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[12px] text-[#A0A0B8] font-medium uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border border-[#E8E6F0] rounded-lg text-[13px] text-[#6B6B8A] py-1 px-2 focus:outline-none cursor-pointer hover:border-[#C4BFEA] transition-all"
            >
              <option value="Newest">Newest</option>
              <option value="Experience ↓">Experience (High → Low)</option>
              <option value="Experience ↑">Experience (Low → High)</option>
              <option value="Availability">Availability</option>
            </select>
          </div>

          <span className="hidden md:inline text-[13px] text-[#6B6B8A]">
            Showing <strong className="text-[#1A1A2E]">{sortedCandidates.length}</strong> of {candidates.length}
          </span>

          {/* Ask Ezra Pill Toggle Button */}
          <button
            onClick={() => setEzraOpen(!ezraOpen)}
            className="ezra-glow bg-[#6C5CE7] hover:bg-[#5B4FCC] text-white font-semibold text-[13.5px] px-5 py-2 rounded-full flex items-center gap-2 active:scale-[0.97] transition-all cursor-pointer"
          >
            <Sparkle size={14} className="fill-white/20 animate-pulse" />
            <span>Ask Ezra</span>
          </button>

          {/* Sidebar mobile/tablet filter toggle */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden p-2 bg-white border border-[#E8E6F0] rounded-xl text-[#6B6B8A] hover:bg-[#F7F6FB] relative active:scale-[0.95] cursor-pointer"
          >
            <SlidersHorizontal size={16} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#6C5CE7] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* ── SIDEBAR FILTERS (Desktop Static) ────────────────── */}
        <aside className="hidden lg:flex w-[260px] border-r border-[#E8E6F0] bg-white flex-col h-full flex-shrink-0">
          <div className="p-4 border-b border-[#E8E6F0] flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">
              Filters
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-[12px] text-[#6C5CE7] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RotateCcw size={11} />
                Clear all
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
            {/* Skill search */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">Skill search</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B8]" />
                <input
                  type="text"
                  placeholder="e.g. Python, AWS"
                  value={filters.skillQuery}
                  onChange={(e) => setFilters({ ...filters, skillQuery: e.target.value })}
                  className="w-full bg-[#F7F6FB] border border-[#E8E6F0] rounded-xl py-1.5 pl-9 pr-3 text-[12.5px] text-[#1A1A2E] placeholder-[#A0A0B8] focus:border-[#C4BFEA] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Visa checkboxes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">Visa Status</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {['H1B', 'GC', 'USC', 'OPT', 'TN', 'CPT'].map(key => (
                  <label key={key} className="flex items-center gap-2 text-[13px] text-[#6B6B8A] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filters.visa[key]}
                      onChange={() => toggleVisaFilter(key)}
                      style={{ accentColor: BRAND_PURPLE }}
                      className="rounded border-[#E8E6F0] w-4 h-4 cursor-pointer"
                    />
                    <span>{key}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">Availability</label>
              <div className="flex flex-col gap-2 mt-1">
                {['All', 'Available Now', 'Available Soon', 'On Project'].map(status => (
                  <label key={status} className="flex items-center gap-2 text-[13px] text-[#6B6B8A] cursor-pointer select-none">
                    <input
                      type="radio"
                      name="availability"
                      checked={filters.availability === status}
                      onChange={() => setFilters({ ...filters, availability: status })}
                      style={{ accentColor: BRAND_PURPLE }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Work preference toggles */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest font-medium">Work Preference</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['Remote', 'Hybrid', 'Onsite'].map(pref => {
                  const active = filters.workPreferences.includes(pref);
                  return (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => toggleWorkPrefFilter(pref)}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer active:scale-[0.95] transition-all"
                      style={{
                        background: active ? '#F0EEFF' : '#FFFFFF',
                        borderColor: active ? '#6C5CE7' : '#E8E6F0',
                        color: active ? '#6C5CE7' : '#6B6B8A'
                      }}
                    >
                      {pref}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">Location</label>
              <input
                type="text"
                placeholder="e.g. Austin, TX"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full bg-[#F7F6FB] border border-[#E8E6F0] rounded-xl py-1.5 px-3 text-[12.5px] text-[#1A1A2E] placeholder-[#A0A0B8] focus:border-[#C4BFEA] focus:outline-none transition-all"
              />
            </div>

            {/* Experience Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">Experience</label>
                <span className="text-[12px] font-semibold text-[#6C5CE7]">{filters.experience} yrs+</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={filters.experience}
                onChange={(e) => setFilters({ ...filters, experience: parseInt(e.target.value) })}
                style={{ accentColor: BRAND_PURPLE }}
                className="w-full h-1 bg-[#E8E6F0] rounded-lg appearance-none cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[10.5px] text-[#A0A0B8] font-medium mt-1">
                <span>0 yrs</span>
                <span>20 yrs</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── CENTER GRID AREA ────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-[900px] mx-auto">
            {/* Ezra Active Results Banner */}
            {activeEzraQueryBanner && (
              <div className="mb-5 bg-[#F0EEFF] text-[#6C5CE7] rounded-xl px-4 py-3 text-[13px] flex items-center justify-between font-medium border border-[#C4BFEA]/40 shadow-sm">
                <span className="flex items-center gap-2">
                  <Sparkles size={14} className="fill-[#6C5CE7]/10" />
                  Ezra's results for: <strong>"{activeEzraQueryBanner}"</strong>
                </span>
                <button
                  onClick={handleClearFilters}
                  className="underline hover:text-[#5B4FCC] cursor-pointer text-[12.5px] font-semibold"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Error / No matches handling */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : sortedCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <SlidersHorizontal size={40} className="text-[#A0A0B8] mb-3" />
                <h3 className="text-[16px] font-semibold text-[#1A1A2E] mb-1">
                  No candidates match your filters
                </h3>
                <p className="text-[13px] text-[#6B6B8A] max-w-sm mb-4">
                  Try broadening your search term, resetting checkboxes, or click below to clear active filters.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="bg-[#6C5CE7] text-white font-semibold text-[13px] px-6 py-2 rounded-xl hover:bg-[#5B4FCC] active:scale-[0.97] transition-all cursor-pointer shadow-sm"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {sortedCandidates.map((candidate) => (
                    <motion.div
                      key={candidate.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CandidateCard
                        candidate={candidate}
                        onOpenProfile={setSelectedCandidate}
                        onOpenDraftEmail={handleOpenEmailComposer}
                        onToggleBookmark={handleToggleBookmark}
                        onRegenerateSummary={handleRegenerateAISummary}
                        isGeneratingSummary={generatingSummaryId === candidate.id}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </main>

        {/* ── RIGHT EZRA PANEL ────────────────────────────────── */}
        <AnimatePresence>
          {ezraOpen && (
            <>
              {/* Mobile overlay backdrop */}
              <motion.div
                onClick={() => setEzraOpen(false)}
                className="fixed inset-0 bg-black/25 z-40 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              {/* Ezra Sidebar Container */}
              <motion.div
                className="fixed lg:relative inset-y-0 right-0 w-full sm:w-[360px] lg:w-[360px] bg-white border-l border-[#E8E6F0] z-50 lg:z-10 shadow-2xl lg:shadow-none flex flex-col h-full overflow-hidden flex-shrink-0"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              >
                {/* Header */}
                <div className="p-4 border-b border-[#E8E6F0] flex items-center justify-between flex-shrink-0 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[14px] text-[#1A1A2E]">Ezra · AI Recruiter</span>
                    <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
                  </div>
                  <button
                    onClick={() => setEzraOpen(false)}
                    className="p-1.5 text-[#6B6B8A] hover:bg-[#F7F6FB] rounded-lg transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Conversation area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-[#FDFDFE]">
                  {ezraMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Avatar for Ezra */}
                      {msg.sender === 'ezra' && (
                        <div className="w-7 h-7 rounded-full bg-[#6C5CE7] text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-1 shadow-sm select-none">
                          EZ
                        </div>
                      )}

                      <div className="flex flex-col max-w-[85%] relative group">
                        <div
                          className="px-4 py-2.5 text-[13.5px] leading-relaxed shadow-sm font-medium"
                          style={{
                            background: msg.sender === 'user' ? BRAND_PURPLE : '#F0EEFF',
                            color: msg.sender === 'user' ? '#FFFFFF' : TEXT_PRIMARY,
                            borderRadius: msg.sender === 'user'
                              ? '18px 18px 4px 18px'
                              : '18px 18px 18px 4px',
                            border: msg.sender === 'ezra' ? '1px solid #C4BFEA/20' : 'none'
                          }}
                        >
                          <p className="m-0 whitespace-pre-wrap">{msg.text}</p>

                          {/* Inline matches rendering */}
                          {msg.matches && msg.matches.length > 0 && (
                            <div className="flex flex-col gap-2 mt-3 w-full">
                              {msg.matches.map(cand => (
                                <div
                                  key={cand.id}
                                  className="bg-[#F7F6FB] border border-[#E8E6F0] rounded-xl p-3 text-left relative"
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <h4 className="text-[13.5px] font-semibold text-[#1A1A2E] leading-tight m-0 truncate pr-2">
                                      {cand.name}
                                    </h4>
                                    {getStatusBadge(cand.status)}
                                  </div>
                                  <div className="text-[12.5px] text-[#6B6B8A] mb-2 truncate">
                                    {cand.role}
                                  </div>
                                  <div className="text-[11.5px] text-[#A0A0B8] flex items-center gap-3 mb-2.5">
                                    <span>📍 {cand.location}</span>
                                    <span>🗂 {cand.visa}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {cand.skills && Object.values(cand.skills).flat().slice(0, 3).map((sk, sIdx) => {
                                      const col = getSkillColor(sIdx);
                                      return (
                                        <span
                                          key={sk}
                                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                          style={{ background: col.bg, color: col.text }}
                                        >
                                          {sk}
                                        </span>
                                      );
                                    })}
                                  </div>

                                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-[#E8E6F0]/60">
                                    <button
                                      onClick={() => setSelectedCandidate(cand)}
                                      className="text-[11.5px] font-semibold text-[#6C5CE7] hover:underline cursor-pointer"
                                    >
                                      View Profile
                                    </button>
                                    <button
                                      onClick={() => handleOpenEmailComposer(cand)}
                                      className="text-[11.5px] font-semibold text-[#6C5CE7] hover:underline cursor-pointer"
                                    >
                                      Draft Email
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inline email draft rendering */}
                          {msg.emailDraft && (
                            <div className="mt-3 p-3 bg-white border border-[#E8E6F0] rounded-xl text-left text-[12.5px] text-[#1A1A2E]">
                              <div className="mb-2">
                                <span className="font-semibold text-[#6B6B8A] text-[10px] uppercase block">To:</span>
                                <input
                                  type="text"
                                  className="w-full bg-transparent border-none outline-none font-semibold text-[12.5px] p-0"
                                  value={msg.emailDraft.to}
                                  readOnly
                                />
                              </div>
                              <div className="mb-2 border-t border-[#F7F6FB] pt-2">
                                <span className="font-semibold text-[#6B6B8A] text-[10px] uppercase block">Subject:</span>
                                <input
                                  type="text"
                                  className="w-full bg-transparent border-none outline-none font-semibold text-[12.5px] p-0"
                                  value={msg.emailDraft.subject}
                                  readOnly
                                />
                              </div>
                              <div className="border-t border-[#F7F6FB] pt-2">
                                <span className="font-semibold text-[#6B6B8A] text-[10px] uppercase block">Body:</span>
                                <textarea
                                  rows={5}
                                  className="w-full bg-transparent border-none outline-none text-[12.5px] leading-relaxed p-0 resize-none font-sans"
                                  value={msg.emailDraft.body}
                                  readOnly
                                />
                              </div>
                              <div className="flex justify-end gap-3 border-t border-[#F7F6FB] pt-2 mt-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.emailDraft.body);
                                    toast.success("Outreach draft copied!");
                                  }}
                                  className="text-[11.5px] text-[#6C5CE7] hover:underline font-semibold cursor-pointer"
                                >
                                  Copy
                                </button>
                                <button
                                  onClick={() => {
                                    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(msg.emailDraft.to)}&su=${encodeURIComponent(msg.emailDraft.subject)}&body=${encodeURIComponent(msg.emailDraft.body)}`;
                                    window.open(url, '_blank');
                                  }}
                                  className="text-[11.5px] text-[#6C5CE7] hover:underline font-semibold cursor-pointer"
                                >
                                  Open in Gmail
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Interactive clarifying choices */}
                          {msg.clarifying && (
                            <div className="flex flex-col gap-1.5 mt-3">
                              <button
                                onClick={() => handleEzraResponse("Tell me about Suresh Kumar")}
                                className="w-full text-left bg-white hover:bg-[#F0EEFF] text-[#6C5CE7] border border-[#6C5CE7]/30 rounded-lg p-2 text-[12.5px] font-semibold cursor-pointer transition-all"
                              >
                                Suresh Kumar (Lead Cloud Engineer)
                              </button>
                              <button
                                onClick={() => handleEzraResponse("Tell me about Suresh Malhotra")}
                                className="w-full text-left bg-white hover:bg-[#F0EEFF] text-[#6C5CE7] border border-[#6C5CE7]/30 rounded-lg p-2 text-[12.5px] font-semibold cursor-pointer transition-all"
                              >
                                Suresh Malhotra (Data Engineer)
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Timestamp on hover */}
                        <span className="text-[10px] text-[#A0A0B8] opacity-0 group-hover:opacity-100 transition-opacity mt-1 self-start select-none px-2 absolute -bottom-4 left-0">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggested prompt chips */}
                {ezraSuggestedPrompts.length > 0 && (
                  <div className="px-4 py-2 flex flex-col gap-1.5 border-t border-[#E8E6F0] bg-[#FDFDFE]">
                    {ezraSuggestedPrompts.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEzraResponse(chip)}
                        className="text-left bg-white hover:bg-[#F0EEFF] border border-[#6C5CE7]/40 text-[#6C5CE7] rounded-full px-3.5 py-1.5 text-[12px] font-semibold active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis block"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input bar */}
                <div className="p-3 border-t border-[#E8E6F0] bg-white flex items-center gap-2 flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Ask Ezra anything…"
                    value={ezraInput}
                    onChange={(e) => setEzraInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEzraResponse(ezraInput);
                    }}
                    className="flex-1 bg-[#F7F6FB] border border-[#E8E6F0] rounded-xl py-2 px-3.5 text-[13px] focus:outline-none focus:border-[#C4BFEA] transition-all"
                  />
                  <button
                    onClick={() => handleEzraResponse(ezraInput)}
                    className="p-2 bg-[#6C5CE7] hover:bg-[#5B4FCC] text-white rounded-xl active:scale-[0.95] transition-all cursor-pointer flex items-center justify-center"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── MOBILE FILTERS DRAWER PANEL ─────────────────────── */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 lg:hidden shadow-xl p-4 flex flex-col h-full overflow-hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              <div className="flex items-center justify-between border-b border-[#E8E6F0] pb-3 mb-4">
                <span className="font-bold text-[14px] text-[#1A1A2E] uppercase tracking-wider">
                  Filters ({activeFiltersCount})
                </span>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1.5 hover:bg-[#F7F6FB] rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable filters form */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5 custom-scrollbar">
                {/* Skill search */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">Skill search</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B8]" />
                    <input
                      type="text"
                      placeholder="e.g. Python, AWS"
                      value={filters.skillQuery}
                      onChange={(e) => setFilters({ ...filters, skillQuery: e.target.value })}
                      className="w-full bg-[#F7F6FB] border border-[#E8E6F0] rounded-xl py-1.5 pl-9 pr-3 text-[12.5px] text-[#1A1A2E] placeholder-[#A0A0B8] focus:border-[#C4BFEA] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Visa Checkboxes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">Visa Status</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['H1B', 'GC', 'USC', 'OPT', 'TN', 'CPT'].map(key => (
                      <label key={key} className="flex items-center gap-2 text-[13px] text-[#6B6B8A] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.visa[key]}
                          onChange={() => toggleVisaFilter(key)}
                          style={{ accentColor: BRAND_PURPLE }}
                          className="rounded border-[#E8E6F0] w-4 h-4 cursor-pointer"
                        />
                        <span>{key}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">Availability</label>
                  <div className="flex flex-col gap-2 mt-1">
                    {['All', 'Available Now', 'Available Soon', 'On Project'].map(status => (
                      <label key={status} className="flex items-center gap-2 text-[13px] text-[#6B6B8A] cursor-pointer">
                        <input
                          type="radio"
                          name="availability-mobile"
                          checked={filters.availability === status}
                          onChange={() => setFilters({ ...filters, availability: status })}
                          style={{ accentColor: BRAND_PURPLE }}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span>{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Work preferences */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">Work Preference</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {['Remote', 'Hybrid', 'Onsite'].map(pref => {
                      const active = filters.workPreferences.includes(pref);
                      return (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => toggleWorkPrefFilter(pref)}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer"
                          style={{
                            background: active ? '#F0EEFF' : '#FFFFFF',
                            borderColor: active ? '#6C5CE7' : '#E8E6F0',
                            color: active ? '#6C5CE7' : '#6B6B8A'
                          }}
                        >
                          {pref}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Austin, TX"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full bg-[#F7F6FB] border border-[#E8E6F0] rounded-xl py-1.5 px-3 text-[12.5px] text-[#1A1A2E] placeholder-[#A0A0B8] focus:border-[#C4BFEA] focus:outline-none transition-all"
                  />
                </div>

                {/* Experience Range */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">Experience</label>
                    <span className="text-[12px] font-semibold text-[#6C5CE7]">{filters.experience} yrs+</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={filters.experience}
                    onChange={(e) => setFilters({ ...filters, experience: parseInt(e.target.value) })}
                    style={{ accentColor: BRAND_PURPLE }}
                    className="w-full h-1 bg-[#E8E6F0] rounded-lg appearance-none cursor-pointer mt-2"
                  />
                </div>
              </div>

              {/* Bottom reset actions */}
              <div className="mt-4 pt-4 border-t border-[#E8E6F0] flex gap-2">
                <button
                  onClick={handleClearFilters}
                  className="flex-1 border border-[#E8E6F0] text-[#6B6B8A] py-2.5 rounded-xl text-[13px] font-semibold active:scale-[0.98] transition-all cursor-pointer"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 bg-[#6C5CE7] text-white py-2.5 rounded-xl text-[13px] font-semibold active:scale-[0.98] transition-all cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── SLIDE-OVER PROFILE DRAWER ───────────────────────── */}
      <AnimatePresence>
        {selectedCandidate && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              onClick={() => setSelectedCandidate(null)}
              className="fixed inset-0 bg-black/35 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Sliding Drawer Card */}
            <motion.div
              className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white z-50 shadow-2xl flex flex-col h-full overflow-hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            >
              {/* Header */}
              <div className="p-5 border-b border-[#E8E6F0] flex items-center justify-between bg-[#FDFDFE]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-[16px] shadow-sm"
                    style={{
                      background: getAvatarStyle(selectedCandidate.id).bg,
                      color: getAvatarStyle(selectedCandidate.id).text
                    }}
                  >
                    {selectedCandidate.initials}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#1A1A2E] leading-tight m-0">
                      {selectedCandidate.name}
                    </h3>
                    <span className="text-[13px] text-[#6B6B8A] block mt-0.5">
                      {selectedCandidate.role}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedCandidate.status)}
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="p-1.5 hover:bg-[#F7F6FB] rounded-lg transition-all text-[#6B6B8A] cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar">
                {/* 4 Mini stats cards */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-[#F7F6FB] rounded-xl p-2.5 text-center flex flex-col justify-center border border-[#E8E6F0]/40">
                    <span className="text-[10px] text-[#A0A0B8] uppercase tracking-wider font-bold block mb-1">Exp</span>
                    <span className="text-[13px] font-semibold text-[#1A1A2E]">{selectedCandidate.experience} yrs</span>
                  </div>
                  <div className="bg-[#F7F6FB] rounded-xl p-2.5 text-center flex flex-col justify-center border border-[#E8E6F0]/40">
                    <span className="text-[10px] text-[#A0A0B8] uppercase tracking-wider font-bold block mb-1">Visa</span>
                    <span className="text-[13px] font-semibold text-[#1A1A2E] truncate">{selectedCandidate.visa}</span>
                  </div>
                  <div className="bg-[#F7F6FB] rounded-xl p-2.5 text-center flex flex-col justify-center border border-[#E8E6F0]/40">
                    <span className="text-[10px] text-[#A0A0B8] uppercase tracking-wider font-bold block mb-1">Pref</span>
                    <span className="text-[13px] font-semibold text-[#1A1A2E] truncate">{selectedCandidate.workPreference}</span>
                  </div>
                  <div className="bg-[#F7F6FB] rounded-xl p-2.5 text-center flex flex-col justify-center border border-[#E8E6F0]/40">
                    <span className="text-[10px] text-[#A0A0B8] uppercase tracking-wider font-bold block mb-1">Loc</span>
                    <span className="text-[13px] font-semibold text-[#1A1A2E] truncate">{selectedCandidate.location.split(',')[0]}</span>
                  </div>
                </div>

                {/* AI Summary Block */}
                <div className="bg-[#F7F6FB] rounded-lg p-3 relative flex flex-col gap-2" style={{ borderLeft: `3px solid ${BRAND_PURPLE}` }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#6C5CE7] uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles size={11} className="fill-[#6C5CE7]/10" />
                      AI Recruiter summary
                    </span>
                    <button
                      onClick={() => handleRegenerateAISummary(selectedCandidate.id)}
                      className="text-[11px] text-[#6B6B8A] hover:text-[#6C5CE7] underline cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                  {generatingSummaryId === selectedCandidate.id ? (
                    <div className="py-2 flex flex-col gap-2">
                      <div className="shimmer-bg h-4 rounded w-full" />
                      <div className="shimmer-bg h-4 rounded w-5/6" />
                    </div>
                  ) : (
                    <p className="text-[13px] italic text-[#6B6B8A] m-0 leading-relaxed font-medium">
                      "{selectedCandidate.summary}"
                    </p>
                  )}
                </div>

                {/* Skills grouped by category */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest border-b border-[#F7F6FB] pb-2">
                    Skills Profile
                  </h4>
                  {Object.entries(selectedCandidate.skills).map(([category, skillsList]) => (
                    <div key={category} className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-wider">
                        {category}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {skillsList.map((skill, sIdx) => {
                          const col = getSkillColor(sIdx);
                          return (
                            <span
                              key={skill}
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: col.bg, color: col.text }}
                            >
                              {skill}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Experience Timeline */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest border-b border-[#F7F6FB] pb-2">
                    Career Timeline
                  </h4>
                  <div style={{ position: 'relative', paddingLeft: 20, borderLeft: '2px solid #E8E6F0', margin: '12px 0 12px 8px' }}>
                    {selectedCandidate.timeline.map((item, idx) => (
                      <div key={idx} style={{ position: 'relative', marginBottom: 20 }} className="last:mb-2">
                        {/* Purple Dot */}
                        <div style={{
                          position: 'absolute',
                          left: -26,
                          top: 4,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#6C5CE7',
                          border: '2.5px solid #FFFFFF'
                        }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', lineHeight: '1.2' }}>
                          {item.role}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B6B8A', marginTop: 3 }}>
                          {item.company} · <span style={{ color: '#A0A0B8', fontWeight: 500 }}>{item.year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recruiter notes */}
                <div className="flex flex-col gap-1.5 border-t border-[#F7F6FB] pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#A0A0B8] uppercase tracking-widest">
                      Internal Notes
                    </label>
                    <AnimatePresence>
                      {savingStatus === 'saving' && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-[11px] text-[#A0A0B8]"
                        >
                          Saving...
                        </motion.span>
                      )}
                      {savingStatus === 'saved' && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-[11px] text-[#12B76A] font-semibold flex items-center gap-1"
                        >
                          <Check size={11} />
                          Saved
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <textarea
                    rows={4}
                    value={localNotes}
                    onChange={(e) => handleNotesChange(e, selectedCandidate.id)}
                    placeholder="Enter confidential recruiting summaries, screening notes, or tech scores..."
                    className="w-full bg-[#F7F6FB] border border-[#E8E6F0] rounded-xl p-3 text-[13px] text-[#1A1A2E] placeholder-[#A0A0B8] focus:border-[#C4BFEA] focus:bg-white focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-4 border-t border-[#E8E6F0] bg-white flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    handleOpenEmailComposer(selectedCandidate);
                  }}
                  className="w-full bg-[#6C5CE7] hover:bg-[#5B4FCC] text-white py-3 rounded-xl text-[13.5px] font-bold active:scale-[0.98] transition-all cursor-pointer shadow-sm text-center"
                >
                  Draft Submission Email
                </button>
                <button
                  onClick={() => handleCopyProfile(selectedCandidate)}
                  className="w-full bg-white hover:bg-[#F7F6FB] border border-[#E8E6F0] text-[#6B6B8A] py-2.5 rounded-xl text-[13px] font-semibold active:scale-[0.98] transition-all cursor-pointer text-center"
                >
                  Copy Profile details
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── DRAFT EMAIL MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {emailModalData.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              onClick={() => setEmailModalData(prev => ({ ...prev, isOpen: false }))}
              className="fixed inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal Card */}
            <motion.div
              className="bg-white rounded-2xl w-full max-w-[560px] relative z-10 shadow-2xl overflow-hidden flex flex-col border border-[#E8E6F0]"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#E8E6F0] flex items-center justify-between bg-[#FDFDFE]">
                <div className="flex items-center gap-2">
                  <Mail size={16} style={{ color: BRAND_PURPLE }} />
                  <span className="font-semibold text-[15px] text-[#1A1A2E]">
                    Drafting Outreach Email for {emailModalData.candidate?.name}
                  </span>
                </div>
                <button
                  onClick={() => setEmailModalData(prev => ({ ...prev, isOpen: false }))}
                  className="p-1 hover:bg-[#F7F6FB] rounded-lg text-[#6B6B8A] transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto max-h-[75vh] custom-scrollbar">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#A0A0B8] uppercase tracking-wider">To:</span>
                  <input
                    type="text"
                    value={emailModalData.to}
                    onChange={(e) => setEmailModalData({ ...emailModalData, to: e.target.value })}
                    className="w-full bg-[#F7F6FB] border border-[#E8E6F0] rounded-xl py-2 px-3 text-[13px] text-[#1A1A2E] focus:outline-none focus:border-[#C4BFEA] transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#A0A0B8] uppercase tracking-wider">Subject:</span>
                  <input
                    type="text"
                    value={emailModalData.subject}
                    onChange={(e) => setEmailModalData({ ...emailModalData, subject: e.target.value })}
                    className="w-full bg-[#F7F6FB] border border-[#E8E6F0] rounded-xl py-2 px-3 text-[13px] text-[#1A1A2E] focus:outline-none focus:border-[#C4BFEA] transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[#A0A0B8] uppercase tracking-wider">
                      Body (AI-Generated, Direct outreach)
                    </span>
                    <span className="text-[11px] text-[#6B6B8A] font-medium bg-[#F7F6FB] px-2 py-0.5 rounded border border-[#E8E6F0]/40">
                      ~ {emailModalData.body.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={emailModalData.body}
                    onChange={(e) => setEmailModalData({ ...emailModalData, body: e.target.value })}
                    className="w-full bg-[#F7F6FB] border border-[#E8E6F0] rounded-xl p-3 text-[13.5px] leading-[1.7] text-[#1A1A2E] focus:outline-none focus:border-[#C4BFEA] focus:bg-white transition-all font-sans"
                    style={{ minHeight: 180 }}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-4 border-t border-[#E8E6F0] flex justify-between items-center bg-[#FDFDFE] flex-shrink-0">
                <button
                  onClick={handleRegenerateEmail}
                  className="border border-[#C4BFEA] text-[#6C5CE7] hover:bg-[#F0EEFF] font-semibold text-[13px] py-2.5 px-4 rounded-xl active:scale-[0.97] transition-all cursor-pointer"
                >
                  Regenerate
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(emailModalData.body);
                      toast.success("Draft copied to clipboard!");
                    }}
                    className="border border-[#E8E6F0] text-[#6B6B8A] hover:bg-[#F7F6FB] font-semibold text-[13px] py-2.5 px-4 rounded-xl active:scale-[0.97] transition-all cursor-pointer"
                  >
                    Copy Draft
                  </button>
                  <button
                    onClick={() => {
                      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailModalData.to)}&su=${encodeURIComponent(emailModalData.subject)}&body=${encodeURIComponent(emailModalData.body)}`;
                      window.open(url, '_blank');
                    }}
                    className="bg-[#6C5CE7] hover:bg-[#5B4FCC] text-white font-bold text-[13px] py-2.5 px-5 rounded-xl active:scale-[0.97] transition-all cursor-pointer shadow-sm"
                  >
                    Open in Gmail
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Auxiliary Card & Skeleton Components ───────────────────
function CandidateCard({ candidate, onOpenProfile, onOpenDraftEmail, onToggleBookmark, onRegenerateSummary, isGeneratingSummary }) {
  const avatarStyle = getAvatarStyle(candidate.id);
  
  return (
    <div
      className="bg-white rounded-2xl border border-[#E8E6F0] p-5 flex flex-col justify-between transition-all duration-200 hover:border-[#C4BFEA] hover:shadow-[0_4px_20px_rgba(108,92,231,0.08)]"
      style={{ minHeight: 290 }}
    >
      {/* Row 1: Identity */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          {/* Initials Circle */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px]"
            style={{ background: avatarStyle.bg, color: avatarStyle.text }}
          >
            {candidate.initials}
          </div>
          <div>
            <h3 className="text-[14.5px] font-semibold text-[#1A1A2E] leading-tight m-0 select-none">
              {candidate.name}
            </h3>
            <span className="text-[12.5px] text-[#6B6B8A] block mt-0.5">
              {candidate.role}
            </span>
          </div>
        </div>
        {getStatusBadge(candidate.status)}
      </div>

      {/* Row 2: Meta info */}
      <div className="flex items-center gap-3.5 text-[12px] text-[#6B6B8A] mb-3">
        <span className="flex items-center gap-1">
          <MapPin size={13} className="text-[#A0A0B8]" />
          {candidate.location}
        </span>
        <span className="flex items-center gap-1">
          <Shield size={13} className="text-[#A0A0B8]" />
          {candidate.visa}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={13} className="text-[#A0A0B8]" />
          {candidate.experience} yrs exp
        </span>
      </div>

      {/* Row 3: AI Summary Box */}
      <div
        className="bg-[#F7F6FB] rounded-lg p-2.5 mb-4 flex flex-col justify-center"
        style={{ minHeight: 52, borderLeft: `3px solid ${BRAND_PURPLE}` }}
      >
        {isGeneratingSummary ? (
          <div className="flex flex-col gap-1.5 w-full">
            <div className="shimmer-bg h-3.5 rounded w-full" />
            <div className="shimmer-bg h-3.5 rounded w-4/5" />
          </div>
        ) : (
          <p
            className="text-[12.5px] italic text-[#6B6B8A] m-0 font-medium leading-relaxed"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            "{candidate.summary}"
          </p>
        )}
      </div>

      {/* Row 4: Skills pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {Object.values(candidate.skills).flat().slice(0, 4).map((skill, sIdx) => {
          const col = getSkillColor(sIdx);
          return (
            <span
              key={skill}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: col.bg, color: col.text }}
            >
              {skill}
            </span>
          );
        })}
        {Object.values(candidate.skills).flat().length > 4 && (
          <span className="text-[11px] font-medium bg-[#F4F4F5] text-[#71717A] px-2.5 py-0.5 rounded-full">
            +{Object.values(candidate.skills).flat().length - 4} more
          </span>
        )}
      </div>

      {/* Row 5: Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[#F7F6FB]">
        <button
          onClick={() => onOpenProfile(candidate)}
          className="flex-1 text-[12.5px] font-bold bg-[#6C5CE7] hover:bg-[#5B4FCC] text-white py-2 rounded-lg active:scale-[0.97] transition-all cursor-pointer text-center"
        >
          View Profile
        </button>
        <button
          onClick={() => onOpenDraftEmail(candidate)}
          className="flex-1 text-[12.5px] font-bold bg-white text-[#6C5CE7] border border-[#6C5CE7] hover:bg-[#F0EEFF] py-2 rounded-lg active:scale-[0.97] transition-all cursor-pointer text-center"
        >
          Draft Email
        </button>
        <button
          onClick={() => onToggleBookmark(candidate.id)}
          className="p-2 rounded-lg border border-[#E8E6F0] hover:bg-[#F7F6FB] active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center"
        >
          <Bookmark
            size={15}
            style={{
              fill: candidate.bookmarked ? '#F59E0B' : 'transparent',
              color: candidate.bookmarked ? '#F59E0B' : '#A0A0B8'
            }}
          />
        </button>
      </div>
    </div>
  );
}

function getStatusBadge(status) {
  const style = STATUS_STYLES[status] || STATUS_STYLES["Not Available"];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
      style={{ background: style.bg, color: style.text }}
    >
      <span
        className={status === 'Available Now' ? 'pulse-dot' : ''}
        style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot }}
      />
      {status}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div
      className="bg-white rounded-2xl border border-[#E8E6F0] p-5 flex flex-col justify-between"
      style={{ minHeight: 290 }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 w-full">
          <div className="shimmer-bg w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <div className="shimmer-bg h-4 rounded w-3/4" />
            <div className="shimmer-bg h-3.5 rounded w-1/2 mt-1.5" />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="shimmer-bg h-3.5 rounded w-16" />
        <div className="shimmer-bg h-3.5 rounded w-14" />
        <div className="shimmer-bg h-3.5 rounded w-16" />
      </div>

      <div className="bg-[#F7F6FB] rounded-lg p-2.5 mb-4 flex flex-col gap-1.5">
        <div className="shimmer-bg h-3.5 rounded w-full" />
        <div className="shimmer-bg h-3.5 rounded w-5/6" />
      </div>

      <div className="flex gap-1.5 mb-4">
        <div className="shimmer-bg h-5 rounded-full w-14" />
        <div className="shimmer-bg h-5 rounded-full w-16" />
        <div className="shimmer-bg h-5 rounded-full w-12" />
      </div>

      <div className="flex gap-2 border-t border-[#F7F6FB] pt-3 mt-auto">
        <div className="shimmer-bg h-8 rounded-lg flex-1" />
        <div className="shimmer-bg h-8 rounded-lg flex-1" />
        <div className="shimmer-bg h-8 rounded-lg w-8 flex-shrink-0" />
      </div>
    </div>
  );
}
