const fs = require('fs');
const path = require('path');

// Adjust this path if needed
const masterlistPath = path.resolve(__dirname, 'legiscan_masterlist.json');

if (!fs.existsSync(masterlistPath)) {
  console.error('❌ legiscan_masterlist.json not found');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(masterlistPath, 'utf-8'));
const masterlist = data.masterlist;

// Exclude "session" entry
const billCount = Object.keys(masterlist).filter(k => k !== 'session').length;

console.log(`📦 Total bills in masterlist: ${billCount}`);
