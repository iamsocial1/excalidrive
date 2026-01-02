# Security Implementation Guide

This document outlines the security measures implemented in the Excalidraw Organizer backend API.

## Security Features

### 1. HTTPS Enforcement

**Implementation:** `src/middleware/httpsRedirect.ts`

- Automatically redirects HTTP requests to HTTPS in production
- Sets Strict-Transport-Security (HSTS) header with 1-year max-age
- Includes subdomains and preload directives

**Configuration:**
```typescript
// Enabled automatically in production (NODE_ENV=production)
// No additional configuration required
```

### 2. Security Headers (Helmet)

**Implementation:** `src/index.ts`

Helmet middleware provides multiple security headers:

- **Content-Security-Policy (CSP)**: Restricts resource loading
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Enables browser XSS protection
- **Referrer-Policy**: Controls referrer information
- **HSTS**: Forces HTTPS connections

### 3. CSRF Protection

**Implementation:** `src/middleware/csrf.ts`

- Generates unique CSRF tokens for each authenticated user
- Validates tokens on all state-changing operations (POST, PUT, DELETE)
- Tokens expire after 24 hours
- Automatically skips safe methods (GET, HEAD, OPTIONS)

**Usage:**

1. Client requests CSRF token:
```bash
GET /api/auth/csrf-token
Authorization: Bearer <jwt-token>
```

2. Client includes token in subsequent requests:
```bash
POST /api/drawings
Authorization: Bearer <jwt-token>
X-CSRF-Token: <csrf-token>
```

**Exemptions:**
- Public endpoints (`/api/public/*`)
- Authentication endpoints (`/api/auth/signin`, `/api/auth/signup`)
- Safe HTTP methods (GET, HEAD, OPTIONS)

### 4. Rate Limiting

**Implementation:** `src/middleware/rateLimiter.ts`

Multiple rate limiters for different endpoints:

| Limiter | Endpoints | Window | Max Requests |
|---------|-----------|--------|--------------|
| API Limiter | `/api/*` | 15 min | 100 |
| Auth Limiter | Authentication | 15 min | 5 |
| Password Reset | Password reset | 1 hour | 3 |
| Public Limiter | Public drawings | 15 min | 50 |
| Drawing Limiter | Drawing operations | 1 min | 30 |

**Features:**
- Returns rate limit info in `RateLimit-*` headers
- Skips health check endpoints
- Doesn't count successful auth requests

### 5. Password Strength Validation

**Implementation:** `src/utils/passwordValidation.ts`

**Requirements:**
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- No common patterns (password, 123456, etc.)
- No sequential characters recommended
- Special characters recommended

**Scoring System:**
- 0: Very Weak
- 1: Weak
- 2: Fair
- 3: Strong
- 4: Very Strong

**Applied to:**
- User signup
- Password reset
- Password change

### 6. SQL Injection Prevention

**Implementation:** Parameterized queries throughout the codebase

All database queries use parameterized statements with PostgreSQL's `$1, $2, ...` placeholders:

```typescript
// ✅ SAFE - Parameterized query
await pool.query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ UNSAFE - String concatenation (never used)
await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
```

**Additional protections:**
- Input validation before database operations
- UUID validation for IDs
- Type checking on all inputs

### 7. XSS Prevention

**Implementation:** `src/utils/sanitize.ts`

Multiple layers of XSS protection:

1. **Input Sanitization:**
   - Removes null bytes
   - Trims whitespace
   - Applied to all request body, query, and params

2. **HTML Escaping:**
   - Escapes HTML special characters (`<`, `>`, `&`, `"`, `'`, `/`)
   - Prevents script injection in user-generated content

3. **Script Stripping:**
   - Removes `<script>` tags
   - Removes event handlers (onclick, onerror, etc.)
   - Removes `javascript:` protocol
   - Removes dangerous `data:` URIs

4. **Output Encoding:**
   - All user-generated content is sanitized before storage
   - Additional sanitization on output when needed

### 8. Secure Session Management

**Implementation:** `src/config/cookies.ts`

**Cookie Configuration:**
- `httpOnly: true` - Prevents JavaScript access
- `secure: true` (production) - Only sent over HTTPS
- `sameSite: 'strict'` - Prevents CSRF attacks
- Appropriate expiration times

**Cookie Types:**
1. **Auth Token**: 7 days expiry
2. **Refresh Token**: 30 days expiry, restricted path
3. **CSRF Token**: 24 hours expiry, accessible to JS

**Cookie Naming:**
- Production: `__Secure-` prefix for enhanced security
- Development: No prefix for easier debugging

### 9. Authentication & Authorization

**JWT Token Security:**
- Tokens signed with strong secret (JWT_SECRET)
- Configurable expiration (default: 7 days)
- Separate reset tokens with 1-hour expiry
- Token verification on all protected routes

**Password Security:**
- Bcrypt hashing with 10 salt rounds
- Passwords never stored in plain text
- Secure password comparison

## Environment Variables

Required security-related environment variables:

```bash
# JWT Configuration
JWT_SECRET=<strong-random-secret-minimum-32-characters>
JWT_EXPIRES_IN=7d

# Environment
NODE_ENV=production  # Enables production security features

# CORS
FRONTEND_URL=https://your-frontend-domain.com

# Database (use strong credentials)
DB_PASSWORD=<strong-database-password>

# Storage (use strong credentials)
S3_ACCESS_KEY_ID=<access-key>
S3_SECRET_ACCESS_KEY=<secret-key>
```

## Security Best Practices

### For Developers

1. **Never commit secrets:**
   - Use `.env` files (gitignored)
   - Use environment variables in production
   - Rotate secrets regularly

2. **Input validation:**
   - Validate all user inputs
   - Use validation middleware
   - Sanitize before storage

3. **Error handling:**
   - Don't expose sensitive information in errors
   - Log errors securely
   - Use generic error messages for users

4. **Database operations:**
   - Always use parameterized queries
   - Use transactions for multi-step operations
   - Validate UUIDs before queries

5. **Authentication:**
   - Verify tokens on all protected routes
   - Check user ownership before operations
   - Implement proper authorization

### For Deployment

1. **HTTPS:**
   - Use valid SSL/TLS certificates
   - Enable HSTS
   - Redirect HTTP to HTTPS

2. **Environment:**
   - Set `NODE_ENV=production`
   - Use strong JWT_SECRET
   - Configure proper CORS origins

3. **Database:**
   - Use connection pooling
   - Enable SSL for database connections
   - Use strong credentials
   - Regular backups

4. **Monitoring:**
   - Monitor rate limit violations
   - Track authentication failures
   - Log security events
   - Set up alerts

5. **Updates:**
   - Keep dependencies updated
   - Monitor security advisories
   - Regular security audits

## Security Checklist

- [x] HTTPS enforcement in production
- [x] Helmet middleware for security headers
- [x] CSRF protection for state-changing operations
- [x] Rate limiting on all endpoints
- [x] Password strength validation
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (input sanitization and output encoding)
- [x] Secure session management (httpOnly cookies)
- [x] JWT token authentication
- [x] Bcrypt password hashing
- [x] Input validation on all endpoints
- [x] Error handling without information leakage
- [x] CORS configuration
- [x] Request size limits
- [x] Database connection pooling
- [x] Graceful shutdown handling

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

Please do not publicly disclose security issues until they have been addressed.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet Documentation](https://helmetjs.github.io/)
