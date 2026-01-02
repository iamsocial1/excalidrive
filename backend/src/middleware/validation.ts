import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from '../utils/errors';
import { sanitizeString, sanitizeEmail } from '../utils/sanitize';

/**
 * Middleware to handle validation results
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg
    }));

    res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors
    });
    return;
  }

  next();
};

// Legacy validation interface for backward compatibility
export interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
}

export const validate = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: { field: string; message: string }[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Check required
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} is required`
        });
        continue;
      }

      // Skip other validations if field is not required and not provided
      if (!rule.required && !value) {
        continue;
      }

      // Check minLength
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} must be at least ${rule.minLength} characters`
        });
      }

      // Check maxLength
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} must not exceed ${rule.maxLength} characters`
        });
      }

      // Check pattern
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} format is invalid`
        });
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    next();
  };
};

// Common validation patterns
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/; // At least 8 chars, 1 uppercase, 1 lowercase, 1 number

// Express-validator validation chains
export const validateSignup = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters')
    .customSanitizer(sanitizeString),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .customSanitizer(sanitizeEmail),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidationErrors
];

export const validateSignin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .customSanitizer(sanitizeEmail),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

export const validateEmail = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .customSanitizer(sanitizeEmail),
  handleValidationErrors
];

export const validatePasswordReset = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidationErrors
];

export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidationErrors
];

export const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters')
    .customSanitizer(sanitizeString),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .customSanitizer(sanitizeEmail),
  handleValidationErrors
];

export const validateDrawingCreate = [
  body('name')
    .trim()
    .notEmpty().withMessage('Drawing name is required')
    .isLength({ min: 1, max: 255 }).withMessage('Drawing name must be between 1 and 255 characters')
    .customSanitizer(sanitizeString),
  body('projectId')
    .notEmpty().withMessage('Project ID is required')
    .isUUID().withMessage('Invalid project ID format'),
  body('excalidrawData')
    .notEmpty().withMessage('Drawing data is required'),
  body('thumbnail')
    .optional(),
  handleValidationErrors
];

export const validateDrawingUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Drawing name must be between 1 and 255 characters')
    .customSanitizer(sanitizeString),
  body('excalidrawData')
    .optional(),
  body('thumbnail')
    .optional(),
  handleValidationErrors
];

export const validateProjectCreate = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 1, max: 255 }).withMessage('Project name must be between 1 and 255 characters')
    .customSanitizer(sanitizeString),
  handleValidationErrors
];

export const validateProjectUpdate = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 1, max: 255 }).withMessage('Project name must be between 1 and 255 characters')
    .customSanitizer(sanitizeString),
  handleValidationErrors
];

export const validateMoveDrawing = [
  body('targetProjectId')
    .notEmpty().withMessage('Target project ID is required')
    .isUUID().withMessage('Invalid project ID format'),
  handleValidationErrors
];

export const validateUUIDParam = (paramName: string = 'id') => [
  param(paramName)
    .isUUID().withMessage(`Invalid ${paramName} format`),
  handleValidationErrors
];
