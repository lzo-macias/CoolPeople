const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');  // ✅ only this one
const candidates = require('../../../data/listofcandidates.js');
require('dotenv').config(); // ✅ load your .env

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

async function analyzeCandidate(name, office) {
    const prompt = `
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
`;



  
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 3500,
      });
  
      const content = response.choices[0].message.content.trim();
      const cleanContent = content.replace(/```json|```/g, '').trim(); // ✨ this line added
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error(`❌ Error analyzing ${name}:`, error.message);
      return null;
    }
  }
  

async function runAnalysis() {
  const results = [];

  for (const candidate of candidates) {
    console.log(`🔎 Analyzing ${candidate.name} (${candidate.office})...`);
    const result = await analyzeCandidate(candidate.name, candidate.office);
    if (result) {
      results.push(result);
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // slight delay to avoid rate limits
  }

  // Output as a proper .js file
  const outPath = path.join(__dirname, '../../../data/candidateAnalyses.js');
  const jsContent = `module.exports = ${JSON.stringify(results, null, 2)};\n`;

  fs.writeFileSync(outPath, jsContent);
  console.log(`✅ Analysis complete. Results saved to ${outPath}`);
}

runAnalysis();
