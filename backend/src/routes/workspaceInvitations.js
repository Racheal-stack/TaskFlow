const express = require('express');
const router = express.Router();
const WorkspaceInvitation = require('../models/WorkspaceInvitation');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const emailService = require('../services/emailService');

// @route   POST /api/workspace-invitations
// @desc    Send workspace invitation
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { workspaceId, email, role = 'member' } = req.body;

    if (!workspaceId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID and email are required'
      });
    }

    // Check if workspace exists and user has permission
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is admin or owner
    // Extract workspace ID (could be populated object or string)
    const actualWorkspaceId = workspaceId._id || workspaceId.id || workspaceId;
    console.log('=== Permission Check ===');
    console.log('workspaceId from request:', workspaceId);
    console.log('actualWorkspaceId:', actualWorkspaceId);
    console.log('req.user.workspaces:', JSON.stringify(req.user.workspaces, null, 2));
    
    const userWorkspace = req.user.workspaces.find(ws => {
      const wsId = ws.workspace?._id || ws.workspace?.id || ws.workspace;
      const wsIdString = wsId ? wsId.toString() : null;
      const workspaceIdString = actualWorkspaceId.toString();
      
      console.log('Comparing:', wsIdString, 'with', workspaceIdString);
      console.log('Match:', wsIdString === workspaceIdString);
      console.log('Role:', ws.role);
      
      return wsIdString === workspaceIdString;
    });

    console.log('Found userWorkspace:', userWorkspace);
    console.log('User role in workspace:', userWorkspace?.role);

    if (!userWorkspace) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace'
      });
    }

    if (!['owner', 'admin'].includes(userWorkspace.role)) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to invite members. Your role: ${userWorkspace.role}`
      });
    }

    // Check if user already exists and is already a member
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const isMember = existingUser.workspaces.some(
        ws => ws.workspace.toString() === workspaceId
      );
      if (isMember) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this workspace'
        });
      }
    }

    // Check if there's already a pending invitation
    const existingInvitation = await WorkspaceInvitation.findOne({
      workspace: workspaceId,
      email: email.toLowerCase(),
      status: 'pending',
      expiresAt: { $gt: Date.now() }
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'An invitation has already been sent to this email'
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation
    const invitation = await WorkspaceInvitation.create({
      workspace: workspaceId,
      email: email.toLowerCase(),
      role,
      invitedBy: req.user.id,
      token
    });

    await invitation.populate([
      { path: 'workspace', select: 'name slug' },
      { path: 'invitedBy', select: 'name email' }
    ]);

    // Send invitation email
    try {
      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/invite/${token}`;
      await emailService.sendWorkspaceInvitation(
        email,
        workspace.name,
        req.user.name,
        inviteLink,
        role
      );
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invitation
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitation',
      error: error.message
    });
  }
});

// @route   GET /api/workspace-invitations/my-invitations
// @desc    Get current user's pending invitations
// @access  Private
router.get('/my-invitations', protect, async (req, res) => {
  try {
    const invitations = await WorkspaceInvitation.findPendingByEmail(req.user.email);

    res.json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitations',
      error: error.message
    });
  }
});

// @route   GET /api/workspace-invitations/workspace/:workspaceId
// @desc    Get all invitations for a workspace
// @access  Private (Admin/Owner only)
router.get('/workspace/:workspaceId', protect, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Check if user has permission - handle both populated and non-populated workspace
    const userWorkspace = req.user.workspaces.find(ws => {
      const wsId = ws.workspace?._id || ws.workspace?.id || ws.workspace;
      return wsId?.toString() === workspaceId.toString();
    });

    console.log('Getting invitations for workspace:', workspaceId);
    console.log('User workspaces:', req.user.workspaces);
    console.log('Found userWorkspace:', userWorkspace);
    console.log('User role:', userWorkspace?.role);

    if (!userWorkspace || !['owner', 'admin'].includes(userWorkspace.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view invitations'
      });
    }

    const invitations = await WorkspaceInvitation.find({
      workspace: workspaceId
    })
      .populate('invitedBy', 'name email avatar')
      .sort('-createdAt');

    console.log('Found invitations:', invitations.length);

    res.json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    console.error('Get workspace invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspace invitations',
      error: error.message
    });
  }
});

// @route   GET /api/workspace-invitations/:token
// @desc    Get invitation details by token
// @access  Public
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await WorkspaceInvitation.findOne({ token })
      .populate('workspace', 'name slug')
      .populate('invitedBy', 'name email avatar');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    if (invitation.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired',
        expired: true
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation has already been ${invitation.status}`,
        status: invitation.status
      });
    }

    res.json({
      success: true,
      data: invitation
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation',
      error: error.message
    });
  }
});

// @route   POST /api/workspace-invitations/:token/accept
// @desc    Accept workspace invitation
// @access  Private
router.post('/:token/accept', protect, async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await WorkspaceInvitation.findOne({ token })
      .populate('workspace', 'name slug');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if invitation email matches user email
    if (invitation.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'This invitation is for a different email address'
      });
    }

    await invitation.accept(req.user.id);

    // Get updated user data
    const user = await User.findById(req.user.id)
      .populate('workspaces.workspace', 'name slug subscription')
      .populate('currentWorkspace', 'name slug subscription');

    res.json({
      success: true,
      message: `You've joined ${invitation.workspace.name}!`,
      data: {
        workspace: invitation.workspace,
        user: {
          workspaces: user.workspaces,
          currentWorkspace: user.currentWorkspace
        }
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept invitation'
    });
  }
});

// @route   POST /api/workspace-invitations/:token/decline
// @desc    Decline workspace invitation
// @access  Private
router.post('/:token/decline', protect, async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await WorkspaceInvitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if invitation email matches user email
    if (invitation.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'This invitation is for a different email address'
      });
    }

    await invitation.decline();

    res.json({
      success: true,
      message: 'Invitation declined'
    });
  } catch (error) {
    console.error('Decline invitation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to decline invitation'
    });
  }
});

// @route   DELETE /api/workspace-invitations/:id
// @desc    Cancel/delete invitation
// @access  Private (Admin/Owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await WorkspaceInvitation.findById(id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if user has permission
    const userWorkspace = req.user.workspaces.find(
      ws => ws.workspace.toString() === invitation.workspace.toString()
    );

    if (!userWorkspace || !['owner', 'admin'].includes(userWorkspace.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this invitation'
      });
    }

    await invitation.deleteOne();

    res.json({
      success: true,
      message: 'Invitation cancelled'
    });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel invitation',
      error: error.message
    });
  }
});

module.exports = router;
