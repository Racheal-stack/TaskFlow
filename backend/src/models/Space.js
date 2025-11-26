const mongoose = require('mongoose');

const spaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Space name is required'],
    trim: true,
    maxlength: [100, 'Space name cannot exceed 100 characters']
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: [true, 'Workspace is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  color: {
    type: String,
    default: '#6B7280',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Invalid color format. Use hex color code (e.g., #6B7280)'
    }
  },
  icon: {
    type: String,
    default: 'FolderIcon',
    trim: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'member', 'admin'],
      default: 'member'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    defaultView: {
      type: String,
      enum: ['list', 'board', 'calendar', 'timeline'],
      default: 'list'
    },
    showCompletedTasks: {
      type: Boolean,
      default: true
    }
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
spaceSchema.index({ workspace: 1, isArchived: 1 });
spaceSchema.index({ workspace: 1, order: 1 });
spaceSchema.index({ 'members.user': 1 });

// Virtual for folders count
spaceSchema.virtual('foldersCount', {
  ref: 'Folder',
  localField: '_id',
  foreignField: 'space',
  count: true
});

// Virtual for lists count
spaceSchema.virtual('listsCount', {
  ref: 'List',
  localField: '_id',
  foreignField: 'space',
  count: true
});

// Methods
spaceSchema.methods.hasAccess = function(userId, requiredRole = 'viewer') {
  const roleHierarchy = ['viewer', 'member', 'admin'];
  const member = this.members.find(m => m.user.toString() === userId.toString());
  
  if (!member) return false;
  
  const userRoleIndex = roleHierarchy.indexOf(member.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
  
  return userRoleIndex >= requiredRoleIndex;
};

spaceSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  
  if (existingMember) {
    existingMember.role = role;
  } else {
    this.members.push({ user: userId, role });
  }
  
  return this.save();
};

spaceSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(m => m.user.toString() !== userId.toString());
  return this.save();
};

spaceSchema.methods.archive = function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  return this.save();
};

spaceSchema.methods.restore = function() {
  this.isArchived = false;
  this.archivedAt = null;
  return this.save();
};

// Statics
spaceSchema.statics.findByWorkspace = function(workspaceId, includeArchived = false) {
  const query = { workspace: workspaceId };
  if (!includeArchived) {
    query.isArchived = false;
  }
  return this.find(query).sort({ order: 1, createdAt: 1 });
};

spaceSchema.statics.findByUser = function(workspaceId, userId, includeArchived = false) {
  const query = {
    workspace: workspaceId,
    'members.user': userId
  };
  if (!includeArchived) {
    query.isArchived = false;
  }
  return this.find(query).sort({ order: 1, createdAt: 1 });
};

module.exports = mongoose.model('Space', spaceSchema);
