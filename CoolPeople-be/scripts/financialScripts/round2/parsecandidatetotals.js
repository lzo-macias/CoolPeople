const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const filePath = path.resolve(__dirname, '../../../data/financialData/CFB_2025.csv');
const outputFile = path.resolve(__dirname, '../../../data/financialData/candidateTotals.js');

async function parseContributions() {
  const candidates = {};
  const relevantOfficeCodes = ['1', '2', '3', '5']; // Mayor, Public Advocate, Comptroller, City Council

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const office = row['OFFICECD'];
      const name = row['RECIPNAME'];
      let amount = row['AMNT'];

      if (!relevantOfficeCodes.includes(office)) return;
      if (!name) return;

      if (amount) {
        amount = parseFloat(amount.replace(/,/g, '')) || 0;
      } else {
        amount = 0;
      }

      if (!candidates[name]) {
        candidates[name] = 0;
      }

      candidates[name] += amount;
    })
    .on('end', () => {
      const summaryArray = Object.entries(candidates).map(([name, totalRaised]) => ({
        name,
        totalRaised: parseFloat(totalRaised.toFixed(2)),
      }));

      const jsContent = `module.exports = ${JSON.stringify(summaryArray, null, 2)};\n`;

      fs.writeFileSync(outputFile, jsContent, 'utf-8');
      console.log(`✅ Candidate totals saved to ${outputFile}`);
    })
    .on('error', (err) => {
      console.error('❌ CSV parse failed:', err.message);
    });
}

parseContributions();
