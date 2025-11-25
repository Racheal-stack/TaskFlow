const mongoose = require('mongoose');
require('dotenv').config();

const Workspace = require('./src/models/Workspace');
const User = require('./src/models/User');

const clearDuplicates = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow');
    console.log('Connected to MongoDB');

    // Find and delete the problematic workspace
    const result = await Workspace.deleteMany({ slug: 'test-company-inc' });
    console.log(`Deleted ${result.deletedCount} workspace(s) with slug 'test-company-inc'`);

    // Also clean up any users that might have references to non-existent workspaces
    const users = await User.find({});
    for (let user of users) {
      // Filter out any workspace references that don't exist
      const validWorkspaces = [];
      for (let ws of user.workspaces) {
        const workspaceExists = await Workspace.findById(ws.workspace);
        if (workspaceExists) {
          validWorkspaces.push(ws);
        }
      }
      
      if (validWorkspaces.length !== user.workspaces.length) {
        user.workspaces = validWorkspaces;
        user.currentWorkspace = validWorkspaces.length > 0 ? validWorkspaces[0].workspace : null;
        await user.save();
        console.log(`Updated user ${user.email}`);
      }
    }

    console.log('Database cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

clearDuplicates();