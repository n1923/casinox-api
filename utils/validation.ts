import { z } from 'zod';
import { RegisterRequest, LoginRequest } from '../types';
import { AuthService } from '../lib/auth';

export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .refine((password) => {
      const validation = AuthService.validatePasswordStrength(password);
      return validation.isValid;
    }, (password) => {
      const validation = AuthService.validatePasswordStrength(password);
      return { message: validation.errors[0] || 'Invalid password' };
    }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password must be less than 100 characters'),
});

export const passwordResetSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters'),
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .refine((password) => {
      const validation = AuthService.validatePasswordStrength(password);
      return validation.isValid;
    }, (password) => {
      const validation = AuthService.validatePasswordStrength(password);
      return { message: validation.errors[0] || 'Invalid password' };
    }),
});

export function validateRegister(data: any): {
  success: boolean;
  data?: RegisterRequest;
  errors?: string[];
} {
  try {
    const validatedData = registerSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => {
          if (err.path.length > 0) {
            return `${err.path.join('.')}: ${err.message}`;
          }
          return err.message;
        }),
      };
    }
    return { success: false, errors: ['Invalid registration data'] };
  }
}

export function validateLogin(data: any): {
  success: boolean;
  data?: LoginRequest;
  errors?: string[];
} {
  try {
    const validatedData = loginSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => {
          if (err.path.length > 0) {
            return `${err.path.join('.')}: ${err.message}`;
          }
          return err.message;
        }),
      };
    }
    return { success: false, errors: ['Invalid login data'] };
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase().trim());
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[\\$'"]/g, '') // Remove problematic characters
    .substring(0, 1000); // Limit length
}

export function validatePassword(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters long');

  // Upper case check
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  // Lower case check
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  // Numbers check
  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');

  // Special characters check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  // No common patterns
  const commonPatterns = [
    'password', '123456', 'qwerty', 'admin', 'welcome',
    'letmein', 'monkey', 'dragon', 'baseball', 'football'
  ];
  
  const hasCommonPattern = commonPatterns.some(pattern => 
    password.toLowerCase().includes(pattern)
  );
  
  if (!hasCommonPattern) score += 1;
  else feedback.push('Avoid common words and patterns');

  return {
    isValid: score >= 4,
    score,
    feedback: feedback.length > 0 ? feedback : ['Strong password!']
  };
}