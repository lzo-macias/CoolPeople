const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, 'openstates_raw.txt');
const dataDir = path.resolve(process.cwd(), 'data', 'stanceData');

const ISSUE_KEYWORDS = {
    "Affordable Housing": ['affordable housing', 'rent', 'tenant', 'NYCHA', 'eviction', 'rezoning'],
    "Policing & Public Safety": ['nypd', 'police', 'public safety', 'crime', 'gun violence', 'stop-and-frisk', 'crime victims', 'victim services', 'advocate'],
    "Education": ['school', 'education', 'DOE', 'teachers', 'students', 'charter school', 'prek'],
    "Public Transit": ['mta', 'subway', 'bus', 'transit', 'commute', 'infrastructure'],
    "Climate & Environment": ['climate', 'green', 'environment', 'resiliency', 'sustainability', 'flood'],
    "Immigration": ['immigrant', 'asylum', 'migrant', 'ICE', 'border', 'citizenship'],
    "LGBTQ+ Rights": ['lgbt', 'queer', 'gay', 'trans', 'pride', 'nonbinary'],
    "Economic Development": ['jobs', 'small business', 'economy', 'workforce', 'economic development'],
    "Homelessness": ['homeless', 'shelter', 'housing insecurity', 'mental health'],
    "Health Care Access": ['healthcare', 'insurance', 'pre-authorization', 'coverage', 'treatment', 'transplant', 'patient', 'organ', 'opioid', 'overdose', 'narcan', 'substance use'],
    "Veterans & Military": ['veteran', 'military', 'service', 'medal', 'armed forces', 'deployment'],
    "Government & Ethics": ['compensation', 'legislature', 'salary', 'ethics', 'accountability', 'pay'],
    "Elections & Democracy": ['petition', 'election', 'ballot', 'candidate', 'vote', 'signature', 'democracy'],
    "Civil Rights & Memory": ['statue', 'monument', 'historic', 'memorial', 'desecration', 'heritage']
  };

  const progressivePhrases = [
    'progressive', 'equity', 'justice', 'abolish', 'defund', 'universal', 'guaranteed', 'climate crisis',
    'racial justice', 'economic justice', 'green new deal', 'reparations', 'police accountability',
    'housing is a human right', 'free college', 'cancel student debt', 'raise the minimum wage',
    'medicare for all', 'gender affirming care', 'workers rights', 'tax the rich', 'abolish ICE',
    'decarceration', 'mutual aid', 'public option', 'democratize', 'community safety'
  ];
  const conservativePhrases = [
    'tough on crime', 'zero tolerance', 'cut taxes', 'protect police', 'border security',
    'law and order', 'pro second amendment', 'back the blue', 'anti woke', 'school choice',
    'secure our borders', 'pro life', 'family values', 'defend traditional marriage',
    'reduce government', 'parental rights', 'protect religious liberty', 'constitutional rights',
    'oppose critical race theory', 'stand with law enforcement'
  ];

function stanceScore(sentence) {
  const l = sentence.toLowerCase();
  const pro = progressivePhrases.some(p => l.includes(p));
  const con = conservativePhrases.some(p => l.includes(p));

  if (pro && !con) return 5;
  if (!pro && con) return 1;
  if (pro && con) return 3;
  return 3; // neutral
}

function scoreByIssue(text) {
  const scores = {};
  const highlights = {};

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  for (const [issue, keywords] of Object.entries(ISSUE_KEYWORDS)) {
    const relevant = [];
  
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (keywords.some(k => lower.includes(k))) {
        relevant.push(line);
      }
    }
  
    highlights[issue] = relevant.slice(0, 3);
    scores[issue] = relevant.length
      ? Math.round(relevant.map(s => stanceScore(s)).reduce((a, b) => a + b, 0) / relevant.length)
      : 0;
  }
  return { scores, highlights };
}

// MAIN
if (!fs.existsSync(inputPath)) {
  console.error('❌ Input file not found:', inputPath);
  process.exit(1);
}

const rawText = fs.readFileSync(inputPath, 'utf-8');
const candidateName = 'Jenifer Rajkumar';
const { scores, highlights } = scoreByIssue(rawText);

const summary = {
  candidate: candidateName,
  source: 'OpenStates',
  issues: {}
};

for (const issue of Object.keys(ISSUE_KEYWORDS)) {
  summary.issues[issue] = {
    stanceScore: scores[issue],
    highlights: highlights[issue]
  };
}

// Save JSON + Markdown
const slug = candidateName.replace(/ /g, '_') + '_openstates';
const jsonPath = path.join(dataDir, `${slug}.json`);
const mdPath = path.join(dataDir, `${slug}.md`);

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

const mdLines = [`# OpenStates Summary for ${candidateName}\n`];
for (const [issue, data] of Object.entries(summary.issues)) {
  mdLines.push(`## ${issue}`);
  mdLines.push(`- 🧭 Stance: **${data.stanceScore}**`);
  mdLines.push(`- 📌 Top Highlights:\n${data.highlights.map(h => `  - ${h}`).join('\n')}`);
  mdLines.push('');
}

fs.writeFileSync(mdPath, mdLines.join('\n'));

console.log(`✅ Output written:\n- ${jsonPath}\n- ${mdPath}`);
