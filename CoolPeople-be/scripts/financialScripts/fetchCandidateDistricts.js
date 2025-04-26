const puppeteer = require('puppeteer');
const fs = require('fs');

const CANDIDATE_LIST_URL = 'https://www.nyccfb.info/follow-the-money/candidates/2025';

async function fetchCandidateDistricts() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(CANDIDATE_LIST_URL, { waitUntil: 'networkidle2' });

  const candidateDistricts = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    const districts = {};

    rows.forEach(row => {
      const tds = row.querySelectorAll('td');
      if (tds.length < 3) return;

      const name = tds[0].innerText.trim();
      const office = tds[2].innerText.trim();
      const match = office.match(/City Council District (\d{1,2})/);

      if (match) {
        districts[name] = match[1].replace(/^0/, '');
      }
    });

    return districts;
  });

  await browser.close();

  // Save for debugging
  fs.writeFileSync('./districtMapPreview.json', JSON.stringify(candidateDistricts, null, 2));

  return candidateDistricts;
}

module.exports = fetchCandidateDistricts;
