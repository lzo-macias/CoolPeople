// const fs = require('fs');
// const path = require('path');
// const OpenAI = require('openai');  // ✅ only this one
// const candidates = require('../../../data/listofcandidates.js');
// require('dotenv').config(); // ✅ load your .env

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const ISSUE_CATEGORIES = [
//   "Affordable Housing",
//   "Policing & Public Safety",
//   "Education",
//   "Public Transit",
//   "Climate & Environment",
//   "Immigration",
//   "LGBTQ+ Rights",
//   "Economic Development",
//   "Homelessness",
//   "Health Care Access",
//   "Veterans & Military",
//   "Government & Ethics",
//   "Elections & Democracy",
//   "Civil Rights & Discrimination"
// ];

// async function analyzeCandidate(name, office) {
//     const prompt = `
// You are an expert NYC civic analyst and political researcher.

// You must analyze the political stance of **${name}**, running for **${office}**.

// For each of the following 15 issue areas:

// - Assign a **score from 1 (very conservative) to 10 (very progressive)**.
// - Write two summaries per category:
  
//   1. **shortSummary**: 
//     - 2–3 sentences.
//     - Summarize if the candidate is progressive or conservative based on actions.
//     - Casually mention one or two bills, programs, or initiatives.

//   2. **detailedSummary**: 
//     - 4–6 sentences.
//     - Describe the candidate's specific actions (e.g., voting for bills, supporting programs, public speeches).
//     - Cite specific bills by number (e.g., Intro 1867, Local Law 97), programs (e.g., NYC Care, NYCHA Blueprint), or initiatives.
//     - Explain briefly what the bills or programs do.

// - Include 2–3 official sources (council.nyc.gov, nyc.gov, nytimes.com, cityandstateny.com).

// -some candidates are not in government or incumbents but have a personal website or a history of public service you can also mention that in a category 

// - If no real information is available for a category, use:
//   {
//     "score": null,
//     "shortSummary": "Not enough information available.",
//     "detailedSummary": "Not enough public information available to assign a rating.",
//     "sources": []
//   }

// IMPORTANT:
// - Return results as **VALID JSON** (no Markdown, no \`\`\`).
// - No commentary, explanations, or extra text.

// The categories:
// ${ISSUE_CATEGORIES.map((issue, idx) => `${idx + 1}. ${issue}`).join('\n')}

// Output JSON format:

// {
//   "name": "${name}",
//   "scores": {
//     "Affordable Housing": {
//       "score": 8,
//       "shortSummary": "...",
//       "detailedSummary": "...",
//       "sources": [
//         "https://council.nyc.gov/...",
//         "https://cityandstateny.com/...",
//         "https://nytimes.com/..."
//       ]
//     },
//     ...
//   },
//   "averageScore": X.Y
// }
// `;



  
//     try {
//       const response = await openai.chat.completions.create({
//         model: "gpt-4o",
//         messages: [{ role: "user", content: prompt }],
//         temperature: 0.4,
//         max_tokens: 3500,
//       });
  
//       const content = response.choices[0].message.content.trim();
//       const cleanContent = content.replace(/```json|```/g, '').trim(); // ✨ this line added
//       return JSON.parse(cleanContent);
//     } catch (error) {
//       console.error(`❌ Error analyzing ${name}:`, error.message);
//       return null;
//     }
//   }
  

// async function runAnalysis() {
//   const results = [];

//   for (const candidate of candidates) {
//     console.log(`🔎 Analyzing ${candidate.name} (${candidate.office})...`);
//     const result = await analyzeCandidate(candidate.name, candidate.office);
//     if (result) {
//       results.push(result);
//     }
//     await new Promise(resolve => setTimeout(resolve, 1000)); // slight delay to avoid rate limits
//   }

//   // Output as a proper .js file
//   const outPath = path.join(__dirname, '../../../data/candidateAnalyses.js');
//   const jsContent = `module.exports = ${JSON.stringify(results, null, 2)};\n`;

//   fs.writeFileSync(outPath, jsContent);
//   console.log(`✅ Analysis complete. Results saved to ${outPath}`);
// }

// runAnalysis();

// const fs = require('fs');
// const path = require('path');
// const OpenAI = require('openai');
// const candidates = require('../../../data/listofcandidates.js');
// require('dotenv').config();

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const ISSUE_CATEGORIES = [
//   "Affordable Housing",
//   "Policing & Public Safety",
//   "Education",
//   "Public Transit",
//   "Climate & Environment",
//   "Immigration",
//   "LGBTQ+ Rights",
//   "Economic Development",
//   "Homelessness",
//   "Health Care Access",
//   "Veterans & Military",
//   "Government & Ethics",
//   "Elections & Democracy",
//   "Civil Rights & Discrimination"
// ];

// function buildPrompt(name, office) {
//   return `
  
//   You are an expert NYC civic analyst and political researcher.

//   You must analyze the political stance of **${name}**, running for **${office}**.
  
//   For each of the following 15 issue areas:
  
//   - Assign a **score from 1 (very conservative) to 10 (very progressive)**.
//   - Write two summaries per category:
    
//     1. **shortSummary**: 
//       - 2–3 sentences.
//       - Summarize if the candidate is progressive or conservative based on actions.
//       - Casually mention one or two bills, programs, or initiatives.
  
//     2. **detailedSummary**: 
//       - 4–6 sentences.
//       - Describe the candidate's specific actions (e.g., voting for bills, supporting programs, public speeches).
//       - Cite specific bills by number (e.g., Intro 1867, Local Law 97), programs (e.g., NYC Care, NYCHA Blueprint), or initiatives.
//       - Explain briefly what the bills or programs do.
  
//   - **Include 2–3 specific citations with full URLs** (e.g., "https://council.nyc.gov/legislation/int-1867/").
//   - Do **not** just say "nytimes.com" or "cityandstateny.com" — link to the **exact page** the information comes from.
//   - If no sources are found, leave the \`sources\` array empty.
  
//   IMPORTANT:
//   - Return results as **VALID JSON** only (no Markdown or commentary).
//   - Use the following exact structure:
  
//   {
//     "name": "${name}",
//     "scores": {
//       "Affordable Housing": {
//         "score": 8,
//         "shortSummary": "...",
//         "detailedSummary": "...",
//         "sources": [
//           "https://council.nyc.gov/legislation/int-1867/",
//           "https://cityandstateny.com/politics/2023/09/some-policy.html",
//           "https://nytimes.com/2023/03/01/nyc-housing-bill.html"
//         ]
//       },
//       ...
//     },
//     "averageScore": X.Y
//   }
//   `;
// }

// function isValidSource(url) {
//   return /^https:\/\/(council\.nyc\.gov|nyc\.gov|nytimes\.com|cityandstateny\.com)\/.+/.test(url);
// }

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
//   } catch (error) {
//     console.error(`❌ Error analyzing ${name}:`, error.message);
//     return null;
//   }
// }

// async function runAnalysis() {
//   const BATCH_SIZE = 20;
//   const results = [];
//   const failed = [];

//   for (let i = 0; i < candidates.length; i++) {
//     const candidate = candidates[i];
//     console.log(`🔎 [${i + 1}/${candidates.length}] Analyzing ${candidate.name} (${candidate.office})`);

//     const result = await analyzeCandidate(candidate.name, candidate.office);

//     if (result) {
//       for (const [issue, data] of Object.entries(result.scores)) {
//         if (data.sources) {
//           data.sources = data.sources.filter(isValidSource);
//         }
//       }
//       results.push(result);
//     } else {
//       failed.push(candidate);
//     }

//     if ((i + 1) % BATCH_SIZE === 0) {
//       console.log(`⏳ Waiting to reduce load...`);
//       await new Promise(resolve => setTimeout(resolve, 5000));
//     } else {
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }
//   }

//   const outPath = path.join(__dirname, '../../../data/candidateAnalyses.js');
//   const jsContent = `module.exports = ${JSON.stringify(results, null, 2)};\n`;
//   fs.writeFileSync(outPath, jsContent);
//   console.log(`✅ Saved ${results.length} analyses to ${outPath}`);

//   if (failed.length) {
//     console.log(`⚠️ ${failed.length} candidates failed:`);
//     failed.forEach(c => console.log(` - ${c.name}`));
//   }
// }

// runAnalysis().catch(console.error);

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { search } = require('duckduckgo-search');
const candidates = require('../../../data/listofcandidates.js');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ISSUE_CATEGORIES = [
  "Affordable Housing", "Policing & Public Safety", "Education", "Public Transit", "Climate & Environment",
  "Immigration", "LGBTQ+ Rights", "Economic Development", "Homelessness", "Health Care Access",
  "Veterans & Military", "Government & Ethics", "Elections & Democracy", "Civil Rights & Discrimination"
];

function buildPrompt(name, office, contextText = '') {
  return `
You are an expert NYC civic analyst and political researcher.

You must analyze the political stance of **${name}**, running for **${office}**.

${contextText ? `Here is some real information about the candidate:
"""
${contextText}
"""` : ''}

For each of the following 15 issue areas:
- Assign a **score from 1 (very conservative) to 10 (very progressive)**.
- Write two summaries per category:
  1. **shortSummary**: 
    - 2–3 sentences.
    - Summarize if the candidate is progressive or conservative based on actions.
    - Casually mention one or two bills, programs, or initiatives.
  2. **detailedSummary**: 
    - 4–6 sentences.
    - Describe the candidate's specific actions (e.g., voting for bills, supporting programs, public speeches).
    - Cite specific bills by number (e.g., Intro 1867, Local Law 97), programs (e.g., NYC Care, NYCHA Blueprint), or initiatives.
    - Explain briefly what the bills or programs do.
    - **Include 2–3 specific citations with full URLs** (e.g., "https://council.nyc.gov/legislation/int-1867/").
    - Do **not** just say "nytimes.com" or "cityandstateny.com" — link to the **exact page** the information comes from.
    - If no sources are found, leave the \`sources\` array empty.

IMPORTANT:
Return only **VALID JSON** with this structure:
{
  "name": "${name}",
  "scores": {
    "Affordable Housing": {
      "score": 8,
      "shortSummary": "...",
      "detailedSummary": "...",
      "sources": ["https://...", "https://..."]
    },
    ...
  },
  "averageScore": X.Y
}
`;
}


function isValidSource(url) {
  return /^https:\/\/(council\.nyc\.gov|nyc\.gov|nytimes\.com|cityandstateny\.com)\/.+/.test(url);
}

async function hasSufficientWebPresence(name) {
  const query = `\"${name}\" site:council.nyc.gov OR site:nyc.gov OR site:cityandstateny.com OR site:nytimes.com`;
  try {
    const results = await search(query, { maxResults: 3 });
    return results && results.length >= 2;
  } catch (e) {
    console.warn(`⚠️ Web search failed for ${name}`);
    return false;
  }
}

async function analyzeCandidate(candidate) {
  const hasPresence = await hasSufficientWebPresence(candidate.name);
  if (!hasPresence) return null;

  const prompt = buildPrompt(candidate.name, candidate.office);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 3500,
    });

    const content = response.choices[0].message.content.trim().replace(/```json|```/g, '');
    const result = JSON.parse(content);

    for (const [issue, data] of Object.entries(result.scores)) {
      if (!data.sources || data.sources.filter(isValidSource).length === 0) {
        result.scores[issue] = {
          score: null,
          shortSummary: "Not enough information available.",
          detailedSummary: "Not enough public information available to assign a rating.",
          sources: []
        };
      } else {
        data.sources = data.sources.filter(isValidSource);
      }
    }

    return result;
  } catch (error) {
    console.error(`❌ Error analyzing ${candidate.name}:`, error.message);
    return null;
  }
}

async function runAnalysis() {
  const BATCH_SIZE = 20;
  const results = [];
  const failed = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    console.log(`🔎 [${i + 1}/${candidates.length}] Analyzing ${candidate.name} (${candidate.office})`);

    const result = await analyzeCandidate(candidate);
    if (result) {
      results.push(result);
    } else {
      failed.push(candidate);
    }

    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(`⏳ Batch pause to reduce load...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const outPath = path.join(__dirname, '../../../data/candidateAnalyses.js');
  const jsContent = `module.exports = ${JSON.stringify(results, null, 2)};\n`;
  fs.writeFileSync(outPath, jsContent);
  console.log(`✅ Saved ${results.length} analyses to ${outPath}`);

  if (failed.length) {
    console.log(`⚠️ ${failed.length} candidates failed:`);
    failed.forEach(c => console.log(` - ${c.name}`));
  }
}

runAnalysis().catch(console.error);
