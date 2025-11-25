const express = require('express');
const { protect, workspaceAccess } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes - will be implemented
router.get('/', protect, (req, res) => {
  res.json({ success: true, message: 'Projects endpoint - coming soon' });
});

module.exports = router;