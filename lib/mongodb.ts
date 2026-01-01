import { MongoClient, Db, MongoClientOptions } from 'mongodb';

// Production'da Vercel environment variables'dan, local'de .env.local'dan alır
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

// Debug için (password'u gizleyerek)
const safeMongoUri = MONGODB_URI 
  ? MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
  : 'not set';

console.log('🔧 MongoDB Configuration:');
console.log('  URI:', safeMongoUri);
console.log('  DB:', MONGODB_DB || 'not set');
console.log('  NODE_ENV:', process.env.NODE_ENV);

if (!MONGODB_URI) {
  const error = new Error('MONGODB_URI environment variable is not set');
  console.error('❌ MongoDB Error:', error.message);
  console.error('💡 Solution: Set MONGODB_URI in Vercel Environment Variables or .env.local');
  throw error;
}

if (!MONGODB_DB) {
  const error = new Error('MONGODB_DB environment variable is not set');
  console.error('❌ MongoDB Error:', error.message);
  console.error('💡 Solution: Set MONGODB_DB in Vercel Environment Variables or .env.local');
  throw error;
}

// Local development için .env.local yükle
if (process.env.NODE_ENV !== 'production' && !process.env.MONGODB_URI) {
  try {
    require('dotenv').config({ path: '.env.local' });
    console.log('📁 Loaded .env.local for local development');
  } catch (error) {
    console.warn('⚠️  .env.local not found, using environment variables');
  }
}

interface MongoCache {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
}

declare global {
  var mongo: MongoCache | undefined;
}

const cached: MongoCache = global.mongo || { client: null, db: null, promise: null };

if (!global.mongo) {
  global.mongo = cached;
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.client && cached.db) {
    console.log('♻️  Using cached MongoDB connection');
    return { client: cached.client, db: cached.db };
  }

  if (!cached.promise) {
    console.log('🔗 Creating new MongoDB connection...');
    
    const opts: MongoClientOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
    };

    cached.promise = MongoClient.connect(MONGODB_URI!, opts)
      .then((client) => {
        console.log('✅ MongoDB connected successfully');
        const db = client.db(MONGODB_DB!);
        
        // Test the connection
        db.command({ ping: 1 })
          .then(() => console.log('🏓 MongoDB ping successful'))
          .catch(err => console.error('❌ MongoDB ping failed:', err.message));
        
        return { client, db };
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:');
        console.error('  Message:', error.message);
        console.error('  Code:', error.code);
        console.error('  URI used:', safeMongoUri);
        
        // Common error solutions
        if (error.message.includes('authentication failed')) {
          console.error('\n🔐 Authentication Failed. Check:');
          console.error('  1. Username/password is correct');
          console.error('  2. Database user has correct permissions');
          console.error('  3. IP is whitelisted in MongoDB Atlas');
        } else if (error.message.includes('ENOTFOUND')) {
          console.error('\n🌐 Network Error. Check:');
          console.error('  1. Internet connection');
          console.error('  2. MongoDB Atlas cluster status');
        }
        
        cached.promise = null;
        throw error;
      });
  }

  try {
    const { client, db } = await cached.promise;
    cached.client = client;
    cached.db = db;
    return { client, db };
  } catch (error) {
    console.error('❌ Failed to establish MongoDB connection');
    cached.promise = null;
    throw error;
  }
}

// Kalan kod aynı kalacak...
export async function withDatabase<T>(
  operation: (db: Db) => Promise<T>
): Promise<T> {
  try {
    const { db } = await connectToDatabase();
    return await operation(db);
  } catch (error) {
    console.error('💥 Database operation error:', error);
    throw error;
  }
}

export function getCollection<T extends Document>(collectionName: string) {
  return {
    findOne: async (query: object): Promise<T | null> => {
      const { db } = await connectToDatabase();
      return db.collection<T>(collectionName).findOne(query);
    },
    
    insertOne: async (document: any) => {
      const { db } = await connectToDatabase();
      const result = await db.collection(collectionName).insertOne(document);
      return { insertedId: result.insertedId.toString() };
    },
    
    // Diğer metodlar...
  };
}

export const usersCollection = getCollection<User>('users');