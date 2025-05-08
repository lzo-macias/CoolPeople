const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const candidates = require('../../../data/listofcandidates.js');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const seenDistricts = new Set();
const partisanshipMap = [];

async function analyzeElectability(candidate) {
  const prompt = `
You are a political analyst evaluating a local NYC candidate's electability.

Candidate: ${candidate.name}
Position: ${candidate.office}

Provide the following information as structured JSON:
{
  "name": "${candidate.name}",
  "office": "${candidate.office}",
  "incumbent": true | false,
  "previousExperience": ["short phrases describing any useful political, legal, community, or public service background"]
}

Use available knowledge and recent NYC elections as context. If information is insufficient, say so clearly.

Return ONLY valid JSON.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 700
    });

    const content = response.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    console.error(`❌ Error analyzing ${candidate.name}:`, error.message);
    return null;
  }
}

async function run() {
  const results = [];
  const outPath = path.join(__dirname, '../../../data/electabilityResults.js');
  let batchCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    console.log(`Analyzing ${i + 1}/${candidates.length}: ${candidate.name} (${candidate.office})...`);
    
    const result = await analyzeElectability(candidate);
    if (result) results.push(result);

    if ((i + 1) % 25 === 0 || i === candidates.length - 1) {
      fs.writeFileSync(outPath, `module.exports = ${JSON.stringify(results, null, 2)};\n`);
      console.log(`✅ Wrote ${results.length} results so far to ${outPath}`);
    }

    await new Promise(r => setTimeout(r, 1200)); // be polite
  }

  console.log(`\n🎉 All batches complete.`);
}

run();
