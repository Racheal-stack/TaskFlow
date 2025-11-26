const mongoose = require('mongoose');

const workspaceInvitationSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.ObjectId,
    ref: 'Workspace',
    required: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'member', 'viewer'],
    default: 'member'
  },
  invitedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  acceptedAt: Date,
  declinedAt: Date
}, {
  timestamps: true
});

// Index for faster queries
workspaceInvitationSchema.index({ email: 1, status: 1 });
workspaceInvitationSchema.index({ workspace: 1, status: 1 });
workspaceInvitationSchema.index({ token: 1 });
workspaceInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Check if invitation is expired
workspaceInvitationSchema.methods.isExpired = function() {
  return this.expiresAt < Date.now() || this.status === 'expired';
};

// Accept invitation
workspaceInvitationSchema.methods.accept = async function(userId) {
  if (this.isExpired()) {
    throw new Error('Invitation has expired');
  }
  
  if (this.status !== 'pending') {
    throw new Error('Invitation is not pending');
  }

  this.status = 'accepted';
  this.acceptedAt = Date.now();
  await this.save();

  // Add user to workspace
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  // Check if user is already in workspace
  const existingMembership = user.workspaces.find(
    ws => ws.workspace.toString() === this.workspace.toString()
  );

  if (!existingMembership) {
    user.workspaces.push({
      workspace: this.workspace,
      role: this.role,
      joinedAt: Date.now()
    });

    // Set as current workspace if user has no current workspace
    if (!user.currentWorkspace) {
      user.currentWorkspace = this.workspace;
    }

    await user.save();
  }

  return user;
};

// Decline invitation
workspaceInvitationSchema.methods.decline = async function() {
  if (this.status !== 'pending') {
    throw new Error('Invitation is not pending');
  }

  this.status = 'declined';
  this.declinedAt = Date.now();
  await this.save();
};

// Static method to find pending invitations by email
workspaceInvitationSchema.statics.findPendingByEmail = function(email) {
  return this.find({
    email: email.toLowerCase(),
    status: 'pending',
    expiresAt: { $gt: Date.now() }
  }).populate('workspace', 'name slug')
    .populate('invitedBy', 'name email avatar');
};

// Static method to check and expire old invitations
workspaceInvitationSchema.statics.expireOldInvitations = async function() {
  const result = await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: Date.now() }
    },
    {
      status: 'expired'
    }
  );
  return result;
};

module.exports = mongoose.model('WorkspaceInvitation', workspaceInvitationSchema);
