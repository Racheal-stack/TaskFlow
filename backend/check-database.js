const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkDatabase() {
  try {
    console.log('🔍 Connecting to TaskFlow Database...\n');
    
    // Connect to MongoDB and wait for connection
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow');
    console.log('✅ Connected to MongoDB\n');

    // Get database info
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📋 Available Collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // Check users collection specifically
    console.log('👥 Users Collection Analysis:');
    
    // Count total documents in users collection
    const userCount = await User.countDocuments();
    console.log(`   Total users: ${userCount}`);
    
    if (userCount > 0) {
      // Get all users with basic info
      const users = await User.find({}, 'name email isEmailVerified role createdAt');
      console.log('\n   User Details:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
        console.log(`      - Role: ${user.role}`);
        console.log(`      - Verified: ${user.isEmailVerified}`);
        console.log(`      - Created: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No users found in database');
    }

    // Check what meetings collection exists
    console.log('📅 Meeting-related Collections:');
    const meetingCollections = collections.filter(col => 
      col.name.toLowerCase().includes('meeting') || 
      col.name.toLowerCase().includes('event')
    );
    
    if (meetingCollections.length > 0) {
      meetingCollections.forEach(col => {
        console.log(`   - ${col.name} found`);
      });
    } else {
      console.log('   No meeting collections found');
    }

    // Check raw MongoDB collections for users
    console.log('\n🔧 Raw Database Check:');
    try {
      const usersRaw = await db.collection('users').find({}).toArray();
      console.log(`   Raw users collection: ${usersRaw.length} documents`);
      
      if (usersRaw.length > 0) {
        console.log('   Sample user document:');
        console.log('   ', JSON.stringify(usersRaw[0], null, 2));
      }
    } catch (error) {
      console.log(`   Error checking raw users: ${error.message}`);
    }

    // Check for potential user-related collections with different names
    console.log('\n🔍 Searching for user-like collections:');
    const userLikeCollections = collections.filter(col => 
      col.name.toLowerCase().includes('user') ||
      col.name.toLowerCase().includes('account') ||
      col.name.toLowerCase().includes('member')
    );
    
    for (const col of userLikeCollections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   - ${col.name}: ${count} documents`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Database check error:', error);
    process.exit(1);
  }
}

checkDatabase();