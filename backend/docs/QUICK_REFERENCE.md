# Quick Reference: Error Handling & Validation

## Common Patterns

### 1. Basic Route with Error Handling

```typescript
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError } from '../utils/errors';

router.get('/items/:id',
  asyncHandler(async (req, res) => {
    const item = await findItem(req.params.id);
    if (!item) {
      throw new NotFoundError('Item not found');
    }
    res.json({ item });
  })
);
```

### 2. Route with Validation

```typescript
import { validate } from '../middleware/validation';

router.post('/items',
  validate([
    { field: 'name', required: true, minLength: 1, maxLength: 255 },
    { field: 'email', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
  ]),
  asyncHandler(async (req, res) => {
    // Inputs are already validated
    const item = await createItem(req.body);
    res.status(201).json({ item });
  })
);
```

### 3. Route with Authentication

```typescript
import { authenticateToken, AuthRequest } from '../middleware/auth';

router.get('/profile',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.userId; // Available after authentication
    const user = await findUser(userId);
    res.json({ user });
  })
);
```

### 4. Route with Rate Limiting

```typescript
import { authLimiter } from '../middleware/rateLimiter';

router.post('/login',
  authLimiter, // 5 attempts per 15 minutes
  asyncHandler(async (req, res) => {
    // Handle login
  })
);
```

### 5. Route with Transaction

```typescript
import { withTransaction } from '../utils/database';

router.post('/transfer',
  asyncHandler(async (req, res) => {
    const result = await withTransaction(async (client) => {
      await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId]);
      await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);
      return { success: true };
    });
    res.json(result);
  })
);
```

### 6. Complete Example

```typescript
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validation';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { NotFoundError, ConflictError } from '../utils/errors';
import { withTransaction } from '../utils/database';
import { logger } from '../utils/logger';

const router = Router();

router.post('/items',
  apiLimiter,                    // Rate limiting
  authenticateToken,             // Authentication
  validate([                     // Validation
    { field: 'name', required: true, minLength: 1, maxLength: 255 }
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const { name } = req.body;
    const userId = req.userId;

    // Check for duplicates
    const existing = await findItemByName(name, userId);
    if (existing) {
      throw new ConflictError('Item with this name already exists');
    }

    // Create with transaction
    const item = await withTransaction(async (client) => {
      const result = await client.query(
        'INSERT INTO items (name, user_id) VALUES ($1, $2) RETURNING *',
        [name, userId]
      );
      
      await client.query(
        'INSERT INTO activity_log (user_id, action) VALUES ($1, $2)',
        [userId, 'item_created']
      );
      
      return result.rows[0];
    });

    // Log success
    logger.info('Item created', { userId, itemId: item.id });

    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  })
);

export default router;
```

## Error Types Quick Reference

```typescript
// 400 Bad Request
throw new ValidationError('Invalid input');

// 401 Unauthorized
throw new AuthenticationError('Invalid credentials');

// 403 Forbidden
throw new AuthorizationError('Access denied');

// 404 Not Found
throw new NotFoundError('Resource not found');

// 409 Conflict
throw new ConflictError('Resource already exists');

// 500 Internal Server Error
throw new DatabaseError('Database operation failed');
throw new StorageError('Storage operation failed');
```

## Logging Quick Reference

```typescript
import { logger } from '../utils/logger';

// Info
logger.info('User logged in', { userId, email });

// Error
logger.error('Failed to create user', error, { email, operation: 'signup' });

// Warning
logger.warn('Deprecated endpoint used', { path: req.path });

// Debug (development only)
logger.debug('Request received', { body: req.body });
```

## Validation Patterns

```typescript
// Email
{ field: 'email', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }

// Password (min 8 chars)
{ field: 'password', required: true, minLength: 8 }

// Name (2-255 chars)
{ field: 'name', required: true, minLength: 2, maxLength: 255 }

// Optional field
{ field: 'description', required: false, maxLength: 1000 }
```

## Rate Limiter Options

```typescript
import {
  apiLimiter,           // 100 req/15min - General API
  authLimiter,          // 5 req/15min - Auth endpoints
  passwordResetLimiter, // 3 req/hour - Password reset
  publicLimiter,        // 50 req/15min - Public endpoints
  drawingLimiter        // 30 req/min - Drawing operations
} from '../middleware/rateLimiter';
```

## Sanitization

```typescript
import { sanitizeString, sanitizeEmail, sanitizeUUID } from '../utils/sanitize';

const cleanName = sanitizeString(userInput);
const cleanEmail = sanitizeEmail(emailInput);
const validUuid = sanitizeUUID(idInput); // Returns null if invalid
```

## Transaction Pattern

```typescript
import { withTransaction } from '../utils/database';

// Single operation
const result = await withTransaction(async (client) => {
  return await client.query('INSERT INTO ...', [values]);
});

// Multiple operations
const result = await withTransaction(async (client) => {
  const user = await client.query('INSERT INTO users ...', [values]);
  await client.query('INSERT INTO preferences ...', [user.rows[0].id]);
  await client.query('INSERT INTO activity_log ...', [user.rows[0].id]);
  return user.rows[0];
});
// Automatically commits on success, rolls back on any error
```

## Common Mistakes to Avoid

❌ **Don't** send responses directly in try-catch:
```typescript
try {
  // ...
} catch (error) {
  res.status(500).json({ error: 'Failed' }); // Wrong!
}
```

✅ **Do** throw custom errors:
```typescript
asyncHandler(async (req, res) => {
  if (!item) {
    throw new NotFoundError('Item not found'); // Right!
  }
});
```

❌ **Don't** forget asyncHandler:
```typescript
router.get('/items', async (req, res) => {
  // Errors won't be caught!
});
```

✅ **Do** use asyncHandler:
```typescript
router.get('/items', asyncHandler(async (req, res) => {
  // Errors are automatically caught
}));
```

❌ **Don't** use string concatenation in SQL:
```typescript
const query = `SELECT * FROM users WHERE email = '${email}'`; // SQL injection risk!
```

✅ **Do** use parameterized queries:
```typescript
const query = 'SELECT * FROM users WHERE email = $1';
await pool.query(query, [email]); // Safe!
```
