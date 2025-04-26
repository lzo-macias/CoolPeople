const express = require("express");
const router = express.Router();
const {
  fetchCandidates,
  fetchCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate
} = require("../db/candidates");

// POST /api/candidates
router.post("/", async (req, res, next) => {
  try {
    const newCandidate = await createCandidate(req.body);
    res.status(201).json(newCandidate);
  } catch (err) {
    console.error("Error creating candidate:", err);
    next(err);
  }
});

// GET /api/candidates
router.get("/", async (req, res, next) => {
  try {
    const candidates = await fetchCandidates();
    res.json(candidates);
  } catch (err) {
    console.error("Error fetching candidates:", err);
    next(err);
  }
});

// GET /api/candidates/:id
router.get("/:id", async (req, res, next) => {
  try {
    const candidate = await fetchCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    res.json(candidate);
  } catch (err) {
    console.error("Error fetching candidate:", err);
    next(err);
  }
});

// PUT /api/candidates/:id
router.put("/:id", async (req, res, next) => {
  try {
    const updatedCandidate = await updateCandidate(req.params.id, req.body);
    if (!updatedCandidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    res.json(updatedCandidate);
  } catch (err) {
    console.error("Error updating candidate:", err);
    next(err);
  }
});

// DELETE /api/candidates/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const deletedCandidate = await deleteCandidate(req.params.id);
    if (!deletedCandidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting candidate:", err);
    next(err);
  }
});

module.exports = router;
