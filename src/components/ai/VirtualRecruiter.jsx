import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, X, Send, User, Brain, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

// ─── Conversational AI Response Engine ────────────────────────
function getAIResponse(input, candidates = [], selectedCandidate = null) {
  const q = input.toLowerCase();
  
  if (q.includes("summarize") || q.includes("who is") || q.includes("profile")) {
    if (!selectedCandidate) {
      return "Please select a candidate from the list first, and I will write a tailored profile summary.";
    }
    const name = selectedCandidate["Candidate Name"] || "the candidate";
    const title = selectedCandidate["Title"] || "Specialist";
    const skills = selectedCandidate["Skills"] || "various technical skills";
    const location = selectedCandidate["Current Location"] || "unknown location";
    const visa = selectedCandidate["VISA"] || "not specified";
    const exp = selectedCandidate["experience"] || selectedCandidate["Years of Experience"] || "several years of";
    const employer = selectedCandidate["Employer"] || selectedCandidate["current_employer"] || "";
    
    return `I've analyzed the profile of **${name}**. Here is my executive summary:
- **Role**: ${title} (${exp} experience${employer ? ` at ${employer}` : ""})
- **Tech Stack**: ${skills}
- **Location & Visa**: 📍 ${location} · 🛂 Visa: ${visa || "Not specified"}

**AI Assessment**: This candidate is highly specialized in **${skills.split(/[|,]/)[0] || "their domain"}**. They present a very strong profile for related development or engineering roles. Would you like me to draft an email outreach draft for them?`;
  }
  
  if (q.includes("compare") || q.includes("candidates") || q.includes("top")) {
    if (!candidates || candidates.length === 0) {
      return "No candidates are currently loaded in the database list. Clear filters or modify your search so I can compare them!";
    }
    const limit = candidates.slice(0, 3);
    let response = `I've compared the top candidates in your active view (${candidates.length} total found):\n\n`;
    limit.forEach((c, idx) => {
      response += `${idx + 1}. **${c["Candidate Name"]}** (${c["Title"] || "Specialist"})\n`;
      response += `   - *Top Stack*: ${c["Skills"] ? c["Skills"].split(/[|,]/).slice(0, 3).map(s=>s.trim()).join(', ') : "General tech"}\n`;
      response += `   - *Visa & Location*: ${c["VISA"] || "—"} / ${c["Current Location"] || "—"}\n\n`;
    });
    if (candidates.length > 3) {
      response += `There are ${candidates.length - 3} other candidates matching your active filters. Let me know if you want me to analyze one of them specifically!`;
    }
    return response;
  }
  
  if (q.includes("visa") || q.includes("work eligibility") || q.includes("citizenship")) {
    if (!candidates || candidates.length === 0) {
      return "Please load some candidates first, and I will give you a visa breakdown.";
    }
    const visaStats = {};
    candidates.forEach(c => {
      const v = c["VISA"] || "Not specified";
      visaStats[v] = (visaStats[v] || 0) + 1;
    });
    let response = "Here is the visa distribution of the active search group:\n";
    Object.entries(visaStats).forEach(([v, count]) => {
      response += `- **${v}**: ${count} candidate${count > 1 ? 's' : ''}\n`;
    });
    return response;
  }
  
  if (q.includes("email") || q.includes("outreach") || q.includes("invite") || q.includes("draft")) {
    if (!selectedCandidate) {
      return "Which candidate would you like to email? Click a profile in the list first, and I will write a custom outreach!";
    }
    const name = selectedCandidate["Candidate Name"] || "there";
    const title = selectedCandidate["Title"] || "Software Specialist";
    const skills = selectedCandidate["Skills"] ? selectedCandidate["Skills"].split(/[|,]/).map(s=>s.trim()) : [];
    
    return `Here is a custom, recruiter-ready outreach message for **${selectedCandidate["Candidate Name"]}**:

\`\`\`text
Subject: Exploring career opportunities with EzHire

Hi ${name.split(' ')[0]},

I noticed your impressive background as a ${title}. Your experience working with ${skills.slice(0, 2).join(' & ')} is an excellent match for some roles we are active on.

If you are open to discussing new positions, when would you have 10 minutes for a brief call?

Best regards,
Recruiter Team
\`\`\``;
  }

  if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
    return "Hi there! I'm Ezra, your virtual recruiting copilot. How can I help you find or evaluate candidates today?";
  }

  return "I'm ready. I can compare the active candidates, check visa details, summarize profiles, or draft emails. Try typing a query or click one of the quick options!";
}

// ─── Component ────────────────────────────────────────────────
export default function VirtualRecruiter({ candidates = [], selectedCandidate = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "init",
      sender: "ai",
      text: "Hi! I'm Ezra, your virtual AI recruiting copilot. I've analyzed all candidates in the database. I can help you summarize profiles, compare candidates, check visa details, or draft outreach emails. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend) => {
    const query = textToSend.trim();
    if (!query) return;

    // Add User Message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Simulate AI thinking
    setIsTyping(true);
    setTimeout(() => {
      const responseText = getAIResponse(query, candidates, selectedCandidate);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleOptionClick = (option) => {
    let queryText = "";
    if (option === "summarize") {
      if (selectedCandidate) {
        queryText = `Summarize the profile of ${selectedCandidate["Candidate Name"]}`;
      } else {
        queryText = "Summarize the active candidate";
      }
    } else if (option === "compare") {
      queryText = "Compare the candidate list";
    } else if (option === "visa") {
      queryText = "Breakdown visa status";
    } else if (option === "email") {
      if (selectedCandidate) {
        queryText = `Draft outreach email for ${selectedCandidate["Candidate Name"]}`;
      } else {
        queryText = "Draft outreach email";
      }
    }
    handleSend(queryText);
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999 }}>
      {/* Chat Trigger Bubble */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
          border: "none",
          boxShadow: "0 8px 30px rgba(124, 58, 237, 0.35)",
          color: "#FFF",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
        aria-label="Toggle virtual recruiter agent"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
        
        {/* Pulsing online status indicator */}
        <span
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#10B981",
            border: "2px solid #FFF",
            boxShadow: "0 0 8px #10B981",
            animation: "pulse 2s infinite",
          }}
        />
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "absolute",
              bottom: 64,
              right: 0,
              width: 380,
              height: 500,
              background: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(229, 231, 235, 0.8)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(90deg, #111827, #1F2937)",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#FFF",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(124, 58, 237, 0.15)",
                  border: "1px solid #7C3AED",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#A78BFA",
                }}
              >
                <Brain size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  Ezra
                  <span style={{ fontSize: 9, fontWeight: 600, background: "#10B981", color: "#FFF", padding: "1px 4px", borderRadius: 4 }}>
                    AI AGENT
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981" }} />
                  Analyzing candidate list
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: 0 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages body */}
            <div className="scroll-y" style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {messages.map((m) => (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.sender === "user" ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "10px 14px",
                      borderRadius: m.sender === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                      background: m.sender === "user" ? "#7C3AED" : "rgba(243, 244, 246, 0.85)",
                      color: m.sender === "user" ? "#FFF" : "var(--text-primary)",
                      fontSize: 13,
                      lineHeight: 1.5,
                      border: m.sender === "user" ? "none" : "1px solid rgba(229, 231, 235, 0.5)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.text}
                  </div>
                  <span style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 4, padding: "0 4px" }}>
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <div
                    style={{
                      padding: "10px 18px",
                      borderRadius: "16px 16px 16px 2px",
                      background: "rgba(243, 244, 246, 0.85)",
                      border: "1px solid rgba(229, 231, 235, 0.5)",
                    }}
                  >
                    <div style={{ display: "flex", gap: 4, alignItems: "center", height: 16 }}>
                      <span className="dot" style={{ animation: "blink 1.4s infinite 0.2s" }} />
                      <span className="dot" style={{ animation: "blink 1.4s infinite 0.4s" }} />
                      <span className="dot" style={{ animation: "blink 1.4s infinite 0.6s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions footer */}
            <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-soft)", display: "flex", flexWrap: "wrap", gap: 5, background: "var(--bg-soft)", flexShrink: 0 }}>
              <button onClick={() => handleOptionClick("summarize")} className="tag" style={{ cursor: "pointer", border: "1px solid rgba(124, 58, 237, 0.2)", background: "rgba(124, 58, 237, 0.04)", color: "#7C3AED", fontSize: 11 }}>
                ✨ Summarize Candidate
              </button>
              <button onClick={() => handleOptionClick("compare")} className="tag" style={{ cursor: "pointer", border: "1px solid rgba(124, 58, 237, 0.2)", background: "rgba(124, 58, 237, 0.04)", color: "#7C3AED", fontSize: 11 }}>
                📊 Compare Top List
              </button>
              <button onClick={() => handleOptionClick("visa")} className="tag" style={{ cursor: "pointer", border: "1px solid rgba(124, 58, 237, 0.2)", background: "rgba(124, 58, 237, 0.04)", color: "#7C3AED", fontSize: 11 }}>
                🛂 Visa Stats
              </button>
              <button onClick={() => handleOptionClick("email")} className="tag" style={{ cursor: "pointer", border: "1px solid rgba(124, 58, 237, 0.2)", background: "rgba(124, 58, 237, 0.04)", color: "#7C3AED", fontSize: 11 }}>
                ✉️ Draft Outreach
              </button>
            </div>

            {/* Input bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
              style={{
                padding: 12,
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 8,
                background: "#FFF",
                flexShrink: 0,
              }}
            >
              <input
                type="text"
                placeholder="Ask Ezra about candidates..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="btn btn-primary btn-sm"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0 }}
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
