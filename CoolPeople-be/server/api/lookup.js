// const express = require('express');
// const router = express.Router();
// const geoLookup = require("../api/geolookup");

// // Your candidates list here or import it from somewhere
// const candidatefundingsummary = require('../../data/listofcandidates');

// function findCandidatesByDistrict(candidates, district) {
//   const normalizedDistrict = parseInt(district, 10);
//   return candidates.filter(candidate => {
//     const office = candidate.office.toLowerCase().replace(/\s+/g, '');
//     return (
//       office.includes('citycouncil') && 
//       office.includes(`district${normalizedDistrict}`)
//     );
//   });
// }


// router.post('/', async (req, res) => {
//   console.log("✅ /api/lookup hit!");
//   const { address } = req.body;
//   const locationResult = await geoLookup(address);
  
//   if (!locationResult) {
//     return res.status(400).send({ error: "Failed lookup" });
//   }

//   const matchingCandidates = findCandidatesByDistrict(candidatefundingsummary, locationResult.cityCouncilDistrict);
//   console.log("🔍 cityCouncilDistrict we got:", locationResult.cityCouncilDistrict);


//   res.send({
//     ...locationResult,        // borough, lat, lng, district
//     candidates: matchingCandidates,  // add candidates here
//   });
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const geoLookup = require("../api/geolookup");

router.post('/', async (req, res) => {
  console.log("✅ /api/lookup hit!");
  const { address } = req.body;
  const locationResult = await geoLookup(address);
  
  if (!locationResult) {
    return res.status(400).send({ error: "Failed lookup" });
  }

  const { borough, cityCouncilDistrict } = locationResult;

  console.log("🌍 Location found:", { borough, cityCouncilDistrict });

  res.send({
    borough,
    cityCouncilDistrict,
  });
});

module.exports = router;
