require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// File paths
const analysisPath = path.join(__dirname, '../../../data/candidateAnalyses.js');
const textfilesDir = path.join(__dirname, 'data/textfiles2');
const outputPath = path.join(__dirname, 'refinedAnalyses1.js');

// Read and parse candidateAnalyses.js
const parseCandidates = () => {
  const content = fs.readFileSync(analysisPath, 'utf-8');
  const jsonStr = content
    .replace(/^module\.exports\s*=\s*/, '')
    .replace(/;\s*$/, '');
  return JSON.parse(jsonStr);
};

// Load supplemental text data for a candidate (unused now but preserved for future use)
const loadCandidateText = (name) => {
  const filename = name.replace(/,/g, '').replace(/ /g, '_') + '.json';
  const fullPath = path.join(textfilesDir, filename);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content);
  }
  return [];
};

// AI fact-checking prompt (no extraText)
const buildFactCheckPrompt = (name, office, category, shortSummary, detailedSummary) => `
You are an expert political researcher reviewing a candidate's public record.

Candidate: ${name}, running for: ${office}  
Issue Area: ${category}

---  
📌 ORIGINAL SHORT SUMMARY:  
"${shortSummary}"

📌 ORIGINAL DETAILED SUMMARY:  
"${detailedSummary}"

---  
🔍 YOUR TASK:

1. **Fact check both summaries** using only widely known public sources (e.g. NYC Council, NY Times, public press releases).  
2. **DO NOT** mention any bill, program, or claim of support unless it is widely attributed to the candidate in public sources.  
3. If something is **uncertain or unverifiable**, **remove or revise** it.
4. If the summary is vague or overly optimistic, rewrite it to reflect only what is confidently known.
5. Write **factually grounded** and **concise** revised summaries in the style of a professional political analyst.
6. Assign a new or retained score **from 1 (very conservative) to 10 (very progressive)** based on the revised summaries.

---  
✅ RESPOND ONLY IN THIS VALID JSON FORMAT:
{
  "score": [number or null],
  "shortSummary": "Your corrected short summary.",
  "detailedSummary": "Your corrected detailed summary."
}
`;


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
}`;
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
    const name = candidate.name;
    const office = candidate.office || 'public office';
    const textEntries = loadCandidateText(name);
    const combinedText = Array.isArray(textEntries)
      ? textEntries.map(e => e.text).join(' ').slice(0, 10000)
      : '';

    const updatedScores = {};
    const newScores = [];

    for (const category of Object.keys(candidate.scores)) {
      const detail = candidate.scores[category];
      const prompt = buildFactCheckPrompt(name, office, category, detail.shortSummary, detail.detailedSummary);

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

    const avgScore = newScores.length
      ? parseFloat((newScores.reduce((a, b) => a + b, 0) / newScores.length).toFixed(1))
      : null;

    let metadata = { party: 'Unknown', incumbency: false, bio: 'No bio available.' };

    try {
      const metaRes = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: buildMetadataPrompt(name, office, combinedText) }],
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
      try {
        const fallbackPrompt = `
You are a political analyst with access to public records and news data.

Candidate: ${name}
Office: ${office}

Respond in this JSON format:
{
  "party": "Democrat",
  "incumbency": true,
  "bio": "One-sentence personal/professional background."
}`;
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