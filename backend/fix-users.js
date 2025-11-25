const mongoose = require('mongoose');
const User = require('./src/models/User');

async function fixUsers() {
  try {
    console.log('🔧 Fixing user accounts for testing...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow');
    console.log('✅ Connected to MongoDB\n');

    // Get all unverified users
    const unverifiedUsers = await User.find({ isEmailVerified: false });
    console.log(`📋 Found ${unverifiedUsers.length} unverified users:`);
    
    unverifiedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
    });

    console.log('\n🛠️ Fixing user accounts...');

    // Verify all users and make first one admin for testing
    for (let i = 0; i < unverifiedUsers.length; i++) {
      const user = unverifiedUsers[i];
      user.isEmailVerified = true;
      
      // Make first user an admin for testing admin features
      if (i === 0) {
        user.role = 'admin';
        console.log(`   ✅ ${user.email} - Verified + Admin`);
      } else {
        console.log(`   ✅ ${user.email} - Verified`);
      }
      
      await user.save();
    }

    console.log('\n🎉 All users are now verified and can log in!');
    console.log('📧 Admin user for testing:', unverifiedUsers[0]?.email);
    console.log('\n💡 You can now:');
    console.log('   1. Log in with any of these users');
    console.log('   2. Access admin tools with the first user');
    console.log('   3. Test the email service features');

    // Show login credentials reminder
    console.log('\n🔑 Login Credentials:');
    console.log('   📧 Email: Use any of the emails shown above');
    console.log('   🔒 Password: The password you used when registering');
    console.log('   👨‍💼 Admin Email:', unverifiedUsers[0]?.email || 'N/A');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing users:', error);
    process.exit(1);
  }
}

fixUsers();