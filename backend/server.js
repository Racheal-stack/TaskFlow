const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const authRoutes = require('./src/routes/auth');
const workspaceRoutes = require('./src/routes/workspaces');
const projectRoutes = require('./src/routes/projects');
const taskRoutes = require('./src/routes/tasks');
const userRoutes = require('./src/routes/users');
const subscriptionRoutes = require('./src/routes/subscriptions');
const analyticsRoutes = require('./src/routes/analytics');
const meetingRoutes = require('./src/routes/meetings');
const spaceRoutes = require('./src/routes/spaces');
const folderRoutes = require('./src/routes/folders');
const listRoutes = require('./src/routes/lists');
const errorHandler = require('./src/middleware/errorHandler');
const socketHandler = require('./src/utils/socketHandler');
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
app.use(helmet());
app.use(compression());
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use('/uploads', express.static('public/uploads'));
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/lists', listRoutes);
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'TaskFlow API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});
app.use(errorHandler);
socketHandler(io);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 TaskFlow API Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
      process.exit(0);
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
      process.exit(1);
    }
  });
});
process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
      process.exit(0);
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
      process.exit(1);
    }
  });
});
if (require.main === module) {
  startServer();
}
module.exports = app;