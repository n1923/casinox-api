import { VercelRequest, VercelResponse } from '@vercel/node';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  error: Error | AppError,
  req: VercelRequest,
  res: VercelResponse
) {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.url,
    method: req.method,
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
  }

  // MongoDB duplicate key error
  if ((error as any).code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate field value entered',
    });
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}

export function asyncHandler(
  fn: (req: VercelRequest, res: VercelResponse) => Promise<any>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      await fn(req, res);
    } catch (error) {
      errorHandler(error as Error, req, res);
    }
  };
}