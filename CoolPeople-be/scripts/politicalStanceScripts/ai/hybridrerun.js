// hybridRerun.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const OpenAI = require('openai');
const candidates = require('../../../data/listofcandidates');
const existingAnalyses = require('../../../data/candidateAnalyses');
require('dotenv').config();

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
          - Describe the candidate's specific actions (e.g., voting for bills, supporting programs, public speeches).
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
    const inputText = extraText && extraText.length >= 100 ? extraText.slice(0, 10000) : '';
  
    return `
      You are a political analyst reviewing background data about a candidate.
  
      Candidate Name: ${name}
      Candidate Office (what the are running for, they might already hold that office but not mostly): ${office}
  
      Below is some raw text about them:
      """
      ${inputText}
      """
  
      From the above, extract:
  
      - "party": Their political party (Democrat, Republican, Independent, or Other)
      - "bio": A one-sentence professional or personal background
  
      Respond in this JSON format:
      {
        "party": "Democrat",
        "bio": "Former teacher and union organizer."
      }`;
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
      const content = response.choices[0].message.content.trim().replace(/```json|```/g, '');
      return JSON.parse(content);
    } catch (err) {
      console.error(`❌ Initial analysis failed for ${name}:`, err.message);
      return null;
    }
  }
  
async function rerunWithFallback() {
    if (fs.existsSync(OUTPUT_PATH)) fs.unlinkSync(OUTPUT_PATH);
    fs.appendFileSync(OUTPUT_PATH, 'module.exports = [\n');
  
    let isFirst = true;
  
    for (const candidate of candidates) {
      const { name, office } = candidate;
      console.log(`\n🔄 Processing: ${name}`);
  
      let analysis = await analyzeCandidate(name, office);
      if (!analysis) continue;
  
      for (const category of ISSUE_CATEGORIES) {
        const data = analysis.scores[category];
        if (data && data.score === null) {
          console.log(`  ⚠️ Missing info for '${category}', triggering txtscraper...`);
      
          try {
            execSync(`python3 scripts/politicalStanceScripts/ai/txtscraper2.py "${name}" "${category}"`, { stdio: 'inherit' });
            const slug = name.replace(/,/g, '').replace(/ /g, '_');
            const filepath = path.join(__dirname, `../../../data/textfiles4/${slug}.json`);
            console.log(slug)
      
            if (fs.existsSync(filepath)) {
              const chunks = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
              const relevantChunks = chunks
              .filter(c => c.category === category && c.text)
              .sort((a, b) => {
                // Sort descending by score; treat null as lowest
                const scoreA = typeof a.score === 'number' ? a.score : -1;
                const scoreB = typeof b.score === 'number' ? b.score : -1;
                return scoreB - scoreA;
              })
              .slice(0, 5)
              .map(c => c.text);
      
              const fallbackPrompt = buildPrompt(name, office, { [category]: relevantChunks.join('\n\n') });
              const factRes = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: fallbackPrompt }],
                temperature: 0,
              });
              const fcData = JSON.parse(factRes.choices[0].message.content);
              analysis.scores[category] = fcData.scores[category];
              console.log(analysis.scores[category])
            }
          } catch (err) {
            console.error(`    ❌ txtscraper or fallback GPT call failed for ${name} (${category})`, err.message);
          }
        }
      }
      
      // Step 2: Handle missing bio/party
      try {
        if (!analysis.party || !analysis.bio) {
          console.log("party",analysis.party)
          console.log("bio",analysis.bio)

          const slug = name.replace(/,/g, '').replace(/ /g, '_');
          const txtFilePath = path.join(__dirname, `../../../data/textfiles4/${slug}.json`);
      
          if (!fs.existsSync(txtFilePath)) {
            execSync(`python3 scripts/politicalStanceScripts/ai/txtscraper2.py "${name}" "bio"`, { stdio: 'inherit' });
          }
      
          const chunks = fs.existsSync(txtFilePath)
            ? JSON.parse(fs.readFileSync(txtFilePath, 'utf-8'))
            : [];
      
          const bioText = chunks
            .filter(c => c.category === 'bio' && c.text)
            .map(c => c.text)
            .join(' ')
            .slice(0, 10000);
      
          console.log(`🧪 BIO TEXT (${name}): ${bioText.slice(0, 300)}`);
      
          const metaPrompt = buildMetadataPrompt(name, office, bioText);
          const metaRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: metaPrompt }],
            temperature: 0,
          });
      
          const raw = metaRes.choices[0].message.content.trim();
          const match = raw.match(/\{[\s\S]*\}/);
          const metadata = match ? JSON.parse(match[0]) : null;
      
          if (metadata) {
            analysis.party = metadata.party;
            analysis.bio = metadata.bio;
          } else {
            console.warn(`⚠️ Still no metadata for ${name}`);
          }
        }
      } catch (err) {
        console.error(`❌ Metadata prompt failed for ${name}:`, err.message);
      }
      // AFTER the for-loop of ISSUE_CATEGORIES (line ~132)
      try {
        if (!analysis.party || !analysis.bio) {
          const slug = name.replace(/,/g, '').replace(/ /g, '_');
          const txtFilePath = path.join(__dirname, `../../../data/textfiles4/${slug}.json`);
      
          if (!fs.existsSync(txtFilePath)) {
            execSync(`python3 scripts/politicalStanceScripts/ai/txtscraper2.py "${name}" "bio"`, { stdio: 'inherit' });
          }
      
          const chunks = fs.existsSync(txtFilePath)
            ? JSON.parse(fs.readFileSync(txtFilePath, 'utf-8'))
            : [];
      
          const bioText = chunks
            .filter(c => c.category === 'bio' && c.text)
            .map(c => c.text)
            .join(' ')
            .slice(0, 10000);
      
          const metaPrompt = buildMetadataPrompt(name, office, bioText);
          const metaRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: metaPrompt }],
            temperature: 0,
          });
      
          const raw = metaRes.choices[0].message.content.trim();
          const match = raw.match(/\{[\s\S]*\}/);
          const metadata = match ? JSON.parse(match[0]) : null;
      
          if (metadata) {
            analysis.party = metadata.party;
            analysis.bio = metadata.bio;
          } else {
            console.warn(`⚠️ Still no metadata for ${name}`);
          }
        }
      } catch (err) {
        console.error(`❌ Metadata prompt failed for ${name}:`, err.message);
      }
  
  
      const scores = Object.values(analysis.scores)
        .map(s => s.score)
        .filter(s => typeof s === 'number');
      analysis.averageScore = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  
      const prefix = isFirst ? '' : ',\n';
      fs.appendFileSync(OUTPUT_PATH, prefix + JSON.stringify(analysis, null, 2));
      isFirst = false;
  
      await new Promise(r => setTimeout(r, 1000));
    }
  
    fs.appendFileSync(OUTPUT_PATH, '\n];\n');
    console.log(`\n✅ All done. Output saved to ${OUTPUT_PATH}`);
  }
  
  rerunWithFallback();
  