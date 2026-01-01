import { connectToDatabase } from '../lib/mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 MongoDB Connection Test');
  console.log('='.repeat(50));
  
  console.log('\n📋 Environment Check:');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('  MONGODB_URI:', process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
    : 'NOT SET'
  );
  console.log('  MONGODB_DB:', process.env.MONGODB_DB || 'NOT SET');

  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
    console.error('\n❌ ERROR: MongoDB environment variables are not set!');
    console.log('\n💡 Solution:');
    console.log('  1. Create .env.local file in project root');
    console.log('  2. Add MONGODB_URI and MONGODB_DB variables');
    console.log('  3. Or set them in Vercel Environment Variables');
    process.exit(1);
  }

  try {
    console.log('\n🔗 Attempting to connect to MongoDB...');
    const { client, db } = await connectToDatabase();
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('\n📊 Database Information:');
    console.log('  Database Name:', db.databaseName);
    console.log('  Connection Status:', client.topology?.isConnected() ? 'Connected' : 'Disconnected');
    
    // List collections
    console.log('\n📁 Collections:');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('  No collections found');
    } else {
      collections.forEach((collection, index) => {
        console.log(`  ${index + 1}. ${collection.name}`);
      });
    }
    
    // Test users collection
    console.log('\n👥 Users Collection Test:');
    const usersCount = await db.collection('users').countDocuments();
    console.log(`  Total Users: ${usersCount}`);
    
    // Test insert/read/delete operations
    console.log('\n⚡ CRUD Operations Test:');
    
    // Test insert
    const testDocument = {
      test: true,
      timestamp: new Date(),
      message: 'Test connection document',
      environment: process.env.NODE_ENV || 'development'
    };
    
    const insertResult = await db.collection('test_connection').insertOne(testDocument);
    console.log('  ✅ Insert Test: PASSED');
    console.log(`    Document ID: ${insertResult.insertedId}`);
    
    // Test read
    const foundDocument = await db.collection('test_connection').findOne({
      _id: insertResult.insertedId
    });
    
    if (foundDocument) {
      console.log('  ✅ Read Test: PASSED');
    } else {
      console.log('  ❌ Read Test: FAILED');
    }
    
    // Test delete
    const deleteResult = await db.collection('test_connection').deleteOne({
      _id: insertResult.insertedId
    });
    
    if (deleteResult.deletedCount === 1) {
      console.log('  ✅ Delete Test: PASSED');
    } else {
      console.log('  ❌ Delete Test: FAILED');
    }
    
    // Test database commands
    console.log('\n📈 Database Statistics:');
    try {
      const stats = await db.stats();
      console.log('  Collections:', stats.collections);
      console.log('  Documents:', stats.objects);
      console.log('  Data Size:', Math.round(stats.dataSize / 1024 / 1024), 'MB');
      console.log('  Storage Size:', Math.round(stats.storageSize / 1024 / 1024), 'MB');
      console.log('  Indexes:', stats.indexes);
      console.log('  Index Size:', Math.round(stats.indexSize / 1024 / 1024), 'MB');
    } catch (statsError) {
      console.log('  ⚠️  Could not retrieve database stats');
    }
    
    // Test connection ping
    console.log('\n🏓 Connection Ping Test:');
    const pingResult = await db.command({ ping: 1 });
    if (pingResult.ok === 1) {
      console.log('  ✅ Ping Test: PASSED');
    } else {
      console.log('  ❌ Ping Test: FAILED');
    }
    
    // Close connection
    await client.close();
    console.log('\n🔌 Connection closed gracefully');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL TESTS PASSED! MongoDB connection is working correctly.');
    console.log('='.repeat(50));
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error('\n📛 Error Details:');
    console.error('  Error Name:', error.name);
    console.error('  Error Message:', error.message);
    console.error('  Error Code:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n🌐 Network Issue Detected:');
      console.error('  • Check your internet connection');
      console.error('  • Verify MongoDB Atlas cluster is running');
      console.error('  • Check DNS resolution');
    } else if (error.message.includes('authentication')) {
      console.error('\n🔐 Authentication Failed:');
      console.error('  • Verify username and password');
      console.error('  • Check if user has proper permissions');
      console.error('  • Ensure IP is whitelisted in MongoDB Atlas');
    } else if (error.message.includes('ENETUNREACH')) {
      console.error('\n📡 Network Unreachable:');
      console.error('  • Check firewall settings');
      console.error('  • Verify network connectivity');
      console.error('  • Try different network');
    } else if (error.code === 'ETIMEOUT') {
      console.error('\n⏰ Connection Timeout:');
      console.error('  • Increase timeout settings');
      console.error('  • Check network latency');
      console.error('  • Try again later');
    }
    
    console.log('\n💡 Troubleshooting Steps:');
    console.log('  1. Check MongoDB Atlas dashboard');
    console.log('  2. Verify connection string format');
    console.log('  3. Test connection from MongoDB Compass');
    console.log('  4. Check IP whitelist in MongoDB Atlas');
    console.log('  5. Verify database user permissions');
    
    process.exit(1);
  }
}

// Run the test
testConnection();