import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: string, email: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    { userId, email },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
  );
};

export const generateResetToken = (userId: string, email: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  // Reset tokens expire in 1 hour
  return jwt.sign(
    { userId, email, type: 'reset' },
    jwtSecret,
    { expiresIn: '1h' } as any
  );
};

export const verifyResetToken = (token: string): { userId: string; email: string } => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const decoded = jwt.verify(token, jwtSecret) as any;
  
  if (decoded.type !== 'reset') {
    throw new Error('Invalid token type');
  }

  return {
    userId: decoded.userId,
    email: decoded.email
  };
};
