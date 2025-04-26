const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { pool } = require("./server/db/index.js");

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // ✅ ADD THIS HERE to parse POST bodies
app.use(express.static('public'));
app.use("/api", require("./server/api"));

const init = async () => {
  try {
    await pool.query('SELECT NOW()'); 
    console.log("✅ Connected to database!");

    app.listen(PORT, () => {
      console.log(`🚀 Server alive on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error during init:", err);
  }
};

init();
