const express = require("express");
const router = express.Router();

// Import all sub-routes
const userRoutes = require("./userRoutes.js");
const candidateRoutes = require("./candidateRoutes.js");
const lookupRoutes = require("./lookup.js"); // ✅ import lookup here


// Add more later if needed:
// const communityRoutes = require("./communityRoutes");
// const messageRoutes = require("./messageRoutes");
// etc.

// Mount routes under specific prefixes

router.use("/lookup", lookupRoutes); // ✅ now /api/lookup
router.use("/users", userRoutes);       // handles /api/users/...
router.use("/candidates", candidateRoutes); // handles /api/candidates/...

// Optional root test
router.get("/", (req, res) => {
  res.send("🌟 API root working!");
});

module.exports = router;
