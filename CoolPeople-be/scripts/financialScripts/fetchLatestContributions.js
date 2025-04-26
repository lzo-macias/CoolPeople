const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DATA_LIBRARY_URL = 'https://www.nyccfb.info/follow-the-money/data-library/';

async function fetchLatestCSV() {
  try {
    const { data: html } = await axios.get(DATA_LIBRARY_URL);
    const $ = cheerio.load(html);

    // Look for a link to a CSV with "2025" and "contributions" in the filename
    const linkTag = $('a').filter((i, el) => {
      const href = $(el).attr('href') || '';
      return href.toLowerCase().includes('2025') && href.toLowerCase().includes('contributions') && href.endsWith('.csv');
    });

    const link = linkTag.attr('href');
    if (!link) throw new Error('Could not find CSV link on NYCCFB');

    const csvURL = new URL(link, DATA_LIBRARY_URL).href;

    const filePath = path.resolve(__dirname, '../data/2025_Contributions.csv');
    const writer = fs.createWriteStream(filePath);

    const response = await axios({ url: csvURL, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ Saved latest CSV to ${filePath}`);
        resolve(filePath);
      });
      writer.on('error', reject);
    });
  } catch (err) {
    console.error('❌ Failed to fetch CSV:', err.message);
  }
}

fetchLatestCSV();
