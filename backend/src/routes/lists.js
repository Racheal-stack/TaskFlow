const express = require('express');
const router = express.Router();
const List = require('../models/List');
const Space = require('../models/Space');
const Folder = require('../models/Folder');
const { protect } = require('../middleware/auth');

// @desc    Get all lists
// @route   GET /api/lists
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { spaceId, folderId, workspaceId } = req.query;

    let query = {};

    if (folderId) {
      query.folder = folderId;
    } else if (spaceId) {
      query.space = spaceId;
      query.folder = null;
    } else if (workspaceId) {
      query.workspace = workspaceId;
    } else {
      return res.status(400).json({ message: 'Space ID, Folder ID, or Workspace ID is required' });
    }

    // Check workspace access
    if (workspaceId && !req.user.hasWorkspaceAccess(workspaceId)) {
      return res.status(403).json({ message: 'Access denied to this workspace' });
    }

    const lists = await List.find({ ...query, isArchived: false })
      .populate('createdBy', 'name email')
      .populate('space', 'name color')
      .populate('folder', 'name color')
      .populate('tasksCount')
      .sort({ order: 1, createdAt: 1 });

    res.json({ success: true, count: lists.length, data: lists });
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get single list
// @route   GET /api/lists/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('space', 'name color')
      .populate('folder', 'name color')
      .populate('tasksCount');

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check workspace access
    const hasAccess = req.user.hasWorkspaceAccess(list.workspace);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Get list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Create new list
// @route   POST /api/lists
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      workspaceId,
      spaceId,
      folderId,
      description,
      color,
      statuses,
      defaultStatus,
      views,
      settings,
      customFields
    } = req.body;

    if (!name || !workspaceId || !spaceId) {
      return res.status(400).json({ message: 'Name, workspace, and space are required' });
    }

    // Check workspace access
    const hasAccess = req.user.hasWorkspaceAccess(workspaceId, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to create list in this workspace' });
    }

    // Verify space exists
    const space = await Space.findById(spaceId);
    if (!space || space.workspace.toString() !== workspaceId.toString()) {
      return res.status(400).json({ message: 'Invalid space' });
    }

    // Verify folder if provided
    if (folderId) {
      const folder = await Folder.findById(folderId);
      if (!folder || folder.space.toString() !== spaceId.toString()) {
        return res.status(400).json({ message: 'Invalid folder' });
      }
    }

    // Get order for new list
    const listsCount = await List.countDocuments({
      space: spaceId,
      folder: folderId || null
    });

    const list = await List.create({
      name,
      workspace: workspaceId,
      space: spaceId,
      folder: folderId || null,
      description,
      color,
      statuses,
      defaultStatus,
      views,
      settings,
      customFields,
      createdBy: req.user._id,
      order: listsCount
    });

    const populatedList = await List.findById(list._id)
      .populate('createdBy', 'name email')
      .populate('space', 'name color')
      .populate('folder', 'name color');

    res.status(201).json({ success: true, data: populatedList });
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update list
// @route   PUT /api/lists/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check workspace access
    const hasAccess = req.user.hasWorkspaceAccess(list.workspace, 'member');
    if (!hasAccess && list.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this list' });
    }

    const {
      name,
      description,
      color,
      statuses,
      defaultStatus,
      views,
      settings,
      customFields,
      isFavorite
    } = req.body;

    if (name) list.name = name;
    if (description !== undefined) list.description = description;
    if (color) list.color = color;
    if (statuses) list.statuses = statuses;
    if (defaultStatus) list.defaultStatus = defaultStatus;
    if (views) list.views = { ...list.views, ...views };
    if (settings) list.settings = { ...list.settings, ...settings };
    if (customFields) list.customFields = customFields;
    if (isFavorite !== undefined) list.isFavorite = isFavorite;

    await list.save();

    list = await List.findById(list._id)
      .populate('createdBy', 'name email')
      .populate('space', 'name color')
      .populate('folder', 'name color');

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Update list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete/Archive list
// @route   DELETE /api/lists/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check workspace access
    const hasAccess = req.user.hasWorkspaceAccess(list.workspace, 'member');
    if (!hasAccess && list.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this list' });
    }

    // Archive instead of delete
    await list.archive();

    res.json({ success: true, message: 'List archived successfully' });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Restore archived list
// @route   POST /api/lists/:id/restore
// @access  Private
router.post('/:id/restore', protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const hasAccess = req.user.hasWorkspaceAccess(list.workspace, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to restore this list' });
    }

    await list.restore();

    res.json({ success: true, message: 'List restored successfully', data: list });
  } catch (error) {
    console.error('Restore list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Add status to list
// @route   POST /api/lists/:id/statuses
// @access  Private
router.post('/:id/statuses', protect, async (req, res) => {
  try {
    const { name, color, type } = req.body;
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const hasAccess = req.user.hasWorkspaceAccess(list.workspace, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to modify this list' });
    }

    await list.addStatus(name, color, type);

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Add status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Remove status from list
// @route   DELETE /api/lists/:id/statuses/:statusName
// @access  Private
router.delete('/:id/statuses/:statusName', protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const hasAccess = req.user.hasWorkspaceAccess(list.workspace, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to modify this list' });
    }

    await list.removeStatus(req.params.statusName);

    res.json({ success: true, message: 'Status removed successfully', data: list });
  } catch (error) {
    console.error('Remove status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Add custom field to list
// @route   POST /api/lists/:id/custom-fields
// @access  Private
router.post('/:id/custom-fields', protect, async (req, res) => {
  try {
    const { name, type, options } = req.body;
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const hasAccess = req.user.hasWorkspaceAccess(list.workspace, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to modify this list' });
    }

    await list.addCustomField(name, type, options);

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Add custom field error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Remove custom field from list
// @route   DELETE /api/lists/:id/custom-fields/:fieldName
// @access  Private
router.delete('/:id/custom-fields/:fieldName', protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const hasAccess = req.user.hasWorkspaceAccess(list.workspace, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to modify this list' });
    }

    await list.removeCustomField(req.params.fieldName);

    res.json({ success: true, message: 'Custom field removed successfully', data: list });
  } catch (error) {
    console.error('Remove custom field error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Reorder lists
// @route   PUT /api/lists/reorder
// @access  Private
router.put('/reorder', protect, async (req, res) => {
  try {
    const { listIds } = req.body;

    if (!Array.isArray(listIds)) {
      return res.status(400).json({ message: 'List IDs must be an array' });
    }

    const updatePromises = listIds.map((id, index) =>
      List.findByIdAndUpdate(id, { order: index })
    );

    await Promise.all(updatePromises);

    res.json({ success: true, message: 'Lists reordered successfully' });
  } catch (error) {
    console.error('Reorder lists error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
