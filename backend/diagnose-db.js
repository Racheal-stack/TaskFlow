const mongoose = require('mongoose');

async function diagnoseDatabase() {
  try {
    console.log('🔍 Diagnosing Database Connection Issues...\n');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow';
    console.log('📡 Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected successfully\n');

    // Get current database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('🗄️ Current Database Name:', dbName);
    
    // List all databases
    const admin = mongoose.connection.db.admin();
    const databases = await admin.listDatabases();
    console.log('\n📋 All Available Databases:');
    databases.databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Check collections in current database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📚 Collections in '${dbName}' database:`);
    
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`   - ${col.name}: ${count} documents`);
      
      // If it's users collection, show sample data
      if (col.name === 'users' && count > 0) {
        const sample = await mongoose.connection.db.collection('users').findOne();
        console.log('     Sample document keys:', Object.keys(sample));
      }
    }

    // Check if there are users in different possible database names
    console.log('\n🔍 Checking other potential TaskFlow databases...');
    
    const taskflowDatabases = databases.databases.filter(db => 
      db.name.toLowerCase().includes('taskflow') || 
      db.name.toLowerCase().includes('task')
    );

    for (const db of taskflowDatabases) {
      if (db.name !== dbName) {
        try {
          const otherDb = mongoose.connection.client.db(db.name);
          const otherCollections = await otherDb.listCollections().toArray();
          console.log(`\n   Database: ${db.name}`);
          
          for (const col of otherCollections) {
            if (col.name === 'users') {
              const count = await otherDb.collection('users').countDocuments();
              console.log(`     - users: ${count} documents`);
            }
          }
        } catch (error) {
          console.log(`     Error checking ${db.name}:`, error.message);
        }
      }
    }

    // Check MongoDB Compass connection info
    console.log('\n🧭 MongoDB Compass Connection Info:');
    console.log('   Expected URI:', mongoUri);
    console.log('   Expected Database:', dbName);
    console.log('   Expected Collection: users');
    console.log('\n💡 In MongoDB Compass:');
    console.log(`   1. Make sure you're connected to: ${mongoUri}`);
    console.log(`   2. Navigate to database: ${dbName}`);
    console.log('   3. Look for the users collection');
    console.log('   4. If users collection shows no data, try refreshing the view');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database diagnosis error:', error);
    process.exit(1);
  }
}

diagnoseDatabase();