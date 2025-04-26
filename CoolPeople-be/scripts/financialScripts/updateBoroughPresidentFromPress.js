const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Paths
const boroughPath = path.resolve(__dirname, '../data/boroughpresidentfundingsummary.js');
const candidatePath = path.resolve(__dirname, '../data/candidateFundingSummary.js');

// Load data
const boroughData = require(boroughPath);
const candidateData = require(candidatePath);

// Build a map for quick lookup by name
const candidateMap = new Map(candidateData.map(c => [c.name, { ...c }]));
const boroughMap = new Map(boroughData.map(c => [c.name, { ...c }]));

// Clean candidate names
const cleanText = (str) =>
  str.replace(/\u00a0/g, ' ')
     .replace(/\s+/g, ' ')
     .replace(/:\s*$/, '')
     .trim();

// Scrape new borough president candidates from CFB
async function fetchUpdatedOffices() {
  const url = 'https://www.nyccfb.info/media/press-releases/nyc-campaign-finance-board-approves-matching-funds-payments-to-2025-candidates-3/';
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const officeMap = new Map();

  $('table tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 2) return;

    const name = cleanText($(tds[0]).text());
    const officeRaw = cleanText($(tds[1]).text());

    if (!officeRaw.includes('Borough President')) return;

    const borough = officeRaw.replace('Borough President', '').trim();
    const fullOffice = `Borough President - ${borough}`;
    officeMap.set(name, fullOffice);
  });

  return officeMap;
}

(async () => {
  try {
    const officeMap = await fetchUpdatedOffices();

    // Merge boroughData into candidateMap
    for (const boroughCandidate of boroughData) {
      const name = boroughCandidate.name;
      const existing = candidateMap.get(name);

      const updatedOffice = officeMap.get(name) || boroughCandidate.office;

      if (existing) {
        // Add Borough President office if not already listed
        if (!existing.office.includes('Borough President')) {
          existing.office += `, ${updatedOffice}`;
        }
        // Merge donor data if needed
        if (!existing.totalRaised && boroughCandidate.totalRaised) {
          existing.totalRaised = boroughCandidate.totalRaised;
          existing.topDonors = boroughCandidate.topDonors;
        }
        candidateMap.set(name, existing);
      } else {
        // New candidate from borough summary only
        candidateMap.set(name, {
          ...boroughCandidate,
          office: updatedOffice,
        });
      }
    }

    const mergedArray = Array.from(candidateMap.values());
    const wrappedJS = `module.exports = ${JSON.stringify(mergedArray, null, 2)};\n`;
    fs.writeFileSync(candidatePath, wrappedJS);
    console.log(`✅ Merged data saved to ${candidatePath}`);

    fs.unlinkSync(boroughPath);
    console.log(`🗑️ Deleted old boroughpresidentfundingsummary.js`);
  } catch (err) {
    console.error('❌ Error:', err);
  }
})();
