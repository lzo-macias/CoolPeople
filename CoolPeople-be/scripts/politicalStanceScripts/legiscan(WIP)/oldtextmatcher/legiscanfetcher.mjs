import axios from 'axios';
import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = 'f94bcaf62d3cdac70895d723d1996135';
const BASE_URL = 'https://api.legiscan.com/';
const DATA_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'testData', 'testStanceData');

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

const progressivePhrases = [
  'progressive', 'equity', 'justice', 'abolish', 'defund', 'universal', 'guaranteed', 'climate crisis',
  'racial justice', 'economic justice', 'green new deal', 'reparations', 'police accountability',
  'housing is a human right', 'free college', 'cancel student debt', 'raise the minimum wage',
  'medicare for all', 'gender affirming care', 'workers rights', 'tax the rich', 'abolish ICE',
  'decarceration', 'mutual aid', 'public option', 'democratize', 'community safety'
];

const conservativePhrases = [
  'tough on crime', 'zero tolerance', 'cut taxes', 'protect police', 'border security',
  'law and order', 'pro second amendment', 'back the blue', 'anti woke', 'school choice',
  'secure our borders', 'pro life', 'family values', 'defend traditional marriage',
  'reduce government', 'parental rights', 'protect religious liberty', 'constitutional rights',
  'oppose critical race theory', 'stand with law enforcement'
];

async function fetchSponsoredBills(legislatorId) {
  const limit = pLimit(5);

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        key: API_KEY,
        op: 'getSponsoredList',
        id: legislatorId
      }
    });

    const basicList = response.data?.sponsoredbills?.bills
    // console.log(basicList)
    if (!Array.isArray(basicList)) {
      throw new Error('Invalid response format or no sponsored bills');
    }

    const filteredList = basicList.filter(b => !b.number.startsWith('K'));

    const detailedBills = await Promise.all(
      filteredList.map(({ bill_id }) =>
        limit(async () => {
          try {
            const billResponse = await axios.get(BASE_URL, {
              params: {
                key: API_KEY,
                op: 'getBill',
                id: bill_id
              }
            });

            const bill = billResponse.data?.bill;
            if (bill?.title) {
              return bill;
            } else {
              return null;
            }
          } catch {
            return null;
          }
        })
      )
    );

    return detailedBills.filter(Boolean);
  } catch {
    return [];
  }
}

function stanceScore(sentence) {
  const lower = sentence.toLowerCase();
  let progressiveHits = 0;
  let conservativeHits = 0;

  for (const p of progressivePhrases) {
    if (lower.includes(p)) progressiveHits++;
  }
  for (const c of conservativePhrases) {
    if (lower.includes(c)) conservativeHits++;
  }

  const total = progressiveHits + conservativeHits;
  if (total === 0) return 5;

  const ratio = progressiveHits / total;
  return Math.round(1 + ratio * 9); // 1–10 scale
}

function scoreByIssue(bills) {
  const scores = {};
  const highlights = {};

  for (const [issue, keywords] of Object.entries(ISSUE_KEYWORDS)) {
    const relevant = [];

    for (const bill of bills) {
      const text = bill.description || '';
      const lower = text.toLowerCase();
      const matched = keywords.filter(k => lower.includes(k));

      if (matched.length > 0) {
        relevant.push(text.trim());

        // Calculate and log scoring detail
        const progressiveHits = progressivePhrases.filter(p => lower.includes(p));
        const conservativeHits = conservativePhrases.filter(c => lower.includes(c));
        const totalHits = progressiveHits.length + conservativeHits.length;

        let score = 5;
        if (totalHits > 0) {
          const ratio = progressiveHits.length / totalHits;
          score = Math.round(1 + ratio * 9);
        }

        // console.log(`📌 [${issue}] match: "${text.slice(0, 80)}..."`);
        // console.log(`   ➤ Progressive: ${progressiveHits.join(', ') || 'None'} | Conservative: ${conservativeHits.join(', ') || 'None'} | Score: ${score}`);
      }
    }

    highlights[issue] = relevant.slice(0, 3);
    scores[issue] = relevant.length
      ? Math.round(relevant.map(s => stanceScore(s)).reduce((a, b) => a + b, 0) / relevant.length)
      : 0;
  }

  return { scores, highlights };
}

const main = async () => {
  const legislatorId = 22412;
  const candidateName = 'Jenifer Rajkumar';

  const bills = await fetchSponsoredBills(legislatorId);
  console.log(bills)
  const { scores, highlights } = scoreByIssue(bills);

  const summary = {
    candidate: candidateName,
    source: 'LegiScan',
    issues: {}
  };

  for (const issue of Object.keys(ISSUE_KEYWORDS)) {
    summary.issues[issue] = {
      stanceScore: scores[issue],
      highlights: highlights[issue]
    };
  }

  const slug = candidateName.replace(/ /g, '_') + '_legiscan';
  const jsonPath = path.join(DATA_DIR, `${slug}.json`);
  const mdPath = path.join(DATA_DIR, `${slug}.md`);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const mdLines = [`# LegiScan Summary for ${candidateName}\n`];
  for (const [issue, data] of Object.entries(summary.issues)) {
    mdLines.push(`## ${issue}`);
    mdLines.push(`- 🧭 Stance Score (1–10): **${data.stanceScore}**`);
    mdLines.push(`- 📌 Top Highlights:\n${data.highlights.map(h => `  - ${h}`).join('\n')}`);
    mdLines.push('');
  }

  fs.writeFileSync(mdPath, mdLines.join('\n'));

  console.log(`✅ Output written:\n- ${jsonPath}\n- ${mdPath}`);
};

main();
