const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const inputPath = path.resolve(__dirname, '../data/2025_BoroughPresidentContributions.csv');
const outputPath = path.resolve(__dirname, '../data/boroughpresidentfundingsummary.js');

const candidates = {};

fs.createReadStream(inputPath)
  .pipe(csv())
  .on('data', (row) => {
    const name = row['RECIPNAME']?.trim();
    const amount = parseFloat(row['AMNT']);
    const donor = row['NAME']?.trim();

    if (!name || isNaN(amount) || !donor) return;

    if (!candidates[name]) {
      candidates[name] = {
        name,
        office: 'Borough President',
        totalRaised: 0,
        donors: {},
      };
    }

    candidates[name].totalRaised += amount;

    if (!candidates[name].donors[donor]) {
      candidates[name].donors[donor] = 0;
    }

    candidates[name].donors[donor] += amount;
  })
  .on('end', () => {
    const output = Object.values(candidates).map(c => {
      const topDonors = Object.entries(c.donors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([donor, amount]) => ({ donor, amount }));

      return {
        name: c.name,
        office: c.office,
        totalRaised: parseFloat(c.totalRaised.toFixed(2)),
        topDonors
      };
    });

    const jsContent = `module.exports = ${JSON.stringify(output, null, 2)};`;

    fs.writeFileSync(outputPath, jsContent);

    console.log(`✅ Saved summary to ${outputPath}`);
  });
