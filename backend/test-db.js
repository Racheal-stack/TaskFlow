const mongoose = require('mongoose');

// Test MongoDB connection
async function testConnection() {
  try {
    // Try different connection strings
    const connectionStrings = [
      'mongodb://localhost:27017/taskflow',
      'mongodb://127.0.0.1:27017/taskflow',
    ];

    console.log('Testing MongoDB connections...\n');

    for (const uri of connectionStrings) {
      try {
        console.log(`Trying: ${uri}`);
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000 // 5 second timeout
        });
        
        console.log('✅ SUCCESS: Connected to MongoDB!');
        console.log('Connection string to use:', uri);
        
        // Test creating a collection
        const testCollection = mongoose.connection.db.collection('test');
        await testCollection.insertOne({ test: true, timestamp: new Date() });
        console.log('✅ Database write test successful');
        
        await mongoose.disconnect();
        console.log('✅ Disconnected successfully\n');
        
        return uri; // Return successful connection string
        
      } catch (error) {
        console.log('❌ Failed:', error.message);
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }
      }
    }
    
    console.log('\n🚨 No working connection found. Please ensure MongoDB is running.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testConnection();