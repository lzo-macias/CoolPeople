const fs = require('fs');
const path = require('path');

const dataDir = path.resolve(__dirname, '..', '..', 'data', 'stanceData');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const ISSUE_KEYWORDS = {
  "Affordable Housing": [
    'affordable housing', 'rent', 'tenant', 'nycha', 'eviction', 'rezoning',
    'public housing', 'housing assistance', 'low-income housing', 'rental subsidy',
    'housing crisis', 'HUD', 'section 8', 'voucher', 'shelter', 'homelessness',
    'rent stabilized', 'landlord', 'tenant rights', 'housing insecurity'
  ],
  "Policing & Public Safety": [
    'nypd', 'police', 'public safety', 'crime', 'gun violence', 'stop-and-frisk',
    'crime victims', 'victim services', 'advocate', 'criminal justice', 'parole',
    'probation', 'incarceration', 'jail', 'prison', 'body camera', 'bail reform',
    'use of force', 'law enforcement', 'reentry program', 'police misconduct'
  ],
  "Education": [
    'school', 'education', 'doe', 'teachers', 'students', 'charter school', 'prek',
    'curriculum', 'discipline', 'public school', 'school safety', 'student services',
    'teacher training', 'after school', 'sex ed', 'learning standards', 'K-12', 'higher education'
  ],
  "Public Transit": [
    'mta', 'subway', 'bus', 'transit', 'commute', 'infrastructure',
    'transportation', 'metrocard', 'fare', 'rail', 'station', 'accessibility',
    'transit desert', 'electric bus', 'zero-emission bus', 'transport access'
  ],
  "Climate & Environment": [
    'climate', 'green', 'environment', 'resiliency', 'sustainability', 'flood',
    'renewable', 'carbon', 'emissions', 'solar', 'wind', 'clean energy',
    'pollution', 'climate change', 'air quality', 'offshore wind', 'wetlands',
    'recycling', 'battery storage', 'building electrification', 'fossil fuel'
  ],
  "Immigration": [
    'immigrant', 'asylum', 'migrant', 'ICE', 'border', 'citizenship',
    'deportation', 'undocumented', 'residency', 'naturalization', 'refugee',
    'green card', 'daca', 'immigration services', 'resettlement', 'language access'
  ],
  "LGBTQ+ Rights": [
    'lgbt', 'queer', 'gay', 'trans', 'pride', 'nonbinary',
    'gender identity', 'gender affirming', 'same-sex', 'conversion therapy',
    'lgbtq youth', 'transition care', 'discrimination', 'drag ban', 'hormone therapy'
  ],
  "Economic Development": [
    'jobs', 'small business', 'economy', 'workforce', 'economic development',
    'entrepreneurship', 'tax credit', 'minimum wage', 'job training',
    'startup', 'employment program', 'hiring incentive', 'local investment'
  ],
  "Homelessness": [
    'homeless', 'shelter', 'housing insecurity', 'unsheltered', 'mental health',
    'transitional housing', 'supportive housing', 'emergency shelter',
    'street outreach', 'wraparound services', 'encampment', 'hygiene center'
  ],
  "Health Care Access": [
    'healthcare', 'insurance', 'pre-authorization', 'coverage', 'treatment',
    'transplant', 'patient', 'organ', 'opioid', 'overdose', 'narcan',
    'substance use', 'mental health', 'reproductive health', 'abortion',
    'medicare', 'medicaid', 'public health', 'aid in dying', 'behavioral health',
    'universal healthcare'
  ],
  "Veterans & Military": [
    'veteran', 'military', 'service', 'medal', 'armed forces', 'deployment',
    'discharge', 'GI bill', 'ptsd', 'veterans affairs', 'vets', 'honorably discharged',
    'service-connected', 'veterans health', 'military spouse'
  ],
  "Government & Ethics": [
    'compensation', 'legislature', 'salary', 'ethics', 'accountability', 'pay',
    'public official', 'conflict of interest', 'lobbyist', 'transparency',
    'procurement', 'compliance', 'whistleblower', 'public integrity'
  ],
  "Elections & Democracy": [
    'petition', 'election', 'ballot', 'candidate', 'vote', 'signature', 'democracy',
    'redistricting', 'ranked choice', 'early voting', 'poll site', 'voter ID',
    'election security', 'campaign finance', 'get out the vote', 'gerrymandering'
  ],
  "Civil Rights & Memory": [
    'statue', 'monument', 'historic', 'memorial', 'desecration', 'heritage',
    'civil rights', 'racial justice', 'equity', 'segregation', 'reparations',
    'discrimination', 'commemoration', 'historic site', 'injustice', 'diversity'
  ]
};

function scoreByIssue(text, issueKeywords = ISSUE_KEYWORDS) {
  const scores = {};
  const lowerText = text.toLowerCase();

  for (const [issue, keywords] of Object.entries(issueKeywords)) {
    scores[issue] = keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      return count + (lowerText.match(regex) || []).length;
    }, 0);
  }

  return scores;
}

function extractHighlights(text, issueKeywords = ISSUE_KEYWORDS) {
  const highlights = [];

  for (const [issue, keywords] of Object.entries(issueKeywords)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`[^.?!]*\\b${keyword}\\b[^.?!]*[.?!]`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(m => {
          highlights.push({ issue, sentence: m.trim() });
        });
      }
    }
  }

  return highlights;
}

function stanceScore(sentence) {
  const progressivePhrases = [
    'progressive', 'equity', 'justice', 'abolish', 'defund', 'expansion',
    'universal', 'guaranteed', 'climate crisis'
  ];
  const conservativePhrases = [
    'tough on crime', 'zero tolerance', 'cut taxes', 'protect police', 'border security'
  ];

  const l = sentence.toLowerCase();
  const pro = progressivePhrases.some(p => l.includes(p));
  const con = conservativePhrases.some(p => l.includes(p));

  return pro ? 1 : con ? -1 : 0;
}

function summarizeCandidate(name, fullText) {
  const issueScores = scoreByIssue(fullText);
  const highlights = extractHighlights(fullText);

  const issues = {};
  for (const issue of Object.keys(ISSUE_KEYWORDS)) {
    const relevant = highlights.filter(h => h.issue === issue);
    const stance = relevant.reduce((sum, h) => sum + stanceScore(h.sentence), 0);
    const stanceVal = relevant.length ? Math.round(stance / relevant.length) : 0;

    issues[issue] = {
      score: issueScores[issue],
      stanceScore: stanceVal,
      highlights: relevant.map(h => h.sentence).slice(0, 3)
    };
  }

  return {
    candidate: name,
    issues
  };
}

if (require.main === module) {
  const candidateName = 'Jenifer Rajkumar';
  const filePath = path.resolve(__dirname, '..', '..', 'data/stanceData/pythonscrapt.txt');

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('❌ Failed to read output.txt:', err.message);
      process.exit(1);
    }

    const summary = summarizeCandidate(candidateName, data);
    console.dir(summary, { depth: null, colors: true });

    const candidateSlug = candidateName.replace(/ /g, '_');
    const jsonPath = path.join(dataDir, `${candidateSlug}.json`);
    const mdPath = path.join(dataDir, `${candidateSlug}.md`);

    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
    console.log(`✅ JSON saved to ${jsonPath}`);

    const mdLines = [`# Summary for ${candidateName}\n`];
    for (const [issue, data] of Object.entries(summary.issues)) {
      mdLines.push(`## ${issue}`);
      mdLines.push(`- 🔢 Score: **${data.score}**`);
      mdLines.push(`- 🧭 Stance: **${data.stanceScore}**`);
      mdLines.push(`- 📌 Top Highlights:\n${data.highlights.map(h => `  - ${h}`).join('\n')}`);
      mdLines.push('');
    }

    fs.writeFileSync(mdPath, mdLines.join('\n'));
    console.log(`📄 Markdown saved to ${mdPath}`);
  });
}

// module.exports = { summarizeCandidate };
