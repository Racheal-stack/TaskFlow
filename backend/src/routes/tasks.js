const express = require('express');
const { protect, workspaceAccess } = require('../middleware/auth');
const Task = require('../models/Task');
const router = express.Router();

router.get('/search', protect, async (req, res) => {
  try {
    const { q, status, priority, assignee, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (assignee) {
      query['assignees.user'] = assignee;
    }
    
    if (dateFrom || dateTo) {
      query.dueDate = {};
      if (dateFrom) query.dueDate.$gte = new Date(dateFrom);
      if (dateTo) query.dueDate.$lte = new Date(dateTo);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let results = await Task.find(query)
      .populate('assignees.user', 'name email')
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 });
    
    const total = await Task.countDocuments(query);
    
    res.json({
      success: true,
      results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/autocomplete', protect, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    const tasks = await Task.find({
      title: { $regex: q, $options: 'i' }
    })
    .select('title')
    .limit(10);
    
    const suggestions = tasks.map(t => t.title);
    
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, (req, res) => {
  res.json({ success: true, message: 'Tasks endpoint - coming soon' });
});

module.exports = router;