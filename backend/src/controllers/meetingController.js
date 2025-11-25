const Meeting = require('../models/Meeting');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const { validationResult } = require('express-validator');

// @desc    Get all meetings for current workspace
// @route   GET /api/meetings
// @access  Private
const getMeetings = async (req, res, next) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      type,
      page = 1, 
      limit = 50,
      search 
    } = req.query;

    // Build query
    const query = {
      workspace: req.user.currentWorkspace,
      $or: [
        { organizer: req.user.id },
        { 'attendees.user': req.user.id }
      ]
    };

    // Add date filters
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add type filter
    if (type) {
      query.type = type;
    }

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const meetings = await Meeting.find(query)
      .sort({ startTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Meeting.countDocuments(query);

    res.status(200).json({
      success: true,
      count: meetings.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      meetings
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    next(error);
  }
};

// @desc    Get single meeting
// @route   GET /api/meetings/:id
// @access  Private
const getMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      workspace: req.user.currentWorkspace,
      $or: [
        { organizer: req.user.id },
        { 'attendees.user': req.user.id }
      ]
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    res.status(200).json({
      success: true,
      meeting
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    next(error);
  }
};

// @desc    Create new meeting
// @route   POST /api/meetings
// @access  Private
const createMeeting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      startTime,
      endTime,
      location,
      type,
      priority,
      attendees = [],
      meetingLink,
      color,
      project,
      reminders = []
    } = req.body;

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Check for conflicts
    const conflictingMeetings = await Meeting.find({
      workspace: req.user.currentWorkspace,
      $or: [
        { organizer: req.user.id },
        { 'attendees.user': req.user.id }
      ],
      status: { $ne: 'cancelled' },
      $or: [
        {
          startTime: { $lt: end },
          endTime: { $gt: start }
        }
      ]
    });

    if (conflictingMeetings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have a conflicting meeting at this time',
        conflicts: conflictingMeetings.map(m => ({
          id: m._id,
          title: m.title,
          startTime: m.startTime,
          endTime: m.endTime
        }))
      });
    }

    // Process attendees
    const processedAttendees = [];
    if (attendees.length > 0) {
      for (const attendeeEmail of attendees) {
        const user = await User.findOne({ 
          email: attendeeEmail.toLowerCase(),
          isActive: true 
        });
        
        if (user) {
          processedAttendees.push({
            user: user._id,
            status: 'pending'
          });
        }
      }
    }

    // Create meeting
    const meeting = await Meeting.create({
      title,
      description,
      startTime: start,
      endTime: end,
      location,
      type,
      priority,
      organizer: req.user.id,
      workspace: req.user.currentWorkspace,
      project,
      attendees: processedAttendees,
      meetingLink,
      color,
      reminders
    });

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      meeting
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    next(error);
  }
};

// @desc    Update meeting
// @route   PUT /api/meetings/:id
// @access  Private
const updateMeeting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let meeting = await Meeting.findOne({
      _id: req.params.id,
      workspace: req.user.currentWorkspace,
      organizer: req.user.id // Only organizer can update
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or you are not authorized to update it'
      });
    }

    // Update meeting
    meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      meeting
    });
  } catch (error) {
    console.error('Update meeting error:', error);
    next(error);
  }
};

// @desc    Delete meeting
// @route   DELETE /api/meetings/:id
// @access  Private
const deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      workspace: req.user.currentWorkspace,
      organizer: req.user.id // Only organizer can delete
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or you are not authorized to delete it'
      });
    }

    await Meeting.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error('Delete meeting error:', error);
    next(error);
  }
};

// @desc    Update attendee response
// @route   PUT /api/meetings/:id/response
// @access  Private
const updateAttendeeResponse = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'declined', 'maybe'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid response status'
      });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      workspace: req.user.currentWorkspace,
      'attendees.user': req.user.id
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or you are not invited'
      });
    }

    // Update attendee response
    const attendee = meeting.attendees.find(a => 
      a.user.toString() === req.user.id.toString()
    );
    
    if (attendee) {
      attendee.status = status;
      if (status === 'accepted') {
        attendee.joinedAt = new Date();
      }
    }

    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Response updated successfully',
      meeting
    });
  } catch (error) {
    console.error('Update response error:', error);
    next(error);
  }
};

// @desc    Get upcoming meetings
// @route   GET /api/meetings/upcoming
// @access  Private
const getUpcomingMeetings = async (req, res, next) => {
  try {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const meetings = await Meeting.find({
      workspace: req.user.currentWorkspace,
      $or: [
        { organizer: req.user.id },
        { 'attendees.user': req.user.id }
      ],
      status: 'scheduled',
      startTime: {
        $gte: now,
        $lte: endOfDay
      }
    })
    .sort({ startTime: 1 })
    .limit(5);

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings
    });
  } catch (error) {
    console.error('Get upcoming meetings error:', error);
    next(error);
  }
};

module.exports = {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  updateAttendeeResponse,
  getUpcomingMeetings
};