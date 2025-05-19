

const { createCandidate } = require("./db/candidates.js");
const { createTables } = require("./db/db.js");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const stringSimilarity = require("string-similarity");

const listOfCandidates = require("../data/listofcandidates.js");
const candidateAnalyses = require("../data/newAnalysis.js");
const candidateTotals = require("../data/financialData/candidateTotals.js");


// Normalize helper
const normalize = (str) => str.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

// Create normalized maps for fast lookup
const stanceMap = {};
for (const analysis of candidateAnalyses) {
  stanceMap[normalize(analysis.name)] = analysis.scores;
}

const financeMap = {};
for (const entry of candidateTotals) {
  financeMap[normalize(entry.name)] = entry.totalRaised;
}

const seedCandidates = async () => {
  await createTables();

  try {
    const candidatePhotosDir = path.join(__dirname, "../public/images/candidateprofile");
    const files = fs.readdirSync(candidatePhotosDir).filter(f =>
      f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".webp")
    );
    const normalizedPhotoMap = files.map(file => ({
      file,
      base: normalize(file.split(".")[0])
    }));

    console.log("🔍 Available normalized image basenames:", normalizedPhotoMap.map(f => f.base));

    for (const candidate of listOfCandidates) {
      const name = candidate.name;
      const position = candidate.office;
      const normalizedName = normalize(name);

      // Fuzzy match image file
      const { bestMatch } = stringSimilarity.findBestMatch(
        normalizedName,
        normalizedPhotoMap.map(p => p.base)
      );
      
      let photo_url = null;
      if (bestMatch.rating > 0.75) {  // ⬅️ relaxed threshold
        const matchedFile = normalizedPhotoMap.find(p => p.base === bestMatch.target);
        if (matchedFile) {
          if (bestMatch.rating > 0.75) {
            const matchedFile = normalizedPhotoMap.find(p => p.base === bestMatch.target);
            if (matchedFile) {
              const imagePath = path.join(candidatePhotosDir, matchedFile.file);
              const originalBase = matchedFile.file.split(".")[0];
const safeBase = originalBase.replace(/[^a-zA-Z0-9_]/g, "_"); // replaces commas, spaces, etc. with _
const optimizedName = `${safeBase}.webp`;
const optimizedPath = path.join(candidatePhotosDir, optimizedName);

if (!fs.existsSync(optimizedPath)) {
  try {
    await sharp(imagePath)
      .resize({ width: 500 })
      .webp({ quality: 80 })
      .toFile(optimizedPath);
    console.log(`🖼️ Optimized ${matchedFile.file} → ${optimizedName}`);
  } catch (sharpErr) {
    console.error(`❌ Error processing ${matchedFile.file}:`, sharpErr);
  }
}

photo_url = `/images/candidateprofile/${optimizedName}`;
            }
          }          
        }
      } else {
        console.warn(`⚠️ No strong photo match for: ${name} → normalized: ${normalizedName} (score: ${bestMatch.rating.toFixed(2)})`);
      }
      
      const fullStanceData = candidateAnalyses.find(c => normalize(c.name) === normalizedName);
      let stances = null;
      if (fullStanceData) {
        const scores = fullStanceData.scores;
        const validScores = Object.values(scores)
          .map(s => s?.score)
          .filter(s => typeof s === "number");
        const averageScore = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : null;
        scores.averageScore = parseFloat(averageScore);
        stances = JSON.stringify(scores);
      }     
      const finances = financeMap[normalizedName] != null ? Math.round(financeMap[normalizedName]) : null;
      const bio = fullStanceData?.bio || null;
      const party = fullStanceData?.party || null;

      const newCandidate = await createCandidate({
        name,
        bio,
        party: null,
        website: null,
        photo_url,
        position,
        office_id: null,
        stances,
        election_id: null,
        incumbency: null,
        finances
      });


      console.log(`✅ Seeded candidate: ${newCandidate.name}`);
    }

    console.log("🌟 Finished seeding candidates!");
  } catch (err) {
    console.error("❌ Error seeding candidates:", err);
  } finally {
    process.exit(0);
  }
};

seedCandidates();

