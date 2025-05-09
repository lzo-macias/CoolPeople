require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

ISSUE_KEYWORDS = {
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
  "Civil Rights & Discrimination": [
    'statue', 'monument', 'historic', 'memorial', 'desecration', 'heritage',
    'civil rights', 'racial justice', 'equity', 'segregation', 'reparations',
    'discrimination', 'commemoration', 'historic site', 'injustice', 'diversity'
  ]
}

// File paths
const analysisPath = path.join(__dirname, '../../../data/candidateAnalyses.js');
// const textfilesDir = path.join(__dirname, '../../../data/textfiles2');
const outputPath = path.join(__dirname, 'refinedAnalyses1.js');

// const skipNames = new Set([
//   "Abreu, Shaun",
//   "Acquafredda, Janine",
//   "Adams, Adrienne E",
//   "Adams, Eric L",
//   "Aldebol, Shirley",
//   "Alexandre, Dominique K"
// ]);

// Read and parse candidateAnalyses.js
const parseCandidates = () => {
  const content = fs.readFileSync(analysisPath, 'utf-8');
  const jsonStr = content
    .replace(/^module\.exports\s*=\s*/, '')
    .replace(/;\s*$/, '');
  return JSON.parse(jsonStr);
};

// Load supplemental text data for a candidate
// Load candidate supplemental JSON
const sanitizeFileName = (name) => {
  return name
    .replace(/ /g, '_')            // spaces to underscores
    .replace(/[^a-zA-Z0-9_,]/g, '') // remove everything except letters, digits, comma, underscore
    + '.json';
};

const loadCandidateText = (name) => {
  const filename = sanitizeFileName(name);
  const fullPath = path.join(__dirname, '../../../data/textfiles2', filename);
  console.log(`📁 Looking for file: ${filename}`);
  console.log(`📂 Full path: ${fullPath}`);
  if (fs.existsSync(fullPath)) {
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  }
  console.warn(`❌ File not found: ${fullPath}`);
  return [];
};

// Filter and prioritize by score
const getTopScoringChunks = (entries, category) => {
  const keywords = ISSUE_KEYWORDS[category] || [];
  return entries
    .filter(e => keywords.some(kw => e.text.toLowerCase().includes(kw)))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map(e => e.text);
};

// AI fact-checking prompt
// Build AI prompt
const buildFactCheckPrompt = (name, office, category, shortSummary, detailedSummary, chunks) => `
You are an expert political researcher verifying candidate stances.

Candidate: ${name}
Office: ${office}
Category: ${category}


Your job is to:
- Check if the summaries are factually accurate based on the supporting text, and your general knowledge.
- Revise the summaries to be factually accurate and rescore if necessary, includes stances, votes, support/opposition to legislation or programs, or explicit views.
- If no evidence exists, return null.
- Assign a stance score 1-10 (1 = conservative, 10 = progressive).

Summaries:
Short: "${shortSummary}"
Detailed: "${detailedSummary}"

Supporting Text:
"""
${chunks.join('\n\n').slice(0, 8000)}
"""

Respond as:
{
  "score": [1-10 or null],
  "shortSummary": "...",
  "detailedSummary": "..."
}`;


// AI metadata prompt
const buildMetadataPrompt = (name, office, extraText) => {
  const fallback = `Candidate name: ${name}. Office: ${office}.`;
  const inputText = extraText && extraText.length >= 100 ? extraText.slice(0, 10000) : fallback;

  return `
You are a political analyst reviewing background data about a candidate.

Candidate Name: ${name}

Below is some raw text about them:
"""
${inputText}
"""

From the above, extract:

- "party": Their political party (Democrat, Republican, Independent, or Other)
- "incumbency": true if they currently hold the office they are running for, otherwise false
- "bio": A one-sentence professional or personal background

Respond in this JSON format:
{
  "party": "Democrat",
  "incumbency": true,
  "bio": "Former teacher and union organizer."
}
`;
};

// Write one candidate to file in JS array format
const appendCandidateToFile = (candidateObj, isFirst) => {
  const jsonStr = JSON.stringify(candidateObj, null, 2);
  const prefix = isFirst ? 'module.exports = [\n' : ',\n';
  fs.appendFileSync(outputPath, prefix + jsonStr);
};

const closeArrayInFile = () => {
  fs.appendFileSync(outputPath, '\n];\n');
};

(async () => {
  const allCandidates = parseCandidates();
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

  for (let i = 0; i < allCandidates.length; i++) {
    const candidate = allCandidates[i];
    // if (skipNames.has(candidate.name)) {
    //   console.log(`⏭️ Skipping: ${candidate.name}`);
    //   continue;
    // }
    const name = candidate.name;
    const office = candidate.office || 'public office';
    const textEntries = loadCandidateText(name);
    // const getCategoryText = (entries, category) => {
    //   const keywords = ISSUE_KEYWORDS[category] || [];
    //   return entries
    //     .filter(e => keywords.some(kw => e.text.toLowerCase().includes(kw)))
    //     .map(e => e.text)
    //     .join(' ')
    //     .slice(0, 10000);
    // };

    const updatedScores = {};
    const newScores = [];

    for (const category of Object.keys(candidate.scores)) {
      const detail = candidate.scores[category];
      const categoryChunks = getTopScoringChunks(textEntries, category);
if (!categoryChunks.length) {
  console.log(`⚠️ No supporting text found for ${name} (${category})`);
}

console.log('🔍 CATEGORY:', category);
console.log('🧩 SUPPORTING CHUNKS (Top):', categoryChunks.slice(0, 2).join('\n\n').slice(0, 1000));

const prompt = buildFactCheckPrompt(name, office, category, detail.shortSummary, detail.detailedSummary, categoryChunks);
console.log('📤 PROMPT SENT TO OPENAI:\n', prompt);

      // DEBUG LOGGING
      console.log('🔍 CATEGORY:', category);
      console.log('🧩 SUPPORTING CHUNKS (Top):', categoryChunks.slice(0, 2).join('\n\n').slice(0, 1000)); // avoid flooding terminal
      console.log('📤 PROMPT SENT TO OPENAI:\n', prompt);

      try {
        const res = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0
        });
        const output = JSON.parse(res.choices[0].message.content);
        updatedScores[category] = {
          score: output.score ?? detail.score,
          shortSummary: output.shortSummary,
          detailedSummary: output.detailedSummary,
          sources: detail.sources || []
        };
        if (output.score !== null && typeof output.score === 'number') {
          newScores.push(output.score);
        }
      } catch (err) {
        console.error(`Error processing ${name} (${category}): ${err.message}`);
        updatedScores[category] = detail;
      }
    }

    // const prompt = buildFactCheckPrompt(name, office, category, detail.shortSummary, detail.detailedSummary, categoryChunks);

    const avgScore = newScores.length
      ? parseFloat((newScores.reduce((a, b) => a + b, 0) / newScores.length).toFixed(1))
      : null;

    let metadata = { party: 'Unknown', incumbency: false, bio: 'No bio available.' };
    const fullText = textEntries.map(e => e.text).join(' ').slice(0, 10000);

    try {
      const metaRes = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: buildMetadataPrompt(name, office, fullText) }],
        temperature: 0
      });
      const raw = metaRes.choices[0]?.message?.content?.trim() || '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        metadata = JSON.parse(match[0]);
      } else {
        throw new Error(`No JSON found in: ${raw}`);
      }
    } catch (err) {
      // console.warn(`Primary metadata parse failed for ${name}: ${err.message}`);
      try {
        const fallbackPrompt = `
You are a political analyst with access to public records and news data.

Candidate: ${name}
Office: ${office}

Respond in this JSON format:
{
  "party": "Democrat",
  "incumbency": true,
  "bio": "One-sentence personal/professional background"
}
`;
        const fallbackRes = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: fallbackPrompt }],
          temperature: 0
        });
        const raw = fallbackRes.choices[0]?.message?.content?.trim() || '';
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          metadata = JSON.parse(match[0]);
        } else {
          throw new Error(`No JSON found in fallback: ${raw}`);
        }
      } catch (fallbackErr) {
        console.error(`Fallback metadata error for ${name}: ${fallbackErr.message}`);
      }
    }

    const candidateObj = {
      name,
      party: metadata.party,
      incumbency: metadata.incumbency,
      bio: metadata.bio,
      scores: updatedScores,
      averageScore: avgScore
    };

    appendCandidateToFile(candidateObj, i === 0);
    console.log(`✅ Processed and saved: ${name}`);
  }

  closeArrayInFile();
  console.log("🎉 All candidates processed. File saved to refinedAnalyses.js");
})();
