const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'List name is required'],
    trim: true,
    maxlength: [100, 'List name cannot exceed 100 characters']
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: [true, 'Workspace is required']
  },
  space: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Space',
    required: true
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  color: {
    type: String,
    default: '#3B82F6',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Invalid color format. Use hex color code (e.g., #3B82F6)'
    }
  },
  statuses: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      default: '#6B7280'
    },
    type: {
      type: String,
      enum: ['todo', 'in-progress', 'done', 'custom'],
      default: 'custom'
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  defaultStatus: {
    type: String,
    default: 'To Do'
  },
  views: {
    enabledViews: [{
      type: String,
      enum: ['list', 'board', 'calendar', 'timeline', 'table'],
      default: ['list', 'board']
    }],
    defaultView: {
      type: String,
      enum: ['list', 'board', 'calendar', 'timeline', 'table'],
      default: 'list'
    }
  },
  settings: {
    allowSubtasks: {
      type: Boolean,
      default: true
    },
    allowAttachments: {
      type: Boolean,
      default: true
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    allowDependencies: {
      type: Boolean,
      default: true
    },
    showCompletedTasks: {
      type: Boolean,
      default: true
    },
    sortBy: {
      field: {
        type: String,
        enum: ['dueDate', 'priority', 'status', 'createdAt', 'name'],
        default: 'createdAt'
      },
      order: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'desc'
      }
    },
    groupBy: {
      type: String,
      enum: ['none', 'status', 'assignee', 'priority', 'dueDate'],
      default: 'status'
    }
  },
  customFields: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'dropdown', 'date', 'checkbox', 'url', 'email'],
      required: true
    },
    options: [String], // For dropdown type
    required: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  order: {
    type: Number,
    default: 0
  },
  isFavorite: {
    type: Boolean,
    default: false
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
listSchema.index({ workspace: 1, isArchived: 1 });
listSchema.index({ space: 1, isArchived: 1 });
listSchema.index({ folder: 1, isArchived: 1 });
listSchema.index({ space: 1, folder: 1, order: 1 });

// Virtual for tasks count
listSchema.virtual('tasksCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'list',
  count: true
});

// Default statuses
listSchema.pre('save', function(next) {
  if (this.isNew && (!this.statuses || this.statuses.length === 0)) {
    this.statuses = [
      { name: 'To Do', color: '#6B7280', type: 'todo', order: 0 },
      { name: 'In Progress', color: '#3B82F6', type: 'in-progress', order: 1 },
      { name: 'Done', color: '#10B981', type: 'done', order: 2 }
    ];
  }
  
  // Validate folder belongs to the same space
  if (this.folder) {
    const Folder = mongoose.model('Folder');
    Folder.findById(this.folder).then(folder => {
      if (folder && folder.space.toString() !== this.space.toString()) {
        return next(new Error('Folder must belong to the same space'));
      }
      next();
    }).catch(err => next(err));
  } else {
    next();
  }
});

// Methods
listSchema.methods.addStatus = function(name, color, type = 'custom') {
  const maxOrder = this.statuses.reduce((max, s) => Math.max(max, s.order), -1);
  this.statuses.push({
    name,
    color: color || '#6B7280',
    type,
    order: maxOrder + 1
  });
  return this.save();
};

listSchema.methods.removeStatus = function(statusName) {
  this.statuses = this.statuses.filter(s => s.name !== statusName);
  return this.save();
};

listSchema.methods.updateStatus = function(oldName, newName, color) {
  const status = this.statuses.find(s => s.name === oldName);
  if (status) {
    status.name = newName;
    if (color) status.color = color;
  }
  return this.save();
};

listSchema.methods.addCustomField = function(name, type, options = {}) {
  const maxOrder = this.customFields.reduce((max, f) => Math.max(max, f.order), -1);
  this.customFields.push({
    name,
    type,
    options: options.options || [],
    required: options.required || false,
    order: maxOrder + 1
  });
  return this.save();
};

listSchema.methods.removeCustomField = function(fieldName) {
  this.customFields = this.customFields.filter(f => f.name !== fieldName);
  return this.save();
};

listSchema.methods.archive = function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  return this.save();
};

listSchema.methods.restore = function() {
  this.isArchived = false;
  this.archivedAt = null;
  return this.save();
};

// Statics
listSchema.statics.findBySpace = function(spaceId, includeArchived = false) {
  const query = { space: spaceId, folder: null };
  if (!includeArchived) {
    query.isArchived = false;
  }
  return this.find(query).sort({ order: 1, createdAt: 1 });
};

listSchema.statics.findByFolder = function(folderId, includeArchived = false) {
  const query = { folder: folderId };
  if (!includeArchived) {
    query.isArchived = false;
  }
  return this.find(query).sort({ order: 1, createdAt: 1 });
};

listSchema.statics.findByWorkspace = function(workspaceId, includeArchived = false) {
  const query = { workspace: workspaceId };
  if (!includeArchived) {
    query.isArchived = false;
  }
  return this.find(query).sort({ order: 1, createdAt: 1 });
};

module.exports = mongoose.model('List', listSchema);
