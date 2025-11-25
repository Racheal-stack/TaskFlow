const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a project name'],
    trim: true,
    maxlength: [100, 'Project name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
    trim: true
  },
  workspace: {
    type: mongoose.Schema.ObjectId,
    ref: 'Workspace',
    required: true
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  // Project settings
  color: {
    type: String,
    default: '#3B82F6', // Blue
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
  },
  icon: {
    type: String,
    default: 'folder'
  },
  // Project workflow stages
  columns: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      default: '#6B7280'
    },
    order: {
      type: Number,
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  // Project members and their roles
  members: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  }],
  // Project status
  status: {
    type: String,
    enum: ['active', 'archived', 'completed', 'on-hold'],
    default: 'active'
  },
  // Project dates
  startDate: Date,
  dueDate: Date,
  completedAt: Date,
  // Project visibility
  visibility: {
    type: String,
    enum: ['private', 'workspace', 'public'],
    default: 'workspace'
  },
  // Project statistics
  stats: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    overdueTasks: {
      type: Number,
      default: 0
    },
    lastActivity: Date
  },
  // Project settings
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowFileUploads: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    autoArchiveCompleted: {
      type: Boolean,
      default: false
    },
    notifyOnTaskUpdate: {
      type: Boolean,
      default: true
    }
  },
  // Template information (if project was created from template)
  template: {
    isTemplate: {
      type: Boolean,
      default: false
    },
    templateName: String,
    createdFromTemplate: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
projectSchema.index({ workspace: 1, status: 1 });
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ status: 1, isActive: 1 });
projectSchema.index({ dueDate: 1 });

// Virtual for tasks
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project'
});

// Virtual for progress percentage
projectSchema.virtual('progress').get(function() {
  if (this.stats.totalTasks === 0) return 0;
  return Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100);
});

// Virtual for overdue status
projectSchema.virtual('isOverdue').get(function() {
  return this.dueDate && new Date() > this.dueDate && this.status !== 'completed';
});

// Pre-save middleware to set default columns
projectSchema.pre('save', function(next) {
  if (this.isNew && this.columns.length === 0) {
    this.columns = [
      { id: 'todo', name: 'To Do', color: '#EF4444', order: 1, isDefault: true },
      { id: 'doing', name: 'Doing', color: '#F59E0B', order: 2, isDefault: true },
      { id: 'review', name: 'Review', color: '#8B5CF6', order: 3, isDefault: true },
      { id: 'done', name: 'Done', color: '#10B981', order: 4, isDefault: true }
    ];
  }
  next();
});

// Method to check if user is project member
projectSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString()
  );
};

// Method to get user's role in project
projectSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// Method to check if user has permission
projectSchema.methods.hasPermission = function(userId, action) {
  const role = this.getUserRole(userId);
  if (!role) return false;
  
  const permissions = {
    viewer: ['view'],
    member: ['view', 'create_task', 'update_task', 'comment'],
    admin: ['view', 'create_task', 'update_task', 'delete_task', 'comment', 'manage_members'],
    owner: ['view', 'create_task', 'update_task', 'delete_task', 'comment', 'manage_members', 'manage_project', 'delete_project']
  };
  
  return permissions[role]?.includes(action) || false;
};

// Static method to find by workspace
projectSchema.statics.findByWorkspace = function(workspaceId, options = {}) {
  const query = { workspace: workspaceId, isActive: true };
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .sort({ updatedAt: -1 });
};

module.exports = mongoose.model('Project', projectSchema);