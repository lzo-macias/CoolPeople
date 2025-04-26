const express = require('express');
const router = express.Router();
const geoLookup = require('../geoLookup'); // your existing geoLookup function

router.post('/lookup', async (req, res) => {
  const { address } = req.body;
  const result = await geoLookup(address);
  if (!result) return res.status(400).send({ error: "Failed lookup" });
  res.send(result);
});

module.exports = router;
