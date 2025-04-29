
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  fetchUsers,
  createUser,
  findUserByEmail,
  updateUser,
  deleteUser,
} = require("../db/users");
const router = express.Router();

// POST /api/users/register
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, full_name, borough, cityCouncilDistrict, address, zip_code, dob } = req.body;
    
    if (!email || !password || !dob || !address) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const newUser = await createUser({ 
      email, 
      password, 
      full_name, 
      borough, 
      cityCouncilDistrict, 
      address, 
      zip_code, 
      dob 
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ ...newUser, token });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required." });
    }

    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ id: user.id, email: user.email, full_name: user.full_name, token });
  } catch (err) {
    next(err);
  }
});

// GET /api/users
router.get("/", async (req, res, next) => {
  try {
    const users = await fetchUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:userId
router.put("/:userId", async (req, res, next) => {
  try {
    const updatedUser = await updateUser(req.params.userId, req.body);
    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:userId
router.delete("/:userId", async (req, res, next) => {
  try {
    await deleteUser(req.params.userId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;