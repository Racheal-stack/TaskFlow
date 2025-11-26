const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const Space = require('../models/Space');
const { protect } = require('../middleware/auth');

// @desc    Get all folders for a space
// @route   GET /api/folders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { spaceId, workspaceId, parentId } = req.query;

    let query = {};

    if (spaceId) {
      query.space = spaceId;
      if (parentId) {
        query.parent = parentId;
      } else {
        query.parent = null;
      }
    } else if (workspaceId) {
      query.workspace = workspaceId;
    } else {
      return res.status(400).json({ message: 'Space ID or Workspace ID is required' });
    }

    // Check workspace access
    if (workspaceId && !req.user.hasWorkspaceAccess(workspaceId)) {
      return res.status(403).json({ message: 'Access denied to this workspace' });
    }

    const folders = await Folder.find({ ...query, isArchived: false })
      .populate('createdBy', 'name email')
      .populate('parent', 'name color')
      .populate('listsCount')
      .sort({ order: 1, createdAt: 1 });

    res.json({ success: true, count: folders.length, data: folders });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get single folder
// @route   GET /api/folders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('space', 'name color')
      .populate('parent', 'name color')
      .populate('listsCount');

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check workspace access
    const hasAccess = req.user.hasWorkspaceAccess(folder.workspace);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get subfolders
    const subfolders = await Folder.findByParent(folder._id);

    res.json({ success: true, data: { ...folder.toObject(), subfolders } });
  } catch (error) {
    console.error('Get folder error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Create new folder
// @route   POST /api/folders
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, spaceId, workspaceId, description, color, parent } = req.body;

    if (!name || !spaceId || !workspaceId) {
      return res.status(400).json({ message: 'Name, space, and workspace are required' });
    }

    // Check workspace access
    const hasAccess = req.user.hasWorkspaceAccess(workspaceId, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to create folder in this workspace' });
    }

    // Verify space exists and belongs to workspace
    const space = await Space.findById(spaceId);
    if (!space || space.workspace.toString() !== workspaceId.toString()) {
      return res.status(400).json({ message: 'Invalid space' });
    }

    // Get order for new folder
    const foldersCount = await Folder.countDocuments({ space: spaceId, parent: parent || null });

    const folder = await Folder.create({
      name,
      space: spaceId,
      workspace: workspaceId,
      description,
      color,
      parent: parent || null,
      createdBy: req.user._id,
      order: foldersCount
    });

    const populatedFolder = await Folder.findById(folder._id)
      .populate('createdBy', 'name email')
      .populate('space', 'name color')
      .populate('parent', 'name color');

    res.status(201).json({ success: true, data: populatedFolder });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update folder
// @route   PUT /api/folders/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check workspace access
    const hasAccess = req.user.hasWorkspaceAccess(folder.workspace, 'member');
    if (!hasAccess && folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this folder' });
    }

    const { name, description, color, isHidden, parent } = req.body;

    if (name) folder.name = name;
    if (description !== undefined) folder.description = description;
    if (color) folder.color = color;
    if (isHidden !== undefined) folder.isHidden = isHidden;
    if (parent !== undefined) folder.parent = parent;

    await folder.save();

    folder = await Folder.findById(folder._id)
      .populate('createdBy', 'name email')
      .populate('space', 'name color')
      .populate('parent', 'name color');

    res.json({ success: true, data: folder });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete/Archive folder
// @route   DELETE /api/folders/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check workspace access
    const hasAccess = req.user.hasWorkspaceAccess(folder.workspace, 'member');
    if (!hasAccess && folder.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this folder' });
    }

    // Archive instead of delete
    await folder.archive();

    res.json({ success: true, message: 'Folder archived successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Restore archived folder
// @route   POST /api/folders/:id/restore
// @access  Private
router.post('/:id/restore', protect, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const hasAccess = req.user.hasWorkspaceAccess(folder.workspace, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to restore this folder' });
    }

    await folder.restore();

    res.json({ success: true, message: 'Folder restored successfully', data: folder });
  } catch (error) {
    console.error('Restore folder error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get folder path/breadcrumbs
// @route   GET /api/folders/:id/path
// @access  Private
router.get('/:id/path', protect, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const hasAccess = req.user.hasWorkspaceAccess(folder.workspace);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const path = await folder.getPath();

    res.json({ success: true, data: path });
  } catch (error) {
    console.error('Get folder path error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Reorder folders
// @route   PUT /api/folders/reorder
// @access  Private
router.put('/reorder', protect, async (req, res) => {
  try {
    const { folderIds } = req.body;

    if (!Array.isArray(folderIds)) {
      return res.status(400).json({ message: 'Folder IDs must be an array' });
    }

    const updatePromises = folderIds.map((id, index) =>
      Folder.findByIdAndUpdate(id, { order: index })
    );

    await Promise.all(updatePromises);

    res.json({ success: true, message: 'Folders reordered successfully' });
  } catch (error) {
    console.error('Reorder folders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
