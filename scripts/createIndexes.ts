import { connectToDatabase } from '../lib/mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createIndexes() {
  console.log('📊 MongoDB Index Creation Tool');
  console.log('='.repeat(50));
  
  console.log('\n🔧 Environment:');
  console.log('  Database:', process.env.MONGODB_DB);
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  
  try {
    const { db } = await connectToDatabase();
    
    console.log('\n✅ Connected to database:', db.databaseName);
    
    // ========== USERS COLLECTION INDEXES ==========
    console.log('\n👥 Creating indexes for "users" collection...');
    
    // 1. Email unique index
    try {
      await db.collection('users').createIndex(
        { email: 1 },
        {
          unique: true,
          name: 'email_unique_idx',
          background: true,
          collation: { locale: 'en', strength: 2 } // Case insensitive
        }
      );
      console.log('  ✅ Created: Unique index on email (case-insensitive)');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('  ⚠️  Index already exists: email_unique_idx');
      } else {
        console.error('  ❌ Error creating email index:', error.message);
      }
    }
    
    // 2. CreatedAt index for sorting
    try {
      await db.collection('users').createIndex(
        { createdAt: -1 },
        {
          name: 'created_at_desc_idx',
          background: true
        }
      );
      console.log('  ✅ Created: Index on createdAt (descending)');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('  ⚠️  Index already exists: created_at_desc_idx');
      } else {
        console.error('  ❌ Error creating createdAt index:', error.message);
      }
    }
    
    // 3. UpdatedAt index
    try {
      await db.collection('users').createIndex(
        { updatedAt: -1 },
        {
          name: 'updated_at_desc_idx',
          background: true
        }
      );
      console.log('  ✅ Created: Index on updatedAt (descending)');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('  ⚠️  Index already exists: updated_at_desc_idx');
      } else {
        console.error('  ❌ Error creating updatedAt index:', error.message);
      }
    }
    
    // 4. Name index for search
    try {
      await db.collection('users').createIndex(
        { name: 'text' },
        {
          name: 'name_text_idx',
          background: true,
          weights: { name: 10 }
        }
      );
      console.log('  ✅ Created: Text index on name');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('  ⚠️  Index already exists: name_text_idx');
      } else {
        console.error('  ❌ Error creating name text index:', error.message);
      }
    }
    
    // 5. Composite index for active users
    try {
      await db.collection('users').createIndex(
        { isActive: 1, createdAt: -1 },
        {
          name: 'active_users_idx',
          background: true,
          partialFilterExpression: { isActive: true }
        }
      );
      console.log('  ✅ Created: Composite index for active users');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('  ⚠️  Index already exists: active_users_idx');
      } else {
        console.error('  ❌ Error creating active users index:', error.message);
      }
    }
    
    // ========== SESSIONS COLLECTION INDEXES (for future use) ==========
    console.log('\n🔑 Creating indexes for "sessions" collection (if exists)...');
    
    try {
      const collections = await db.listCollections({ name: 'sessions' }).toArray();
      if (collections.length > 0) {
        // Token index
        await db.collection('sessions').createIndex(
          { token: 1 },
          {
            unique: true,
            name: 'token_unique_idx',
            background: true
          }
        );
        console.log('  ✅ Created: Unique index on token');
        
        // ExpiresAt index for TTL
        await db.collection('sessions').createIndex(
          { expiresAt: 1 },
          {
            name: 'expires_at_ttl_idx',
            background: true,
            expireAfterSeconds: 0
          }
        );
        console.log('  ✅ Created: TTL index on expiresAt');
        
        // UserId index
        await db.collection('sessions').createIndex(
          { userId: 1 },
          {
            name: 'user_id_idx',
            background: true
          }
        );
        console.log('  ✅ Created: Index on userId');
      } else {
        console.log('  ⏭️  Sessions collection does not exist, skipping...');
      }
    } catch (error: any) {
      console.log('  ⚠️  Skipping sessions indexes:', error.message);
    }
    
    // ========== LOGS COLLECTION INDEXES (for future use) ==========
    console.log('\n📝 Creating indexes for "logs" collection (if exists)...');
    
    try {
      const collections = await db.listCollections({ name: 'logs' }).toArray();
      if (collections.length > 0) {
        await db.collection('logs').createIndex(
          { timestamp: -1 },
          {
            name: 'timestamp_desc_idx',
            background: true
          }
        );
        console.log('  ✅ Created: Index on timestamp');
        
        await db.collection('logs').createIndex(
          { level: 1, timestamp: -1 },
          {
            name: 'level_timestamp_idx',
            background: true
          }
        );
        console.log('  ✅ Created: Composite index on level + timestamp');
      } else {
        console.log('  ⏭️  Logs collection does not exist, skipping...');
      }
    } catch (error: any) {
      console.log('  ⚠️  Skipping logs indexes:', error.message);
    }
    
    // ========== LIST ALL INDEXES ==========
    console.log('\n📋 Listing all indexes...');
    
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const indexes = await db.collection(collection.name).indexes();
      
      if (indexes.length > 1) { // More than just the default _id index
        console.log(`\n${collection.name.toUpperCase()}:`);
        indexes.forEach((index: any, i: number) => {
          console.log(`  ${i + 1}. ${index.name}`);
          console.log(`     Key:`, JSON.stringify(index.key));
          if (index.unique) console.log(`     Unique: ${index.unique}`);
          if (index.expireAfterSeconds !== undefined) 
            console.log(`     TTL: ${index.expireAfterSeconds} seconds`);
          if (index.weights) console.log(`     Weights:`, index.weights);
        });
      }
    }
    
    // ========== INDEX OPTIMIZATION ==========
    console.log('\n⚡ Index Optimization Recommendations:');
    console.log('  1. Monitor query performance in MongoDB Atlas');
    console.log('  2. Use explain() to analyze query execution');
    console.log('  3. Consider compound indexes for frequent queries');
    console.log('  4. Remove unused indexes to improve write performance');
    console.log('  5. Regularly update statistics with db.collection.stats()');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Index creation completed successfully!');
    console.log('='.repeat(50));
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Error creating indexes:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    
    if (error.code === 13) {
      console.error('\n🔐 Permission Denied:');
      console.error('  • Check database user permissions');
      console.error('  • User needs createIndex permission');
    } else if (error.code === 11000) {
      console.error('\n⚠️  Duplicate Key Error:');
      console.error('  • Index with same name already exists');
      console.error('  • Use different index name');
    }
    
    process.exit(1);
  }
}

createIndexes();