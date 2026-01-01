import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI as string;
const MONGODB_DB = process.env.MONGODB_DB as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

interface MongoCache {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongo: MongoCache | undefined;
}

const cached: MongoCache = global.mongo || { client: null, db: null, promise: null };

if (!global.mongo) {
  global.mongo = cached;
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.client && cached.db) {
    return { client: cached.client, db: cached.db };
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 10000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts).then((client) => {
      return {
        client,
        db: client.db(MONGODB_DB),
      };
    });
  }

  try {
    const { client, db } = await cached.promise;
    cached.client = client;
    cached.db = db;
    return { client, db };
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

export async function withDatabase<T>(
  operation: (db: Db) => Promise<T>
): Promise<T> {
  const { db } = await connectToDatabase();
  return operation(db);
}

export function getCollection<T>(collectionName: string) {
  return {
    findOne: async (query: object): Promise<T | null> => {
      const { db } = await connectToDatabase();
      return db.collection<T>(collectionName).findOne(query);
    },
    insertOne: async (document: any): Promise<any> => {
      const { db } = await connectToDatabase();
      return db.collection(collectionName).insertOne(document);
    },
    find: async (query: object, options?: any): Promise<T[]> => {
      const { db } = await connectToDatabase();
      return db.collection<T>(collectionName).find(query, options).toArray();
    },
    updateOne: async (filter: object, update: object): Promise<any> => {
      const { db } = await connectToDatabase();
      return db.collection(collectionName).updateOne(filter, update);
    },
    deleteOne: async (filter: object): Promise<any> => {
      const { db } = await connectToDatabase();
      return db.collection(collectionName).deleteOne(filter);
    },
  };
}

export const usersCollection = getCollection<User>('users');