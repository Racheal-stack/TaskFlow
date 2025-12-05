const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const Workspace = require('../models/Workspace');
const AuditLog = require('../models/AuditLog');

router.patch('/:workspaceId/members/:userId/role', protect, checkPermission('admin'), async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    const { role } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    const member = workspace.members.find(m => m.user.toString() === userId);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const oldRole = member.role;
    member.role = role;
    await workspace.save();

    await AuditLog.create({
      workspace: workspaceId,
      user: req.user._id,
      action: 'role_changed',
      targetType: 'user',
      targetId: userId,
      changes: { from: oldRole, to: role }
    });

    res.json({ success: true, member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:workspaceId/audit-logs', protect, checkPermission('admin'), async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const logs = await AuditLog.find({ workspace: workspaceId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
