const { createCandidate } = require("./db/candidates.js");
const { createTables } = require("./db/db.js");
const path = require("path");
const fs = require("fs");
const combinedCandidates = require("../data/combinedCandidates.js");

const seedCandidates = async () => {
     await createTables();
  try {
    for (const candidate of combinedCandidates) {
      const name = candidate.name;
      const position = candidate.office;

      // Match photo if it exists
      const formattedName = name.replace(/ /g, "_");
      const candidatePhotosDir = path.join(__dirname, "../public/images/candidateprofile");
      const files = fs.readdirSync(candidatePhotosDir);
      const matchingPhoto = files.find(file => file.startsWith(formattedName));

      let photo_url = null;
      if (matchingPhoto) {
        photo_url = `/images/candidateprofile/${matchingPhoto}`;  // ✅ Only URL path here
      }

      const newCandidate = await createCandidate({
        name,
        bio: null,
        party: null,
        website: null,
        photo_url,
        position,
        office_id: null,
        election_id: null,
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
