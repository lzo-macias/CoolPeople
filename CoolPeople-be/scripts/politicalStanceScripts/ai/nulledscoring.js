const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const candidates = require('../../../data/listofcandidates.js');
const existingAnalyses = require('../../../olddata/candidateAnalyses2.js');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ISSUE_CATEGORIES = [
  "Affordable Housing",
  "Policing & Public Safety",
  "Education",
  "Public Transit",
  "Climate & Environment",
  "Immigration",
  "LGBTQ+ Rights",
  "Economic Development",
  "Homelessness",
  "Health Care Access",
  "Veterans & Military",
  "Government & Ethics",
  "Elections & Democracy",
  "Civil Rights & Discrimination"
];

function buildPrompt(name, office) {
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
    - Describe the candidate's specific actions (e.g., voting for bills, supporting programs, public speeches).
    - Cite specific bills by number (e.g., Intro 1867, Local Law 97), programs (e.g., NYC Care, NYCHA Blueprint), or initiatives.
    - Explain briefly what the bills or programs do.

- Include 2–3 official sources (council.nyc.gov, nyc.gov, nytimes.com, cityandstateny.com).

-some candidates are not in government or incumbents but have a personal website or a history of public service you can also mention that in a category 

- If no real information is available for a category, use:
  {
    "score": null,
    "shortSummary": "Not enough information available.",
    "detailedSummary": "Not enough public information available to assign a rating.",
    "sources": []
  }

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
        "https://council.nyc.gov/...",
        "https://cityandstateny.com/...",
        "https://nytimes.com/..."
      ]
    },
    ...
  },
  "averageScore": X.Y
}
`;;
}

async function analyzeCandidate(name, office) {
  const prompt = buildPrompt(name, office);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 3500,
    });

    const content = response.choices[0].message.content.trim().replace(/```json|```/g, '');
    return JSON.parse(content);
  } catch (err) {
    console.error(`❌ Failed to analyze ${name}:`, err.message);
    return null;
  }
}

async function runRerunScript() {
    const excludedNames = new Set([
      "Actille, Treasure J*",
      "Alayeto, Clarisa",
      "Rajkumar, Jenifer"
    ]);
  
    const failedNames = new Set(
      existingAnalyses.filter(c => c.averageScore === null && !excludedNames.has(c.name)).map(c => c.name)
    );
  
    const candidatesToRetry = candidates.filter(c => failedNames.has(c.name));
  
    console.log(`🔁 Re-analyzing ${candidatesToRetry.length} candidates...\n`);
  
    // Remove existing null entries that are being retried
    const updated = existingAnalyses.filter(c => !failedNames.has(c.name));
  
    for (const c of candidatesToRetry) {
      console.log(`🔍 Reprocessing: ${c.name}`);
      const result = await analyzeCandidate(c.name, c.office);
      if (result) {
        updated.push(result);
      } else {
        // If it still fails, preserve the original null entry
        const original = existingAnalyses.find(entry => entry.name === c.name);
        if (original) updated.push(original);
      }
  
      await new Promise(r => setTimeout(r, 1000)); // Rate limit buffer
    }
  
    const outputPath = path.join(__dirname, '../../../data/candidateAnalyses.js');
    const jsFormatted = `module.exports = ${JSON.stringify(updated, null, 2)};\n`;
  
    fs.writeFileSync(outputPath, jsFormatted);
    console.log(`✅ Updated file written to ${outputPath}`);
  }
  

runRerunScript();
