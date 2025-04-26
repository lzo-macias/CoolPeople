// scrapeCandidates.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright'); // 👈 playwright instead of axios/cheerio

const TARGET_URL = 'https://www.nyccfb.info/follow-the-money/candidates/2025';
const OUTPUT_PATH = '/Users/papasito/Documents/CoolPeople/CoolPeople-be/data/listofcandidates.js';

async function scrapeCandidates() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

  // Wait for the table to appear
  await page.waitForSelector('table');

  const candidates = await page.$$eval('table tbody tr', rows => {
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      const name = cells[0]?.innerText.trim();
      const classification = cells[1]?.innerText.trim().toLowerCase();
      const office = cells[2]?.innerText.trim();
      
      if (classification === 'participant') {
        return { name, office };
      }
      return null;
    }).filter(item => item !== null);
  });

  await browser.close();

  const fileContent = `module.exports = ${JSON.stringify(candidates, null, 2)};\n`;

  fs.writeFileSync(OUTPUT_PATH, fileContent, 'utf-8');
  console.log(`✅ Successfully scraped and saved ${candidates.length} candidates to listofcandidates.js`);
}

scrapeCandidates();
