const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected (${socket.userId})`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join workspace rooms based on user's workspaces
    if (socket.user.workspaces) {
      socket.user.workspaces.forEach(ws => {
        socket.join(`workspace_${ws.workspace}`);
      });
    }

    // Handle joining specific project rooms
    socket.on('join_project', (projectId) => {
      // TODO: Verify user has access to project
      socket.join(`project_${projectId}`);
      console.log(`User ${socket.user.name} joined project ${projectId}`);
    });

    // Handle leaving project rooms
    socket.on('leave_project', (projectId) => {
      socket.leave(`project_${projectId}`);
      console.log(`User ${socket.user.name} left project ${projectId}`);
    });

    // Handle task updates (real-time collaboration)
    socket.on('task_update', (data) => {
      // Broadcast to all users in the project
      socket.to(`project_${data.projectId}`).emit('task_updated', {
        taskId: data.taskId,
        changes: data.changes,
        updatedBy: {
          id: socket.userId,
          name: socket.user.name,
          avatar: socket.user.avatar
        },
        timestamp: new Date()
      });
    });

    // Handle task movement (drag and drop)
    socket.on('task_moved', (data) => {
      socket.to(`project_${data.projectId}`).emit('task_position_changed', {
        taskId: data.taskId,
        fromColumn: data.fromColumn,
        toColumn: data.toColumn,
        newOrder: data.newOrder,
        movedBy: {
          id: socket.userId,
          name: socket.user.name
        },
        timestamp: new Date()
      });
    });

    // Handle typing indicators for comments
    socket.on('typing_start', (data) => {
      socket.to(`project_${data.projectId}`).emit('user_typing', {
        taskId: data.taskId,
        user: {
          id: socket.userId,
          name: socket.user.name
        }
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`project_${data.projectId}`).emit('user_stopped_typing', {
        taskId: data.taskId,
        userId: socket.userId
      });
    });

    // Handle new comments
    socket.on('new_comment', (data) => {
      socket.to(`project_${data.projectId}`).emit('comment_added', {
        taskId: data.taskId,
        comment: data.comment,
        author: {
          id: socket.userId,
          name: socket.user.name,
          avatar: socket.user.avatar
        },
        timestamp: new Date()
      });
    });

    // Handle user presence (who's online)
    socket.on('update_presence', (data) => {
      socket.to(`workspace_${data.workspaceId}`).emit('user_presence_changed', {
        userId: socket.userId,
        status: data.status, // 'active', 'away', 'busy'
        currentProject: data.currentProject
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.name} disconnected: ${reason}`);
      
      // Notify workspace members that user went offline
      if (socket.user.workspaces) {
        socket.user.workspaces.forEach(ws => {
          socket.to(`workspace_${ws.workspace}`).emit('user_went_offline', {
            userId: socket.userId,
            timestamp: new Date()
          });
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.name}:`, error);
    });
  });

  // Helper function to emit to specific user
  io.emitToUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  // Helper function to emit to workspace
  io.emitToWorkspace = (workspaceId, event, data) => {
    io.to(`workspace_${workspaceId}`).emit(event, data);
  };

  // Helper function to emit to project
  io.emitToProject = (projectId, event, data) => {
    io.to(`project_${projectId}`).emit(event, data);
  };

  console.log('Socket.IO server initialized');
};

module.exports = socketHandler;