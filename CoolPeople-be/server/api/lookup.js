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
