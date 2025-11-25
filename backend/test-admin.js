const mongoose = require('mongoose');
const User = require('./src/models/User');
const emailService = require('./src/services/emailService');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow');

async function setupAdmin() {
  try {
    // Find the first user or create an admin user
    const users = await User.find().limit(5);
    console.log('Current users:', users.map(u => ({ 
      email: u.email, 
      role: u.role, 
      verified: u.isEmailVerified 
    })));

    if (users.length > 0) {
      // Make the first user an admin
      const user = users[0];
      user.role = 'admin';
      user.isEmailVerified = true; // Also verify their email for testing
      await user.save();
      console.log(`Made ${user.email} an admin`);
    } else {
      console.log('No users found. Please register a user first.');
    }

    // Test email service initialization
    console.log('\n--- Email Service Test ---');
    const status = emailService.getStatus();
    console.log('Email Service Status:', status);

    // Test sending email if we have admin user
    if (users.length > 0) {
      const testResult = await emailService.sendTestEmail(users[0].email);
      console.log('Test Email Result:', testResult);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupAdmin();