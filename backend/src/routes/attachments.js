const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Task = require('../models/Task');
const fs = require('fs').promises;
const path = require('path');

router.post('/:taskId/attachments', protect, upload.array('files', 5), async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const attachments = req.files.map(file => ({
      fileName: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: req.user._id,
      url: `/uploads/${file.filename}`
    }));

    task.attachments.push(...attachments);
    await task.save();

    res.json({ success: true, attachments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:taskId/attachments/:attachmentId', protect, async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    const task = await Task.findById(taskId);

    const attachment = task.attachments.id(attachmentId);
    if (attachment) {
      const filePath = path.join('public', attachment.url);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error('File deletion failed:', err);
      }
      
      task.attachments.pull(attachmentId);
      await task.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
