const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.get('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ preferences: user.emailPreferences || {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.emailPreferences = { ...user.emailPreferences, ...req.body };
    await user.save();
    res.json({ preferences: user.emailPreferences });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
