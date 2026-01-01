import { VercelRequest, VercelResponse } from '@vercel/node';
import { enableCors } from '../../middlewares/cors';
import { asyncHandler, AppError } from '../../middlewares/errorHandler';
import { validateLogin } from '../../utils/validation';
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
  const validation = validateLogin(req.body);
  if (!validation.success) {
    throw new AppError(400, validation.errors?.join(', ') || 'Invalid data');
  }

  const { email, password } = validation.data!;

  // Find user
  const user = await usersCollection.findOne<User>({ email });
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  // Verify password
  const isValidPassword = await AuthService.comparePassword(
    password,
    user.password
  );

  if (!isValidPassword) {
    throw new AppError(401, 'Invalid email or password');
  }

  // Generate JWT token
  const token = AuthService.generateToken({
    _id: user._id!,
    email: user.email,
  });

  // Prepare response
  const sanitizedUser = AuthService.sanitizeUser(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
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