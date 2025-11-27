const express = require('express');
const router = express.Router();
const List = require('../models/List');
const Space = require('../models/Space');
const Folder = require('../models/Folder');
const { protect } = require('../middleware/auth');

// Helper function to check if user is owner or admin of workspace
const isOwnerOrAdmin = (user, workspaceId) => {
  const role = user.getWorkspaceRole(workspaceId);
  return role === 'owner' || role === 'admin';
};

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

// @desc    Add custom status to list
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

    // Check if user has permission to create statuses
    // Owner and Admin always have permission
    const hasPermission = isOwnerOrAdmin(req.user, list.workspace) || list.canUserCreateStatuses(req.user._id);
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to create statuses' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Status name is required' });
    }

    // Check if status name already exists
    if (list.statuses.find(s => s.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ message: 'Status with this name already exists' });
    }

    await list.addStatus(name, color, type || 'custom');

    res.json({ success: true, message: 'Status added successfully', data: list });
  } catch (error) {
    console.error('Add status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update custom status
// @route   PUT /api/lists/:id/statuses/:statusId
// @access  Private
router.put('/:id/statuses/:statusId', protect, async (req, res) => {
  try {
    const { name, color } = req.body;
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const hasAccess = req.user.hasWorkspaceAccess(list.workspace, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to modify this list' });
    }

    // Check if user has permission to edit statuses
    // Owner and Admin always have permission
    const hasPermission = isOwnerOrAdmin(req.user, list.workspace) || list.canUserEditStatuses(req.user._id);
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to edit statuses' });
    }

    const status = list.statuses.id(req.params.statusId);
    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    if (name) status.name = name;
    if (color) status.color = color;

    await list.save();

    res.json({ success: true, message: 'Status updated successfully', data: list });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete custom status
// @route   DELETE /api/lists/:id/statuses/:statusId
// @access  Private
router.delete('/:id/statuses/:statusId', protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const hasAccess = req.user.hasWorkspaceAccess(list.workspace, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to modify this list' });
    }

    // Check if user has permission to delete statuses
    // Owner and Admin always have permission
    const hasPermission = isOwnerOrAdmin(req.user, list.workspace) || list.canUserDeleteStatuses(req.user._id);
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to delete statuses' });
    }

    const status = list.statuses.id(req.params.statusId);
    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    // Prevent deleting if it's the last status
    if (list.statuses.length <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last status' });
    }

    status.remove();
    await list.save();

    res.json({ success: true, message: 'Status deleted successfully', data: list });
  } catch (error) {
    console.error('Delete status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update list permissions
// @route   PUT /api/lists/:id/permissions
// @access  Private
router.put('/:id/permissions', protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const hasAccess = req.user.hasWorkspaceAccess(list.workspace, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to modify this list' });
    }

    // Check if user has permission to manage permissions
    if (!list.canUserManagePermissions(req.user._id)) {
      return res.status(403).json({ message: 'You do not have permission to manage permissions' });
    }

    const {
      canCreateStatuses,
      canEditStatuses,
      canDeleteStatuses,
      canViewTasks,
      canCreateTasks,
      canEditTasks,
      canDeleteTasks,
      canManagePermissions
    } = req.body;

    if (!list.permissions) {
      list.permissions = {};
    }

    if (canCreateStatuses !== undefined) list.permissions.canCreateStatuses = canCreateStatuses;
    if (canEditStatuses !== undefined) list.permissions.canEditStatuses = canEditStatuses;
    if (canDeleteStatuses !== undefined) list.permissions.canDeleteStatuses = canDeleteStatuses;
    if (canViewTasks !== undefined) list.permissions.canViewTasks = canViewTasks;
    if (canCreateTasks !== undefined) list.permissions.canCreateTasks = canCreateTasks;
    if (canEditTasks !== undefined) list.permissions.canEditTasks = canEditTasks;
    if (canDeleteTasks !== undefined) list.permissions.canDeleteTasks = canDeleteTasks;
    if (canManagePermissions !== undefined) list.permissions.canManagePermissions = canManagePermissions;

    await list.save();

    res.json({ success: true, message: 'Permissions updated successfully', data: list });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get list permissions with user details
// @route   GET /api/lists/:id/permissions
// @access  Private
router.get('/:id/permissions', protect, async (req, res) => {
  try {
    const list = await List.findById(req.params.id)
      .populate('permissions.canCreateStatuses', 'name email')
      .populate('permissions.canEditStatuses', 'name email')
      .populate('permissions.canDeleteStatuses', 'name email')
      .populate('permissions.canViewTasks', 'name email')
      .populate('permissions.canCreateTasks', 'name email')
      .populate('permissions.canEditTasks', 'name email')
      .populate('permissions.canDeleteTasks', 'name email')
      .populate('permissions.canManagePermissions', 'name email');

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const hasAccess = req.user.hasWorkspaceAccess(list.workspace, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this list' });
    }

    res.json({ success: true, data: list.permissions || {} });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
