// hybridRerun.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const OpenAI = require('openai');
const candidates = require('../../../data/listofcandidates');
// const existingAnalyses = require('../../../data/candidateAnalyses');
require('dotenv').config();
const { jsonrepair } = require('jsonrepair');


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUTPUT_PATH = path.join(__dirname, '../../../data/newAnalysis.js');

const ISSUE_CATEGORIES = [
  "Affordable Housing", "Policing & Public Safety", "Education", "Public Transit",
  "Climate & Environment", "Immigration", "LGBTQ+ Rights", "Economic Development",
  "Homelessness", "Health Care Access", "Veterans & Military", "Government & Ethics",
  "Elections & Democracy", "Civil Rights & Discrimination"
];

function buildPrompt(name, office, fallbackTextByCategory = {}) {
  const fallbackWarning = `⚠️ NOTE: Some supporting excerpts may not name the candidate directly but come from a page that mentions them elsewhere. Use judgment to connect their stance where reasonable.\n`;

  return `
    You are an expert NYC civic analyst and political researcher.

    You must analyze the political stance of **${name}**, running for **${office}**.

    For each of the following 15 issue areas:

    - Assign a **score from 1 (very conservative) to 10 (very progressive)**.
    - Write two summaries per category:

      1. **shortSummary**: 
        - 2–3 sentences.
        - Summarize if the candidate is progressive or conservative based on actions.
        - Casually mention one or two bills, programs, or initiatives.

      2. **detailedSummary**: 
        - 4–6 sentences.
 Describe the candidate's specific actions (e.g., voting for bills, supporting programs, public speeches).
If no direct evidence exists, clearly state that no specific actions were found. Do not infer or fabricate actions or support.
        - Explain briefly what the bills or programs do.

      - **Include 2–3 citations with URLs**

    - Some candidates are not in government or incumbents but have a personal website or a history of public service. You may mention that in a category.  

    - If no real information is available for a category, use:
      {
        "score": null,
        "shortSummary": "Not enough information available.",
        "detailedSummary": "Not enough public information available to assign a rating.",
        "sources": []
      }

    ${Object.keys(fallbackTextByCategory).length > 0 ? fallbackWarning : ''}

    IMPORTANT:
    - Return results as **VALID JSON** (no Markdown, no \`\`\`).
    - No commentary, explanations, or extra text.

    The categories:
    ${ISSUE_CATEGORIES.map((issue, idx) => `${idx + 1}. ${issue}`).join('\n')}

    Output JSON format:

    {
      "name": "${name}",
      "scores": {
        "Affordable Housing": {
          "score": 8,
          "shortSummary": "...",
          "detailedSummary": "...",
          "sources": [
            "example...",
            "example...",
            "example..."
          ]
        },
        ...
      },
      "averageScore": X.Y
    }`;
}

const buildMetadataPrompt = (name, office, extraText) => {
  console.log("this is my extraText", extraText)
  const inputText = extraText && extraText.length >= 100 ? extraText.slice(0, 10000) : ''
  console.log("this is my inputtext", inputText);

  return `
You are a political analyst reviewing raw, possibly messy text about a candidate.

Candidate Name: ${name}
Candidate Office: ${office}

Text source:
"""
${inputText}
"""

Instructions:

From the above, extract:

- "party": Political party (Democrat, Republican, Independent, or Other)
- "bio": Read the text and write a **one-sentence** professional or personal background.

Return valid JSON only:
{
  "party": "Democrat",
  "bio": "Tenant attorney and community activist from Washington Heights"
}
`;
};

async function analyzeCandidate(name, office) {
  const prompt = buildPrompt(name, office);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 3500,
    });

    const rawContent = response.choices[0].message.content.trim().replace(/```json|```/g, '');
    const match = rawContent.match(/\{[\s\S]*\}/);

    if (!match) {
      console.error(`❌ No valid JSON block found in GPT output for ${name}`);
      console.error(`🔎 Raw content: ${rawContent.slice(0, 300)}`);
      return null;
    }

    const jsonText = match[0];

    try {
      return JSON.parse(jsonText);
    } catch (err) {
      console.warn(`⚠️ JSON parse failed for ${name}: ${err.message}`);
      console.warn(`🛠️ Attempting auto-repair on JSON...`);

      try {
        const repaired = jsonrepair(jsonText);
        return JSON.parse(repaired);
      } catch (repairErr) {
        console.error(`❌ Failed to repair and parse JSON for ${name}:`, repairErr.message);
        return null;
      }
    }
  } catch (err) {
    console.error(`❌ OpenAI call failed for ${name}:`, err.message);
    return null;
  }
}

async function rerunWithFallback() {
  let existing = [];
  if (fs.existsSync(OUTPUT_PATH)) {
    const raw = fs.readFileSync(OUTPUT_PATH, 'utf-8');
    const match = raw.match(/module\.exports\s*=\s*\[(.*)\];/s);
    if (match) {
      try {
        const arrayContent = `[${match[1].trim().replace(/,\s*$/, '')}]`;
        existing = JSON.parse(arrayContent);
      } catch (e) {
        console.error("❌ Could not parse existing output file:", e.message);
      }
    }
  }

  const processedNames = new Set(existing.map(c => c.name));
  let isFirst = existing.length === 0;

  const stream = fs.createWriteStream(OUTPUT_PATH, { flags: 'w' });
  stream.write('module.exports = [\n');
  if (existing.length) {
    const existingStr = existing.map(c => JSON.stringify(c, null, 2)).join(',\n');
    stream.write(existingStr);
  }

  for (const candidate of candidates) {
    const { name, office } = candidate;
    if (processedNames.has(name)) {
      console.log(`✅ Already processed: ${name}`);
      continue;
    }

    console.log(`\n🔄 Processing new candidate: ${name}`);
    let analysis = await analyzeCandidate(name, office);
    if (!analysis) continue;

    for (const category of ISSUE_CATEGORIES) {
      const data = analysis.scores[category];
      if (data && data.score === null) {
        console.log(`  ⚠️ Missing info for '${category}', triggering txtscraper...`);

        try {
          execSync(`python3 scripts/politicalStanceScripts/ai/txtscraper2.py "${name}" "${category}"`, { stdio: 'inherit' });
          const slug = name.replace(/,/g, '').replace(/ /g, '_');
          const filepath = path.join(__dirname, `../../../data/textfiles5/${slug}.json`);
          console.log(`📁 Reading: ${filepath}`);

          if (fs.existsSync(filepath)) {
            const chunks = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
            const relevantChunks = chunks
              .filter(c => c.category === category && c.text)
              .sort((a, b) => {
                const scoreA = typeof a.score === 'number' ? a.score : -1;
                const scoreB = typeof b.score === 'number' ? b.score : -1;
                return scoreB - scoreA;
              })
              .slice(0, 5)
              .map(c => c.text);

            console.log(`📌 Using ${relevantChunks.length} fallback chunks for ${category}`);

            const fallbackPrompt = buildPrompt(name, office, { [category]: relevantChunks.join('\n\n') });
            const factRes = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [{ role: 'user', content: fallbackPrompt }],
              temperature: 0.7,
            });
            const fcData = JSON.parse(factRes.choices[0].message.content);
            analysis.scores[category] = fcData.scores[category];

            console.log(`✅ Updated score for ${category}:`, fcData.scores[category]);
          }
        } catch (err) {
          console.error(`    ❌ txtscraper or fallback GPT call failed for ${name} (${category})`, err.message);
        }
      }
    }

    try {
      if (!analysis.party || !analysis.bio) {
        const slug = name.replace(/,/g, '').replace(/ /g, '_');
        const txtFilePath = path.join(__dirname, `../../../data/textfiles5/${slug}.json`);

        let chunks = [];
        if (fs.existsSync(txtFilePath)) {
          chunks = JSON.parse(fs.readFileSync(txtFilePath, 'utf-8'));
        }

        let bioChunks = chunks.filter(c => c.category === 'bio' && c.text);

        if (bioChunks.length === 0) {
          console.log(`⚠️ No bio chunks yet, re-running bio scrape for ${name}`);
          execSync(`python3 scripts/politicalStanceScripts/ai/txtscraper2.py "${name}" "bio"`, { stdio: 'inherit' });

          if (fs.existsSync(txtFilePath)) {
            chunks = JSON.parse(fs.readFileSync(txtFilePath, 'utf-8'));
            bioChunks = chunks.filter(c => c.category === 'bio' && c.text);
          }
        }

        bioChunks = bioChunks
          .map(c => c.text.trim())
          .sort((a, b) => b.length - a.length)
          .slice(0, 5);

        const bioText = bioChunks.join('\n\n').slice(0, 5000);
        console.log(`🧪 BIO TEXT (${name}): ${bioText.slice(0, 300)}`);

        const metaPrompt = buildMetadataPrompt(name, office, bioText);
        const metaRes = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: metaPrompt }],
          temperature: 0.2,
        });

        const raw = metaRes.choices[0].message.content.trim();
        const match = raw.match(/\{[\s\S]*\}/);
        const metadata = match ? JSON.parse(match[0]) : null;

        if (metadata && typeof metadata.bio === 'string' && metadata.bio.trim().length > 0) {
          analysis.party = metadata.party;
          analysis.bio = metadata.bio.trim();
          console.log(`✅ Metadata updated: ${metadata.party}, ${metadata.bio}`);
        } else {
          console.warn(`⚠️ Metadata returned empty or invalid bio for ${name}`);
          analysis.bio = "Candidate with limited public background information.";
          analysis.party = metadata?.party || "Unknown";
        }
      }
    } catch (err) {
      console.error(`❌ Metadata prompt failed for ${name}:`, err.message);
    }


    const scores = Object.values(analysis.scores).map(s => s.score).filter(s => typeof s === 'number');
    analysis.averageScore = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

    stream.write(existing.length || !isFirst ? ',\n' : '');
    stream.write(JSON.stringify(analysis, null, 2));
    isFirst = false;

    await new Promise(r => setTimeout(r, 1000));
  }

  stream.write('\n];\n');
  stream.end();
  console.log(`\n✅ Update complete. Appended to ${OUTPUT_PATH}`);
}


rerunWithFallback();

// hybridRerun.js
// hybridRerun.js
// hybridRerun.js

// hybridRerun.js
// const fs = require('fs');
// const path = require('path');
// const { execSync } = require('child_process');
// const OpenAI = require('openai');
// const candidates = require('../../../data/listofcandidates');
// require('dotenv').config();

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// const OUTPUT_PATH = path.join(__dirname, '../../../data/newAnalysis.js');

// const ISSUE_CATEGORIES = [
//   "Affordable Housing", "Policing & Public Safety", "Education", "Public Transit",
//   "Climate & Environment", "Immigration", "LGBTQ+ Rights", "Economic Development",
//   "Homelessness", "Health Care Access", "Veterans & Military", "Government & Ethics",
//   "Elections & Democracy", "Civil Rights & Discrimination"
// ];

// function buildPrompt(name, office, fallbackTextByCategory = {}) {
//   const fallbackWarning = `\n\n⚠️ NOTE: Some supporting excerpts may not name the candidate directly but come from a page that mentions them elsewhere. Use judgment to connect their stance where reasonable.`;
//   return `
// You are an expert NYC civic analyst and political researcher.

// You must analyze the political stance of **${name}**, running for **${office}**.

// For each of the following 15 issue areas:

// - Assign a **score from 1 (very conservative) to 10 (very progressive)**.
// - Write two summaries per category:

//   1. **shortSummary**: 2–3 sentences summarizing the candidate's stance.
//   2. **detailedSummary**: 4–6 sentences describing specific actions (bills supported or proposed, endoresments, speeches etc...). If no direct evidence exists, clearly state that no specific actions were found. Do not infer or fabricate.

// - Include 2–3 citations with URLs.
// - Add a field called **needsFallback**:
//   - true if no specific actions or sources were found
//   - false if real actions and sources are used

// If no real information is available, use:
// {
//   "score": null,
//   "shortSummary": "Not enough information available.",
//   "detailedSummary": "Not enough public information available to assign a rating.",
//   "sources": [],
//   "needsFallback": true
// }

// ${Object.keys(fallbackTextByCategory).length > 0 ? fallbackWarning : ''}

// Return valid JSON only (no Markdown).

// The categories:
// ${ISSUE_CATEGORIES.map((issue, idx) => `${idx + 1}. ${issue}`).join('\n')}

// Output format:
// {
//   "name": "${name}",
//   "scores": {
//     "Affordable Housing": {
//       "score": 8,
//       "shortSummary": "...",
//       "detailedSummary": "...",
//       "sources": ["url1", "url2"],
//       "needsFallback": false
//     },
//     ...
//   },
//   "averageScore": X.Y
// }`;
// }

// const buildMetadataPrompt = (name, office, extraText) => {
//   const inputText = extraText && extraText.length >= 100 ? extraText.slice(0, 10000) : '';
//   return `
// You are a political analyst reviewing background data about a candidate.

// Candidate Name: ${name}
// Candidate Office: ${office}

// Below is some raw text about them:
// """
// ${inputText}

// """
//   - "bio": A single sentence summarizing their professional, political, and civic background. Avoid vague titles. Prefer bios that include multiple roles (e.g., “former public defender, nonprofit director, and tenant rights advocate”).


// Extract the following in JSON format Example:
// {
//   "party": "Democrat",
//   "bio": "Former teacher, union organizer, and long time tenant rights attorney."
// }`;
// };

// async function analyzeCandidate(name, office) {
//   const prompt = buildPrompt(name, office);
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.4,
//       max_tokens: 3500,
//     });
//     const content = response.choices[0].message.content.trim().replace(/```json|```/g, '');
//     return JSON.parse(content);
//   } catch (err) {
//     console.error(`❌ Initial analysis failed for ${name}:`, err.message);
//     return null;
//   }
// }

// async function rerunWithFallback() {
//   if (fs.existsSync(OUTPUT_PATH)) fs.unlinkSync(OUTPUT_PATH);
//   fs.appendFileSync(OUTPUT_PATH, 'module.exports = [\n');

//   let isFirst = true;
//   for (const candidate of candidates) {
//     const { name, office } = candidate;
//     console.log(`\n🔄 Processing: ${name}`);

//     let analysis = await analyzeCandidate(name, office);
//     console.log(`📬 Received initial analysis for ${name}:`, !!analysis);
//     if (!analysis) continue;

//     for (const category of ISSUE_CATEGORIES) {
//       const data = analysis.scores[category];
//       if (data && (data.score === null || data.needsFallback === true)) {
//         console.log(`  ⚠️ Triggering fallback for '${category}'...`);
//         try {
//           execSync(`python3 scripts/politicalStanceScripts/ai/txtscraper2.py "${name}" "${category}"`, { stdio: 'inherit' });
//           const slug = name.replace(/,/g, '').replace(/ /g, '_');
//           const filepath = path.join(__dirname, `../../../data/textfiles4/${slug}.json`);
//           if (fs.existsSync(filepath)) {
//             const chunks = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
//             const relevantChunks = chunks.filter(c => c.category === category && c.text).slice(0, 5).map(c => c.text);
//             const fallbackPrompt = buildPrompt(name, office, { [category]: relevantChunks.join('\n\n') });
//             const factRes = await openai.chat.completions.create({
//               model: 'gpt-4o',
//               messages: [{ role: 'user', content: fallbackPrompt }],
//               temperature: 0.6
//             });
//             const fcData = JSON.parse(factRes.choices[0].message.content);
//             analysis.scores[category] = fcData.scores[category];
//           }
//         } catch (err) {
//           console.error(`❌ Fallback failed for ${name} (${category}):`, err.message);
//         }
//       }
//     }

//     // Always extract metadata from scraped bio
//     try {
//       const slug = name.replace(/,/g, '').replace(/ /g, '_');
//       const txtFilePath = path.join(__dirname, `../../../data/textfiles4/${slug}.json`);

//       if (!fs.existsSync(txtFilePath)) {
//         execSync(`python3 scripts/politicalStanceScripts/ai/txtscraper2.py "${name}" "bio"`, { stdio: 'inherit' });
//       }

//       const chunks = fs.existsSync(txtFilePath) ? JSON.parse(fs.readFileSync(txtFilePath, 'utf-8')) : [];
//       const bioText = chunks.filter(c => c.category === 'bio' && c.text).map(c => c.text).join(' ').slice(0, 10000);

//       console.log(`🧪 BIO TEXT (${name}): ${bioText.slice(0, 300)}`);

//       const metaPrompt = buildMetadataPrompt(name, office, bioText);
//       const metaRes = await openai.chat.completions.create({
//         model: "gpt-4o",
//         messages: [{ role: "user", content: metaPrompt }],
//         temperature: 0.4,
//       });

//       const raw = metaRes.choices[0].message.content.trim();
//       const match = raw.match(/\{[\s\S]*\}/);
//       const metadata = match ? JSON.parse(match[0]) : null;

//       if (metadata) {
//         analysis.party = metadata.party;
//         analysis.bio = metadata.bio;
//         console.log(`✅ Metadata updated: ${metadata.party}, ${metadata.bio}`);
//       } else {
//         console.warn(`⚠️ Still no metadata for ${name}`);
//       }
//     } catch (err) {
//       console.error(`❌ Metadata prompt failed for ${name}:`, err.message);
//     }

//     const scores = Object.values(analysis.scores).map(s => s.score).filter(s => typeof s === 'number');
//     analysis.averageScore = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

//     const prefix = isFirst ? '' : ',\n';
//     fs.appendFileSync(OUTPUT_PATH, prefix + JSON.stringify(analysis, null, 2));
//     isFirst = false;
//   }

//   fs.appendFileSync(OUTPUT_PATH, '\n];\n');
//   console.log(`\n✅ All done. Output saved to ${OUTPUT_PATH}`);
// }

// rerunWithFallback();
