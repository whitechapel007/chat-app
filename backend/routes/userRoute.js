const express = require("express");

const router = express.Router();
const User = require("../model/userModel");
const jwt = require("jsonwebtoken");
const protect = require("../utils/protect");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register Route
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const user = await User.create({ username, password });
    const token = generateToken(user._id);

    res.status(201).json({ success: true, token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    res.status(200).json({ success: true, token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/user", protect, async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(201).json(user);
});

module.exports = router;
