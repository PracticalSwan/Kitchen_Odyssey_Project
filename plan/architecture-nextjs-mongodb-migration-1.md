---
goal: Migrate Kitchen Odyssey from frontend-only localStorage architecture to split Frontend + Next.js Backend + MongoDB Atlas while preserving all existing logic and design-overhaul compatibility
last_updated: 2026-02-18
revision_notes: >
  Updated for Next.js 16 breaking changes (middleware.js→proxy.js, async params/headers/cookies),
  Mongoose recommended cached connection pattern, MongoDB Atlas connection verified,
  added Section 3.5 (Next.js 16 API Patterns), updated CORS with proxy.js alternative.
---

# Introduction


This plan defines a deterministic migration path from the current localStorage-based architecture to a split system with the existing React/Vite frontend (`Project2/Kitchen_Odyssey`) and a new Next.js backend service in the sibling folder `Project2/kitchen-odyssey-backend` (created with Next.js 16.1.6, JavaScript, App Router, `src/` structure), backed by MongoDB Atlas Free Tier. The plan explicitly preserves all existing logic and event behavior, aligns with `plan/design-overhaul-1.md`, and includes exhaustive testing for functional, integration, regression, security, performance, accessibility, and edge-case coverage.

## 1. Requirements & Constraints

### Functional Requirements

- **REQ-001**: Preserve all current end-user behavior and business logic from `Kitchen_Odyssey` during and after migration.
- **REQ-002**: Keep the existing frontend app running in `Kitchen_Odyssey` (React + Vite) and add a separate backend app at `Project2/kitchen-odyssey-backend`.
- **REQ-003**: Replace localStorage as source of truth with MongoDB Atlas while preserving API semantics currently represented in `src/lib/storage.js`.
- **REQ-004**: Do not break Guest Mode and Random Recipe Suggestion features.
- **REQ-005**: Preserve all event-driven update behavior (e.g., `favoriteToggled`, `recipeUpdated`) or provide backward-compatible event emission wrappers.
- **REQ-006**: Keep compatibility with all UI states and constraints in `plan/design-overhaul-1.md`.
- **REQ-007**: Maintain role/access behaviors (`admin`, `active user`, `pending user`, `suspended user`, `guest user`) with no privilege escalation.
- **REQ-008**: Support non-breaking phased rollout with fallback mode.
- **REQ-009**: Introduce deterministic environment configuration for local dev, test, and production.
- **REQ-010**: All migrated endpoints must include validation, error contracts, and typed response envelopes.
- **REQ-011**: Implement comprehensive automated tests covering all screens, interactions, and edge cases.
- **REQ-012**: Migration must include data seeding/import strategy from existing localStorage schemas.
- **REQ-013**: API must support all functions currently in `src/lib/storage.js` including stats, activity, and search history.
- **REQ-014**: Frontend must handle network failures gracefully with read-through fallback and user feedback.
- **REQ-015**: Optimistic updates must be implemented for interactive features (like, favorite) to maintain perceived performance.
- **REQ-016**: All commands/scripts/docs must use the exact backend folder name `kitchen-odyssey-backend` (kebab-case naming; no alternate aliases).
- **REQ-017**: Atlas Free tier must be treated as a hard operational constraint with mandatory indexing, pagination, retention, and connection-pool limits before rollout.

### Security Requirements

- **SEC-001**: Enforce authentication and authorization checks on all write endpoints.
- **SEC-002**: Sanitize and validate all request payloads server-side.
- **SEC-003**: Store credentials/secrets in environment variables only.
- **SEC-004**: Protect against common API abuse patterns (rate limits on auth and write-heavy routes).
- **SEC-005**: Protect against NoSQL injection attacks for MongoDB queries.
- **SEC-006**: Implement CSRF protection for state-changing operations.
- **SEC-007**: Add security headers via Next.js proxy/route responses (`proxy.js` and route handler headers) or equivalent framework-native controls. **Note:** Next.js 16 renamed `middleware.js` to `proxy.js` — the export is now `export function proxy(request)` instead of `export function middleware(request)`. Proxy runs on Node.js runtime (not Edge).
- **SEC-008**: Implement request size limits to prevent DoS via large payloads.
- **SEC-009**: Use HTTPS-only in production with secure cookie flags.
- **SEC-010**: Implement token-based authentication with secure token storage and refresh mechanism.
- **SEC-011**: Hash all user passwords with bcrypt (cost factor 12+) before storing in MongoDB. Current localStorage stores plaintext passwords; migration import script must hash all existing passwords during import.

### Technical Constraints

- **CON-001**: Do not implement this plan during planning phase.
- **CON-002**: Backend location is `Project2/kitchen-odyssey-backend` (sibling of `Project2/Kitchen_Odyssey`).
- **CON-003**: Keep frontend routing and page/component structure intact unless strictly required for API integration.
- **CON-004**: Keep compatibility with design-overhaul execution order and UI contracts.
- **CON-005**: Avoid introducing breaking schema changes without versioned migration scripts.
- **CON-006**: Use API versioning (`/api/v1/*`) to allow future breaking changes.
- **CON-007**: Guest mode continues to use `localStorage` for guest ID persistence (`cookhub_guest_id`).
- **CON-008**: All timestamps stored in UTC for timezone consistency.
- **CON-009**: Backend is created with Next.js 16.1.6, JavaScript (not TypeScript), App Router, with `src/` directory structure.
- **CON-010**: `VITE_USE_BACKEND_API` is the single rollout switch for frontend runtime behavior.
- **CON-011**: Mongoose must be added as a production dependency (`npm install mongoose`) before any models or DB code can be implemented. The default `create-next-app` scaffold does not include it.
- **CON-012**: Admin users cannot like, favorite, or review recipes. The existing `canInteract` logic is `user && status === 'active' && !isAdmin && !isGuest`. Backend must enforce this same restriction on interaction endpoints.

### Design Guidelines

- **GUD-001**: Use stable contract-first API design (OpenAPI-first or explicit route contract docs).
- **GUD-002**: Use repository/service layering in backend for predictable testability.
- **GUD-003**: Use adapter pattern in frontend so old storage calls map to new API with minimal UI changes.
- **PAT-001**: Strangler pattern migration: localStorage read-through fallback during controlled rollout.
- **PAT-002**: Backward-compatible event bridge pattern for UI listeners.
- **PAT-003**: Optimistic updates with rollback on failure for interactive features.

## 2. Authentication Strategy

### 2.1 Token-Based Authentication

**Implementation Choice:** JWT (JSON Web Tokens) with HttpOnly cookies

**Rationale:**
- JWTs are stateless and work well with Next.js API routes
- HttpOnly cookies prevent XSS attacks
- No need for server-side session storage
- Simplifies scaling across multiple server instances

### 2.1.1 User Status State Machine

The backend must replicate the existing user status transitions exactly:

```
  signup --> [pending]   (new users always start as pending)
                |
       admin approves
                v
  login --> [active] <--> [inactive] <-- logout
                            (only active/inactive users toggle on login/logout)

  [pending]  -- login --> status stays pending (no toggle)
  [suspended] -- login --> status stays suspended (no toggle)
  [active]   -- logout --> [inactive]
  [inactive] -- login --> [active]
```

**Critical rules:**
- Login only toggles `inactive` -> `active`. Pending and suspended users remain in their status.
- Logout only toggles `active` -> `inactive`. Pending and suspended users remain in their status.
- Admin can change status to `active`, `suspended`, or `pending` via admin endpoints.
- `lastActive` timestamp is updated on login, on periodic heartbeat (every 60s), and on page exit.

### 2.2 Token Structure

**Access Token:**
- Lifetime: 15 minutes
- Contains: user ID, role, status, permissions
- Stored in: HttpOnly cookie
- Sent with: Every API request automatically

**Refresh Token:**
- Lifetime: 7 days
- Contains: user ID, token version
- Stored in: HttpOnly cookie with additional security flags
- Used for: Obtaining new access token without re-authentication

### 2.3 Authentication Flow

```
+---------------+                 +----------------+                +--------------+
|   Frontend    |                 |    Backend     |                |   Database   |
+------+--------+                 +-------+--------+                +------+-------+
       |                                  |                                |
       |  1. POST /api/v1/auth/login      |                                |
       |  {email, password}               |                                |
       |--------------------------------->|                                |
       |                                  |  2. Validate credentials       |
       |                                  |------------------------------->|
       |                                  |<-------------------------------|
       |  3. Set cookies:                 |                                |
       |  - access_token (15min)          |                                |
       |  - refresh_token (7days)         |                                |
       |<---------------------------------|                                |
       |                                  |                                |
       |  4. API request with token       |                                |
       |--------------------------------->|                                |
       |                                  |  5. Verify token               |
       |  6. Response                     |                                |
       |<---------------------------------|                                |
       |                                  |                                |
       |  7. Auto-refresh on 401          |                                |
       |--------------------------------->|                                |
       |  8. New access_token             |                                |
       |<---------------------------------|                                |
```

### 2.4 Session Management

**Multi-Device Support:**
- Users can be logged in on multiple devices simultaneously
- Each device receives its own refresh token
- Logout invalidates only the calling device's tokens
- Admin "logout all devices" invalidates all refresh tokens for a user

**Token Storage (Backend):**
- Store refresh token hash in database for validation
- Include token version to support token invalidation
- Implement token rotation: issue new refresh token on each use

### 2.5 Guest Mode Authentication

**Strategy:** Continue using `localStorage` for guest ID

**Rationale:**
- Guests don't need server-side sessions
- Guest views are excluded from all analytics (per existing requirements)
- Simplifies implementation - no auth tokens needed for guests
- Guest ID (`cookhub_guest_id`) persists across sessions

**Behavior:**
- Guest requests include `guest_id` header (if available)
- Backend identifies guest by ID prefix (`guest-*`)
- Guest restrictions enforced at API level (no likes, favorites, reviews)

### 2.6 Security Considerations

**Token Security:**
- Use strong signing key (minimum 32 bytes, stored in `JWT_SECRET`)
- Implement token versioning to support forced logout
- Set `Secure`, `HttpOnly`, `SameSite=Strict` cookie flags in production (behind reverse proxy with same origin)
- **Development mode:** Use `SameSite=Lax` (not `Strict`) because frontend (`localhost:5173`) and backend (`localhost:3000`) are cross-origin. Alternatively, configure Vite's dev proxy to forward `/api` requests to the backend so both share the same origin.
- Use short access token lifetime (15 minutes)
- Rotate refresh tokens on each use

**CORS Configuration:**
```javascript
// Local development
allowedOrigins: ['http://localhost:5173']

// Production
allowedOrigins: ['https://your-frontend-domain.com']
credentials: true // Required for cookies
```

### 2.7 Token Refresh Flow

**Automatic Refresh:**
- Frontend interceptor catches 401 responses
- Calls `/api/v1/auth/refresh` endpoint
- Accepts rotated HttpOnly cookie set by backend (frontend does not read/store raw access token)
- Retries original request
- Shows user-friendly message if refresh fails (redirect to login)

**Manual Refresh:**
- User can be logged out if refresh token is invalid/expired
- Frontend redirects to login page
- User credentials required again

## 3. Deployment Considerations

### 3.1 Environment Configuration

**Development Environment:**
```bash
# Backend (Project2/kitchen-odyssey-backend/.env.local)
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=kitchen_odyssey_dev
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=0
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
JWT_SECRET=dev-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_AUTH=10
RATE_LIMIT_MAX_WRITE=50
RATE_LIMIT_MAX_READ=100
LOG_LEVEL=debug

# Frontend (Project2/Kitchen_Odyssey/.env)
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_USE_BACKEND_API=false
```

**Production Environment:**
```bash
# Backend (Project2/kitchen-odyssey-backend/.env.production)
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=kitchen_odyssey_prod
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=0
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
JWT_SECRET=<strong-random-64-char-string>
ALLOWED_ORIGINS=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_AUTH=10
RATE_LIMIT_MAX_WRITE=40
RATE_LIMIT_MAX_READ=100
LOG_LEVEL=info

# Frontend (Project2/Kitchen_Odyssey/.env.production)
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
VITE_USE_BACKEND_API=true
```

### 3.2 Deployment Targets

**Primary Deployment Target: Azure VM**

**Required Topology (project-aligned):**
- Frontend source: `Project2/Kitchen_Odyssey`
- Backend source: `Project2/kitchen-odyssey-backend`
- Reverse proxy (Nginx/Caddy/IIS) routes:
  - `/` -> Vite frontend static assets
  - `/api/v1/*` -> Next.js backend service

**Rationale:**
- Matches project deployment requirement and local folder split.
- Keeps backend and frontend independently deployable.
- Maintains one public origin for simpler cookie/CORS behavior.

**Optional Preview Environments (non-primary):**
- Vercel, Railway, Render may be used for temporary QA previews only.

### 3.3 CORS Configuration

**Next.js Route-Handler Setup (dynamic origin allowlist):**
```javascript
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

export function buildCorsHeaders(origin) {
  if (!origin || !allowedOrigins.has(origin)) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers':
      'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, X-Guest-ID',
    Vary: 'Origin'
  };
}

// Use in each route handler:
// 1) Handle OPTIONS preflight with buildCorsHeaders(origin)
// 2) Attach CORS headers to normal responses
```

**Alternative: CORS via `proxy.js` (Next.js 16 proxy, preferred for global CORS):**
```javascript
// src/proxy.js — handles CORS globally for all /api routes
import { NextResponse } from 'next/server';

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
);

export function proxy(request) {
  const origin = request.headers.get('origin') ?? '';

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  const response = NextResponse.next();
  if (allowedOrigins.has(origin)) {
    Object.entries(getCorsHeaders(origin)).forEach(([k, v]) =>
      response.headers.set(k, v)
    );
  }
  return response;
}

function getCorsHeaders(origin) {
  if (!allowedOrigins.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers':
      'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, X-Guest-ID',
    Vary: 'Origin',
  };
}

export const config = { matcher: ['/api/:path*'] };
```

> **Decision:** Use the `proxy.js` approach for global CORS + security headers, and the route-handler `buildCorsHeaders` helper as a fallback for routes that need custom CORS behavior.

### 3.4 Backend Bootstrap (Project Already Created)

**Status:** ✅ Completed - Backend project exists at `Project2/kitchen-odyssey-backend`

**Project Configuration:**
- Framework: Next.js 16.1.6
- Language: JavaScript (not TypeScript)
- Router: App Router
- Directory: `src/` structure enabled
- Package Manager: npm
- Scripts: `dev`, `build`, `start`, `lint` available
- MongoDB Atlas: ✅ Connected (verified — `sample_mflix`, `admin`, `local` databases accessible)

**Notes:**
- Run backend commands from inside `Project2/kitchen-odyssey-backend`.
- Do not move backend under `Kitchen_Odyssey`; both must remain sibling folders.
- All API routes will be created under `src/app/api/v1/` directory structure.

### 3.5 Next.js 16 API Patterns (Critical)

The following patterns are **mandatory** for all route handler code in the backend. These reflect breaking changes in Next.js 16 that differ from older Next.js documentation.

**1. Route handler `params` is now a Promise (must be `await`ed):**
```javascript
// src/app/api/v1/recipes/[id]/route.js
export async function GET(request, { params }) {
  const { id } = await params; // REQUIRED: params is a Promise in Next.js 16
  // ... use id
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  // ... use id
}
```

**2. `headers()` and `cookies()` from `next/headers` are now async:**
```javascript
import { cookies, headers } from 'next/headers';

export async function GET(request) {
  const cookieStore = await cookies();   // async in Next.js 16
  const headersList = await headers();   // async in Next.js 16

  const token = cookieStore.get('access_token');
  const origin = headersList.get('origin');
  // ...
}
```

**3. Prefer `Response.json()` for simple responses:**
```javascript
// Preferred: standard Web API
export async function GET() {
  return Response.json({ success: true, data: { ... } });
}

// Use NextResponse only when you need cookies, redirects, or rewrites
import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.json({ success: true, data: { ... } });
  response.cookies.set('access_token', token, { httpOnly: true, secure: true });
  return response;
}
```

**4. `after()` API for post-response work (logging, analytics):**
```javascript
import { after } from 'next/server';

export async function POST(request) {
  const result = await processRequest(request);

  // Run after the response is sent to the client
  after(async () => {
    await logActivity({ type: 'recipe', text: `Recipe created: ${result.title}` });
  });

  return Response.json({ success: true, data: result });
}
```

**5. Proxy file (formerly middleware) at `src/proxy.js`:**
```javascript
// src/proxy.js — Next.js 16 renamed middleware.js to proxy.js
// Runs on Node.js runtime (not Edge)
import { NextResponse } from 'next/server';

export function proxy(request) {
  // Security headers, CORS preflight, auth checks, etc.
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
```

> **Migration note:** If upgrading from older Next.js, run `npx @next/codemod@latest middleware-to-proxy .` to auto-rename.

### 3.6 Health Check Endpoint

**Response Format:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-02-17T12:00:00Z",
  "uptime": 12345,
  "database": {
    "status": "connected",
    "latency_ms": 15
  },
  "environment": "production"
}
```

**Endpoint:** `GET /api/v1/health`

### 3.7 Migration Cutover Strategy

**Pre-Migration:**
- Full backup of MongoDB Atlas data
- Export existing localStorage data from test accounts
- Document baseline metrics (response times, error rates)

**Migration Window:**
- Choose low-traffic period
- Enable maintenance mode (if possible)
- Deploy backend
- Run data import script
- Verify data integrity
- Enable `VITE_USE_BACKEND_API=true` for production

**Post-Migration:**
- Monitor error rates for 24 hours
- Keep fallback switch active for 1 week
- Archive migration metrics
- Remove localStorage code paths after 2 stable releases

## 4. Edge Cases

### EC-001: Race Conditions

**Scenario:** User likes a recipe, then quickly unlikes it before the first request completes.

**Impact:** Database state inconsistency; UI shows incorrect state.

**Detection:**
- Multiple concurrent mutations on same resource
- Optimistic update conflicts with server response

**Solution:**
```javascript
// Request deduplication with pending request map
const pendingRequests = new Map();

async function toggleLike(recipeId) {
  const requestKey = `like-${userId}-${recipeId}`;

  // Return existing promise if request in flight
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }

  const request = apiClient.post(`/recipes/${recipeId}/like`);
  pendingRequests.set(requestKey, request);

  try {
    const result = await request;
    return result;
  } finally {
    pendingRequests.delete(requestKey);
  }
}
```

**Testing:**
- Unit test: Simulate rapid toggle with mocked delays
- Integration test: Send concurrent requests and verify final state

### EC-002: Stale Authentication

**Scenario:** User's access token expires while they're viewing a recipe; they try to like it.

**Impact:** Silent failure or confusing 401 error.

**Solution:**
```javascript
// Axios interceptor for automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        await apiClient.post('/auth/refresh');
        // Retry original request with new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

**Testing:**
- Mock expired token response
- Verify refresh token is called
- Verify original request is retried
- Verify redirect on refresh failure

### EC-003: Network Partition During Write

**Scenario:** User submits a recipe, but connection drops before response.

**Impact:** User doesn't know if recipe was created; potential duplicate on retry.

**Solution:**
```javascript
// Idempotency key for duplicate prevention
async function createRecipe(recipeData) {
  const idempotencyKey = `${userId}-${Date.now()}`;

  try {
    const response = await apiClient.post('/recipes', recipeData, {
      headers: { 'X-Idempotency-Key': idempotencyKey }
    });
    return response;
  } catch (error) {
    // Show error with retry option
    if (error.code === 'NETWORK_ERROR') {
      showRetryDialog(() => createRecipe(recipeData));
    }
  }
}
```

**Backend Idempotency:**
```javascript
// Store idempotency keys for 5 minutes
// NOTE: In-memory Map is acceptable for single-process dev/staging.
// For production or multi-instance deployments, replace with a MongoDB
// TTL collection or Redis to survive restarts and share across instances.
const idempotencyCache = new Map();

if (req.headers['x-idempotency-key']) {
  const key = req.headers['x-idempotency-key'];
  if (idempotencyCache.has(key)) {
    return idempotencyCache.get(key); // Return original response
  }
}
```

### EC-004: Guest Mode User Converts

**Scenario:** Guest user views recipes (not tracked), then signs up. Should their pre-signup view history migrate?

**Current Behavior:** Views are lost (no guest tracking per requirements).

**Decision:** This is acceptable behavior. Guest view history is intentionally excluded from analytics.

**Implementation:**
- Clear guest ID from localStorage on signup
- Start fresh view history for new user
- No migration of guest activity to user account

**User Communication:** Consider showing a message: "As a guest, your browsing history wasn't saved. Sign up to track your favorites and history!"

### EC-005: Large Dataset Pagination

**Scenario:** Admin views all users with 10,000+ records.

**Impact:** Memory issues, slow response, browser crash.

**Solution:**
```javascript
// Cursor-based pagination
// PaginationParams: { cursor?: string, limit: number }
// PaginatedResponse: { data: T[], nextCursor?: string, hasMore: boolean, total: number }

// API endpoint
GET /api/v1/admin/users?limit=20&cursor=abc123
```

**Frontend Implementation:**
```javascript
function usePaginatedUsers(limit = 20) {
  const [data, setData] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    const response = await apiClient.get('/admin/users', {
      params: { limit, cursor }
    });

    setData(prev => [...prev, ...response.data]);
    setCursor(response.nextCursor);
    setHasMore(response.hasMore);
  };

  return { data, loadMore, hasMore };
}
```

**Testing:**
- Test with 1000+ records
- Verify memory usage stays constant
- Test infinite scroll behavior

### EC-006: Recipe Image Upload

**Scenario:** User wants to upload their own recipe images.

**Current Design:** Uses Unsplash URLs only.

**Question:** Will the backend support image upload?

**Decision:** Out of scope for v1.0 migration. Keep URL-only approach.

**Future Consideration:**
- Use Cloudinary or similar service
- Add multipart/form-data endpoint
- Validate image size and format
- Generate thumbnails

### EC-007: Concurrent Session Handling

**Scenario:** User is logged in on two devices; one logs out.

**Impact:** Other device should be invalidated or show session expired.

**Solution:**
```javascript
// Token versioning
// User: { id: string, tokenVersion: number } - Increment on full logout

// On logout from specific device
// Invalidate only that device's refresh token

// On logout from all devices
// Increment tokenVersion, invalidating all refresh tokens

// Token validation
if (payload.tokenVersion !== user.tokenVersion) {
  throw new UnauthorizedError('Token invalidated');
}
```

**API Endpoint:**
```javascript
POST /api/v1/auth/logout
// Logout from current device only

POST /api/v1/auth/logout-all
// Logout from all devices
```

### EC-008: Search History Deduplication

**Current Behavior:** `addSearchHistory()` removes duplicates and limits to 10 items per user.

**Edge Case:** What if the API call fails after the client updates the UI optimistically?

**Solution:**
```javascript
// Optimistic update with rollback
async function addSearchHistory(query) {
  // Optimistic update
  const previousHistory = [...searchHistory];
  setSearchHistory(prev => addToHistory(prev, query));

  try {
    await apiClient.post('/search-history', { query });
  } catch (error) {
    // Rollback on failure
    setSearchHistory(previousHistory);
    showError('Failed to save search history');
  }
}
```

**Testing:**
- Mock API failure after optimistic update
- Verify state is rolled back
- Verify user sees error message

### EC-009: Daily Stats Timezone Handling

**Scenario:** User in timezone GMT+7 views a recipe at 11:59 PM, then another at 12:01 AM.

**Impact:** Views may be logged on different days depending on server timezone.

**Solution:**
```javascript
// Store all timestamps in UTC
const timestamp = new Date().toISOString(); // e.g., "2026-02-17T23:59:00Z"

// Aggregate stats based on user's timezone
// User: { id: string, timezone: string } // e.g., "Asia/Bangkok"

// Query daily stats with timezone
GET /api/v1/stats/daily?date=2026-02-17&timezone=Asia/Bangkok
```

**Backend Aggregation:**
```javascript
// Convert UTC timestamp to user timezone for daily aggregation
function getDateInTimezone(utcDate, timezone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(utcDate); // "2026-02-17"
}
```

### EC-010: MongoDB Atlas Free Tier Limits

**Constraints:**
- Shared compute with variable latency under noisy-neighbor load
- Strict free-tier storage quota (validate current quota in Atlas project settings)
- Lower concurrent throughput than paid tiers

**Impact:** Slow queries, connection saturation, or storage pressure can break parity and user experience.

**Status:** ✅ MongoDB Atlas connection verified — databases `sample_mflix`, `admin`, `local` are accessible. The `kitchen_odyssey_dev` database will be auto-created when Mongoose models are first used.

**Solution:**
```javascript
// Mongoose-recommended cached connection pattern for Next.js / serverless
// Prevents connection storms by caching the connection promise (not the resolved value)
import mongoose from 'mongoose';

let cachedConnection = null;

export async function getDb() {
  if (cachedConnection) return cachedConnection;

  // Cache the connection *promise* so concurrent callers share the same connect()
  cachedConnection = mongoose
    .connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME ?? 'kitchen_odyssey_dev',
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE ?? 10),
      minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE ?? 0),
      serverSelectionTimeoutMS: Number(
        process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? 5000
      ),
    })
    .then(() => mongoose);

  await cachedConnection;
  return cachedConnection;
}
```

> **Why `.then(() => mongoose)`?** Caching the *promise* (not the resolved connection) ensures that if two route handlers call `getDb()` simultaneously during a cold start, Mongoose only opens one connection instead of two. This is the official Mongoose pattern for Lambda / serverless environments and applies equally to Next.js API route handlers.

// Use projection + lean + bounded pagination for read-heavy queries
export async function listRecipes(cursor) {
  const query = cursor ? { _id: { $lt: cursor } } : {};

  return Recipe.find(query)
    .select('_id title category difficulty likeCount createdAt')
    .sort({ _id: -1 })
    .limit(20)
    .lean();
}

// Retention: TTL indexes for non-critical collections
// db.activity_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
// db.search_history.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// Quota alerting
export async function checkFreeTierStorage() {
  const stats = await mongoose.connection.db.stats();
  const usageBytes = stats.storageSize ?? 0;
  const quotaBytes = Number(process.env.ATLAS_FREE_TIER_QUOTA_BYTES ?? 0);

  if (quotaBytes > 0 && usageBytes / quotaBytes >= 0.7) {
    alertAdmin('Atlas free-tier storage above 70%');
  }
}
```

**Prevention:**
- Enforce required indexes before enabling `VITE_USE_BACKEND_API=true`.
- Use cursor pagination (never unbounded offset pagination on large collections).
- Use `.select()` projections and `.lean()` for list endpoints.
- Set TTL/retention on `activity_logs` and `search_history`.
- Alert at 70% quota usage and require cleanup/archival before rollout gates can pass.
- Track p95 latency and keep read endpoints below agreed SLO in staging before production cutover.

### EC-011: Duplicate Recipe Creation

**Scenario:** User double-clicks "Create Recipe" button.

**Impact:** Two recipes created with identical data.

**Solution:**
```javascript
// Disable button during submission
const [isSubmitting, setIsSubmitting] = useState(false);

async function handleSubmit(e) {
  e.preventDefault();
  if (isSubmitting) return;

  setIsSubmitting(true);
  try {
    await createRecipe(recipeData);
    navigate('/recipes');
  } finally {
    setIsSubmitting(false);
  }
}

<button disabled={isSubmitting}>
  {isSubmitting ? 'Creating...' : 'Create Recipe'}
</button>
```

**Backend Validation:**
```javascript
// Check for duplicate recipe from same user in last minute
const recentDuplicate = await Recipe.findOne({
  authorId: userId,
  title: recipeData.title,
  createdAt: { $gte: new Date(Date.now() - 60000) }
});

if (recentDuplicate) {
  throw new ConflictError('Duplicate recipe detected');
}
```

### EC-012: Orphaned References on Deletion

**Scenario A — Recipe deletion:** User/admin deletes a recipe that other users have favorited or reviewed.

**Impact:** Orphaned references in users' favorites, reviews pointing to non-existent recipe.

**Scenario B — User deletion (admin):** Admin deletes a user account. The existing `storage.deleteUser()` performs a complex cascade:
1. Delete all recipes authored by the user
2. Remove deleted recipe IDs from ALL other users' `favorites` and `viewedRecipes` arrays
3. Delete all reviews written by the user AND reviews on the user's deleted recipes
4. Clean `daily_stats` entries (remove user ID from `newUsers`, `newContributors`, `activeUsers`; remove views by/for deleted recipes)
5. Clear current user session if the deleted user is logged in

**The backend MUST replicate this full cascade for `DELETE /admin/users/:id`.** Partial cleanup will cause orphaned data and broken UI references.

**Solution:**
```javascript
// Cascade delete recipe
async function deleteRecipe(recipeId) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Delete recipe
    await Recipe.findByIdAndDelete(recipeId, { session });

    // Remove from all users' favorites
    await User.updateMany(
      { favorites: recipeId },
      { $pull: { favorites: recipeId } },
      { session }
    );

    // Delete all reviews for this recipe
    await Review.deleteMany({ recipeId }, { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### EC-013: Special Characters in Search

**Scenario:** User searches for special characters like `$`, `{`, `}` that have meaning in MongoDB queries.

**Impact:** NoSQL injection attack potential.

**Solution:**
```javascript
// Sanitize search input
import { escapeRegExp } from 'lodash';

function sanitizeSearchQuery(query) {
  // Remove MongoDB operators
  let sanitized = query.replace(/\$|{|}|\./g, '');

  // Escape regex special chars for text search
  return escapeRegExp(sanitized);
}

// Use text index for search instead of regex
const results = await Recipe.find({
  $text: { $search: sanitizeSearchQuery(query) }
});
```

## 5. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish migration baseline, target architecture, and dependency gates.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-001 | Create architecture decision record in `Kitchen_Odyssey/plan/adr-frontend-backend-split-1.md` defining boundary: frontend in `Kitchen_Odyssey`, backend in `../kitchen-odyssey-backend`, Atlas as data source. |  |  |
| TASK-002 | Create migration readiness checklist in `Kitchen_Odyssey/plan/migration-readiness-checklist-1.md` with explicit pass/fail gates for Guest Mode, Random Recipe, and design-overhaul dependencies. |  |  |
| TASK-003 | Create compatibility matrix in `Kitchen_Odyssey/plan/compatibility-matrix-localstorage-to-api-1.md` mapping each `src/lib/storage.js` function to target backend endpoint and response shape. |  |  |
| TASK-004 | Define immutable baseline test snapshot (current behavior) in `Kitchen_Odyssey/tests/baseline/` to prove non-regression post-migration. |  |  |

### Implementation Phase 2

- GOAL-002: Scaffold backend service outside frontend folder with deterministic structure.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-005 | Create backend workspace folder `Project2/kitchen-odyssey-backend` with Next.js App Router API project layout (`src/app/api`, `src/lib`, `src/models`, `src/repositories`, `src/services`, `tests`). **Note:** Next.js 16 uses `proxy.js` (at `src/proxy.js` with `src/` structure) instead of a `middlewares` folder. The single `proxy.js` file replaces the old `middleware.js`. | ✅ | 2026-02-17 |
| TASK-006 | Add backend environment templates: `Project2/kitchen-odyssey-backend/.env.example` including `MONGODB_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_AUTH`, `RATE_LIMIT_MAX_WRITE`, `RATE_LIMIT_MAX_READ`, and Mongo pool settings. |  |  |
| TASK-007 | Add backend config modules: `Project2/kitchen-odyssey-backend/src/lib/config.js` with schema validation for all env vars. |  |  |
| TASK-008 | Add backend health check endpoint: `Project2/kitchen-odyssey-backend/src/app/api/v1/health/route.js` returning version, db connectivity, uptime, and dependency status. |  |  |
| TASK-008-A | Add ESLint config to backend workspace with consistent rules for JavaScript. |  |  |
| TASK-008-B | Verify `.gitignore` for backend (node_modules, .env, .next, dist). | ✅ | 2026-02-17 |
| TASK-008-C | Verify development scripts (`dev`, `build`, `start`, `lint`, `test`) in package.json. `test` script still missing — must add before Phase 4. | | |
| TASK-008-D | Add shared CORS helper for Next.js route handlers (including `OPTIONS` preflight handling) with allowlist + credentials support. |  |  |
| TASK-008-E | Install Mongoose (`npm install mongoose`) and add `bcryptjs` (`npm install bcryptjs`) as production dependencies. Remove unused frontend deps (`@tailwindcss/postcss`, `tailwindcss`, `babel-plugin-react-compiler`) from backend. |  |  |
| TASK-008-F | Add `!.env.example` exception to backend `.gitignore` so the environment template file is tracked. |  |  |
| TASK-008-G | Clean up default `create-next-app` frontend files in backend project (`layout.js`, `page.js`, `globals.css`, `favicon.ico`) — backend is API-only and should not serve HTML pages. |  |  |

### Implementation Phase 3

- GOAL-003: Define MongoDB Atlas schema and migration-safe data model.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-009 | Define collection schemas (`users`, `recipes`, `reviews`, `daily_stats`, `activity_logs`, `search_history`) in `Project2/kitchen-odyssey-backend/src/models/*.js` using strict validation. |  |  |
| TASK-010 | Add indexes for performance and uniqueness in `Project2/kitchen-odyssey-backend/src/lib/indexes.js` (email unique, recipe slug/id lookup, activity time-series indexes). |  |  |
| TASK-010-A | Add retention/TTL strategy for non-critical collections (`activity_logs`, `search_history`) and document rollback-safe cleanup policy. |  |  |
| TASK-010-B | Add query budget guardrails (projection, `lean()`, cursor pagination defaults) for Atlas Free-tier readiness. |  |  |
| TASK-011 | Create migration mapping spec file `Kitchen_Odyssey/plan/migration-data-mapping-1.md` with field-by-field transformations. |  |  |
| TASK-012 | Add data import utility `Project2/kitchen-odyssey-backend/scripts/import-localstorage-snapshot.js` supporting idempotent import and dry-run mode. |  |  |
| TASK-013 | Add rollback utility `Project2/kitchen-odyssey-backend/scripts/rollback-import.js` for migration transaction batches. |  |  |

### Implementation Phase 4

- GOAL-004: Implement contract-first backend APIs equivalent to current storage operations.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-014 | Create OpenAPI contract `Project2/kitchen-odyssey-backend/docs/openapi.yaml` covering all endpoints (auth, users, recipes, reviews, stats, activity, search history, random suggestion). |  |  |
| TASK-015 | Implement auth routes in `src/app/api/v1/auth/*/route.js` (login, signup, guest session, logout, refresh, profile). |  |  |
| TASK-016 | Implement recipe routes in `src/app/api/v1/recipes/*/route.js` with CRUD, filtering, pagination, sorting, and role checks. |  |  |
| TASK-017 | Implement interaction routes in `src/app/api/v1/recipes/[id]/like|favorite|reviews/route.js` preserving guest/pending restrictions. |  |  |
| TASK-018 | Implement admin routes in `src/app/api/v1/admin/users/*` and `src/app/api/v1/admin/recipes/*` for moderation operations with pagination. |  |  |
| TASK-019 | Implement random suggestion route `src/app/api/v1/recipes/random-suggestion/route.js` honoring existing quality constraints and guest analytics bypass. |  |  |
| TASK-020 | Implement stats routes: `GET /api/v1/stats/daily`, `GET /api/v1/stats/active-users`, `GET /api/v1/stats/views`. |  |  |
| TASK-021 | Implement activity routes: `GET /api/v1/activity`, `POST /api/v1/activity`. |  |  |
| TASK-022 | Implement search history routes: `GET /api/v1/search-history`, `POST /api/v1/search-history`, `DELETE /api/v1/search-history`. |  |  |
| TASK-023 | Standardize response envelope and error format in `Project2/kitchen-odyssey-backend/src/lib/http/response.js` and `src/lib/http/errors.js`. |  |  |

### Implementation Phase 5

- GOAL-005: Integrate frontend using adapter layer with zero UI behavior breakage.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-024 | Add API client module `Kitchen_Odyssey/src/lib/apiClient.js` with retry, timeout, typed response guards, and request/response interceptors. |  |  |
| TASK-025 | Add storage adapter `Kitchen_Odyssey/src/lib/storageApiAdapter.js` implementing same public signatures as `src/lib/storage.js`. |  |  |
| TASK-026 | Add feature flag config `Kitchen_Odyssey/src/lib/featureFlags.js` with granular flags: `useBackendApi`, `useBackendForAuth`, `useBackendForRecipes`, `useBackendForReviews`. |  |  |
| TASK-027 | Update `Kitchen_Odyssey/src/context/AuthContext.jsx` to source data via adapter while preserving state fields (`user`, `isGuest`, `canInteract`). |  |  |
| TASK-028 | Update pages/components currently reading `storage.js` directly to call adapter layer only (`Home.jsx`, `Search.jsx`, `RecipeDetail.jsx`, `CreateRecipe.jsx`, `Profile.jsx`, admin pages). |  |  |
| TASK-029 | Preserve event bridge in `Kitchen_Odyssey/src/lib/eventsBridge.js` so `favoriteToggled`, `recipeUpdated` continue dispatching and listening unchanged. |  |  |
| TASK-030 | Add fallback on API failure: read-through local cache with warning telemetry in `storageApiAdapter.js`. |  |  |
| TASK-031 | Implement optimistic updates for like/favorite toggle with rollback on failure to maintain UI responsiveness. |  |  |
| TASK-032 | Add request deduplication to prevent duplicate API calls for same resource during rapid interactions. |  |  |

### Implementation Phase 6

- GOAL-006: Align migration with design-overhaul plan execution safety.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-033 | Create cross-plan dependency map in `Kitchen_Odyssey/plan/dependency-map-design-overhaul-and-backend-migration-1.md` linking `design-overhaul-1.md` tasks to API readiness milestones. |  |  |
| TASK-034 | Define API contracts required by design-overhaul screens (auth banners, pending restrictions, admin table pagination/filtering, nutrition panel payloads). |  |  |
| TASK-035 | Add UI-state contract tests ensuring all redesign states remain representable by backend data (empty/loading/error/restricted/success). |  |  |
| TASK-036 | Gate design-overhaul phase execution on backend contract stability tag `api-contract-v1` documented in `Kitchen_Odyssey/plan/release-gates-1.md`. |  |  |

### Implementation Phase 7

- GOAL-007: Implement security, reliability, and observability controls.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-037 | Add auth and role guard utilities for route handlers in `Project2/kitchen-odyssey-backend/src/lib/auth/**` with JWT validation. |  |  |
| TASK-038 | Add request validation utilities in `Project2/kitchen-odyssey-backend/src/lib/validation/**` with schema-per-route definitions. |  |  |
| TASK-039 | Add rate limiting and abuse prevention utilities in `Project2/kitchen-odyssey-backend/src/lib/security/rateLimit.js` for auth/write endpoints. |  |  |
| TASK-040 | Add CSRF protection checks for state-changing route handlers. |  |  |
| TASK-041 | Add NoSQL injection prevention in all MongoDB query builders. |  |  |
| TASK-042 | Add framework-native security headers via `proxy.js` (Next.js 16 proxy, formerly middleware) and route response headers. The proxy file lives at `src/proxy.js` and exports `export function proxy(request)`. Use `npx @next/codemod@latest middleware-to-proxy .` if migrating from older Next.js middleware. |  |  |
| TASK-043 | Add request size limits to prevent DoS via large payloads. |  |  |
| TASK-044 | Add structured logging and correlation IDs in `src/lib/observability/logger.js` and request context middleware. |  |  |
| TASK-045 | Add metrics endpoints and counters in `src/app/api/v1/metrics/route.js` including error rates, latency, and DB query timings. |  |  |

### Implementation Phase 8

- GOAL-008: Execute full-spectrum testing with exhaustive edge-case coverage.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-046 | Add backend unit tests for repositories/services in `Project2/kitchen-odyssey-backend/tests/unit/**` (CRUD, auth rules, validation, failure paths). |  |  |
| TASK-047 | Add backend integration tests in `Project2/kitchen-odyssey-backend/tests/integration/**` using test database and seeded fixtures. |  |  |
| TASK-048 | Add API contract tests in `Project2/kitchen-odyssey-backend/tests/contract/**` to verify OpenAPI conformance and error contracts. |  |  |
| TASK-049 | Extend frontend Playwright tests in `Kitchen_Odyssey/tests/**` to run against API-backed mode and localStorage-backed mode for parity. |  |  |
| TASK-050 | Add migration parity test suite `Kitchen_Odyssey/tests/migration-parity.spec.js` validating identical behavior pre/post backend switch. |  |  |
| TASK-051 | Add edge-case suite `Kitchen_Odyssey/tests/edge-cases.spec.js` covering invalid payloads, race conditions, stale sessions, network failures, large datasets, and all documented edge cases. |  |  |
| TASK-052 | Add guest analytics bypass tests for random suggestion and view tracking consistency in `tests/guest-analytics.spec.js` and backend integration equivalents. |  |  |
| TASK-053 | Add performance tests comparing baseline vs migrated mode (response latency, page render stability, event propagation latency). |  |  |
| TASK-054 | Add accessibility regression tests to ensure migration does not alter keyboard/focus/ARIA behavior from current + overhaul states. |  |  |
| TASK-055 | Add security tests: unauthorized access, role bypass, payload injection, token tampering, CSRF attempts. |  |  |
| TASK-056 | Add concurrency tests for race conditions (simultaneous like/favorite/review mutations). |  |  |

### Implementation Phase 9

- GOAL-009: Perform staged rollout with rollback guarantees.

| Task | Description | Completed | Date |
| -------- | --------------------- | --------- | ---------- |
| TASK-057 | Deploy backend to Azure VM target environment with Atlas connection and run smoke checks (`/api/v1/health`, auth, recipes, admin). |  |  |
| TASK-058 | Configure production environment variables with secure `JWT_SECRET`, `ALLOWED_ORIGINS`, and Atlas pool limits tuned for free tier. |  |  |
| TASK-059 | Enable `VITE_USE_BACKEND_API=true` for internal test cohort only; monitor errors and parity dashboards for 72 hours. |  |  |
| TASK-060 | Execute full regression matrix (all user roles + all major flows + design-overhaul UI states) before broad enablement. |  |  |
| TASK-061 | Enable global API mode, keep rollback switch active (`VITE_USE_BACKEND_API=false` option) for one release cycle. |  |  |
| TASK-062 | Archive rollout metrics in `Kitchen_Odyssey/plan/rollout-report-1.md` including error rates, performance, user feedback. |  |  |
| TASK-063 | Retire localStorage source-of-truth path only after two consecutive stable release windows and all parity checks pass. |  |  |

## 6. API Contract Overview

### 6.1 Endpoint Summary

All endpoints follow the pattern: `/api/v1/{resource}/{action}`

| Resource | Endpoints | Description |
|----------|-----------|-------------|
| **Auth** | `POST /auth/login`, `POST /auth/signup`, `POST /auth/logout`, `POST /auth/logout-all`, `POST /auth/refresh`, `GET /auth/me` | Authentication and session management |
| **Users** | `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id` | User CRUD operations |
| **Recipes** | `GET /recipes`, `GET /recipes/:id`, `POST /recipes`, `PATCH /recipes/:id`, `DELETE /recipes/:id` | Recipe CRUD with filtering/pagination |
| **Interactions** | `POST /recipes/:id/like`, `POST /recipes/:id/favorite`, `GET /recipes/:id/reviews`, `POST /recipes/:id/reviews`, `DELETE /reviews/:id` | Likes, favorites, reviews |
| **Admin** | `GET /admin/users`, `PATCH /admin/users/:id/status`, `DELETE /admin/users/:id`, `GET /admin/recipes`, `PATCH /admin/recipes/:id/status` | Admin operations |
| **Stats** | `GET /stats/daily`, `GET /stats/active-users`, `GET /stats/views` | Dashboard metrics |
| **Activity** | `GET /activity`, `POST /activity` | Activity feed |
| **Search History** | `GET /search-history`, `POST /search-history`, `DELETE /search-history` | Search history management |
| **Random** | `GET /recipes/random-suggestion` | Random recipe with quality filters |

### 6.2 Response Envelope

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-17T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {},
    "timestamp": "2026-02-17T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "nextCursor": "abc123",
    "hasMore": true,
    "limit": 20,
    "total": 150
  }
}
```

### 6.3 Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PATCH, DELETE |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 429 | Too many requests (rate limit) |
| 500 | Internal server error |

## 7. Testing Strategy

### 7.1 Dual-Mode Testing

Tests must run in two modes to ensure parity:

```javascript
// tests/migration-parity.spec.js
import { test } from '@playwright/test';

const modes = [
  { name: 'localStorage', useBackendApi: false },
  { name: 'backend', useBackendApi: true }
];

for (const mode of modes) {
  test.describe(`Migration parity: ${mode.name}`, () => {
    test.use({
      storageState: mode.useBackendApi
        ? 'tests/auth/backend-user.json'
        : 'tests/auth/local-user.json'
    });

    test('recipe list displays same recipes', async ({ page }) => {
      await page.goto('/');
      const recipeCount = await page.locator('.recipe-card').count();
      // Assert same count across modes
      expect(recipeCount).toBeGreaterThan(0);
    });

    test('like toggle behavior is identical', async ({ page }) => {
      await page.goto('/recipes/recipe-1');
      const likeButton = page.locator('[data-testid="like-button"]');

      const initialCount = await likeButton.textContent();
      await likeButton.click();
      const afterClick = await likeButton.textContent();

      expect(initialCount).not.toBe(afterClick);
    });
  });
}
```

### 7.2 Test Execution Order

**Week 1: Backend Foundation**
1. Unit tests (repositories, services)
2. Integration tests (API routes)
3. Contract tests (OpenAPI validation)

**Week 2: Frontend Integration**
4. Migration parity tests (localStorage vs API)
5. Edge case suite (race conditions, network failures)
6. Guest analytics tests
7. Performance tests

**Week 3: Full System**
8. End-to-end Playwright tests
9. Security tests
10. Accessibility regression tests
11. Cross-browser tests

### 7.3 Test Environment Setup

**Local MongoDB for Testing:**
```bash
# Use separate database for tests
MONGODB_URI=mongodb+srv://.../kitchen_odyssey_test
```

**Seeded Fixtures:**
- 10 users (various roles and statuses)
- 20 recipes (published, pending, rejected)
- 50 reviews
- Mixed activity logs

**Test Data Management:**
- Reset database before each test run
- Use transactions for isolation
- Cleanup after test completion

## 8. Test Matrix

- **TEST-001**: Baseline snapshot tests (current localStorage behavior) must pass before migration starts.
- **TEST-002**: API unit tests for every repository/service function: success + failure + boundary cases.
- **TEST-003**: API integration tests for every route: role matrix (`guest`, `pending`, `active`, `admin`) + schema validation.
- **TEST-004**: Contract tests: every endpoint response and error payload matches `openapi.yaml`.
- **TEST-005**: Frontend parity tests in dual-mode (`VITE_USE_BACKEND_API=false|true`) with identical expected outcomes.
- **TEST-006**: Event consistency tests for `favoriteToggled`, `recipeUpdated`, and dependent UI listeners.
- **TEST-007**: Data edge-case tests: empty datasets, single records, 100+ records, long strings, special chars, malformed fields.
- **TEST-008**: Concurrency tests: simultaneous like/favorite/review mutations and conflict resolution expectations.
- **TEST-009**: Network resilience tests: timeout, 429, 500, offline fallback, retry/backoff correctness.
- **TEST-010**: Security tests: unauthorized access, role bypass attempts, payload injection, token tampering, CSRF attempts.
- **TEST-011**: Guest-mode analytics bypass tests (recipe views, daily stats, activeUsers) with random-suggestion path.
- **TEST-012**: Design-overhaul compatibility tests for all UI states (loading/empty/error/restricted/success) across 13 screens.
- **TEST-013**: Accessibility regression tests for keyboard flow, focus handling, ARIA labels, and modal behaviors.
- **TEST-014**: Cross-browser tests (Chromium, Firefox, WebKit) for migrated mode.
- **TEST-015**: Performance tests: API p95 latency, page interactive timing, and no CLS regressions due to async data.
- **TEST-016**: Migration script tests: dry-run, idempotency, partial-failure rollback, and post-import integrity checks.
- **TEST-017**: Release gate: zero critical bugs, zero failing parity tests, zero failing security tests, and no unresolved high-severity warnings.
- **TEST-018**: Race condition tests: rapid like/unlike toggles, concurrent recipe creation, duplicate submission prevention.
- **TEST-019**: Token refresh tests: expired access token refresh flow, multi-device logout behavior.
- **TEST-020**: Pagination tests: large dataset handling, cursor-based navigation, infinite scroll behavior.
- **TEST-021**: Timezone tests: daily stats aggregation across timezones, UTC storage correctness.
- **TEST-022**: Storage limit tests: MongoDB Atlas free-tier quota monitoring, TTL/retention behavior, and archival triggers.

## 9. Risks & Assumptions

### Risks

- **RISK-001**: Behavioral drift between localStorage and API contracts.
  - Mitigation: mandatory compatibility matrix + parity tests before rollout.
- **RISK-002**: Role/permission regressions for pending or guest users.
  - Mitigation: explicit role matrix tests on every restricted endpoint and UI flow.
- **RISK-003**: Event-driven UI desynchronization after async API integration.
  - Mitigation: event bridge and event consistency suite.
- **RISK-004**: Atlas free-tier limits affecting response time under load.
  - Mitigation: indexes, query optimization, capped test datasets, monitoring alerts.
- **RISK-005**: Design-overhaul dependencies blocked by unstable API contracts.
  - Mitigation: release gates and cross-plan dependency map.
- **RISK-006**: Race conditions in concurrent user interactions.
  - Mitigation: request deduplication, optimistic updates with rollback, idempotency keys.
- **RISK-007**: NoSQL injection vulnerabilities in MongoDB queries.
  - Mitigation: input sanitization, parameterized queries, validation middleware.
- **RISK-008**: Token refresh failures causing poor user experience.
  - Mitigation: graceful fallback, clear error messages, smooth redirect to login.
- **RISK-009**: CORS misconfiguration blocking API requests in production.
  - Mitigation: environment-specific CORS config, pre-deployment smoke tests.
- **RISK-010**: Data migration failures or corruption.
  - Mitigation: idempotent import script, transaction support, rollback capability, dry-run mode.
- **RISK-011**: SameSite cookie incompatibility in local development (cross-origin: localhost:5173 vs localhost:3000).
  - Mitigation: use `SameSite=Lax` in development or configure Vite dev proxy to unify origin.
- **RISK-012**: Plaintext password migration. Existing localStorage stores passwords in plaintext; importing them without hashing would be a critical security vulnerability.
  - Mitigation: import script must bcrypt-hash all passwords during import. Add SEC-011 requirement.

### Assumptions

- **ASSUMPTION-001**: The `Project2` parent folder is writable for creating `kitchen-odyssey-backend`.
- **ASSUMPTION-002**: Current localStorage schema can be exported deterministically for migration import.
- **ASSUMPTION-003**: Existing Playwright coverage can be extended without replacing current test architecture.
- **ASSUMPTION-004**: No mandatory requirement exists to migrate frontend from Vite to Next.js frontend runtime.
- **ASSUMPTION-005**: Guest mode will continue using `localStorage` for guest ID persistence.
- **ASSUMPTION-006**: MongoDB Atlas free-tier quota is sufficient for initial usage when retention and archival controls are enabled.
- **ASSUMPTION-007**: Azure VM remains the primary production deployment target.
- **ASSUMPTION-008**: All timestamps will be stored in UTC for consistency.
- **ASSUMPTION-009**: Image upload is out of scope for v1.0 migration (URL-only approach).
- **ASSUMPTION-010**: Guest view history will not migrate to user accounts on signup.


