import { MongoClient, Db, MongoClientOptions } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'casino-api';

// MongoDB bağlantı seçenekleri
const options: MongoClientOptions = {
  maxPoolSize: 10, // Bağlantı havuzu boyutu
  minPoolSize: 2,
  maxIdleTimeMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  tls: true, // Atlas için TLS gereklidir
  retryWrites: true,
  w: 'majority'
};

if (!MONGODB_URI) {
  throw new Error('Lütfen MONGODB_URI ortam değişkenini tanımlayın');
}

if (!MONGODB_DB) {
  throw new Error('Lütfen MONGODB_DB ortam değişkenini tanımlayın');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  // Eğer bağlantı zaten varsa kullan
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    console.log('MongoDB bağlantısı kuruluyor...');
    
    const client = await MongoClient.connect(MONGODB_URI, options);
    const db = client.db(MONGODB_DB);
    
    // Bağlantıyı test et
    await db.command({ ping: 1 });
    console.log('MongoDB bağlantısı başarılı!');
    
    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    throw new Error('MongoDB bağlantısı kurulamadı');
  }
}

// Bağlantıyı kapatmak için fonksiyon
export async function closeDatabaseConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('MongoDB bağlantısı kapatıldı');
  }
}