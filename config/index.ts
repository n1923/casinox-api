import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface Config {
  // Database
  mongodb: {
    uri: string;
    database: string;
  };
  
  // JWT
  jwt: {
    secret: string;
    expiresIn: string;
    algorithm: string;
    refreshThreshold: number;
  };
  
  // Security
  security: {
    allowedOrigins: string[];
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
    bcryptSaltRounds: number;
  };
  
  // Application
  app: {
    nodeEnv: string;
    logLevel: string;
    apiVersion: string;
    apiPrefix: string;
    port: number;
  };
  
  // Logging
  logging: {
    dir: string;
    maxSize: number;
    maxFiles: number;
    retentionDays: number;
  };
  
  // Vercel
  vercel: {
    url: string;
    env: string;
  };
}

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'MONGODB_DB', 'JWT_SECRET'];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`❌ Environment variable ${envVar} is required but not set`);
  }
});

const config: Config = {
  mongodb: {
    uri: process.env.MONGODB_URI!,
    database: process.env.MONGODB_DB!,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
    refreshThreshold: parseInt(process.env.TOKEN_REFRESH_THRESHOLD || '86400'),
  },
  
  security: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '*').split(',').map(origin => origin.trim()),
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    },
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  },
  
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    apiVersion: process.env.API_VERSION || 'v1',
    apiPrefix: process.env.API_PREFIX || '/api',
    port: parseInt(process.env.PORT || '3000'),
  },
  
  logging: {
    dir: process.env.LOG_DIR || 'logs',
    maxSize: parseInt(process.env.LOG_MAX_SIZE || '10485760'),
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '30'),
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '14'),
  },
  
  vercel: {
    url: process.env.VERCEL_URL || 'http://localhost:3000',
    env: process.env.VERCEL_ENV || 'development',
  },
};

// Validate JWT secret length
if (config.jwt.secret.length < 32) {
  console.warn('⚠️  JWT_SECRET is less than 32 characters. Consider using a longer secret for production.');
}

// Validate MongoDB URI format
if (!config.mongodb.uri.includes('mongodb+srv://')) {
  console.warn('⚠️  MongoDB URI should use mongodb+srv:// format for MongoDB Atlas');
}

// Log configuration in development
if (config.app.nodeEnv === 'development') {
  console.log('🔧 Configuration loaded:', {
    nodeEnv: config.app.nodeEnv,
    database: config.mongodb.database,
    apiPrefix: config.app.apiPrefix,
    origins: config.security.allowedOrigins,
  });
}

export default config;