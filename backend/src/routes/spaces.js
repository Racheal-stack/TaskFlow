const express = require('express');
const router = express.Router();
const Space = require('../models/Space');
const Folder = require('../models/Folder');
const List = require('../models/List');
const Workspace = require('../models/Workspace');
const { protect } = require('../middleware/auth');

// @desc    Get all spaces for a workspace
// @route   GET /api/spaces
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }

    // Check workspace access
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const hasAccess = req.user.hasWorkspaceAccess(workspaceId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this workspace' });
    }

    const spaces = await Space.findByWorkspace(workspaceId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email avatar');

    res.json({ success: true, count: spaces.length, data: spaces });
  } catch (error) {
    console.error('Get spaces error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get single space
// @route   GET /api/spaces/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email avatar')
      .populate('foldersCount')
      .populate('listsCount');

    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // Check workspace access
    const hasAccess = req.user.hasWorkspaceAccess(space.workspace);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ success: true, data: space });
  } catch (error) {
    console.error('Get space error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Create new space
// @route   POST /api/spaces
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, workspaceId, description, color, icon, isPrivate, settings } = req.body;

    if (!name || !workspaceId) {
      return res.status(400).json({ message: 'Name and workspace are required' });
    }

    // Check workspace access
    const hasAccess = req.user.hasWorkspaceAccess(workspaceId, 'member');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to create space in this workspace' });
    }

    // Get order for new space
    const spacesCount = await Space.countDocuments({ workspace: workspaceId });

    const space = await Space.create({
      name,
      workspace: workspaceId,
      description,
      color,
      icon,
      isPrivate,
      settings,
      createdBy: req.user._id,
      order: spacesCount,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    const populatedSpace = await Space.findById(space._id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email avatar');

    res.status(201).json({ success: true, data: populatedSpace });
  } catch (error) {
    console.error('Create space error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update space
// @route   PUT /api/spaces/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let space = await Space.findById(req.params.id);

    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // Check if user has admin access to the space
    const hasAccess = space.hasAccess(req.user._id, 'admin');
    if (!hasAccess && space.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this space' });
    }

    const { name, description, color, icon, isPrivate, isFavorite, settings } = req.body;

    if (name) space.name = name;
    if (description !== undefined) space.description = description;
    if (color) space.color = color;
    if (icon) space.icon = icon;
    if (isPrivate !== undefined) space.isPrivate = isPrivate;
    if (isFavorite !== undefined) space.isFavorite = isFavorite;
    if (settings) space.settings = { ...space.settings, ...settings };

    await space.save();

    space = await Space.findById(space._id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email avatar');

    res.json({ success: true, data: space });
  } catch (error) {
    console.error('Update space error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete/Archive space
// @route   DELETE /api/spaces/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);

    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // Check if user has admin access
    const hasAccess = space.hasAccess(req.user._id, 'admin');
    if (!hasAccess && space.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this space' });
    }

    // Archive instead of delete
    await space.archive();

    res.json({ success: true, message: 'Space archived successfully' });
  } catch (error) {
    console.error('Delete space error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Restore archived space
// @route   POST /api/spaces/:id/restore
// @access  Private
router.post('/:id/restore', protect, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);

    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }

    const hasAccess = space.hasAccess(req.user._id, 'admin');
    if (!hasAccess && space.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to restore this space' });
    }

    await space.restore();

    res.json({ success: true, message: 'Space restored successfully', data: space });
  } catch (error) {
    console.error('Restore space error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Add member to space
// @route   POST /api/spaces/:id/members
// @access  Private
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { userId, role } = req.body;
    const space = await Space.findById(req.params.id);

    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }

    const hasAccess = space.hasAccess(req.user._id, 'admin');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to add members' });
    }

    await space.addMember(userId, role);

    const updatedSpace = await Space.findById(space._id)
      .populate('members.user', 'name email avatar');

    res.json({ success: true, data: updatedSpace });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Remove member from space
// @route   DELETE /api/spaces/:id/members/:userId
// @access  Private
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);

    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }

    const hasAccess = space.hasAccess(req.user._id, 'admin');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to remove members' });
    }

    await space.removeMember(req.params.userId);

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Reorder spaces
// @route   PUT /api/spaces/reorder
// @access  Private
router.put('/reorder', protect, async (req, res) => {
  try {
    const { spaceIds } = req.body; // Array of space IDs in new order

    if (!Array.isArray(spaceIds)) {
      return res.status(400).json({ message: 'Space IDs must be an array' });
    }

    const updatePromises = spaceIds.map((id, index) =>
      Space.findByIdAndUpdate(id, { order: index })
    );

    await Promise.all(updatePromises);

    res.json({ success: true, message: 'Spaces reordered successfully' });
  } catch (error) {
    console.error('Reorder spaces error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
