const path = require('path');
const fs = require('fs');

// Paths to your files
const totalsPath = path.resolve(__dirname, '../../../data/financialData/candidateTotals.js');
const listPath = path.resolve(__dirname, '../../../data/listofcandidates.js');
const outputPath = path.resolve(__dirname, '../../../data/combinedCandidates.js');

// Load the two files
const candidateTotals = require(totalsPath);
const listOfCandidates = require(listPath);

// Create a lookup map from totals
const totalsMap = {};
candidateTotals.forEach(candidate => {
  totalsMap[candidate.name.trim().toLowerCase()] = candidate.totalRaised;
});

// Merge the two
const mergedCandidates = listOfCandidates.map(candidate => {
  const nameKey = candidate.name.trim().toLowerCase();
  return {
    name: candidate.name,
    office: candidate.office,
    totalRaised: totalsMap[nameKey] || 0  // Default to 0 if not found
  };
});

// Save the merged result
const output = `module.exports = ${JSON.stringify(mergedCandidates, null, 2)};\n`;

fs.writeFileSync(outputPath, output, 'utf-8');
console.log(`✅ Combined candidate data written to ${outputPath}`);
