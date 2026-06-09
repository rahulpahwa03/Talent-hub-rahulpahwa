/**
 * resumeParser.js
 *
 * Browser-native resume extraction for PDF, DOCX, DOC, and plain text.
 *   - PDF  → pdfjs-dist  (reads actual text layer)
 *   - DOCX → mammoth.js  (proper ZIP/XML extraction)
 *   - DOC  → mammoth.js  (binary .doc support)
 *   - TXT  → FileReader
 *
 * Every NLP field has multiple fallback strategies so we extract
 * as much as possible even from incomplete or oddly-formatted resumes.
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// ─── PDF.js worker (uses CDN for reliable Vite/production bundling) ───────────
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.0.227'}/build/pdf.worker.min.mjs`;


// ══════════════════════════════════════════════════════════════════════════════
// TEXT EXTRACTION
// ══════════════════════════════════════════════════════════════════════════════

export async function extractTextFromFile(file) {
  const fname = (file.name || '').toLowerCase();
  const mime  = (file.type || '').toLowerCase();

  if (mime.includes('pdf') || fname.endsWith('.pdf')) {
    return extractPdf(file);
  }
  if (
    mime.includes('wordprocessingml') ||
    mime.includes('msword') ||
    fname.endsWith('.docx') ||
    fname.endsWith('.doc')
  ) {
    return extractWord(file);
  }
  // Fallback: plain text / RTF / CSV
  return readText(file);
}

// ── PDF via pdfjs-dist ────────────────────────────────────────────────────────
async function extractPdf(file) {
  const buffer = await file.arrayBuffer();
  const pdf    = await pdfjsLib.getDocument({ data: buffer }).promise;
  const output = [];

  const numPages = Math.min(pdf.numPages, 10);
  for (let i = 1; i <= numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group items into lines using Y-coordinate proximity
    const lineMap = {};
    for (const item of content.items) {
      if (!item.str) continue;
      // Round Y to nearest 4px to group items on same visual line
      const yKey = Math.round((item.transform?.[5] ?? 0) / 4) * 4;
      const xVal = item.transform?.[4] ?? 0;
      if (!lineMap[yKey]) lineMap[yKey] = [];
      lineMap[yKey].push({ str: item.str, x: xVal });
    }

    // Sort lines top→bottom (PDF Y increases upward, so sort descending)
    const sortedYs = Object.keys(lineMap)
      .map(Number)
      .sort((a, b) => b - a);

    for (const y of sortedYs) {
      // Sort items on the same visual line left-to-right (X-coordinate ascending)
      const line = lineMap[y]
        .sort((a, b) => a.x - b.x)
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (line) output.push(line);
    }
  }

  return output.join('\n');
}

// ── DOCX / DOC via mammoth ────────────────────────────────────────────────────
async function extractWord(file) {
  const buffer = await file.arrayBuffer();
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    if (result.value && result.value.trim().length > 10) {
      return result.value;
    }
  } catch (err) {
    console.warn('[resumeParser] mammoth failed, falling back to text read:', err.message);
  }
  // Last-ditch: read as text and strip tags (works for .rtf and some .doc)
  return readText(file);
}

// ── Plain text ────────────────────────────────────────────────────────────────
function readText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result || '');
    reader.onerror = () => reject(new Error('Cannot read file'));
    reader.readAsText(file);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// NLP FIELD EXTRACTION
// ══════════════════════════════════════════════════════════════════════════════

// ─── Skills dictionary ─────────────────────────────────────────────────────────
const SKILLS = [
  // Cloud & Data Platforms
  'AWS','Azure','GCP','Google Cloud','Snowflake','Databricks','Redshift','BigQuery',
  'Athena','EMR','S3','EC2','Lambda','RDS','CloudFormation','Glue',
  // Languages
  'Python','Java','JavaScript','TypeScript','Scala','Go','Golang','C#','C++','C',
  'Ruby','PHP','Rust','Kotlin','Swift','R','MATLAB','Bash','Shell Scripting','VBA','Perl',
  // Web Frameworks
  'React','Angular','Vue','Vue.js','Node.js','NodeJS','Spring Boot','Django',
  'FastAPI','Flask','.NET','React Native','Flutter','Express','Next.js','NestJS',
  // Data / ML / AI
  'Spark','Apache Spark','PySpark','Kafka','Apache Kafka','Airflow','Apache Airflow',
  'dbt','Hadoop','Hive','Pandas','NumPy','scikit-learn','Scikit-learn',
  'TensorFlow','PyTorch','Keras','XGBoost','LightGBM',
  'Machine Learning','Deep Learning','NLP','LLM','Generative AI','Computer Vision',
  'Data Engineering','Data Science','Data Analytics','Analytics','ETL','ELT',
  'Data Modeling','Data Warehouse','Data Lake','Data Pipeline','Feature Engineering',
  // Databases
  'SQL','PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch','Cassandra',
  'DynamoDB','NoSQL','SQLite','Oracle','SQL Server','MSSQL','HBase','Spark SQL','Teradata',
  // DevOps / Infra
  'Docker','Kubernetes','Terraform','Jenkins','GitHub Actions','CI/CD','GitLab CI',
  'Ansible','Helm','Linux','Git','GitHub','GitLab','Bitbucket',
  // BI & Visualisation
  'Tableau','Power BI','Looker','Grafana','Kibana','QuickSight','Qlik','SSRS','SSAS',
  // APIs & Architecture
  'GraphQL','REST','REST API','Microservices','gRPC','WebSocket','OAuth','JWT',
  // Process
  'Agile','Scrum','Kanban','JIRA','Confluence','Jira',
  // ERP / CRM
  'Salesforce','SAP','Workday','ServiceNow','Dynamics 365',
  // Office
  'Excel','PowerPoint','VBA','Power Query',
];

// ─── Visa keywords ─────────────────────────────────────────────────────────────
const VISAS = [
  { re: /\bh[\s\-]?1[\s\-]?b\b/i,                 label: 'H1B' },
  { re: /green[\s\-]?card/i,                       label: 'Green Card' },
  { re: /\bgc\b(?!\s*[a-z])/,                      label: 'Green Card' },
  { re: /us[\s\-]?citizen(?:ship)?/i,              label: 'US Citizen' },
  { re: /united\s+states\s+citizen/i,              label: 'US Citizen' },
  { re: /\busc\b/i,                               label: 'US Citizen' },
  { re: /opt[\s\-]?ead/i,                          label: 'OPT EAD' },
  { re: /\bopt\b/i,                               label: 'OPT' },
  { re: /h[\s\-]?4[\s\-]?ead/i,                   label: 'H4 EAD' },
  { re: /\bl[\s\-]?2[\s\-]?s\b/i,                 label: 'L2S' },
  { re: /\bl[\s\-]?1[\s\-]?[ab]?\b/i,             label: 'L1' },
  { re: /tn[\s\-]?visa/i,                          label: 'TN Visa' },
  { re: /employment\s+authoriz/i,                  label: 'OPT EAD' },
  { re: /work\s+authoriz/i,                        label: 'OPT EAD' },
  { re: /\bead\b/i,                               label: 'OPT EAD' },
  { re: /\bcpt\b/i,                               label: 'OPT/CPT' },
  { re: /permanent\s+residen(?:t|ce)/i,            label: 'Green Card' },
];

// ─── Job titles ────────────────────────────────────────────────────────────────
const TITLES = [
  // Data
  'Principal Data Engineer','Staff Data Engineer','Senior Data Engineer','Lead Data Engineer','Data Engineer',
  'Senior Analytics Engineer','Analytics Engineer',
  'Senior Data Architect','Data Architect',
  'Senior Data Scientist','Lead Data Scientist','Data Scientist',
  'Senior Data Analyst','Data Analyst','Junior Data Analyst',
  'Business Intelligence Developer','BI Developer','BI Engineer',
  // Software
  'Principal Software Engineer','Staff Software Engineer','Senior Software Engineer',
  'Lead Software Engineer','Software Engineer','Associate Software Engineer',
  'Senior Software Developer','Software Developer',
  'Senior Java Developer','Java Developer',
  'Senior Python Developer','Python Developer',
  'Senior Full Stack Developer','Full Stack Developer','Full-Stack Developer',
  'Senior Backend Developer','Backend Developer','Backend Engineer',
  'Senior Frontend Developer','Frontend Developer','Frontend Engineer',
  'Senior React Developer','React Developer',
  // Cloud / Infra
  'Senior Cloud Engineer','Cloud Engineer','Cloud Architect',
  'Senior DevOps Engineer','Lead DevOps Engineer','DevOps Engineer',
  'Senior Platform Engineer','Platform Engineer',
  'Site Reliability Engineer','SRE',
  'Senior Solutions Architect','Solutions Architect',
  'Senior Systems Engineer','Systems Engineer',
  'Network Engineer','Systems Administrator','SysAdmin',
  // AI / ML
  'Senior Machine Learning Engineer','Machine Learning Engineer','ML Engineer',
  'AI Engineer','NLP Engineer','Computer Vision Engineer',
  'Research Scientist','Applied Scientist',
  // Management
  'Engineering Manager','Director of Engineering','VP of Engineering','CTO',
  'Tech Lead','Technical Lead','Team Lead','Scrum Master',
  'Senior Project Manager','Project Manager',
  'Senior Product Manager','Product Manager',
  // QA
  'Senior QA Engineer','QA Engineer','Senior Test Engineer','Test Engineer',
  'Senior SDET','SDET','Automation Engineer',
  // Database
  'Database Administrator','DBA','Senior DBA',
  // Security
  'Security Engineer','Cybersecurity Analyst','Information Security Analyst',
  // HR / Talent
  'Recruiter','Technical Recruiter','Senior Recruiter','Talent Acquisition Specialist',
  'HR Manager','Human Resources Manager',
  // Consulting
  'Senior Consultant','Consultant','Associate Consultant',
  // Generic
  'Senior Analyst','Analyst','Senior Specialist','Specialist',
  'Senior Associate','Associate','Coordinator',
];

// ─── Experience extraction ─────────────────────────────────────────────────────
const EXP_REGEXES = [
  /(\d{1,2})\+?\s*years?\s+of\s+(?:professional\s+|relevant\s+|total\s+|industry\s+)?experience/i,
  /(\d{1,2})\+?\s*yrs?\s+(?:of\s+)?(?:professional\s+|relevant\s+)?experience/i,
  /experience\s*(?:of|:)?\s*(\d{1,2})\+?\s*years?/i,
  /over\s+(\d{1,2})\+?\s*years?\s+of\s+experience/i,
  /(\d{1,2})\+?\s*years?\s+(?:of\s+)?(?:software|data|industry|professional|it|tech)\b/i,
  /(\d{1,2})\+\s*years?\b/i,
];

// ─── City / location patterns ──────────────────────────────────────────────────
const LOCATION_REGEXES = [
  // City, ST (US state abbrev)
  /\b([A-Z][a-zA-Z\s]{1,25}),\s*([A-Z]{2})\b(?!\s*\d)/,
  // City, Country
  /\b([A-Z][a-zA-Z\s]{1,25}),\s*(India|USA|United States|UK|United Kingdom|Canada|Australia|UAE|Singapore|Germany|Malaysia|Philippines)\b/i,
  // Indian cities (very common)
  /\b(Hyderabad|Bangalore|Bengaluru|Mumbai|Delhi|New Delhi|Chennai|Pune|Kolkata|Ahmedabad|Gurugram|Gurgaon|Noida|Navi Mumbai|Thane|Kochi|Jaipur|Lucknow|Coimbatore|Chandigarh)\b/i,
  // US metro shorthand
  /\b(New York(?:\s+City)?|Los Angeles|Chicago|Houston|Phoenix|Dallas|Austin|Seattle|Denver|Boston|Atlanta|Miami|Minneapolis|San Francisco|San Jose|Portland|Charlotte|Tampa|Orlando)\b/i,
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PARSE FUNCTION
// ══════════════════════════════════════════════════════════════════════════════
export function parseResumeText(rawText, fileName) {
  if (!rawText || rawText.trim().length < 5) {
    const fallbackName = extractNameFromFileName(fileName);
    return {
      ...empty(),
      name: fallbackName,
    };
  }

  // Normalise
  const text = rawText
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim();

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Debug — visible in browser console
  console.groupCollapsed('[EzHire] Resume Parser');
  console.log('Total chars:', text.length);
  console.log('First 20 lines:', lines.slice(0, 20));
  console.groupEnd();

  const email    = extractEmail(text);
  const phone    = extractPhone(text);
  const linkedin = extractLinkedIn(text);
  const location = extractLocation(text);
  const visa     = extractVisa(text);
  const skills   = extractSkills(text);
  const title    = extractTitle(lines, text);
  const experience = extractExperience(text);
  const currentEmployer = extractEmployer(text);
  const name     = extractName(lines, email, title, fileName);
  const summary  = extractSummary(lines, name, title, skills, experience);

  const result = { name, email, phone, linkedin, location, visa, skills, experience, currentEmployer, title, summary };
  console.debug('[EzHire] Parsed fields:', result);
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// EXTRACTORS
// ══════════════════════════════════════════════════════════════════════════════

function extractEmail(text) {
  const m = text.match(/\b([A-Za-z0-9][A-Za-z0-9._%+\-]*@[A-Za-z0-9.\-]+\.[A-Za-z]{2,7})\b/);
  return m ? m[1].trim() : '';
}

function extractPhone(text) {
  // Matches US, Indian (+91), and general international phone numbers
  const patterns = [
    // US: (123) 456-7890 or 123-456-7890 or 123.456.7890
    /(?:\+?1[\s.\-]?)?\(?[0-9]{3}\)?[\s.\-][0-9]{3}[\s.\-][0-9]{4}/,
    // Indian: +91 98765 43210 or 9876543210 or space-separated
    /(?:\+91[\s.\-]?)?[6-9][0-9]{2}[\s.\-][0-9]{3}[\s.\-][0-9]{4}/,
    /(?:\+91[\s.\-]?)?[6-9][0-9]{4}[\s.\-][0-9]{5}/,
    /(?:\+91[\s.\-]?)?[6-9][0-9]{9}/,
    // International: +XX-XXX-XXXX or similar (7-15 digits)
    /\+[0-9]{1,3}[\s.\-]?[0-9]{4,14}/,
    // Generic 10-digit
    /\b[0-9]{10}\b/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0].replace(/\s+/g, ' ').trim();
  }
  return '';
}

function extractLinkedIn(text) {
  const m = text.match(
    /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/|linkedin:\s*|linkedin\s*[:\-\/]\s*)([A-Za-z0-9\-_%]+)/i
  );
  return m ? `linkedin.com/in/${m[1]}` : '';
}

function extractLocation(text) {
  for (const re of LOCATION_REGEXES) {
    const m = text.match(re);
    if (m) return m[0].trim();
  }
  return '';
}

function extractVisa(text) {
  // Return blank by default as visa is mostly not mentioned on resumes.
  return '';
}

function extractSkills(text) {
  return SKILLS.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '[\\s/\\-\\.]+');
    try {
      // Word-boundary aware but handles .NET, C++, C# etc.
      const re = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
      return re.test(text);
    } catch {
      return text.toLowerCase().includes(skill.toLowerCase());
    }
  });
}

function extractTitle(lines, fullText) {
  // First: search top 30 lines (more likely to be current/headline title)
  const topText = lines.slice(0, 30).join('\n');
  for (const t of TITLES) {
    if (containsExact(topText, t)) return t;
  }
  // Then full text
  for (const t of TITLES) {
    if (containsExact(fullText, t)) return t;
  }
  return '';
}

function containsExact(text, phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    return new RegExp(`(?<![a-zA-Z])${escaped}(?![a-zA-Z])`, 'i').test(text);
  } catch {
    return text.toLowerCase().includes(phrase.toLowerCase());
  }
}

function extractExperience(text) {
  for (const re of EXP_REGEXES) {
    const m = text.match(re);
    if (m && m[1]) {
      const yrs = parseInt(m[1], 10);
      if (yrs > 0 && yrs < 50) return `${yrs}+ years`;
    }
  }
  // Infer from earliest→latest year range in document
  const allYears = [...text.matchAll(/\b(19[89]\d|20[012]\d)\b/g)]
    .map(m => parseInt(m[1], 10))
    .filter(y => y >= 1990 && y <= new Date().getFullYear());
  if (allYears.length >= 2) {
    const span = Math.max(...allYears) - Math.min(...allYears);
    if (span >= 1 && span <= 45) return `~${span} years`;
  }
  return '';
}

function extractEmployer(text) {
  // Pattern 1: "at CompanyName" or "@ CompanyName"
  const p1 = text.match(
    /\bat\s+([A-Z][A-Za-z0-9\s&.,\-]{2,50}?)(?=\s*[\|,\-–—\n]|$)/m
  );
  if (p1 && isLikelyCompany(p1[1])) return clean(p1[1]);

  // Pattern 2: Company suffix keywords
  const p2 = text.match(
    /([A-Z][A-Za-z0-9\s&.,\-]{2,50}?\b(?:LLC|Inc\.?|Corp\.?|Ltd\.?|Limited|Technologies|Technology|Solutions|Systems|Group|Labs?|Company|Co\.|Services|Consulting|Global|International|Holdings|Pvt|Private|Associates))\b/m
  );
  if (p2 && isLikelyCompany(p2[1])) return clean(p2[1]);

  return '';
}

function isLikelyCompany(str) {
  if (!str) return false;
  const s = str.trim();
  return s.length >= 3 && s.length <= 60 && !/^(the|and|for|with|from|our|their|his|her)\b/i.test(s);
}

function clean(str) {
  return (str || '').trim().replace(/[.,\-–—]+$/, '').trim();
}

function extractNameFromFileName(fileName) {
  if (!fileName) return '';
  let name = fileName.replace(/\.[^/.]+$/, "");
  name = name.replace(/[_\-\.]/g, " ");
  name = name.replace(/\d+/g, "");
  const removeWords = /\b(resume|cv|curriculum|vitae|profile|hiring|job|apply|digitals|ezhire|copy|final|updated|en|es|fr|de|eng|doc|docx|pdf|txt)\b/gi;
  name = name.replace(removeWords, "");
  name = name.replace(/\s+/g, " ").trim();

  if (!name || name.length < 2 || name.length > 40) return '';
  return name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function extractName(lines, email, title, fileName) {
  // Strategy 1: check if filename is a clean name first (e.g. "John Doe")
  if (fileName) {
    const nameFromFileName = extractNameFromFileName(fileName);
    if (nameFromFileName && nameFromFileName.split(' ').length >= 2) {
      // Guard: Ensure it doesn't contain common title keywords or role terms
      const titleKeywords = /\b(software|engineer|developer|architect|analyst|manager|consultant|director|lead|senior|data|cloud|bi|qa|sdet|tech|java|python|javascript|aws|azure|snowflake|admin|recruiter|acquisition|recruit|talent|design|hiring|project|program)\b/i;
      if (!titleKeywords.test(nameFromFileName)) {
        return nameFromFileName;
      }
    }
  }

  // Strategy 2: first 1-4 word line that isn't a section header, URL, email, or phone
  const SKIP = /resume|curriculum|vitae|\bcv\b|objective|summary|profile|education|experience|skills|contact|address|certif|reference|project|award|language|interest|publication/i;
  const SKIP_CHARS = /@|http|www\.|\.com|\.io|\.pdf|linkedin|github/i;

  for (const line of lines.slice(0, 15)) {
    const parts = line.split(/[|•·→:;,\/\\]/);
    const candidatePart = parts[0].trim();

    if (SKIP.test(candidatePart)) continue;
    if (SKIP_CHARS.test(candidatePart)) continue;
    if (/\d{4,}/.test(candidatePart)) continue;

    // Strip to just letters, spaces, hyphens, apostrophes
    const stripped = candidatePart.replace(/[^a-zA-Z\s\-'.]/g, '').trim();
    if (stripped.length < 2 || stripped.length > 55) continue;

    const words = stripped.split(/\s+/).filter(Boolean);
    if (words.length < 1 || words.length > 5) continue;

    // Every word should look like a name part (some letters)
    const allWordLike = words.every(w => /[a-zA-Z]{1,}/.test(w));
    if (!allWordLike) continue;

    // Convert to Title Case
    const named = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return named;
  }

  // Strategy 3: derive from email (john.doe@... → John Doe)
  if (email) {
    const local = email.split('@')[0];
    const parts = local
      .split(/[._\-+]/)
      .filter(p => /[a-zA-Z]{2,}/.test(p) && !/\d/.test(p));
    if (parts.length >= 1 && parts.length <= 3) {
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    }
  }

  // Strategy 4: derive from filename fallback (any filename extraction)
  if (fileName) {
    const nameFromFileName = extractNameFromFileName(fileName);
    if (nameFromFileName) return nameFromFileName;
  }

  return '';
}

function extractSummary(lines, name, title, skills, experience) {
  // Look for text after a summary/objective/about section header
  const headerRe = /^(?:summary|professional\s+summary|career\s+objective|objective|about\s+me|profile|personal\s+profile)\s*[:\-]?\s*$/i;
  const sectionRe = /^(?:education|work\s+experience|experience|employment|skills|certifications?|projects?|awards?|references?|publications?|languages?)\s*[:\-]?\s*$/i;

  let inSummarySection = false;
  const summaryLines = [];

  for (const line of lines) {
    if (headerRe.test(line)) { inSummarySection = true; continue; }
    if (inSummarySection) {
      if (sectionRe.test(line)) break; // hit next section
      if (line.length > 20) summaryLines.push(line);
      if (summaryLines.join(' ').length > 350) break;
    }
  }

  if (summaryLines.length > 0) {
    return summaryLines.join(' ').slice(0, 500);
  }

  // Fallback: first long paragraph line in the doc
  for (const line of lines) {
    if (
      line.length > 80 &&
      line.length < 600 &&
      /[a-zA-Z]{4,}/.test(line) &&
      !/@/.test(line) &&
      !/http/i.test(line)
    ) {
      return line.slice(0, 500);
    }
  }

  // Generate from parsed fields
  if (title || skills.length > 0) {
    const expPart = experience ? `${experience} experienced` : 'Experienced';
    const titlePart = title || 'professional';
    const skillPart = skills.length > 0 ? ` with expertise in ${skills.slice(0, 4).join(', ')}` : '';
    return `${expPart} ${titlePart}${skillPart}.`;
  }

  return '';
}

function empty() {
  return {
    name: '', email: '', phone: '', linkedin: '',
    location: '', visa: '', skills: [],
    experience: '', currentEmployer: '', title: '', summary: '',
  };
}
