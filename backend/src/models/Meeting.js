const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a meeting title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Please provide a start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Please provide an end time']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot be more than 200 characters']
  },
  type: {
    type: String,
    enum: ['meeting', 'call', 'workshop', 'presentation', 'other'],
    default: 'meeting'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  organizer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: mongoose.Schema.ObjectId,
    ref: 'Workspace',
    required: true
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  attendees: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'maybe'],
      default: 'pending'
    },
    joinedAt: Date
  }],
  meetingLink: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#3b82f6' // Default blue color
  },
  reminders: [{
    time: {
      type: Number, // Minutes before meeting
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    endDate: Date
  },
  attachments: [{
    filename: String,
    originalName: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [5000, 'Notes cannot be more than 5000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
meetingSchema.index({ workspace: 1, startTime: 1 });
meetingSchema.index({ organizer: 1, startTime: 1 });
meetingSchema.index({ 'attendees.user': 1, startTime: 1 });
meetingSchema.index({ startTime: 1, endTime: 1 });

// Virtual for meeting duration
meetingSchema.virtual('duration').get(function() {
  return this.endTime - this.startTime;
});

// Virtual for formatted duration
meetingSchema.virtual('durationFormatted').get(function() {
  const duration = this.endTime - this.startTime;
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Check if meeting is happening now
meetingSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return now >= this.startTime && now <= this.endTime;
});

// Check if meeting is upcoming (within next hour)
meetingSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  return this.startTime >= now && this.startTime <= nextHour;
});

// Validate that end time is after start time
meetingSchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
  } else {
    next();
  }
});

// Populate attendees and organizer by default
meetingSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'organizer',
    select: 'name email avatar'
  }).populate({
    path: 'attendees.user',
    select: 'name email avatar'
  }).populate({
    path: 'project',
    select: 'name color'
  });
  next();
});

module.exports = mongoose.model('Meeting', meetingSchema);