const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true,
    maxlength: [200, 'Task title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot be more than 2000 characters'],
    trim: true
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  workspace: {
    type: mongoose.Schema.ObjectId,
    ref: 'Workspace',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  // Task assignment
  assignees: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  }],
  // Task status and column
  status: {
    type: String,
    enum: ['todo', 'doing', 'review', 'done', 'blocked', 'cancelled'],
    default: 'todo'
  },
  column: {
    type: String,
    required: true,
    default: 'todo'
  },
  // Task priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Task dates
  dueDate: Date,
  startDate: Date,
  completedAt: Date,
  // Task ordering within column
  order: {
    type: Number,
    default: 0
  },
  // Task labels/tags
  labels: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      default: '#6B7280'
    }
  }],
  // File attachments (Pro feature)
  attachments: [{
    fileName: String,
    originalName: String,
    fileSize: Number,
    mimeType: String,
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    url: String
  }],
  // Task checklist
  checklist: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  // Time tracking
  timeTracking: {
    estimated: Number, // in minutes
    logged: Number, // in minutes
    sessions: [{
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      startTime: Date,
      endTime: Date,
      duration: Number, // in minutes
      description: String
    }]
  },
  // Comments/Activity
  comments: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['comment', 'system', 'status_change', 'assignment_change'],
      default: 'comment'
    },
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date,
    isEdited: {
      type: Boolean,
      default: false
    }
  }],
  // Task relationships
  dependencies: [{
    task: {
      type: mongoose.Schema.ObjectId,
      ref: 'Task'
    },
    type: {
      type: String,
      enum: ['blocks', 'blocked_by', 'related'],
      default: 'related'
    }
  }],
  // Subtasks
  subtasks: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Task'
  }],
  parentTask: {
    type: mongoose.Schema.ObjectId,
    ref: 'Task'
  },
  // Task settings
  isArchived: {
    type: Boolean,
    default: false
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  // Recurring task settings (Pro feature)
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom']
    },
    interval: Number,
    endDate: Date,
    nextDueDate: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
taskSchema.index({ project: 1, column: 1, order: 1 });
taskSchema.index({ workspace: 1, status: 1 });
taskSchema.index({ 'assignees.user': 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ isArchived: 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && new Date() > this.dueDate && this.status !== 'done';
});

// Virtual for completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  if (this.checklist.length === 0) {
    return this.status === 'done' ? 100 : 0;
  }
  
  const completedItems = this.checklist.filter(item => item.completed).length;
  return Math.round((completedItems / this.checklist.length) * 100);
});

// Virtual for total logged time
taskSchema.virtual('totalLoggedTime').get(function() {
  return this.timeTracking.logged || 0;
});

// Pre-save middleware
taskSchema.pre('save', function(next) {
  // Set completion date when task is marked as done
  if (this.isModified('status') && this.status === 'done' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Clear completion date when task is moved from done
  if (this.isModified('status') && this.status !== 'done' && this.completedAt) {
    this.completedAt = undefined;
  }
  
  // Update column based on status
  if (this.isModified('status') && !this.isModified('column')) {
    const statusColumnMap = {
      'todo': 'todo',
      'doing': 'doing',
      'review': 'review',
      'done': 'done',
      'blocked': 'doing',
      'cancelled': 'done'
    };
    this.column = statusColumnMap[this.status] || this.column;
  }
  
  next();
});

// Method to check if user is assigned to task
taskSchema.methods.isAssignedTo = function(userId) {
  return this.assignees.some(assignee => 
    assignee.user.toString() === userId.toString()
  );
};

// Method to add comment
taskSchema.methods.addComment = function(userId, text, type = 'comment', metadata = {}) {
  this.comments.push({
    user: userId,
    text,
    type,
    metadata
  });
  return this.save();
};

// Method to move to column
taskSchema.methods.moveToColumn = function(columnId, newOrder) {
  this.column = columnId;
  this.order = newOrder;
  
  // Update status based on column
  const columnStatusMap = {
    'todo': 'todo',
    'doing': 'doing',
    'review': 'review',
    'done': 'done'
  };
  
  if (columnStatusMap[columnId]) {
    this.status = columnStatusMap[columnId];
  }
  
  return this.save();
};

// Static method to find by project
taskSchema.statics.findByProject = function(projectId, options = {}) {
  const query = { project: projectId, isArchived: false };
  
  if (options.column) query.column = options.column;
  if (options.status) query.status = options.status;
  if (options.assignee) query['assignees.user'] = options.assignee;
  
  return this.find(query)
    .populate('assignees.user', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('comments.user', 'name email avatar')
    .sort({ order: 1, createdAt: -1 });
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = function(workspaceId) {
  return this.find({
    workspace: workspaceId,
    dueDate: { $lt: new Date() },
    status: { $nin: ['done', 'cancelled'] },
    isArchived: false
  }).populate('assignees.user project', 'name email avatar name');
};

module.exports = mongoose.model('Task', taskSchema);