const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true,
    maxlength: [100, 'Folder name cannot exceed 100 characters']
  },
  space: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Space',
    required: [true, 'Space is required']
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
    default: '#9CA3AF',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Invalid color format. Use hex color code (e.g., #9CA3AF)'
    }
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  isHidden: {
    type: Boolean,
    default: false
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
folderSchema.index({ space: 1, isArchived: 1 });
folderSchema.index({ space: 1, parent: 1, order: 1 });
folderSchema.index({ workspace: 1 });

// Virtual for lists count
folderSchema.virtual('listsCount', {
  ref: 'List',
  localField: '_id',
  foreignField: 'folder',
  count: true
});

// Virtual for subfolders
folderSchema.virtual('subfolders', {
  ref: 'Folder',
  localField: '_id',
  foreignField: 'parent'
});

// Pre-save hook to validate parent folder
folderSchema.pre('save', async function(next) {
  if (this.parent) {
    // Check if parent exists and belongs to the same space
    const parentFolder = await this.constructor.findById(this.parent);
    
    if (!parentFolder) {
      return next(new Error('Parent folder does not exist'));
    }
    
    if (parentFolder.space.toString() !== this.space.toString()) {
      return next(new Error('Parent folder must belong to the same space'));
    }
    
    // Prevent circular references
    if (parentFolder.parent && parentFolder.parent.toString() === this._id.toString()) {
      return next(new Error('Circular folder reference detected'));
    }
  }
  
  next();
});

// Methods
folderSchema.methods.archive = function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  return this.save();
};

folderSchema.methods.restore = function() {
  this.isArchived = false;
  this.archivedAt = null;
  return this.save();
};

folderSchema.methods.getPath = async function() {
  const path = [this];
  let currentFolder = this;
  
  while (currentFolder.parent) {
    currentFolder = await this.constructor.findById(currentFolder.parent);
    if (!currentFolder) break;
    path.unshift(currentFolder);
  }
  
  return path;
};

// Statics
folderSchema.statics.findBySpace = function(spaceId, includeArchived = false) {
  const query = { space: spaceId, parent: null };
  if (!includeArchived) {
    query.isArchived = false;
  }
  return this.find(query).sort({ order: 1, createdAt: 1 });
};

folderSchema.statics.findByParent = function(parentId, includeArchived = false) {
  const query = { parent: parentId };
  if (!includeArchived) {
    query.isArchived = false;
  }
  return this.find(query).sort({ order: 1, createdAt: 1 });
};

folderSchema.statics.findByWorkspace = function(workspaceId, includeArchived = false) {
  const query = { workspace: workspaceId };
  if (!includeArchived) {
    query.isArchived = false;
  }
  return this.find(query).sort({ order: 1, createdAt: 1 });
};

module.exports = mongoose.model('Folder', folderSchema);
