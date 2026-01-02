# Security Quick Reference

## Overview

This document provides a quick reference for the security features implemented in task 26.

## Implemented Security Features

### ✅ 1. HTTPS Enforcement in Production

**Files:**
- `src/middleware/httpsRedirect.ts`

**What it does:**
- Automatically redirects HTTP → HTTPS in production
- Sets HSTS header (max-age: 1 year)
- Only active when `NODE_ENV=production`

**No configuration needed** - works automatically in production.

---

### ✅ 2. Helmet Middleware for Security Headers

**Files:**
- `src/index.ts` (enhanced configuration)

**Headers added:**
- Content-Security-Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security (HSTS)

**Already configured** - no additional setup required.

---

### ✅ 3. CSRF Protection

**Files:**
- `src/middleware/csrf.ts`
- `src/routes/auth.ts` (added endpoint)

**How to use:**

1. **Get CSRF token** (after authentication):
```bash
GET /api/auth/csrf-token
Authorization: Bearer <jwt-token>

Response: { "csrfToken": "abc123..." }
```

2. **Include in requests**:
```bash
POST /api/drawings
Authorization: Bearer <jwt-token>
X-CSRF-Token: abc123...
```

**Auto-skipped for:**
- GET, HEAD, OPTIONS requests
- `/api/public/*` endpoints
- `/api/auth/signin` and `/api/auth/signup`

---

### ✅ 4. Rate Limiting on Authentication Endpoints

**Files:**
- `src/middleware/rateLimiter.ts` (already existed)

**Limits:**
- Auth endpoints: 5 requests / 15 minutes
- Password reset: 3 requests / hour
- General API: 100 requests / 15 minutes

**Already active** - no changes needed.

---

### ✅ 5. Password Strength Validation

**Files:**
- `src/utils/passwordValidation.ts`
- `src/routes/auth.ts` (integrated)

**Requirements enforced:**
- Minimum 8 characters
- At least 1 lowercase letter
- At least 1 uppercase letter
- At least 1 number
- No common patterns (password, 123456, etc.)

**Applied to:**
- User signup (`POST /api/auth/signup`)
- Password reset (`POST /api/auth/reset-password`)
- Password change (`PUT /api/auth/password`)

**Error response example:**
```json
{
  "error": "Password does not meet security requirements",
  "details": {
    "errors": [
      "Password must contain at least one uppercase letter",
      "Password must contain at least one number"
    ],
    "suggestions": [
      "Consider adding special characters for stronger security"
    ]
  }
}
```

---

### ✅ 6. SQL Injection Prevention

**Files:**
- All database queries throughout codebase

**Implementation:**
- All queries use parameterized statements (`$1, $2, ...`)
- No string concatenation in SQL queries
- UUID validation before queries

**Example:**
```typescript
// ✅ Safe
await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

// ❌ Never used
await pool.query(`SELECT * FROM users WHERE id = '${userId}'`);
```

**Already implemented** - all existing queries are safe.

---

### ✅ 7. XSS Prevention

**Files:**
- `src/utils/sanitize.ts` (enhanced)
- `src/middleware/sanitize.ts` (already existed)

**New functions added:**
- `sanitizeHtml()` - Escapes HTML special characters
- `stripScripts()` - Removes script tags and event handlers

**Applied to:**
- All request inputs (body, query, params)
- User-generated content before storage

**Protection against:**
- Script injection
- Event handler injection
- JavaScript protocol URLs
- Dangerous data URIs

---

### ✅ 8. Secure Session Management with httpOnly Cookies

**Files:**
- `src/config/cookies.ts`

**Cookie configuration:**
```typescript
{
  httpOnly: true,        // Prevents JavaScript access
  secure: true,          // HTTPS only (production)
  sameSite: 'strict',    // CSRF protection
  maxAge: 7 days         // Auth token expiry
}
```

**Cookie types:**
- `auth_token` - 7 days
- `refresh_token` - 30 days
- `csrf_token` - 24 hours

**Production naming:**
- Cookies prefixed with `__Secure-` in production

**Ready to use** - configuration available for future cookie-based auth.

---

## Testing the Security Features

### 1. Test Password Strength Validation

```bash
# Weak password (should fail)
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "weak"
  }'

# Strong password (should succeed)
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "StrongPass123"
  }'
```

### 2. Test CSRF Protection

```bash
# Get CSRF token
TOKEN=$(curl -X GET http://localhost:3001/api/auth/csrf-token \
  -H "Authorization: Bearer <your-jwt-token>" \
  | jq -r '.csrfToken')

# Use CSRF token in request
curl -X POST http://localhost:3001/api/drawings \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "X-CSRF-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

### 3. Test Rate Limiting

```bash
# Try multiple auth requests quickly (should be rate limited after 5)
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo ""
done
```

### 4. Test HTTPS Redirect (Production)

```bash
# Set NODE_ENV=production and try HTTP request
# Should redirect to HTTPS
curl -I http://localhost:3001/health
```

---

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `JWT_SECRET` (min 32 chars)
- [ ] Use strong database password
- [ ] Configure `FRONTEND_URL` to actual domain
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Use strong S3 credentials
- [ ] Review and adjust rate limits if needed
- [ ] Set up monitoring for security events
- [ ] Enable database SSL connections
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Review CORS configuration

---

## Security Headers Verification

After deployment, verify security headers using:

```bash
curl -I https://your-api-domain.com/health
```

Expected headers:
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`

Or use online tools:
- https://securityheaders.com/
- https://observatory.mozilla.org/

---

## Common Issues & Solutions

### Issue: CSRF token errors

**Solution:** Ensure client:
1. Gets CSRF token after authentication
2. Includes token in `X-CSRF-Token` header
3. Refreshes token if expired (24 hours)

### Issue: Rate limit errors

**Solution:**
- Wait for the rate limit window to expire
- Adjust rate limits in `src/middleware/rateLimiter.ts` if needed
- Implement exponential backoff in client

### Issue: Password validation too strict

**Solution:**
- Review requirements in `src/utils/passwordValidation.ts`
- Adjust validation rules if needed (not recommended)
- Provide clear password requirements to users

### Issue: HTTPS redirect not working

**Solution:**
- Verify `NODE_ENV=production` is set
- Check if behind a proxy (may need to trust `X-Forwarded-Proto` header)
- Ensure SSL certificate is properly configured

---

## Additional Resources

- Full documentation: `SECURITY.md`
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security: https://nodejs.org/en/docs/guides/security/
