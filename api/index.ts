import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  const apiInfo = {
    name: 'Vercel Auth API',
    version: '1.0.0',
    description: 'Authentication API built with Node.js, TypeScript and MongoDB',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      health: 'GET /api/health'
    },
    documentation: 'Add your documentation URL here',
    status: 'operational'
  };

  res.status(200).json({
    success: true,
    message: 'Welcome to Vercel Auth API',
    data: apiInfo,
    timestamp: new Date().toISOString()
  });
}