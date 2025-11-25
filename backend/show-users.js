const mongoose = require('mongoose');
const User = require('./src/models/User');

async function showUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow');
    
    console.log('👥 TaskFlow Users Database\n');
    console.log('=' .repeat(80));
    
    const users = await User.find({}).select('name email role isEmailVerified createdAt');
    
    if (users.length === 0) {
      console.log('No users found.');
      return;
    }
    
    console.log(`Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Verified: ${user.isEmailVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log(`   ID: ${user._id}`);
      console.log('   ' + '-'.repeat(50));
    });
    
    console.log('\n💡 MongoDB Compass Query:');
    console.log('   Database: taskflow');
    console.log('   Collection: users');
    console.log('   Query: {} (empty object to show all)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

showUsers();