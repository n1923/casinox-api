import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    success: true,
    message: 'Hello from CasinoX API!',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.url
  });
}