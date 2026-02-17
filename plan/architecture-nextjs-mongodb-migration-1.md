---
goal: Migrate Kitchen Odyssey from frontend-only localStorage architecture to split Frontend + Next.js Backend + MongoDB Atlas while preserving existing behavior and design-overhaul compatibility
last_updated: 2026-02-17
revision_notes: >
  Rev 7 (2026-02-17): End-to-end verification pass completed for Phase 1 through Phase 6.
  Updated task status table to evidence-based DONE/PARTIAL/PENDING marks. Fixed remaining
  frontend lint blockers (Home toast wiring) and backend auth cookie tests for access+refresh+csrf.
  Rev 6 (2026-02-18): Verified against Next.js 16.1.6 documentation via Context7. Added critical
  Next.js 16 patterns: Promise-based params with await, async headers/cookies. All route handler
  patterns validated against current docs. Confirmed proxy.js naming convention.
  Rev 5 (2026-02-17): Added TASK-008-H (MongoDB connection utility), TASK-016-A
  (user management routes), TASK-016-B (deletion cascade logic). Expanded TASK-017
  scope to include view recording and rating endpoints.
  Rev 4 (2026-02-17): Reduced to implementation-critical content only. Removed embedded
  testing strategy and matrix. Testing scope moved to
  `plan/architecture-nextjs-mongodb-migration-testing-1.md`.
---

# Introduction

This plan defines the implementation path for migrating Kitchen Odyssey from localStorage-backed data to a split architecture:
- Frontend: `Project2/Kitchen_Odyssey` (React + Vite)
- Backend: `Project2/kitchen-odyssey-backend` (Next.js 16.1.6, JavaScript, App Router, `src/` structure)
- Database: MongoDB Atlas Free Tier

All testing execution details were extracted to `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-testing-1.md`.

## 1. Non-Negotiables

- Preserve all current user-facing behavior while replacing localStorage as source of truth.
- Keep frontend and backend as separate deployable projects.
- Keep backend path exactly `Project2/kitchen-odyssey-backend` (kebab-case only).
- Use API versioning under `/api/v1/*`.
- Use `VITE_USE_BACKEND_API` as the rollout switch.
- Keep Guest Mode and Random Recipe Suggestion behavior intact.
- Preserve event semantics (`favoriteToggled`, `recipeUpdated`) through adapter/event bridge.
- Enforce role restrictions:
  - Admin cannot like, favorite, or review recipes.
  - Non-published recipes are visible only to owner and admin.
- Keep frontend sort model aligned across Discover/Search: `trending`, `newest`, `rating`, `title`.
- `GET /recipes` default `limit` is `30` to match Home batch loading.
- Hash all passwords with bcrypt before persistence (including imported localStorage users).
- Atlas Free Tier constraints are mandatory: connection pooling, projection + `lean()`, pagination, retention/TTL.

## 2. Target Architecture

```text
React/Vite Frontend (Kitchen_Odyssey)
  -> Adapter (storageApiAdapter.js)
  -> API client (apiClient.js)
  -> Next.js Backend (/api/v1/*, kitchen-odyssey-backend)
  -> Repository/Service layer
  -> MongoDB Atlas
```

Boundary rules:
- Frontend keeps current page/component structure unless API integration requires targeted edits.
- Backend owns persistence, validation, auth, and moderation/business rules.
- Frontend may use read-through fallback cache only as controlled resilience behavior, not as source of truth after cutover.

## 3. Runtime and Security Baseline

### 3.1 Authentication Model

- Access token: short-lived HttpOnly cookie.
- Refresh token: HttpOnly cookie, server-side revocation support.
- Token payload includes `tokenVersion` to support global logout/logout-all.
- Guest sessions remain unauthenticated and use `kitchen_odyssey_guest_id` local persistence.

### 3.2 Environment Baseline

Backend (`.env.example` must exist and be tracked):
- `MONGODB_URI`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_AUTH`
- `RATE_LIMIT_MAX_WRITE`
- `RATE_LIMIT_MAX_READ`
- Atlas pool settings (`maxPoolSize`, `minPoolSize`, timeout values)
- **Image Storage (Local Filesystem on Azure VM):**
  - `IMAGE_UPLOAD_DIR` (absolute path, e.g., `/var/www/kitchen-odyssey-backend/uploads`)
  - `IMAGE_PUBLIC_URL_BASE` (base URL for serving images, e.g., `https://backend-domain.com/uploads`)
  - `IMAGE_MAX_SIZE_BYTES` (default: 5MB)
  - `IMAGE_ALLOWED_TYPES` (default: `image/jpeg,image/png,image/webp`)
  - `IMAGE_THUMBNAIL_DIR` (subdirectory for thumbnails, e.g., `/thumbnails`)

Frontend:
- `VITE_USE_BACKEND_API`
- `VITE_API_BASE_URL`

### 3.3 Next.js 16 Backend Patterns

- Use route handlers in `src/app/api/v1/**/route.js` with `export async function GET/POST/DELETE/PATCH` signatures.
- **Dynamic route params are Promises in Next.js 16**: Use `{ params }: { params: Promise<{ id: string }> }` and `await params` to extract values.
- Use `src/proxy.js` (not `middleware.js`) for framework-level request controls/headers.
- Use cached Mongoose connection utility; do not open a new connection per request.
- Keep backend API-only. Remove unneeded default UI scaffold files.
- **Async headers/cookies**: Use `await headers()` and `await cookies()` for request context (not synchronous access).

## 4. Data Migration Scope

Target collections:
- `users`
- `recipes`
- `reviews`
- `daily_stats`
- `activity_logs`
- `search_history`

Migration decisions:
- `kitchen_odyssey_current_user` is not migrated as persistent data.
- `kitchen_odyssey_guest_id` remains local-only for guest continuity.
- Imported user passwords from localStorage plaintext must be hashed during import.
- Timestamps stored in UTC.
- Add deletion cascade handling to prevent orphaned references.

Field-level mapping details are maintained in `Kitchen_Odyssey/docs/migration-data-mapping-1.md`.

## 5. Implementation Phases

### Phase 1: Planning Artifacts

| Task | Description | Status |
| --- | --- | --- |
| TASK-001 | Create ADR for frontend/backend split and Atlas data source decision. | DONE |
| TASK-002 | Create migration readiness checklist with pass/fail gates for Guest Mode, Random Recipe, and design-overhaul dependencies. | DONE |
| TASK-003 | Create compatibility matrix mapping each `src/lib/storage.js` function to API endpoint/shape. | DONE |

### Phase 2: Backend Bootstrap

| Task | Description | Status |
| --- | --- | --- |
| TASK-005 | Confirm backend workspace and API project layout at `Project2/kitchen-odyssey-backend`. | DONE |
| TASK-006 | Add backend `.env.example` template with required variables. | DONE |
| TASK-007 | Add `src/lib/config.js` with env schema validation. | DONE |
| TASK-008 | Add `GET /api/v1/health` route with version, uptime, DB status. | DONE |
| TASK-008-A | Add ESLint config for backend JavaScript. | DONE |
| TASK-008-B | Verify backend `.gitignore` baseline. | DONE |
| TASK-008-C | Add backend `test` script in `package.json`. | DONE |
| TASK-008-D | Add shared CORS helper for route handlers (`OPTIONS` + allowlist + credentials). | DONE |
| TASK-008-E | Install `mongoose` and `bcryptjs`; remove backend-unused frontend deps. | DONE |
| TASK-008-F | Ensure `!.env.example` is present in backend `.gitignore`. | DONE |
| TASK-008-G | Remove default create-next-app UI files from backend (API-only). | DONE |
| TASK-008-H | Add cached MongoDB connection utility (`src/lib/db.js`) with pooling settings from env. Prerequisite for all database operations. | DONE |

### Phase 3: Data Model and Migration Scripts

| Task | Description | Status |
| --- | --- | --- |
| TASK-009 | Define Mongoose schemas for core collections with strict validation. | DONE |
| TASK-009-A | Add image metadata fields to User schema (`avatar`, `avatarUrl`, `avatarStoragePath`). | DONE |
| TASK-009-B | Add image metadata fields to Recipe schema (`image`, `imageUrl`, `imageStoragePath`, `imageThumbnailUrl`). | DONE |
| TASK-010 | Add required indexes and uniqueness constraints. | DONE |
| TASK-010-A | Add TTL/retention policy for non-critical collections. | PARTIAL |
| TASK-010-B | Add query-budget guardrails (projection, `lean()`, cursor defaults). | PARTIAL |
| TASK-011 | Finalize migration mapping document. | DONE |
| TASK-012 | Add idempotent import utility with dry-run mode. | DONE |
| TASK-013 | Add rollback utility for migration batches. | DONE |

### Phase 4: API Surface Implementation

| Task | Description | Status |
| --- | --- | --- |
| TASK-014 | Maintain OpenAPI contract (`docs/openapi.yaml`) aligned with implementation. | DONE |
| TASK-015 | Implement auth routes (`login`, `signup`, `guest-session`, `logout`, `logout-all`, `refresh`, `profile`). | DONE |
| TASK-015-A | Implement image upload utility for local filesystem (`src/lib/storage/imageUpload.js`) with file validation, size limits, local directory management, and thumbnail generation using Sharp library. Configure Next.js to serve uploaded files via `public/uploads` or API route proxy at `/uploads/*`. **Security:** magic byte validation, filename sanitization (prevent path traversal), set secure file permissions (644), validate image dimensions (prevent decompression bombs). | DONE |
| TASK-016 | Implement recipe routes with unified sorting and pagination defaults. | DONE |
| TASK-016-A | Implement user management routes (`GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`) with self-access and admin access patterns. Required by Profile.jsx and `updateProfile()`. | DONE |
| TASK-016-B | Implement deletion cascade logic for user and recipe deletions. User deletion must cascade across recipes, reviews, favorites references, daily_stats, and activity_logs. Recipe deletion must cascade across reviews and user favorites. | DONE |
| TASK-016-C | Implement image cleanup on cascade (delete files from local filesystem when user/recipe deleted). Use `fs.unlink` with proper error handling for missing files. | DONE |
| TASK-017 | Implement interaction routes (`like`, `favorite`, `reviews`, `POST /recipes/:id/view` with guest analytics bypass, `GET /recipes/:id/rating`) with role restrictions. | DONE |
| TASK-017-A | Implement image upload endpoints: `POST /upload/recipe-image` (multipart/form-data), `POST /upload/user-avatar`. Returns storage metadata including URL and CDN path. | DONE |
| TASK-017-B | Implement image deletion endpoint: `DELETE /upload/image/:storagePath` for cleanup during updates. | DONE |
| TASK-017-C | Implement input sanitization middleware for XSS prevention (sanitize user-generated text content: titles, descriptions, comments, search queries). Use validator.js or similar. | DONE |
| TASK-017-D | Implement secure error response handler that sanitizes error messages before sending to clients (hide stack traces, internal paths, DB schema details). | DONE |
| TASK-018 | Implement admin moderation routes for users/recipes. | DONE |
| TASK-019 | Implement random suggestion route preserving existing quality constraints. | DONE |
| TASK-020 | Implement stats routes returning real computed data expected by `AdminStats.jsx`. | DONE |
| TASK-021 | Implement activity routes (`GET`, `POST`). | DONE |
| TASK-022 | Implement search history routes (`GET`, `POST`, `DELETE`). | DONE |
| TASK-023 | Standardize response/error envelope utilities. | DONE |

### Phase 5: Frontend Integration

| Task | Description | Status |
| --- | --- | --- |
| TASK-024 | Add `src/lib/apiClient.js` with timeout, retry, and interceptors. | DONE |
| TASK-025 | Add `src/lib/storageApiAdapter.js` matching `storage.js` public signatures. | DONE |
| TASK-025-A | Add image upload helper in `src/lib/imageUpload.js` with progress tracking, preview generation, and error handling. | DONE |
| TASK-026 | Add `src/lib/featureFlags.js` and runtime toggles. | DONE |
| TASK-026-A | Add reusable `ImageUpload` component in `src/components/ui/ImageUpload.jsx` with drag-and-drop, preview, and validation feedback. **UX requirements:** upload progress bar, file size/type validation display, drag-over visual feedback, thumbnail preview after selection, clear/remove button, error retry option. | DONE |
| TASK-027 | Update `AuthContext.jsx` to use adapter while preserving state semantics. | DONE |
| TASK-028 | Update storage consumers to call adapter only (Home/Search/Recipe/Admin/Profile/etc.). | DONE |
| TASK-028-A | Update recipe create/edit forms to use `ImageUpload` component for recipe images. | DONE |
| TASK-028-B | Update profile edit form to use `ImageUpload` component for avatar upload. | DONE |
| TASK-029 | Preserve event bridge compatibility for existing UI listeners. | DONE |
| TASK-029-A | Add consistent error boundary components with user-friendly error messages and retry buttons. | DONE |
| TASK-029-B | Add loading skeleton components for async data loading states (recipes list, user profile, admin dashboard). | DONE |
| TASK-029-C | Validate frontend component compatibility with backend API responses. Test critical components (RecipeCard, UserProfile, AdminStats, CreateRecipeForm) with actual API payloads to ensure data shape matches component expectations. | PARTIAL |
| TASK-030 | Add read-through fallback behavior for recoverable API failures. | DONE |
| TASK-031 | Add optimistic updates with rollback for like/favorite toggles. | DONE |
| TASK-032 | Add request deduplication for rapid interactions. | DONE |

### Phase 6: Security and Observability Hardening

| Task | Description | Status |
| --- | --- | --- |
| TASK-033 | Add auth/role guard utilities in backend auth layer. | DONE |
| TASK-034 | Add per-route request validation utilities. | DONE |
| TASK-034-A | Add input validation schemas for all user inputs (email, usernames, recipe fields, search queries). Use Joi or similar with whitelist approach. | PARTIAL |
| TASK-035 | Add auth/write-focused rate limiting. | DONE |
| TASK-036 | Add CSRF protections for state-changing operations. | DONE |
| TASK-036-A | Configure CORS middleware with strict allowlist from `ALLOWED_ORIGINS` env var. Validate Origin header on all requests. | PARTIAL |
| TASK-037 | Add NoSQL injection defenses in query builders. | PARTIAL |
| TASK-038 | Add security headers via `src/proxy.js` and route responses. | DONE |
| TASK-039 | Add request payload size limits. | DONE |
| TASK-040 | Add structured logging + correlation IDs. | PARTIAL |
| TASK-041 | Add metrics endpoint/counters for latency, error rate, and DB timing. | PENDING |

### Phase 7: Deployment and Cutover

| Task | Description | Status |
| --- | --- | --- |
| TASK-042 | Deploy backend to Azure VM (Linux) and configure: Node.js runtime, PM2 process manager, nginx reverse proxy, Let's Encrypt SSL, firewall rules, and image upload directory permissions. Run smoke checks (`health`, auth, recipes, admin, image upload). |  |
| TASK-042-A | Configure nginx to serve uploaded images from local filesystem (`/uploads/*` routes) with proper caching headers and security headers. |  |
| TASK-042-B | Set secure file permissions on upload directories (644 for files, 755 for directories) and configure nginx to run as non-root user with read-only access to uploads. |  |
| TASK-043 | Configure production secrets/origins and Atlas pool limits. |  |
| TASK-043-A | Set up automated backup for image upload directory on Azure VM (rsync to backup location or Azure Blob Storage backup). |  |
| TASK-044 | Enable `VITE_USE_BACKEND_API=true` for internal cohort and monitor telemetry. |  |
| TASK-045 | Enable global API mode after release-gate pass from testing plan. |  |
| TASK-046 | Archive rollout metrics in `Kitchen_Odyssey/plan/rollout-report-1.md`. |  |
| TASK-047 | Retire localStorage source-of-truth only after stable release windows and gate pass. |  |

## 6. Critical Edge Cases to Preserve

- Rapid like/favorite toggles must remain idempotent and eventually consistent.
- Stale tokens and multi-device logout-all must invalidate sessions reliably.
- Partial write/network failures must not duplicate mutations (idempotency strategy required).
- Large recipe datasets must remain responsive through paging/cursor strategy.
- Owner must read own pending/rejected recipes; public cannot.
- Admin must be blocked from interaction endpoints.
- Daily stats must aggregate correctly across user timezones (UTC storage baseline).
- Atlas quota pressure must not degrade core read/write paths (guardrails + retention).
- User or recipe deletion must clean dependent references (favorites/reviews/activity pointers).
- **Image Upload Edge Cases:**
  - Large image uploads must fail fast with clear error messages (size limit validation).
  - Invalid file types must be rejected before upload (MIME type + magic number validation).
  - Failed uploads must not leave orphaned files on local filesystem (transactional cleanup with temp file pattern).
  - Concurrent image updates must handle race conditions (last-write-wins with cleanup of stale images).
  - Image processing failures must not block recipe/user creation (graceful fallback to default/avatar placeholder).
  - Network interruptions during upload must provide resume/retry guidance or clear failure state.
  - Disk space exhaustion on Azure VM must be monitored and handled gracefully.
  - File permission issues on Linux filesystem must be validated on startup.
  - Image serving must handle missing files (404 with placeholder fallback).

## 7. Risks and Assumptions

### Risks

- Data migration can introduce corruption if mapping/validation is bypassed.
- Contract drift between frontend adapter and backend route payloads can cause UI regressions.
- Atlas Free Tier resource limits can degrade reliability without strict query discipline.
- CORS/cookie policy misconfiguration can break auth in local and production environments.

### Assumptions

- Existing localStorage schema can be exported deterministically.
- Frontend can consume adapter-backed responses without structural redesign.
- Backend remains JavaScript-first (no TypeScript migration in this phase).
- Backend will be deployed to Azure VM (Linux) with local filesystem image storage.
- Image upload/storage will use local filesystem with Next.js static file serving via `/public/uploads` or API route proxy.
- Existing URL-based images in localStorage will be preserved and migrated as-is.

## 8. Testing Plan Split

Testing work was intentionally removed from this architecture plan.

Authoritative testing plan:
- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-testing-1.md`

Testing tasks moved there include:
- TASK-004, TASK-046, TASK-046-A, TASK-047 through TASK-056, TASK-060

## 9. Related Documents

- `Kitchen_Odyssey/docs/api-contract-specification-1.md`
- `Kitchen_Odyssey/docs/migration-data-mapping-1.md`
- `Kitchen_Odyssey/docs/security-considerations-1.md`
- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-testing-1.md`
