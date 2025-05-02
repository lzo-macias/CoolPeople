process.stdout.on('error', err => {
    if (err.code === 'EPIPE') {
      process.exit(0); // Exit cleanly if stdout pipe closes
    } else {
      throw err;
    }
  });

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const dataDir = path.resolve(__dirname, '..', '..', '..', '..', 'data', 'individualstancedata2');
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
    "Civil Rights & Discrimination": [
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

function extractHighlights(textChunks, issueKeywords = ISSUE_KEYWORDS) {
  const highlights = [];

  for (const { source, text } of textChunks) {
    for (const [issue, keywords] of Object.entries(issueKeywords)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`[^.?!]*\\b${keyword}\\b[^.?!]*[.?!]`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          matches.forEach(m => {
            highlights.push({ issue, sentence: m.trim(), source });
          });
        }
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

async function summarizeCandidate(name, textChunks) {
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY is not set in the environment.');
        process.exit(1);
      }
  // Format bill identifiers like A00350 or S01793 to start on a new line
  const combinedText = textChunks.map(t => t.text).join('\n');
  const formattedText = combinedText.replace(/([AS]\d{5})/g, '\n$1');
  
  const issueKeywordHits = scoreByIssue(formattedText);
  const highlights = extractHighlights(textChunks);

  const issues = {};

  for (const issue of Object.keys(ISSUE_KEYWORDS)) {
    const relevant = highlights.filter(h => h.issue === issue);
    const selectedText = relevant.map(h => h.sentence).slice(0, 5).join('\n');

    let stanceScoreValue = null;
    let stanceExplanation = 'Not enough context.';

    if (relevant.length > 0 && selectedText.length > 100) {
        const prompt = `
You're a political analyst. Based on the following statements related to the issue "${issue}", assign a stance score from 1 (very conservative) to 10 (very progressive).

Return your response in this format:
Rating: X
Reason: [3 concise sentences]

Statements:
"""
${selectedText}
"""`;

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        });
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500)); 

        const content = response.choices[0].message.content;
        const match = content.match(/Rating:\s*(\d+)/i);
        stanceScoreValue = match ? parseInt(match[1]) : null;
        stanceExplanation = content.replace(/Rating:\s*\d+\s*Reason:\s*/i, '').trim();
      } catch (err) {
        console.error(`❌ Failed stance generation for ${issue}:`, err.message);
      }
    }

    issues[issue] = {
      importanceScore: issueKeywordHits[issue],
      stanceScore: stanceScoreValue,
      stanceExplanation,
      highlights: relevant.slice(0, 3).map(h => ({ sentence: h.sentence, source: h.source }))
    };
  }

  // Aggregate ideology: average all non-null stance scores
  const validScores = Object.values(issues)
    .map(d => d.stanceScore)
    .filter(score => typeof score === 'number');

  let aggregateIdeology = { score: null, reasoning: 'Insufficient data.' };

  if (validScores.length > 0) {
    const avgScore = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);

    // Identify top 3 issues by importanceScore
    const topIssuesSorted = Object.entries(issues)
    .sort((a, b) => b[1].importanceScore - a[1].importanceScore)
    .slice(0, 3);
  
  const focusList = topIssuesSorted.map(([issue]) => issue).join(', ');
  const mergedReasoning = topIssuesSorted.map(([_, d]) => d.stanceExplanation.replace(/\n/g, ' ')).join(' ');
  
  let fullReasoning = `${name} focuses on issues such as ${focusList}. ${mergedReasoning}`;
  fullReasoning = fullReasoning.slice(0, 400).replace(/[^.]*$/, '').trim(); // Cut at last full sentence
  
  aggregateIdeology = {
    score: avgScore,
    reasoning: fullReasoning
  };
  }

  return {
    candidate: name,
    aggregateIdeology,
    issues,
  };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
    const candidateName = process.argv[2];
    if (!candidateName) {
        console.error("❌ Please provide a candidate name.");
        process.exit(1);
    }

    const candidateSlug = candidateName.replace(/ /g, '_');
    const jsonPath = path.join(dataDir, `${candidateSlug}.json`);
    const filePath = path.resolve(__dirname, '..', '..', '..', '..', `data/individualstancedata2/${candidateSlug}.json`);
    
    try {
        const rawJson = await readFile(filePath, 'utf-8');
        const textChunks = JSON.parse(rawJson);
    
        const summary = await summarizeCandidate(candidateName, textChunks);
        console.log(JSON.stringify(summary, null, 2));
    
        const jsPath = path.join(dataDir, `${candidateSlug}.js`);
        const jsContent = `export default ${JSON.stringify(summary, null, 2)};`;
    
        console.log("📁 Writing JS to:", jsPath);
        await writeFile(jsPath, jsContent, 'utf-8');
        
        console.log(`✅ JS file saved to ${jsPath}`);
        console.log(`✅ JSON saved to ${jsonPath}`);
    } catch (err) {
        console.error('❌ Error during scoring:', err.message);
        process.exit(1);
    }
    
}

