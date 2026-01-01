import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { db } = await connectToDatabase();
    
    // Veritabanı bağlantısını test et
    const stats = await db.stats();
    
    // Test verisi ekle
    const testCollection = db.collection('test');
    await testCollection.insertOne({
      message: 'Test kaydı',
      timestamp: new Date(),
      status: 'success'
    });
    
    // Test verilerini getir
    const testData = await testCollection.find({}).toArray();
    
    res.status(200).json({
      message: 'API çalışıyor!',
      database: {
        name: db.databaseName,
        stats: {
          collections: stats.collections,
          objects: stats.objects,
          dataSize: stats.dataSize
        }
      },
      testData
    });
  } catch (error) {
    console.error('Test hatası:', error);
    res.status(500).json({
      error: 'Test başarısız',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
}