const mongoose = require('mongoose');
const User = require('./src/models/User');

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node make-admin.js user@example.com');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow');

async function makeAdmin() {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      console.log('Available users:');
      const users = await User.find({}, 'email role isEmailVerified');
      users.forEach(u => {
        console.log(`   ${u.email} - ${u.role} - ${u.isEmailVerified ? 'verified' : 'unverified'}`);
      });
      process.exit(1);
    }

    // Make user admin and verify their email
    const oldRole = user.role;
    user.role = 'admin';
    user.isEmailVerified = true; // Verify email for testing
    await user.save();

    console.log(`✅ Successfully updated ${email}`);
    console.log(`   Role: ${oldRole} → admin`);
    console.log(`   Email verified: ${user.isEmailVerified}`);
    console.log('\n🎉 User can now access Admin Tools in Settings!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

makeAdmin();