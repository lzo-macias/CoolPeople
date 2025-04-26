const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { pool } = require("./server/db/index.js"); // ✅ Correctly import pool

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use("/api", require("./server/api"));
// app.use('/api', require('./server/api/lookup'));


const init = async () => {
  try {
    // Optional: test connection
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
