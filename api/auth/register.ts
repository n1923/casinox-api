import { VercelRequest, VercelResponse } from '@vercel/node';
import { enableCors } from '../../middlewares/cors';
import { asyncHandler, AppError } from '../../middlewares/errorHandler';
import { validateRegister } from '../../utils/validation';
import { AuthService } from '../../lib/auth';
import { usersCollection } from '../../lib/mongodb';
import { User } from '../../types';

const handler = async (req: VercelRequest, res: VercelResponse) => {
  // Handle CORS
  if (enableCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    throw new AppError(405, 'Method not allowed');
  }

  // Validate request body
  const validation = validateRegister(req.body);
  if (!validation.success) {
    throw new AppError(400, validation.errors?.join(', ') || 'Invalid data');
  }

  const { name, email, password } = validation.data!;

  // Check if user already exists
  const existingUser = await usersCollection.findOne<User>({ email });
  if (existingUser) {
    throw new AppError(400, 'User with this email already exists');
  }

  // Hash password
  const hashedPassword = await AuthService.hashPassword(password);

  // Create user
  const userData: Omit<User, '_id'> = {
    email,
    password: hashedPassword,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await usersCollection.insertOne(userData);

  if (!result.insertedId) {
    throw new AppError(500, 'Failed to create user');
  }

  // Generate JWT token
  const token = AuthService.generateToken({
    _id: result.insertedId.toString(),
    email,
  });

  // Prepare response
  const sanitizedUser = AuthService.sanitizeUser({
    _id: result.insertedId.toString(),
    ...userData,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        ...sanitizedUser,
        createdAt: sanitizedUser.createdAt.toISOString(),
        updatedAt: sanitizedUser.updatedAt.toISOString(),
      },
      token,
    },
  });
};

export default asyncHandler(handler);