---
goal: Define security best practices and patterns for Kitchen Odyssey backend services
version: 1.0
date_created: 2026-02-17
last_updated: 2026-02-17
owner: Project Team
status: 'Planned'
tags: ['security', 'nosql-injection', 'auth', 'jwt', 'csrf', 'rate-limiting', 'owasp']
---

# Security Considerations

## Introduction

This document outlines security best practices and implementation patterns for the Kitchen Odyssey backend services. It covers authentication, authorization, NoSQL injection prevention, and protection against common web vulnerabilities following OWASP guidelines.

**Framework Note:** The target backend is `Project2/Kitchen_Odyssey_Backend` using Next.js route handlers. Any Express-style snippets in this document are reference patterns and must be translated to equivalent Next.js middleware/route utilities during implementation.

---

## 1. Authentication Security

### 1.1 Password Storage

**Requirement:** Store passwords using bcrypt with salt rounds.

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Hash password on user creation/update
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// Verify password on login
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
```

**Security Rules:**
- Never store plain text passwords
- Use minimum 10 salt rounds (configurable via env var)
- Use timing-safe comparison (built into bcrypt)
- Reject weak passwords (minimum 6 characters)

---

### 1.2 JWT Token Security

**Implementation:**

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!; // Minimum 32 bytes
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  tokenVersion: number; // For forced logout
}

// Generate access token
export function generateAccessToken(user: JWTPayload): string {
  return jwt.sign(user, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'kitchen-odyssey-api',
    audience: 'kitchen-odyssey-app'
  });
}

// Generate refresh token
export function generateRefreshToken(userId: string, tokenVersion: number): string {
  return jwt.sign(
    { userId, tokenVersion, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

// Verify token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}
```

**Security Rules:**
- Store `JWT_SECRET` in environment variables only
- Use minimum 32-character random secret
- Include `tokenVersion` for forced logout capability
- Set short expiry on access tokens (15 minutes)
- Use HttpOnly cookies to prevent XSS access
- Set `Secure` flag on cookies (HTTPS only in production)
- Set `SameSite=Strict` to prevent CSRF

---

### 1.3 Token Refresh Flow

```typescript
// Middleware to refresh token on 401
export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyToken(refreshToken);

  if (!payload || payload.type !== 'refresh') {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const user = await User.findById(payload.userId);

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw new UnauthorizedError('Token invalidated');
  }

  // Generate new access token
  const newAccessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    tokenVersion: user.tokenVersion
  });

  // Rotate refresh token
  const newRefreshToken = generateRefreshToken(user.id, user.tokenVersion);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

---

## 2. Authorization & Role-Based Access Control

### 2.1 Role Guards

```typescript
import { Request, Response, NextFunction } from 'express';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive'
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_MISSING',
        message: 'Authentication required'
      }
    });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid or expired token'
      }
    });
  }

  req.user = payload;
  next();
}

// Middleware to check user role
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
}

// Middleware to check user status
export function requireActiveUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' }
    });
  }

  if (req.user.status !== UserStatus.ACTIVE) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_ACCOUNT_INACTIVE',
        message: `Account is ${req.user.status}`
      }
    });
  }

  next();
}

// Usage examples
router.post('/recipes', requireAuth, requireActiveUser, createRecipe);
router.delete('/users/:id', requireAuth, requireRole(UserRole.ADMIN), deleteUser);
```

---

### 2.2 Resource Ownership Check

```typescript
// Middleware to verify user owns resource or is admin
export async function requireOwnershipOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params;
  const resource = await Recipe.findById(id);

  if (!resource) {
    return res.status(404).json({
      success: false,
      error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' }
    });
  }

  if (resource.authorId !== req.user.userId && req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_NOT_OWNER',
        message: 'You do not have permission to modify this resource'
      }
    });
  }

  req.resource = resource;
  next();
}

// Usage
router.patch('/recipes/:id', requireAuth, requireOwnershipOrAdmin, updateRecipe);
```

---

## 3. NoSQL Injection Prevention

### 3.1 Understanding NoSQL Injection

MongoDB is vulnerable to injection attacks when user input is directly used in query objects without sanitization.

**Vulnerable Example:**
```typescript
// BAD: Direct use of user input
app.get('/users', async (req, res) => {
  const { role, status } = req.query;
  const users = await User.find({ role, status }); // VULNERABLE!
});
```

**Attack Vector:**
```
GET /users?role[$ne]=null&status[$ne]=null
# Returns all users where role != null AND status != null
```

---

### 3.2 Sanitization Utility

```typescript
// Sanitize MongoDB operators from user input
export function sanitizeMongoQuery<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Check for MongoDB operators
      const value = sanitized[key];
      if (
        '$gte' in value ||
        '$gt' in value ||
        '$lte' in value ||
        '$lt' in value ||
        '$ne' in value ||
        '$in' in value ||
        '$nin' in value ||
        '$exists' in value ||
        '$regex' in value ||
        '$where' in value ||
        '$expr' in value
      ) {
        delete sanitized[key]; // Remove suspicious keys
      }
    }
  }

  return sanitized;
}

// Also sanitize special characters
export function sanitizeSpecialChars(input: string): string {
  return input
    .replace(/\$/g, '') // Remove $
    .replace(/\{/g, '') // Remove {
    .replace(/\}/g, '') // Remove }
    .replace(/\./g, ''); // Remove .
}
```

---

### 3.3 Safe Query Building

```typescript
import mongoose from 'mongoose';

// GOOD: Use Mongoose's type-safe queries
export async function findUsers(filters: { role?: string; status?: string }) {
  const query: any = {};

  // Only add known, safe fields to query
  if (filters.role && ['admin', 'user'].includes(filters.role)) {
    query.role = filters.role;
  }

  if (filters.status && ['active', 'pending', 'suspended', 'inactive'].includes(filters.status)) {
    query.status = filters.status;
  }

  return User.find(query);
}

// GOOD: Use mongoose's built-in casting
export async function findRecipeById(id: string) {
  // Mongoose automatically casts to ObjectId and validates
  return Recipe.findById(mongoose.Types.ObjectId(id));
}

// GOOD: Use regex with escaped input for search
export async function searchRecipes(searchTerm: string) {
  const escaped = sanitizeSpecialChars(searchTerm);
  return Recipe.find({
    $or: [
      { title: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } }
    ]
  });
}

// GOOD: Use text search (requires text index)
export async function searchRecipesText(searchTerm: string) {
  // Text search is safer - MongoDB handles escaping
  return Recipe.find({ $text: { $search: searchTerm } });
}
```

---

### 3.4 Input Validation Middleware

```typescript
import { body, param, query, validationResult } from 'express-validator';

// Validation middleware
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }
    });
  }

  next();
}

// Usage examples
router.post(
  '/recipes',
  requireAuth,
  [
    body('title').trim().isLength({ min: 3, max: 100 }),
    body('description').trim().isLength({ min: 10, max: 1000 }),
    body('category').isString(),
    body('prepTime').isInt({ min: 0 }),
    body('cookTime').isInt({ min: 0 }),
    body('servings').isInt({ min: 1 }),
    body('difficulty').isIn(['Easy', 'Medium', 'Hard']),
    body('ingredients').isArray(),
    body('instructions').isArray()
  ],
  handleValidationErrors,
  createRecipe
);

router.get(
  '/recipes',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isString(),
    query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
    query('status').optional().isIn(['published', 'pending', 'rejected'])
  ],
  handleValidationErrors,
  getRecipes
);
```

---

## 4. CSRF Protection

### 4.1 CSRF Token Implementation

```typescript
import crypto from 'crypto';

// Generate CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Store CSRF token in session/user record
export async function assignCSRFToken(userId: string): Promise<string> {
  const token = generateCSRFToken();
  await User.findByIdAndUpdate(userId, { csrfToken: token });
  return token;
}

// Verify CSRF token
export function verifyCSRFToken(userId: string, token: string): boolean {
  const user = await User.findById(userId);

  if (!user || !user.csrfToken) {
    return false;
  }

  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(user.csrfToken),
    Buffer.from(token)
  );
}

// Middleware to check CSRF token
export function requireCSRFToken(req: Request, res: Response, next: NextFunction) {
  // Skip for GET requests (read-only)
  if (req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'];

  if (!token) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token required'
      }
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' }
    });
  }

  if (!verifyCSRFToken(req.user.userId, token)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid CSRF token'
      }
    });
  }

  next();
}
```

---

### 4.2 Frontend CSRF Integration

```javascript
// src/lib/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true // Required for cookies
});

// Request interceptor - add CSRF token
apiClient.interceptors.request.use((config) => {
  // Add CSRF token to state-changing requests
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const csrfToken = getCSRFToken(); // From cookie or meta tag
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
});

export default apiClient;
```

---

## 5. Rate Limiting

### 5.1 Rate Limiter Implementation

```typescript
import rateLimit from 'express-rate-limit';
import MongoStore from 'rate-limit-mongo';

// Rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'rate_limits',
    expireTimeMs: 60000 // 1 minute
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: 60
    }
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false
});

// Rate limiter for general API requests
export const apiRateLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'rate_limits',
    expireTimeMs: 60000
  }),
  windowMs: 60 * 1000,
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.',
      retryAfter: 60
    }
  }
});

// Rate limiter for write operations
export const writeRateLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    collectionName: 'rate_limits',
    expireTimeMs: 60000
  }),
  windowMs: 60 * 1000,
  max: 50, // 50 write operations per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many write operations. Please wait.',
      retryAfter: 60
    }
  }
});

// Usage
router.post('/auth/login', authRateLimiter, login);
router.post('/auth/signup', authRateLimiter, signup);
router.get('/recipes', apiRateLimiter, getRecipes);
router.post('/recipes', writeRateLimiter, createRecipe);
```

---

## 6. Security Headers

### 6.1 Helmet.js Configuration

```typescript
import helmet from 'helmet';

export function securityHeaders(app: Express) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }));

  // Additional custom headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });
}
```

---

## 7. Request Size Limits

```typescript
import express from 'express';

// Limit request body size to prevent DoS
export function requestSizeLimits(app: Express) {
  app.use(express.json({ limit: '1mb' })); // 1MB for JSON
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  // Limit for multipart/form-data (if image upload is added later)
  // app.use(express.multipart({ limit: '10mb' }));
}
```

---

## 8. CORS Configuration

```typescript
import cors from 'cors';

export function corsConfig(app: Express) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Required for cookies
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'X-CSRF-Token',
      'X-Requested-With',
      'Accept',
      'Accept-Version',
      'Content-Length',
      'Content-MD5',
      'Content-Type',
      'Date',
      'X-Api-Version',
      'Authorization',
      'X-Guest-ID'
    ],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400 // 24 hours
  }));
}
```

---

## 9. Data Sanitization

### 9.1 HTML Sanitization

```typescript
import sanitizeHtml from 'sanitize-html';

export function sanitizeHtmlInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  });
}

// Usage for user-generated content
router.post(
  '/recipes',
  [
    body('title').customSanitizer((value) => sanitizeHtmlInput(value)),
    body('description').customSanitizer((value) => sanitizeHtmlInput(value))
  ],
  createRecipe
);
```

### 9.2 SQL/NoSQL Operator Detection

```typescript
// Detect and block potential injection patterns
const INJECTION_PATTERNS = [
  /\$where/i,
  /\$expr/i,
  /\$ne/i,
  /\$gte/i,
  /\$gt/i,
  /\$lte/i,
  /\$lt/i,
  /\$in/i,
  /\$nin/i,
  /\$exists/i,
  /\$regex/i,
  /;\s*drop\s+/i,
  /;\s*delete\s+/i,
  /;\s*update\s+/i,
  /--/,
  /\/\*/,
  /\*\//
];

export function detectInjection(input: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

export function sanitizeInput(input: string): string {
  if (detectInjection(input)) {
    throw new Error('Potentially malicious input detected');
  }

  return input.replace(/[<>]/g, ''); // Remove angle brackets
}
```

---

## 10. Security Testing

### 10.1 Security Test Cases

```typescript
// tests/security/nosql-injection.spec.ts
import request from 'supertest';
import { app } from '../app';

describe('NoSQL Injection Prevention', () => {
  it('should reject $ne operator in search', async () => {
    const response = await request(app)
      .get('/api/v1/recipes')
      .query({ search: '{"$ne":null}' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should sanitize $where clause', async () => {
    const response = await request(app)
      .get('/api/v1/users')
      .query({ role: '{"$where":"sleep(1000)"}' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Authentication Security', () => {
  it('should reject requests without token', async () => {
    const response = await request(app)
      .post('/api/v1/recipes')
      .send({ title: 'Test Recipe' })
      .expect(401);

    expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
  });

  it('should reject expired tokens', async () => {
    const expiredToken = generateExpiredToken();
    const response = await request(app)
      .post('/api/v1/recipes')
      .set('Cookie', `access_token=${expiredToken}`)
      .send({ title: 'Test Recipe' })
      .expect(401);

    expect(response.body.error.code).toBe('AUTH_TOKEN_EXPIRED');
  });
});

describe('Rate Limiting', () => {
  it('should rate limit authentication endpoints', async () => {
    const requests = Array(11).fill(null).map(() =>
      request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' })
    );

    const responses = await Promise.all(requests);

    // First 10 should work (or return 401 for wrong credentials)
    responses.slice(0, 10).forEach(res => {
      expect([400, 401]).toContain(res.status);
    });

    // 11th should be rate limited
    expect(responses[10].status).toBe(429);
    expect(responses[10].body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});

describe('CSRF Protection', () => {
  it('should reject state-changing requests without CSRF token', async () => {
    const response = await request(app)
      .post('/api/v1/recipes/recipe-1/like')
      .set('Cookie', getAuthCookie())
      .expect(403);

    expect(response.body.error.code).toBe('CSRF_TOKEN_MISSING');
  });
});

describe('Authorization', () => {
  it('should prevent regular users from accessing admin endpoints', async () => {
    const userToken = generateUserToken();
    const response = await request(app)
      .patch('/api/v1/admin/users/user-1/status')
      .set('Cookie', `access_token=${userToken}`)
      .send({ status: 'active' })
      .expect(403);

    expect(response.body.error.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
  });

  it('should prevent pending users from creating recipes', async () => {
    const pendingUserToken = generatePendingUserToken();
    const response = await request(app)
      .post('/api/v1/recipes')
      .set('Cookie', `access_token=${pendingUserToken}`)
      .send(validRecipeData)
      .expect(403);

    expect(response.body.error.code).toBe('RECIPE_CREATE_FORBIDDEN');
  });
});
```

---

## 11. OWASP Top 10 Coverage

| OWASP Category | Implementation |
|----------------|----------------|
| **A01: Broken Access Control** | Role-based middleware, resource ownership checks |
| **A02: Cryptographic Failures** | bcrypt passwords, HTTPS-only in production, secure cookies |
| **A03: Injection** | Input validation, NoSQL sanitization, parameterized queries |
| **A04: Insecure Design** | Guest analytics exclusion, transaction-based operations |
| **A05: Security Misconfiguration** | Security headers, CORS config, rate limiting |
| **A06: Vulnerable Components** | Keep dependencies updated, npm audit |
| **A07: Authentication Failures** | JWT with short expiry, token refresh, secure password storage |
| **A08: Software/Data Integrity** | CSRF protection, idempotency keys |
| **A09: Logging & Monitoring** | Structured logging, correlation IDs |
| **A10: Server-Side Request Forgery** | Validate URLs, allowlist domains |

---

## 12. Security Checklist

### Pre-Deployment

- [ ] All environment variables are set (no defaults in code)
- [ ] JWT_SECRET is minimum 32 characters
- [ ] HTTPS is enforced in production
- [ ] Security headers are configured (framework-native policy via Next.js middleware/headers)
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is on all endpoints
- [ ] NoSQL injection prevention is implemented
- [ ] CSRF protection is enabled
- [ ] Passwords are hashed with bcrypt
- [ ] Database connection uses SSL/TLS
- [ ] Sensitive data is not logged

### Post-Deployment

- [ ] Run security audit: `npm audit`
- [ ] Test authentication flows
- [ ] Test authorization rules (all roles)
- [ ] Test rate limiting
- [ ] Test NoSQL injection prevention
- [ ] Verify CORS configuration
- [ ] Check security headers are present
- [ ] Monitor for suspicious activity

---

## 13. Monitoring & Alerting

### Security Metrics to Monitor

```typescript
// lib/observability/securityMetrics.ts
export interface SecurityMetrics {
  // Authentication failures
  failedLoginAttempts: number;
  invalidTokenErrors: number;

  // Authorization failures
  forbiddenRequests: number;
  adminAccessAttempts: number;

  // Rate limiting
  rateLimitHits: number;

  // Injection attempts
  injectionAttempts: number;

  // Suspicious patterns
  multipleFailedLoginsFromIP: Map<string, number>;
  rapidRequestsFromUser: Map<string, number>;
}

// Alert thresholds
export const ALERT_THRESHOLDS = {
  FAILED_LOGIN_ATTEMPTS_PER_IP: 5,
  RATE_LIMIT_HITS_PER_MINUTE: 100,
  INJECTION_ATTEMPTS_PER_HOUR: 10
};
```

---

## Related Documents

- `../architecture-nextjs-mongodb-migration-1.md` - Main migration plan
- `api-contract-specification-1.md` - API endpoint contracts
- `migration-data-mapping-1.md` - Field-by-field data mapping
- `testing-strategy-1.md` - Security testing approach
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- MongoDB Security: https://www.mongodb.com/docs/manual/security/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
