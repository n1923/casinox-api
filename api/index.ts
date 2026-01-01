import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  const apiInfo = {
    name: 'CasinoX API',
    version: '1.0.0',
    description: 'Authentication API for CasinoX',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      health: 'GET /api/health',
      hello: 'GET /api/hello'
    },
    status: 'operational'
  };

  res.status(200).json({
    success: true,
    message: 'Welcome to CasinoX API',
    data: apiInfo,
    timestamp: new Date().toISOString()
  });
}