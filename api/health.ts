import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { db } = await connectToDatabase();
    
    // Veritabanı istatistiklerini al
    const stats = await db.stats();
    
    // Mevcut koleksiyonları listele
    const collections = await db.listCollections().toArray();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        name: db.databaseName,
        status: 'connected',
        collections: collections.map(col => col.name),
        stats: {
          collections: stats.collections,
          documents: stats.objects,
          storageSize: stats.storageSize,
          indexSize: stats.indexSize
        }
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        status: 'disconnected'
      }
    });
  }
}