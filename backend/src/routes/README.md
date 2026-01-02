# Authentication API Endpoints

## Overview
This document describes the authentication endpoints implemented for the Excalidraw Organizer backend.

## Base URL
All authentication endpoints are prefixed with `/api/auth`

## Endpoints

### 1. Sign Up
**POST** `/api/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Validation:**
- `name`: Required, 2-255 characters
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "preferences": {
      "theme": "system",
      "defaultViewMode": "list"
    }
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**
- `400`: Validation failed
- `409`: User already exists
- `500`: Internal server error

---

### 2. Sign In
**POST** `/api/auth/signin`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Validation:**
- `email`: Required, valid email format
- `password`: Required

**Success Response (200):**
```json
{
  "message": "Signed in successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "preferences": {
      "theme": "system",
      "defaultViewMode": "list"
    }
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**
- `400`: Validation failed
- `401`: Invalid email or password
- `500`: Internal server error

---

### 3. Sign Out
**POST** `/api/auth/signout`

Sign out the current user (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "message": "Signed out successfully"
}
```

**Error Responses:**
- `401`: Authentication required
- `403`: Invalid token

---

### 4. Forgot Password
**POST** `/api/auth/forgot-password`

Request a password reset link.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Validation:**
- `email`: Required, valid email format

**Success Response (200):**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent",
  "resetToken": "token_here" // Only in development mode
}
```

**Note:** In production, the reset token is sent via email. In development, it's returned in the response for testing purposes.

**Error Responses:**
- `400`: Validation failed
- `500`: Internal server error

---

### 5. Reset Password
**POST** `/api/auth/reset-password`

Reset password using a reset token.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123"
}
```

**Validation:**
- `token`: Required
- `newPassword`: Required, minimum 8 characters

**Success Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400`: Invalid or expired token
- `500`: Internal server error

---

### 6. Update Profile
**PUT** `/api/auth/profile`

Update user name and/or email (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Validation:**
- `name`: Optional, 2-255 characters
- `email`: Optional, valid email format
- At least one field must be provided

**Success Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "preferences": {
      "theme": "system",
      "defaultViewMode": "list"
    },
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation failed
- `401`: Authentication required
- `403`: Invalid token
- `409`: Email already in use
- `500`: Internal server error

---

### 7. Change Password
**PUT** `/api/auth/password`

Change user password (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePass123"
}
```

**Validation:**
- `currentPassword`: Required
- `newPassword`: Required, minimum 8 characters

**Success Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400`: Validation failed
- `401`: Current password is incorrect or authentication required
- `403`: Invalid token
- `404`: User not found
- `500`: Internal server error

---

## Authentication

Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens are returned from the `/signup` and `/signin` endpoints and should be stored securely on the client side.

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": [] // Optional, for validation errors
}
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Tokens**: Access tokens expire based on `JWT_EXPIRES_IN` environment variable (default: 7 days)
3. **Reset Tokens**: Password reset tokens expire after 1 hour
4. **Email Enumeration Prevention**: Forgot password endpoint always returns success to prevent email enumeration
5. **Input Validation**: All inputs are validated before processing
6. **SQL Injection Prevention**: Parameterized queries are used throughout
