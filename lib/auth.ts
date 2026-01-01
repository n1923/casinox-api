import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Algorithm } from 'jsonwebtoken';
import crypto from 'crypto';
import { JwtPayload, User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_ALGORITHM = (process.env.JWT_ALGORITHM || 'HS256') as Algorithm;
const TOKEN_REFRESH_THRESHOLD = parseInt(process.env.TOKEN_REFRESH_THRESHOLD || '86400');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

// Validate JWT algorithm
const validAlgorithms: Algorithm[] = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'];
if (!validAlgorithms.includes(JWT_ALGORITHM)) {
  throw new Error(`Invalid JWT algorithm. Must be one of: ${validAlgorithms.join(', ')}`);
}

export class AuthService {
  // Password hashing with configurable salt rounds
  static async hashPassword(password: string, saltRounds: number = 12): Promise<string> {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
  }

  static async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    if (!password || !hashedPassword) {
      return false;
    }
    
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Password comparison error:', error);
      return false;
    }
  }

  // Token generation with enhanced security
  static generateToken(user: { _id: string; email: string; name?: string }): string {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const payload: JwtPayload = {
      id: user._id,
      email: user.email,
      name: user.name,
      jti: crypto.randomBytes(16).toString('hex'), // JWT ID for replay protection
      iat: Math.floor(Date.now() / 1000),
    };

    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: JWT_ALGORITHM,
      issuer: 'vercel-auth-app',
      audience: 'vercel-auth-app-users',
      notBefore: 0, // Token becomes valid immediately
    };

    try {
      return jwt.sign(payload, JWT_SECRET, options);
    } catch (error) {
      console.error('Token generation error:', error);
      throw new Error('Failed to generate token');
    }
  }

  // Token verification with full validation
  static verifyToken(token: string): JwtPayload | null {
    if (!token || typeof token !== 'string') {
      return null;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
        issuer: 'vercel-auth-app',
        audience: 'vercel-auth-app-users',
        clockTolerance: 30, // 30 seconds tolerance for clock skew
      }) as JwtPayload;

      return decoded;
    } catch (error: any) {
      console.error('Token verification error:', {
        name: error.name,
        message: error.message,
        expiredAt: error.expiredAt,
      });
      
      return null;
    }
  }

  // Check if token needs refresh
  static shouldRefreshToken(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - currentTime;

      return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD;
    } catch (error) {
      console.error('Token refresh check error:', error);
      return true;
    }
  }

  // Generate refresh token (for future use)
  static generateRefreshToken(userId: string): string {
    const payload = {
      sub: userId,
      jti: crypto.randomBytes(16).toString('hex'),
      type: 'refresh',
    };

    const options: SignOptions = {
      expiresIn: '30d',
      algorithm: JWT_ALGORITHM,
      issuer: 'vercel-auth-app',
      audience: 'vercel-auth-app-refresh',
    };

    return jwt.sign(payload, JWT_SECRET + '_refresh', options); // Different secret for refresh tokens
  }

  // Password strength validation
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Generate random password
  static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*()_+-=[]{}|;:,.<>?'[Math.floor(Math.random() * 32)];

    // Fill the rest
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Sanitize user data for responses
  static sanitizeUser(user: User): Omit<User, 'password'> & { id: string } {
    if (!user || typeof user !== 'object') {
      throw new Error('Invalid user object');
    }

    const { password, _id, ...rest } = user;
    
    return {
      id: _id?.toString() || '',
      ...rest,
    };
  }
}

// Export a singleton instance
export default AuthService;