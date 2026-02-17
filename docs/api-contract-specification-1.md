---
goal: Define complete API contract specification for Kitchen Odyssey backend services
version: 1.0
date_created: 2026-02-17
last_updated: 2026-02-17
owner: Project Team
status: 'Planned'
tags: ['api', 'openapi', 'contract', 'specification', 'rest', 'endpoints']
---

# API Contract Specification

## Introduction

This document provides the complete API contract specification for the Kitchen Odyssey backend services. All endpoints follow RESTful conventions and are versioned under `/api/v1/`. This specification maps 1:1 with the existing `src/lib/storage.js` functions to ensure behavioral parity during migration.

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://your-backend-domain.com/api/v1
```

## Authentication

### Token-Based Authentication

Most endpoints require authentication via JWT tokens stored in HttpOnly cookies. The backend automatically validates tokens from the `access_token` cookie.

**Headers:**
- `Cookie: access_token=<jwt_token>`

**Guest Access:**
- Guests can access read-only endpoints without authentication
- Guest ID should be passed via `X-Guest-ID` header when available

---

## Endpoints

### 1. Authentication Endpoints

#### 1.1 Login

**Endpoint:** `POST /auth/login`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "string (required, email format)",
  "password": "string (required, min 6 chars)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "admin|user",
      "status": "active|pending|suspended|inactive",
      "avatar": "string (url)",
      "bio": "string",
      "location": "string",
      "cookingLevel": "Beginner|Intermediate|Advanced|Professional",
      "favorites": ["string (recipe ids)"],
      "viewedRecipes": ["string (recipe ids)"],
      "joinedDate": "string (ISO 8601)",
      "lastActive": "string (ISO 8601)"
    }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Error Responses:**
- `400 (Bad Request)`: Invalid email format
- `401 (Unauthorized)`: Invalid credentials
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.login(email, password)`

---

#### 1.2 Signup

**Endpoint:** `POST /auth/signup`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "string (required, email format)",
  "username": "string (required, 3-30 chars)",
  "password": "string (required, min 6 chars)",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "birthday": "string (optional, ISO 8601 date)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "message": "Account created. Please wait for admin approval."
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Error Responses:**
- `400 (Bad Request)`: Validation errors
- `409 (Conflict)`: Email already exists
```json
{
  "success": false,
  "error": {
    "code": "AUTH_EMAIL_EXISTS",
    "message": "An account with this email already exists",
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.signup(userData)`

---

#### 1.3 Logout

**Endpoint:** `POST /auth/logout`

**Authentication:** Required

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.logout(userId)`

---

#### 1.4 Logout All Devices

**Endpoint:** `POST /auth/logout-all`

**Authentication:** Required

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out from all devices"
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

---

#### 1.5 Refresh Token

**Endpoint:** `POST /auth/refresh`

**Authentication:** Refresh token cookie required

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Token refreshed"
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_REFRESH_TOKEN",
    "message": "Invalid or expired refresh token",
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

---

#### 1.6 Get Current User

**Endpoint:** `GET /auth/me`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.getCurrentUser()`

---

### 2. User Endpoints

#### 2.1 Get All Users (Admin Only)

**Endpoint:** `GET /users`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `cursor` (string, optional): Pagination cursor
- `limit` (number, optional, default: 20, max: 100)
- `status` (string, optional): Filter by status
- `role` (string, optional): Filter by role

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "admin|user",
      "status": "active|pending|suspended|inactive",
      "avatar": "string (url)",
      "joinedDate": "string (ISO 8601)",
      "lastActive": "string (ISO 8601)"
    }
  ],
  "pagination": {
    "nextCursor": "string",
    "hasMore": true,
    "limit": 20,
    "total": 150
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.getUsers()`

---

#### 2.2 Get User by ID

**Endpoint:** `GET /users/:id`

**Authentication:** Required (Own profile or Admin)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

---

#### 2.3 Update User Profile

**Endpoint:** `PATCH /users/:id`

**Authentication:** Required (Own profile or Admin)

**Request Body:**
```json
{
  "username": "string (optional, 3-30 chars)",
  "bio": "string (optional, max 500 chars)",
  "location": "string (optional, max 100 chars)",
  "cookingLevel": "Beginner|Intermediate|Advanced|Professional (optional)",
  "avatar": "string (optional, url)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.saveUser(user)`

---

#### 2.4 Delete User (Admin Only)

**Endpoint:** `DELETE /users/:id`

**Authentication:** Required (Admin only)

**Success Response (204):** No content

**Corresponds to:** `storage.deleteUser(userId)`

---

### 3. Recipe Endpoints

#### 3.1 Get All Recipes

**Endpoint:** `GET /recipes`

**Authentication:** Optional

**Query Parameters:**
- `cursor` (string, optional): Pagination cursor
- `limit` (number, optional, default: 20, max: 100)
- `category` (string, optional): Filter by category
- `difficulty` (string, optional): Filter by difficulty (Easy, Medium, Hard)
- `status` (string, optional): Filter by status (published, pending, rejected)
- `search` (string, optional): Search in title/description
- `sort` (string, optional): Sort field (createdAt, likes, views)
- `order` (string, optional): Sort order (asc, desc)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "category": "string",
      "prepTime": "number (minutes)",
      "cookTime": "number (minutes)",
      "servings": "number",
      "difficulty": "Easy|Medium|Hard",
      "ingredients": [
        {
          "name": "string",
          "quantity": "string",
          "unit": "string"
        }
      ],
      "instructions": ["string"],
      "images": ["string (url)"],
      "authorId": "string",
      "status": "published|pending|rejected",
      "createdAt": "string (ISO 8601)",
      "likedBy": ["string (user ids)"],
      "viewedBy": ["string (user ids)"],
      "likeCount": "number",
      "viewCount": "number",
      "averageRating": "number"
    }
  ],
  "pagination": {
    "nextCursor": "string",
    "hasMore": true,
    "limit": 20,
    "total": 150
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.getRecipes()`

---

#### 3.2 Get Recipe by ID

**Endpoint:** `GET /recipes/:id`

**Authentication:** Optional

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recipe": { ... }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.getRecipeById(recipeId)`

---

#### 3.3 Create Recipe

**Endpoint:** `POST /recipes`

**Authentication:** Required (Active users only)

**Request Body:**
```json
{
  "title": "string (required, 3-100 chars)",
  "description": "string (required, 10-1000 chars)",
  "category": "string (required)",
  "prepTime": "number (required, minutes)",
  "cookTime": "number (required, minutes)",
  "servings": "number (required, min 1)",
  "difficulty": "Easy|Medium|Hard (required)",
  "ingredients": [
    {
      "name": "string (required)",
      "quantity": "string (required)",
      "unit": "string"
    }
  ],
  "instructions": ["string (required)"],
  "images": ["string (url)"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "recipe": { ... }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Error Responses:**
- `403 (Forbidden)`: Pending or suspended users
```json
{
  "success": false,
  "error": {
    "code": "RECIPE_CREATE_FORBIDDEN",
    "message": "Your account must be active to create recipes",
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.saveRecipe(recipe)`

---

#### 3.4 Update Recipe

**Endpoint:** `PATCH /recipes/:id`

**Authentication:** Required (Author or Admin only)

**Request Body:** Same as create (all fields optional)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recipe": { ... }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.saveRecipe(recipe)`

---

#### 3.5 Delete Recipe

**Endpoint:** `DELETE /recipes/:id`

**Authentication:** Required (Author or Admin only)

**Success Response (204):** No content

**Side Effects:**
- Removes recipe ID from all users' favorites
- Deletes all reviews for this recipe

**Corresponds to:** `storage.deleteRecipe(recipeId)`

---

### 4. Interaction Endpoints

#### 4.1 Toggle Like

**Endpoint:** `POST /recipes/:id/like`

**Authentication:** Required (Active users only)

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "count": 42
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Error Responses:**
- `403 (Forbidden)`: Pending, suspended, or guest users
```json
{
  "success": false,
  "error": {
    "code": "INTERACTION_FORBIDDEN",
    "message": "You must be an active user to like recipes",
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.toggleLike(userId, recipeId)`

---

#### 4.2 Toggle Favorite

**Endpoint:** `POST /recipes/:id/favorite`

**Authentication:** Required (Active users only)

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "favorited": true
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Side Effect:** Dispatches `favoriteToggled` event

**Corresponds to:** `storage.toggleFavorite(userId, recipeId)`

---

#### 4.3 Record View

**Endpoint:** `POST /recipes/:id/view`

**Authentication:** Optional

**Headers:**
- `X-Guest-ID` (string): Guest ID if user is not authenticated

**Request Body:**
```json
{
  "viewerType": "user|guest"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "viewCount": 150
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Behavior:**
- Guest views are NOT recorded in `viewedBy` array
- Guest views do NOT increment daily stats
- Returns current view count

**Corresponds to:** `storage.recordView(viewerIdOrOptions, recipeIdMaybe)`

---

#### 4.4 Get Recipe Reviews

**Endpoint:** `GET /recipes/:id/reviews`

**Authentication:** Optional

**Query Parameters:**
- `limit` (number, optional, default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "recipeId": "string",
      "userId": "string",
      "username": "string",
      "rating": "number (1-5)",
      "comment": "string",
      "createdAt": "string (ISO 8601)"
    }
  ],
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.getReviews(recipeId)`

---

#### 4.5 Add Review

**Endpoint:** `POST /recipes/:id/reviews`

**Authentication:** Required (Active users only)

**Request Body:**
```json
{
  "rating": "number (required, 1-5)",
  "comment": "string (required, 10-1000 chars)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "review": { ... }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.addReview(review)`

---

#### 4.6 Delete Review

**Endpoint:** `DELETE /reviews/:id`

**Authentication:** Required (Review author or Admin only)

**Success Response (204):** No content

**Corresponds to:** `storage.deleteReview(reviewId)`

---

#### 4.7 Get Average Rating

**Endpoint:** `GET /recipes/:id/rating`

**Authentication:** Optional

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "averageRating": 4.5,
    "reviewCount": 42
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.getAverageRating(recipeId)`

---

### 5. Admin Endpoints

#### 5.1 Update User Status (Admin Only)

**Endpoint:** `PATCH /admin/users/:id/status`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "status": "active|pending|suspended|inactive"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

---

#### 5.2 Update Recipe Status (Admin Only)

**Endpoint:** `PATCH /admin/recipes/:id/status`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "status": "published|pending|rejected"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recipe": { ... }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Side Effect:** Dispatches `recipeUpdated` event

---

### 6. Statistics Endpoints

#### 6.1 Get Daily Stats (Admin Only)

**Endpoint:** `GET /stats/daily`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `date` (string, optional, format: YYYY-MM-DD, default: today)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "string (YYYY-MM-DD)",
    "newUsers": ["string (user ids)"],
    "newContributors": ["string (user ids)"],
    "activeUsers": ["string (user ids)"],
    "views": [
      {
        "viewerKey": "string",
        "viewerType": "user|guest",
        "recipeId": "string",
        "viewedAt": "string (ISO 8601)"
      }
    ],
    "newUsersCount": 5,
    "activeUsersCount": 23,
    "viewsCount": 156
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.getDailyStats()`, `storage.getNewUsersToday()`, `storage.getDailyActiveUsers()`, `storage.getDailyViews()`

---

#### 6.2 Get Active Users Count (Admin Only)

**Endpoint:** `GET /stats/active-users`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `date` (string, optional, format: YYYY-MM-DD, default: today)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "string (YYYY-MM-DD)",
    "activeUsers": ["string (user ids)"],
    "count": 42
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.getDailyActiveUsers()`

---

#### 6.3 Get Daily Views Count (Admin Only)

**Endpoint:** `GET /stats/views`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `date` (string, optional, format: YYYY-MM-DD, default: today)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "string (YYYY-MM-DD)",
    "viewsCount": 156,
    "uniqueViewers": 45
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.getDailyViews()`

---

### 7. Activity Endpoints

#### 7.1 Get Recent Activity (Admin Only)

**Endpoint:** `GET /activity`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `limit` (number, optional, default: 5, max: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "type": "user|recipe|review",
      "text": "string",
      "time": "string (ISO 8601)"
    }
  ],
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.getRecentActivity(limit)`

---

#### 7.2 Add Activity (Internal/Admin Only)

**Endpoint:** `POST /activity`

**Authentication:** Required (Admin or internal service)

**Request Body:**
```json
{
  "type": "user|recipe|review",
  "text": "string (required)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "activity": { ... }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.addActivity(activity)`

---

### 8. Search History Endpoints

#### 8.1 Get Search History

**Endpoint:** `GET /search-history`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "userId": "string",
      "query": "string",
      "createdAt": "string (ISO 8601)"
    }
  ],
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.getSearchHistory(userId)`

---

#### 8.2 Add Search History

**Endpoint:** `POST /search-history`

**Authentication:** Required

**Request Body:**
```json
{
  "query": "string (required, trimmed, max 100 chars)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "entry": { ... }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Behavior:**
- Removes duplicates (same query by same user)
- Limits to 10 items per user
- Adds to beginning of list

**Corresponds to:** `storage.addSearchHistory({ userId, query })`

---

#### 8.3 Clear Search History

**Endpoint:** `DELETE /search-history`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "deletedCount": 10
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Corresponds to:** `storage.clearSearchHistory(userId)`

---

### 9. Random Suggestion Endpoint

#### 9.1 Get Random Recipe Suggestion

**Endpoint:** `GET /recipes/random-suggestion`

**Authentication:** Optional

**Query Parameters:**
- `category` (string, optional): Filter by category

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recipe": { ... }
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

**Behavior:**
- Filters to `status: published` only
- Quality constraints: >= 5 likes AND >= 1 review
- Falls back to all published recipes if no quality recipes match
- Guest views through this endpoint do NOT increment any metrics

**Corresponds to:** `storage.getRandomSuggestion()`

---

### 10. Health Check Endpoint

#### 10.1 Health Check

**Endpoint:** `GET /health`

**Authentication:** None required

**Success Response (200):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "string (ISO 8601)",
  "uptime": 12345,
  "database": {
    "status": "connected",
    "latency_ms": 15
  },
  "environment": "production"
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `AUTH_EMAIL_EXISTS` | 409 | Email already registered |
| `AUTH_INVALID_REFRESH_TOKEN` | 401 | Refresh token expired or invalid |
| `AUTH_TOKEN_EXPIRED` | 401 | Access token expired |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `RECIPE_NOT_FOUND` | 404 | Recipe does not exist |
| `RECIPE_CREATE_FORBIDDEN` | 403 | User not allowed to create recipes |
| `REVIEW_NOT_FOUND` | 404 | Review does not exist |
| `INTERACTION_FORBIDDEN` | 403 | Guest/pending/suspended users cannot interact |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `DUPLICATE_RESOURCE` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication (`/auth/*`) | 10 requests | 1 minute |
| Write operations (POST/PATCH/DELETE) | 50 requests | 1 minute |
| Read operations (GET) | 100 requests | 1 minute |
| Admin endpoints | 200 requests | 1 minute |

**Rate Limit Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60,
    "timestamp": "string (ISO 8601)",
    "requestId": "string"
  }
}
```

---

## OpenAPI Specification

A complete OpenAPI 3.0 YAML specification is available at:

```
Project2/kitchen-odyssey-backend/docs/openapi.yaml
```

This specification can be imported into tools like:
- Swagger UI for interactive documentation
- Postman for API testing
- openapi-typescript for generating TypeScript types
- Orval for generating React Query hooks

---

## TypeScript Type Generation

To generate TypeScript types from the OpenAPI specification:

```bash
# Install openapi-typescript
npm install -g openapi-typescript

# Generate types
openapi-typescript Project2/kitchen-odyssey-backend/docs/openapi.yaml -o src/types/api.ts
```

This will generate a `paths` object with full type safety for all endpoints.


