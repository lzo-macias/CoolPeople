const express = require("express");
const router = express.Router();

// Import all sub-routes
const userRoutes = require("./userRoutes.js");
const candidateRoutes = require("./candidateRoutes.js");

// Add more later if needed:
// const communityRoutes = require("./communityRoutes");
// const messageRoutes = require("./messageRoutes");
// etc.

// Mount routes under specific prefixes
router.use("/users", userRoutes);       // handles /api/users/...
router.use("/candidates", candidateRoutes); // handles /api/candidates/...

// Optional root test
router.get("/", (req, res) => {
  res.send("🌟 API root working!");
});

module.exports = router;
