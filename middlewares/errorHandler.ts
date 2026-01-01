import { VercelRequest, VercelResponse } from '@vercel/node';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any[]) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(409, message, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export function errorHandler(
  error: Error | AppError,
  req: VercelRequest,
  res: VercelResponse
) {
  console.error('📛 Error Handler:', {
    timestamp: new Date().toISOString(),
    errorName: error.name,
    errorMessage: error.message,
    statusCode: (error as AppError).statusCode || 500,
    code: (error as AppError).code,
    path: req.url,
    method: req.method,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // JWT specific errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // MongoDB duplicate key error
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyValue)[0];
    return res.status(409).json({
      success: false,
      error: `${field} already exists`,
      code: 'DUPLICATE_KEY',
    });
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: (error as any).errors,
      code: 'VALIDATION_ERROR',
    });
  }

  // AppError instances
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      ...(error instanceof ValidationError && { details: error.details }),
    });
  }

  // Default error response
  const response: any = {
    success: false,
    error: 'Internal server error',
  };

  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      message: error.message,
      stack: error.stack,
    };
  }

  return res.status(500).json(response);
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

// Rate limiting middleware
export function rateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const requests = new Map();

  return (req: VercelRequest, res: VercelResponse, next: () => void) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const key = `${ip}-${req.url}`;
    
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // Clean old entries
    requests.forEach((timestamps, key) => {
      const validTimestamps = timestamps.filter((time: number) => time > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    });
    
    // Check current requests
    const userRequests = requests.get(key) || [];
    
    if (userRequests.length >= options.max) {
      throw new RateLimitError(options.message);
    }
    
    userRequests.push(now);
    requests.set(key, userRequests);
    
    next();
  };
}