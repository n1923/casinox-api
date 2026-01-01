import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  
  const availableEndpoints = [
    { method: 'POST', path: '/api/auth/register', description: 'Register new user' },
    { method: 'POST', path: '/api/auth/login', description: 'User login' },
    { method: 'GET', path: '/api/health', description: 'Health check endpoint' },
    { method: 'GET', path: '/', description: 'API information' }
  ];

  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The requested path '${req.url}' does not exist`,
    timestamp: new Date().toISOString(),
    availableEndpoints,
    documentation: 'Add your documentation URL here'
  });
}