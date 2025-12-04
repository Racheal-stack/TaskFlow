const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  addComment,
  getComments,
  getNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/commentController');

router.post('/tasks/:taskId/comments', protect, addComment);
router.get('/tasks/:taskId/comments', protect, getComments);

router.get('/notifications', protect, getNotifications);
router.patch('/notifications/:notificationId/read', protect, markAsRead);
router.patch('/notifications/read-all', protect, markAllAsRead);

module.exports = router;
