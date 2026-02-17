# Migration Readiness Checklist

## Pre-Migration Gates

### Infrastructure
- [ ] MongoDB Atlas cluster provisioned and accessible
- [ ] Backend project (`kitchen-odyssey-backend`) bootstrapped with dependencies
- [ ] `.env.example` created with all required variables
- [ ] Health endpoint (`GET /api/v1/health`) responds with DB status
- [ ] CORS configured for dev (`localhost:5173`) and production origins

### Data Layer
- [ ] Mongoose schemas defined for all 6 collections (users, recipes, reviews, daily_stats, activity_logs, search_history)
- [ ] Required indexes and uniqueness constraints applied
- [ ] Import utility can seed MongoDB from localStorage export (idempotent, dry-run supported)
- [ ] Password hashing applied during import (no plaintext in DB)
- [ ] Rollback utility can reverse a migration batch

### Authentication
- [ ] Login/signup endpoints return valid JWT tokens in HttpOnly cookies
- [ ] Refresh token rotation works correctly
- [ ] `GET /auth/me` returns current user from token
- [ ] Logout clears cookies and invalidates session
- [ ] Guest mode continues to work without authentication

### Core API
- [ ] Recipe CRUD endpoints match `storage.js` behavior
- [ ] User CRUD endpoints with ownership/admin checks
- [ ] Review CRUD with one-per-user-per-recipe constraint
- [ ] Like/Favorite toggle endpoints are idempotent
- [ ] View recording respects guest analytics bypass
- [ ] Random suggestion preserves quality constraints (>=5 likes, >=1 review)

### Frontend Integration
- [ ] `apiClient.js` handles timeout, retry, and auth interceptors
- [ ] `storageApiAdapter.js` mirrors all `storage.js` public signatures
- [ ] `VITE_USE_BACKEND_API` flag switches between localStorage and API mode
- [ ] `AuthContext.jsx` works with adapter without state semantics changes
- [ ] Event bridge (`favoriteToggled`, `recipeUpdated`) preserved

### Guest Mode Compatibility
- [ ] Guest ID (`kitchen_odyssey_guest_id`) remains client-local
- [ ] Guest views excluded from all metrics
- [ ] Guest search history works (keyed by `guest:{id}`)
- [ ] Random recipe suggestion accessible without authentication

### Design Overhaul Compatibility
- [ ] API responses provide all fields needed by current UI components
- [ ] Image URL fields (`imageUrl`, `avatarUrl`) populated correctly
- [ ] Pagination metadata compatible with Home batch loading (limit=30)
- [ ] Sort options (`trending`, `newest`, `rating`, `title`) work server-side

### Security
- [ ] Rate limiting on auth and write endpoints
- [ ] Input validation on all write endpoints
- [ ] NoSQL injection defenses in query construction
- [ ] CSRF protection on state-changing routes
- [ ] Security headers configured in proxy.js
- [ ] Request payload size limits enforced

### Testing
- [ ] Backend unit tests for repositories/services pass
- [ ] Backend integration tests against seeded test DB pass
- [ ] API contract tests validate response schemas
- [ ] Playwright E2E tests pass in both localStorage and API modes
- [ ] No critical security test failures

## Release Gate
All checkboxes above must be checked before enabling `VITE_USE_BACKEND_API=true` in production.
