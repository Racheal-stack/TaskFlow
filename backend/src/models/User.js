const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  emailVerificationCode: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      taskAssigned: { type: Boolean, default: true },
      taskDueDate: { type: Boolean, default: true },
      projectUpdates: { type: Boolean, default: true }
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  workspaces: [{
    workspace: {
      type: mongoose.Schema.ObjectId,
      ref: 'Workspace'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  currentWorkspace: {
    type: mongoose.Schema.ObjectId,
    ref: 'Workspace'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

UserSchema.index({ 'workspaces.workspace': 1 });
UserSchema.index({ currentWorkspace: 1 });


userSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


userSchema.methods.hasWorkspaceAccess = function(workspaceId, requiredRole = 'member') {
  const roleHierarchy = ['viewer', 'member', 'admin', 'owner'];
  const userWorkspace = this.workspaces.find(ws => 
    ws.workspace.toString() === workspaceId.toString()
  );
  
  if (!userWorkspace) return false;
  
  const userRoleIndex = roleHierarchy.indexOf(userWorkspace.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
  
  return userRoleIndex >= requiredRoleIndex;
};

UserSchema.methods.getWorkspaceRole = function(workspaceId) {
  const workspace = this.workspaces.find(ws => 
    ws.workspace.toString() === workspaceId.toString()
  );
  return workspace ? workspace.role : null;
};


userSchema.statics.findByWorkspace = function(workspaceId) {
  return this.find({
    'workspaces.workspace': workspaceId,
    isActive: true
  }).select('-password');
};

module.exports = mongoose.model('User', userSchema);