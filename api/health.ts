import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    service: 'auth-api'
  };

  try {
    // Test MongoDB connection
    const { db } = await connectToDatabase();
    await db.command({ ping: 1 });
    
    healthCheck['mongodb'] = {
      status: 'connected',
      database: db.databaseName,
      collections: await db.listCollections().toArray()
    };
  } catch (error: any) {
    healthCheck.status = 'unhealthy';
    healthCheck['mongodb'] = {
      status: 'disconnected',
      error: error.message
    };
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    success: healthCheck.status === 'healthy',
    data: healthCheck,
    message: healthCheck.status === 'healthy' 
      ? 'Service is healthy' 
      : 'Service is experiencing issues'
  });
}