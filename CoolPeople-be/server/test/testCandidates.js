const { fetchCandidates } = require("../db/candidates.js"); // ✅ adjust path if needed

const runTest = async () => {
  try {
    console.log("🚀 Fetching candidates...");

    const candidates = await fetchCandidates();

    if (!candidates.length) {
      console.log("⚠️ No candidates found.");
      return;
    }

    for (const candidate of candidates) {
      console.log(`🧩 Candidate:
        Name: ${candidate.name || "❌ No name"}
        Photo URL: ${candidate.photo_url || "❌ No photo"}
        Position: ${candidate.position || "❌ No position"}
      `);
    }

    console.log(`🎯 Total candidates fetched: ${candidates.length}`);
  } catch (err) {
    console.error("❌ Error fetching candidates:", err);
  } finally {
    process.exit(0);
  }
};

runTest();
