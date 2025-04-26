const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const fetchCandidateDistricts = require('./fetchCandidateDistricts');

const filePath = path.resolve(__dirname, '../data/2025_Contributions.csv');

async function parseContributions() {
  const candidates = {};
  const relevantOfficeCodes = ['1', '2', '3', '5'];

  const candidateDistricts = await fetchCandidateDistricts(); // <-- THIS is now included
  console.log("🔍 Preview of fetched candidate districts:");
console.log(Object.entries(candidateDistricts).slice(0, 10));

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const office = row['OFFICECD'];
      const name = row['RECIPNAME'];
      const donor = row['NAME'];
      const amount = parseFloat(row['AMNT']) || 0;

      if (!relevantOfficeCodes.includes(office)) return;

      if (!candidates[name]) {
        candidates[name] = {
          office,
          district: office === '5' ? candidateDistricts[name] || 'Unknown' : null,
          totalRaised: 0,
          contributionsByDonor: {}
        };
      }

      candidates[name].totalRaised += amount;

      if (!candidates[name].contributionsByDonor[donor]) {
        candidates[name].contributionsByDonor[donor] = 0;
      }
      candidates[name].contributionsByDonor[donor] += amount;
    })
    .on('end', () => {
      const summary = Object.entries(candidates).map(([name, data]) => {
        let officeName;
        switch (data.office) {
          case '1': officeName = 'Mayor'; break;
          case '2': officeName = 'Public Advocate'; break;
          case '3': officeName = 'Comptroller'; break;
          case '5': officeName = `City Council (District ${data.district})`; break;
          default: officeName = 'Unknown';
        }

        return {
          name,
          office: officeName,
          totalRaised: data.totalRaised,
          topDonors: Object.entries(data.contributionsByDonor)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([donor, amount]) => ({ donor, amount }))
        };
      });

      const outPath = path.resolve(__dirname, '../data/candidateFundingSummary.json');
      fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
      console.log(`✅ Summary written to ${outPath}`);
    })
    .on('error', (err) => {
      console.error('❌ CSV parse failed:', err.message);
    });
}

parseContributions();
