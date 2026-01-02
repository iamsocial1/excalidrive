import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { hashPassword, comparePassword, generateToken, generateResetToken, verifyResetToken } from '../utils/auth';
import { validate } from '../middleware/validation';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';
import { ConflictError, AuthenticationError, NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { validatePasswordStrength } from '../utils/passwordValidation';
import { getCsrfToken } from '../middleware/csrf';
import { User } from '@prisma/client';

const router = Router();

// POST /api/auth/signup - Create new user account
router.post(
  '/signup',
  authLimiter,
  validate([
    { field: 'name', required: true, minLength: 2, maxLength: 255 },
    { field: 'email', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
    { field: 'password', required: true, minLength: 8, message: 'Password must be at least 8 characters' }
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, email, password } = req.body;

    // Validate password strength
    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.isValid) {
      throw new ValidationError('Password does not meet security requirements', {
        errors: passwordStrength.errors,
        suggestions: passwordStrength.suggestions
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true }
    });

    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        preferences: { theme: 'system', defaultViewMode: 'list' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        preferences: true
      }
    });

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    logger.info('User created successfully', { userId: user.id, email: user.email });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        preferences: user.preferences
      },
      token
    });
  })
);

// POST /api/auth/signin - Authenticate user
router.post(
  '/signin',
  authLimiter,
  validate([
    { field: 'email', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
    { field: 'password', required: true }
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        preferences: true
      }
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    logger.info('User signed in successfully', { userId: user.id, email: user.email });

    res.json({
      message: 'Signed in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      },
      token
    });
  })
);

// POST /api/auth/signout - Invalidate session (client-side token removal)
router.post('/signout', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info('User signed out', { userId: req.userId });
  
  res.json({
    message: 'Signed out successfully'
  });
}));

// POST /api/auth/forgot-password - Send password reset email
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate([
    { field: 'email', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true
      }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({
        message: 'If an account exists with this email, a password reset link has been sent'
      });
      return;
    }

    // Generate reset token
    const resetToken = generateResetToken(user.id, user.email);

    logger.info('Password reset requested', { userId: user.id, email: user.email });
    logger.debug(`Reset link: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent',
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  })
);

// POST /api/auth/reset-password - Reset password with token
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate([
    { field: 'token', required: true },
    { field: 'newPassword', required: true, minLength: 8, message: 'Password must be at least 8 characters' }
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token, newPassword } = req.body;

    // Validate password strength
    const passwordStrength = validatePasswordStrength(newPassword);
    if (!passwordStrength.isValid) {
      throw new ValidationError('Password does not meet security requirements', {
        errors: passwordStrength.errors,
        suggestions: passwordStrength.suggestions
      });
    }

    try {
      const { userId } = verifyResetToken(token);
      const passwordHash = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          updatedAt: new Date()
        }
      });

      logger.info('Password reset successfully', { userId });

      res.json({
        message: 'Password reset successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('token')) {
        throw new ValidationError('The password reset link is invalid or has expired');
      }
      throw error;
    }
  })
);

// PUT /api/auth/profile - Update user name, email, and preferences
router.put(
  '/profile',
  authenticateToken,
  validate([
    { field: 'name', required: false, minLength: 2, maxLength: 255 },
    { field: 'email', required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, email, preferences } = req.body;
    const userId = req.userId;

    if (!name && !email && !preferences) {
      throw new ValidationError('At least one field must be provided');
    }

    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          NOT: { id: userId }
        },
        select: { id: true }
      });

      if (existingUser) {
        throw new ConflictError('An account with this email already exists');
      }
    }

    // Handle preferences update
    let updatedPreferences;
    if (preferences) {
      // Get current preferences
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true }
      });
      
      const currentPreferences = (currentUser?.preferences as any) || {};
      updatedPreferences = {
        ...currentPreferences,
        ...preferences
      };
    }

    // Build update data object
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (updatedPreferences) updateData.preferences = updatedPreferences;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        preferences: true,
        updatedAt: true
      }
    });

    logger.info('Profile updated successfully', { userId, updates: { name: !!name, email: !!email, preferences: !!preferences } });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        updatedAt: user.updatedAt
      }
    });
  })
);

// PUT /api/auth/preferences - Update user preferences
router.put(
  '/preferences',
  authenticateToken,
  validate([
    { field: 'theme', required: false },
    { field: 'defaultViewMode', required: false }
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { theme, defaultViewMode } = req.body;
    const userId = req.userId;

    if (!theme && !defaultViewMode) {
      throw new ValidationError('At least one preference field must be provided');
    }

    // Get current preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });

    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    const currentPreferences = (currentUser.preferences as any) || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...(theme && { theme }),
      ...(defaultViewMode && { defaultViewMode })
    };

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: updatedPreferences,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        preferences: true,
        updatedAt: true
      }
    });

    logger.info('Preferences updated successfully', { userId, preferences: updatedPreferences });

    res.json({
      message: 'Preferences updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        updatedAt: user.updatedAt
      }
    });
  })
);

// PUT /api/auth/password - Change password
router.put(
  '/password',
  authenticateToken,
  validate([
    { field: 'currentPassword', required: true },
    { field: 'newPassword', required: true, minLength: 8, message: 'Password must be at least 8 characters' }
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    // Validate password strength
    const passwordStrength = validatePasswordStrength(newPassword);
    if (!passwordStrength.isValid) {
      throw new ValidationError('Password does not meet security requirements', {
        errors: passwordStrength.errors,
        suggestions: passwordStrength.suggestions
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValidPassword = await comparePassword(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    });

    logger.info('Password changed successfully', { userId });

    res.json({
      message: 'Password changed successfully'
    });
  })
);

// GET /api/auth/csrf-token - Get CSRF token for authenticated user
router.get('/csrf-token', authenticateToken, getCsrfToken);

export default router;
