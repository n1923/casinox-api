import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }
  
  if (!MONGODB_DB) {
    throw new Error('MONGODB_DB is not defined in environment variables');
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB);
  
  cachedClient = client;
  cachedDb = db;
  
  return { client, db };
}