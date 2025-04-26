// // scripts/politicalStanceScripts/legiscan/save_legislator_ids.js
// const axios = require('axios');
// const fs = require('fs');
// const path = require('path');

// const API_KEY = 'f94bcaf62d3cdac70895d723d1996135';
// const BASE_URL = 'https://api.legiscan.com/';
// const OUTPUT_PATH = path.resolve('data', 'stanceData', 'ny_legislators_by_name.json');

// async function run() {
//   const resp = await axios.get(BASE_URL, {
//     params: {
//       key: API_KEY,
//       op: 'getMasterList',
//       state: 'NY'
//     }
//   });

//   const masterlist = resp.data.masterlist;
//   console.log(`✅ Loaded masterlist with ${Object.keys(masterlist).length} entries`);

//   const sponsorMap = {};

//   for (const key of Object.keys(masterlist)) {
//     if (key === 'session') continue;
  
//     const bill = masterlist[key];
//     try {
//       console.log(`🔍 Fetching bill ${bill.number} (ID: ${bill.bill_id})...`);
  
//       const billResp = await axios.get(BASE_URL, {
//         params: {
//           key: API_KEY,
//           op: 'getBill',
//           id: bill.bill_id
//         }
//       });
  
//       const sponsors = billResp.data.bill.sponsors || [];
//       sponsors.forEach(({ name, people_id }) => {
//         if (name && people_id) sponsorMap[name.trim()] = people_id;
//       });
  
//     } catch (err) {
//       console.warn(`⚠️ Failed to fetch bill ID ${bill.bill_id}: ${err.message}`);
//       // Optionally wait a bit to avoid being rate-limited
//       await new Promise(res => setTimeout(res, 500));
//     }
//   }

// console.log(`✅ Collected ${Object.keys(sponsorMap).length} unique sponsors`);


//   fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sponsorMap, null, 2));
//   console.log(`✅ Saved sponsor map to ${OUTPUT_PATH}`);
// }

// run();

// scripts/politicalStanceScripts/legiscan/save_legislator_ids.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = 'f94bcaf62d3cdac70895d723d1996135';
const BASE_URL = 'https://api.legiscan.com/';
const OUTPUT_PATH = path.resolve('scripts', 'politicalStanceScripts', 'legiscan(WIP)', 'ny_legislators_by_name.json');

async function run() {
  const { default: pLimit } = await import('p-limit'); // 👈 This is the fix
  const resp = await axios.get(BASE_URL, {
    params: {
      key: API_KEY,
      op: 'getMasterList',
      state: 'NY'
    }
  });

  const masterlist = resp.data.masterlist;
  console.log(`✅ Loaded masterlist with ${Object.keys(masterlist).length} entries`);

  const sponsorMap = {};
  const limit = pLimit(10); // Run 10 concurrent fetches

  const tasks = Object.keys(masterlist).map(key =>
    limit(async () => {
      if (key === 'session') return;

      const bill = masterlist[key];

      try {
        console.log(`🔍 Fetching bill ${bill.number} (ID: ${bill.bill_id})...`);

        const billResp = await axios.get(BASE_URL, {
          params: {
            key: API_KEY,
            op: 'getBill',
            id: bill.bill_id
          }
        });

        const sponsors = billResp.data.bill.sponsors || [];
        sponsors.forEach(({ name, people_id }) => {
          if (name && people_id) sponsorMap[name.trim()] = people_id;
        });

        await new Promise(res => setTimeout(res, 150));
      } catch (err) {
        console.warn(`⚠️ Failed to fetch bill ID ${bill.bill_id}: ${err.message}`);
      }
    })
  );

  await Promise.all(tasks);

  console.log(`✅ Collected ${Object.keys(sponsorMap).length} unique sponsors`);
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sponsorMap, null, 2));
  console.log(`✅ Saved sponsor map to ${OUTPUT_PATH}`);
}

run();
