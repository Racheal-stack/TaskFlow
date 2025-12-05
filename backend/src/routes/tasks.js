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

router.post('/:taskId/dependencies', protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { dependsOn } = req.body;

    const task = await Task.findById(taskId);
    const dependentTask = await Task.findById(dependsOn);

    if (!task || !dependentTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const hasCycle = async (startId, targetId, visited = new Set()) => {
      if (startId === targetId) return true;
      if (visited.has(startId)) return false;
      
      visited.add(startId);
      const t = await Task.findById(startId);
      
      for (const dep of t.dependencies || []) {
        if (await hasCycle(dep.task.toString(), targetId, visited)) {
          return true;
        }
      }
      return false;
    };

    if (await hasCycle(dependsOn, taskId)) {
      return res.status(400).json({ 
        message: 'Circular dependency detected' 
      });
    }

    if (!task.dependencies.find(d => d.task.toString() === dependsOn)) {
      task.dependencies.push({ task: dependsOn, type: 'blocked_by' });
      await task.save();
    }

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:taskId/dependencies', protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await Task.findById(taskId).populate('dependencies.task', 'title status');
    const blockedBy = await Task.find({ 'dependencies.task': taskId });
    
    res.json({
      dependsOn: task.dependencies,
      blocking: blockedBy
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:taskId/dependencies/:depId', protect, async (req, res) => {
  try {
    const { taskId, depId } = req.params;
    
    const task = await Task.findById(taskId);
    task.dependencies = task.dependencies.filter(d => d.task.toString() !== depId);
    await task.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:taskId', protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    
    const task = await Task.findById(taskId).populate('dependencies.task', 'status');
    
    if (updates.status === 'completed' || updates.status === 'done') {
      const incompleteDeps = task.dependencies.filter(d => 
        d.task.status !== 'completed' && d.task.status !== 'done'
      );
      
      if (incompleteDeps.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot complete task with incomplete dependencies'
        });
      }
    }
    
    Object.assign(task, updates);
    await task.save();
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, (req, res) => {
  res.json({ success: true, message: 'Tasks endpoint - coming soon' });
});

module.exports = router;