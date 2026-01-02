# Error Handling and Validation Guide

This document describes the comprehensive error handling and validation system implemented in the backend API.

## Overview

The backend implements a multi-layered approach to error handling and validation:

1. **Input Validation** - Validates and sanitizes all user inputs
2. **Custom Error Classes** - Structured error types with appropriate HTTP status codes
3. **Error Handling Middleware** - Centralized error processing and logging
4. **Rate Limiting** - Prevents abuse and brute-force attacks
5. **Database Transactions** - Ensures data consistency with automatic rollback
6. **Comprehensive Logging** - Context-aware logging for debugging

## Custom Error Classes

Located in `utils/errors.ts`:

- `AppError` - Base error class with status code and operational flag
- `ValidationError` - 400 Bad Request errors
- `AuthenticationError` - 401 Unauthorized errors
- `AuthorizationError` - 403 Forbidden errors
- `NotFoundError` - 404 Not Found errors
- `ConflictError` - 409 Conflict errors (e.g., duplicate email)
- `DatabaseError` - 500 Internal Server Error for database failures
- `StorageError` - 500 Internal Server Error for storage failures

### Usage Example

```typescript
import { ValidationError, NotFoundError } from '../utils/errors';

// Throw validation error
if (!name && !email) {
  throw new ValidationError('At least one field must be provided');
}

// Throw not found error
if (result.rows.length === 0) {
  throw new NotFoundError('User not found');
}
```

## Input Validation

### Legacy Validation (Backward Compatible)

```typescript
import { validate } from '../middleware/validation';

router.post('/endpoint',
  validate([
    { field: 'name', required: true, minLength: 2, maxLength: 255 },
    { field: 'email', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
  ]),
  handler
);
```

### Express-Validator (Recommended)

```typescript
import { validateSignup, validateSignin } from '../middleware/validation';

router.post('/signup', validateSignup, handler);
router.post('/signin', validateSignin, handler);
```

### Input Sanitization

All inputs are automatically sanitized by the `sanitizeInput` middleware:

```typescript
import { sanitizeInput } from '../middleware/sanitize';

app.use(sanitizeInput); // Applied globally
```

Sanitization utilities in `utils/sanitize.ts`:
- `sanitizeString()` - Removes null bytes and trims whitespace
- `sanitizeEmail()` - Normalizes email addresses
- `sanitizeObject()` - Recursively sanitizes all object properties
- `sanitizeUUID()` - Validates and normalizes UUIDs
- `sanitizeInteger()` - Safely parses integers
- `sanitizeBoolean()` - Safely parses booleans

## Rate Limiting

Located in `middleware/rateLimiter.ts`:

### Available Rate Limiters

1. **apiLimiter** - General API rate limiting (100 requests per 15 minutes)
2. **authLimiter** - Strict auth endpoint limiting (5 attempts per 15 minutes)
3. **passwordResetLimiter** - Password reset limiting (3 attempts per hour)
4. **publicLimiter** - Public endpoint limiting (50 requests per 15 minutes)
5. **drawingLimiter** - Drawing operations limiting (30 per minute)

### Usage Example

```typescript
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';

router.post('/signin', authLimiter, handler);
router.post('/forgot-password', passwordResetLimiter, handler);
```

## Async Error Handling

Use `asyncHandler` to automatically catch errors in async route handlers:

```typescript
import { asyncHandler } from '../utils/asyncHandler';

router.post('/endpoint',
  asyncHandler(async (req, res) => {
    // Any thrown error will be caught and passed to error middleware
    const user = await findUser(req.body.email);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    res.json({ user });
  })
);
```

## Database Transactions

Use `withTransaction` for operations requiring atomicity:

```typescript
import { withTransaction } from '../utils/database';

const user = await withTransaction(async (client) => {
  const result = await client.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [name, email]
  );
  
  await client.query(
    'INSERT INTO user_preferences (user_id) VALUES ($1)',
    [result.rows[0].id]
  );
  
  return result.rows[0];
});
// Automatically commits on success, rolls back on error
```

## Logging

Use the logger utility for context-aware logging:

```typescript
import { logger } from '../utils/logger';

// Info logging
logger.info('User created successfully', { userId: user.id, email: user.email });

// Error logging
logger.error('Database query failed', error, {
  operation: 'createUser',
  userId: req.userId,
  path: req.path
});

// Warning logging
logger.warn('Deprecated endpoint accessed', { path: req.path });

// Debug logging (only in development)
logger.debug('Processing request', { body: req.body });
```

## Error Response Format

All errors return a consistent JSON format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    // Optional additional details
  }
}
```

### Validation Error Response

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

## Security Features

### SQL Injection Prevention

- All queries use parameterized statements
- Input sanitization removes dangerous characters
- No string concatenation in SQL queries

### XSS Prevention

- Input sanitization removes script tags and dangerous content
- Helmet middleware sets security headers
- Content-Type validation

### Rate Limiting

- Prevents brute-force attacks on authentication endpoints
- Limits password reset attempts
- Protects against DoS attacks

### Password Security

- Bcrypt hashing with salt
- Minimum password length enforcement
- Password strength validation (optional)

## Best Practices

1. **Always use asyncHandler** for async route handlers
2. **Throw custom errors** instead of sending responses directly
3. **Use transactions** for multi-step database operations
4. **Log with context** to aid debugging
5. **Validate all inputs** before processing
6. **Sanitize user inputs** to prevent injection attacks
7. **Apply appropriate rate limiting** to sensitive endpoints
8. **Return user-friendly error messages** without exposing internals

## Example: Complete Route with Error Handling

```typescript
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validation';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { NotFoundError, ValidationError } from '../utils/errors';
import { withTransaction } from '../utils/database';
import { logger } from '../utils/logger';
import { pool } from '../config/database';

const router = Router();

router.post('/items',
  apiLimiter,
  authenticateToken,
  validate([
    { field: 'name', required: true, minLength: 1, maxLength: 255 },
    { field: 'description', required: false, maxLength: 1000 }
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const { name, description } = req.body;
    const userId = req.userId;

    // Validate business logic
    if (name.toLowerCase() === 'forbidden') {
      throw new ValidationError('This name is not allowed');
    }

    // Create item within transaction
    const item = await withTransaction(async (client) => {
      const result = await client.query(
        'INSERT INTO items (name, description, user_id) VALUES ($1, $2, $3) RETURNING *',
        [name, description, userId]
      );
      
      // Additional operations in same transaction
      await client.query(
        'INSERT INTO activity_log (user_id, action) VALUES ($1, $2)',
        [userId, 'item_created']
      );
      
      return result.rows[0];
    });

    logger.info('Item created successfully', {
      userId,
      itemId: item.id,
      itemName: item.name
    });

    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  })
);

export default router;
```

## Testing Error Handling

When testing endpoints, verify:

1. Proper HTTP status codes are returned
2. Error messages are user-friendly
3. Validation errors include field-specific details
4. Rate limiting works correctly
5. Transactions roll back on errors
6. Errors are logged with appropriate context
