import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The path '${req.url}' does not exist on this server.`,
    available_endpoints: [
      'GET  /              - API information',
      'GET  /api/health    - Health check',
      'GET  /api/hello     - Test endpoint',
      'POST /api/auth/register - User registration',
      'POST /api/auth/login    - User login'
    ],
    timestamp: new Date().toISOString()
  });
}