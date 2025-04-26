import axios from 'axios';
import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = 'f94bcaf62d3cdac70895d723d1996135';
const BASE_URL = 'https://api.legiscan.com/';
const DATA_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'testDataAi', 'testStanceDataAi');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
    "Civil Rights & Memory": [
      'statue', 'monument', 'historic', 'memorial', 'desecration', 'heritage',
      'civil rights', 'racial justice', 'equity', 'segregation', 'reparations',
      'discrimination', 'commemoration', 'historic site', 'injustice', 'diversity'
    ]
  };

async function AigetStanceScore(Number, description) {
  const prompt = `
You are a political analyst. Evaluate the ideological stance of the following legislative bill. On a scale from 1 (very conservative) to 10 (very progressive), how would you rate this bill based on its language, policy goals, and typical partisan alignment?

Bill Number: ${Number}
Bill Description: ${description}

Return your rating and 1-sentence reasoning like this:
Rating: X
Reason: [short explanation]
`;

  const response = await openai.chat.completions.create({
    model: "GPT-4o Mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3
  });

  const content = response.choices[0].message.content;
  const match = content.match(/Rating:\s*(\d+)/i);
  const score = match ? parseInt(match[1]) : 5;

  return { score, reasoning: content };
}

async function fetchSponsoredBills(legislatorId) {
  const limit = pLimit(5);
  const response = await axios.get(BASE_URL, {
    params: { key: API_KEY, op: 'getSponsoredList', id: legislatorId }
  });

  const basicList = response.data?.sponsoredbills?.bills || [];
  const filteredList = basicList.filter(b => !b.number.startsWith('K'));

  const detailedBills = await Promise.all(
    filteredList.map(({ bill_id }) =>
      limit(async () => {
        try {
          const billResponse = await axios.get(BASE_URL, {
            params: { key: API_KEY, op: 'getBill', id: bill_id }
          });
          const bill = billResponse.data?.bill;
          return bill?.title ? bill : null;
        } catch {
          return null;
        }
      })
    )
  );

  return detailedBills.filter(Boolean);
}

async function scoreByIssue(bills) {
    const scores = {};
    const highlights = {};
    const importance = {};
  
    let totalAiRequests = 0; // Track how many AI calls would be made
  
    for (const [issue, keywords] of Object.entries(ISSUE_KEYWORDS)) {
      const relevant = [];
      const issueScores = [];
      let keywordHits = 0;
  
      for (const bill of bills) {
        const text = bill.description || '';
        console.log(`🔎 Checking bill: ${bill.title}`);
        console.log(`📝 Description: ${text.slice(0, 200)}...`);
        const lower = text.toLowerCase();
        const matched = keywords.filter(k => lower.includes(k));
        console.log(`🎯 Matched for [${issue}]:`, matched);

  
        keywordHits += matched.length;
  
        if (matched.length > 0) {
          relevant.push(text.trim());
          totalAiRequests++;
  
          console.log(`🧠 WOULD send to AI [${issue}] → "${bill.title.slice(0, 80)}..."`);
  
          const { score, reasoning } = await AigetStanceScore(bill.title, text);
          issueScores.push(score);
          console.log(`📌 [${issue}] - Score: ${score}\n  ↪ ${reasoning}`);
        }
      }
  
      highlights[issue] = relevant.slice(0, 3);
      scores[issue] = issueScores.length
        ? Math.round(issueScores.reduce((a, b) => a + b, 0) / issueScores.length)
        : 0;
      importance[issue] = keywordHits;
    }
  
    console.log(`💡 Total AI prompts that would be sent: ${totalAiRequests}`);
    return { scores, highlights, importance };
  }

const main = async () => {
  const legislatorId = 22412;
  const candidateName = 'Jenifer Rajkumar';

  const bills = await fetchSponsoredBills(legislatorId);
  console.log(bills)
  const { scores, highlights, importance } = await scoreByIssue(bills);

  const summary = {
    candidate: candidateName,
    source: 'LegiScan',
    issues: {}
  };

  for (const issue of Object.keys(ISSUE_KEYWORDS)) {
    summary.issues[issue] = {
      stanceScore: scores[issue],
      importanceScore: importance[issue],
      highlights: highlights[issue]
    };
  }

  const slug = candidateName.replace(/ /g, '_') + '_legiscan';
  const jsonPath = path.join(DATA_DIR, `${slug}.json`);
  const mdPath = path.join(DATA_DIR, `${slug}.md`);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const mdLines = [`# LegiScan Summary for ${candidateName}\n`];
  for (const [issue, data] of Object.entries(summary.issues)) {
    mdLines.push(`## ${issue}`);
    mdLines.push(`- 🧭 Stance Score (1–10): **${data.stanceScore}**`);
    mdLines.push(`- 📊 Importance Score (Keyword Hits): **${data.importanceScore}**`);
    mdLines.push(`- 📌 Top Highlights:\n${data.highlights.map(h => `  - ${h}`).join('\n')}`);
    mdLines.push('');
  }
  fs.writeFileSync(mdPath, mdLines.join('\n'));

  console.log(`✅ Output written:\n- ${jsonPath}\n- ${mdPath}`);
};

main();
