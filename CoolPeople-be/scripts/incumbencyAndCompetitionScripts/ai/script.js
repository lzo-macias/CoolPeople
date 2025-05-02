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
      "previousExperience": ["short phrases describing any useful political, legal, community, or public service background"],
      "districtPartisanship": "Highly Democratic | Competitive | Highly Republican | Unknown"
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

    const officeKey = parsed.office.trim();

    // Save partisanship once per office/district
    if (!seenDistricts.has(officeKey)) {
      seenDistricts.add(officeKey);
      partisanshipMap.push({
        office: officeKey,
        districtPartisanship: parsed.districtPartisanship
      });
    }

    delete parsed.districtPartisanship;
    return parsed;
  } catch (error) {
    console.error(`Error analyzing ${candidate.name}:`, error.message);
    return null;
  }
}

async function run() {
  const results = [];
  for (const candidate of candidates) {
    console.log(`Analyzing ${candidate.name} (${candidate.office})...`);
    const result = await analyzeElectability(candidate);
    if (result) results.push(result);
    await new Promise(r => setTimeout(r, 1200)); // polite pacing
  }

  const outPath = path.join(__dirname, '../../../data/electabilityResults.js');
  const partisanshipOutPath = path.join(__dirname, '../../../data/districtPartisanshipMap.js');

  fs.writeFileSync(outPath, `module.exports = ${JSON.stringify(results, null, 2)};\n`);
  fs.writeFileSync(partisanshipOutPath, `module.exports = ${JSON.stringify(partisanshipMap, null, 2)};\n`);

  console.log(`\n✅ Electability data saved to ${outPath}`);
  console.log(`✅ District partisanship map saved to ${partisanshipOutPath}`);
}

run();
