const express = require("express");

const router = express.Router();

const Message = require("../model/message");
const protect = require("../utils/protect");

// Send Message
router.post("/", protect, async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Message content is required" });
  }

  try {
    const message = await Message.create({
      sender: req.user.id,
      content,
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Messages
router.get("/", protect, async (req, res) => {
  try {
    const messages = await Message.find().populate("sender", "username"); // Populate the sender's username
    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
