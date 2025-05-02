// const fs = require('fs');
// const path = require('path');

// // Load the original file
// const filePath = path.resolve(__dirname, '../data/financialData/candidateTotals.js');
// const candidates = require(filePath);

// // Sort by totalRaised (highest to lowest)
// const sorted = candidates.sort((a, b) => b.totalRaised - a.totalRaised);

// // Format for module.exports output
// const formatted = `module.exports = ${JSON.stringify(sorted, null, 2)};\n`;

// // Overwrite the original file
// fs.writeFileSync(filePath, formatted);

// console.log('candidateTotals.js sorted by totalRaised (descending).');

// const fs = require("fs");
// const path = require("path");

// // Load the data
// const candidates = require("/Users/papasito/Documents/CoolPeople/CoolPeople-be/data/listofcandidates.js");
// const financials = require("/Users/papasito/Documents/CoolPeople/CoolPeople-be/data/financialData/candidateTotals.js");

// // Create a lookup for financial data
// const financialLookup = {};
// financials.forEach(c => {
//   financialLookup[c.name.trim()] = c.totalRaised;
// });

// // Merge data
// const merged = candidates.map(c => {
//   const name = c.name.trim();
//   return {
//     ...c,
//     totalRaised: financialLookup[name] ?? null
//   };
// });

// // Output result to file
// const outputPath = path.join(__dirname, "mergedCandidates.json");
// fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));

// console.log(`✅ Merged ${merged.length} candidates → saved to mergedCandidates.json`);

const fs = require("fs");
const path = require("path");

// Load data
const candidates = require("/Users/papasito/Documents/CoolPeople/CoolPeople-be/data/listofcandidates.js");
const financials = require("/Users/papasito/Documents/CoolPeople/CoolPeople-be/data/financialData/candidateTotals.js");

// Create lookup map for financials
const financialLookup = {};
financials.forEach(entry => {
  financialLookup[entry.name.trim()] = entry.totalRaised;
});

// Merge and sort
const merged = candidates
  .map(candidate => {
    const name = candidate.name.trim();
    return {
      name,
      office: candidate.office,
      totalRaised: financialLookup[name] ?? 0 // fill missing with 0
    };
  })
  .sort((a, b) => b.totalRaised - a.totalRaised); // sort by highest totalRaised

// Output to file
const outputPath = path.join(__dirname, "mergedCandidates.json");
fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));

console.log(`✅ Merged and sorted ${merged.length} candidates → saved to mergedCandidates.json`);
