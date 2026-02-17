---
goal: Migrate Kitchen Odyssey from frontend-only localStorage architecture to split Frontend + Next.js Backend + MongoDB Atlas while preserving existing behavior and design-overhaul compatibility
last_updated: 2026-02-17
revision_notes: >
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
- Guest sessions remain unauthenticated and use `cookhub_guest_id` local persistence.

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

Frontend:
- `VITE_USE_BACKEND_API`
- `VITE_API_BASE_URL`

### 3.3 Next.js 16 Backend Patterns

- Use route handlers in `src/app/api/v1/**/route.js`.
- Use `src/proxy.js` (not `middleware.js`) for framework-level request controls/headers.
- Use cached Mongoose connection utility; do not open a new connection per request.
- Keep backend API-only. Remove unneeded default UI scaffold files.

## 4. Data Migration Scope

Target collections:
- `users`
- `recipes`
- `reviews`
- `daily_stats`
- `activity_logs`
- `search_history`

Migration decisions:
- `cookhub_current_user` is not migrated as persistent data.
- `cookhub_guest_id` remains local-only for guest continuity.
- Imported user passwords from localStorage plaintext must be hashed during import.
- Timestamps stored in UTC.
- Add deletion cascade handling to prevent orphaned references.

Field-level mapping details are maintained in `Kitchen_Odyssey/docs/migration-data-mapping-1.md`.

## 5. Implementation Phases

### Phase 1: Planning Artifacts

| Task | Description | Status |
| --- | --- | --- |
| TASK-001 | Create ADR for frontend/backend split and Atlas data source decision. |  |
| TASK-002 | Create migration readiness checklist with pass/fail gates for Guest Mode, Random Recipe, and design-overhaul dependencies. |  |
| TASK-003 | Create compatibility matrix mapping each `src/lib/storage.js` function to API endpoint/shape. |  |

### Phase 2: Backend Bootstrap

| Task | Description | Status |
| --- | --- | --- |
| TASK-005 | Confirm backend workspace and API project layout at `Project2/kitchen-odyssey-backend`. | DONE |
| TASK-006 | Add backend `.env.example` template with required variables. |  |
| TASK-007 | Add `src/lib/config.js` with env schema validation. |  |
| TASK-008 | Add `GET /api/v1/health` route with version, uptime, DB status. |  |
| TASK-008-A | Add ESLint config for backend JavaScript. |  |
| TASK-008-B | Verify backend `.gitignore` baseline. | DONE |
| TASK-008-C | Add backend `test` script in `package.json`. |  |
| TASK-008-D | Add shared CORS helper for route handlers (`OPTIONS` + allowlist + credentials). |  |
| TASK-008-E | Install `mongoose` and `bcryptjs`; remove backend-unused frontend deps. |  |
| TASK-008-F | Ensure `!.env.example` is present in backend `.gitignore`. |  |
| TASK-008-G | Remove default create-next-app UI files from backend (API-only). |  |

### Phase 3: Data Model and Migration Scripts

| Task | Description | Status |
| --- | --- | --- |
| TASK-009 | Define Mongoose schemas for core collections with strict validation. |  |
| TASK-010 | Add required indexes and uniqueness constraints. |  |
| TASK-010-A | Add TTL/retention policy for non-critical collections. |  |
| TASK-010-B | Add query-budget guardrails (projection, `lean()`, cursor defaults). |  |
| TASK-011 | Finalize migration mapping document. |  |
| TASK-012 | Add idempotent import utility with dry-run mode. |  |
| TASK-013 | Add rollback utility for migration batches. |  |

### Phase 4: API Surface Implementation

| Task | Description | Status |
| --- | --- | --- |
| TASK-014 | Maintain OpenAPI contract (`docs/openapi.yaml`) aligned with implementation. |  |
| TASK-015 | Implement auth routes (`login`, `signup`, `guest-session`, `logout`, `logout-all`, `refresh`, `profile`). |  |
| TASK-016 | Implement recipe routes with unified sorting and pagination defaults. |  |
| TASK-017 | Implement interaction routes (`like`, `favorite`, `reviews`) with role restrictions. |  |
| TASK-018 | Implement admin moderation routes for users/recipes. |  |
| TASK-019 | Implement random suggestion route preserving existing quality constraints. |  |
| TASK-020 | Implement stats routes returning real computed data expected by `AdminStats.jsx`. |  |
| TASK-021 | Implement activity routes (`GET`, `POST`). |  |
| TASK-022 | Implement search history routes (`GET`, `POST`, `DELETE`). |  |
| TASK-023 | Standardize response/error envelope utilities. |  |

### Phase 5: Frontend Integration

| Task | Description | Status |
| --- | --- | --- |
| TASK-024 | Add `src/lib/apiClient.js` with timeout, retry, and interceptors. |  |
| TASK-025 | Add `src/lib/storageApiAdapter.js` matching `storage.js` public signatures. |  |
| TASK-026 | Add `src/lib/featureFlags.js` and runtime toggles. |  |
| TASK-027 | Update `AuthContext.jsx` to use adapter while preserving state semantics. |  |
| TASK-028 | Update storage consumers to call adapter only (Home/Search/Recipe/Admin/Profile/etc.). |  |
| TASK-029 | Preserve event bridge compatibility for existing UI listeners. |  |
| TASK-030 | Add read-through fallback behavior for recoverable API failures. |  |
| TASK-031 | Add optimistic updates with rollback for like/favorite toggles. |  |
| TASK-032 | Add request deduplication for rapid interactions. |  |

### Phase 6: Design-Overhaul Alignment

| Task | Description | Status |
| --- | --- | --- |
| TASK-033 | Create dependency map between design-overhaul work and API readiness milestones. |  |
| TASK-034 | Define required API contract details for redesign screens and states. |  |
| TASK-036 | Gate design-overhaul execution on backend contract stability tag (`api-contract-v1`). |  |

### Phase 7: Security and Observability Hardening

| Task | Description | Status |
| --- | --- | --- |
| TASK-037 | Add auth/role guard utilities in backend auth layer. |  |
| TASK-038 | Add per-route request validation utilities. |  |
| TASK-039 | Add auth/write-focused rate limiting. |  |
| TASK-040 | Add CSRF protections for state-changing operations. |  |
| TASK-041 | Add NoSQL injection defenses in query builders. |  |
| TASK-042 | Add security headers via `src/proxy.js` and route responses. |  |
| TASK-043 | Add request payload size limits. |  |
| TASK-044 | Add structured logging + correlation IDs. |  |
| TASK-045 | Add metrics endpoint/counters for latency, error rate, and DB timing. |  |

### Phase 8: Deployment and Cutover

| Task | Description | Status |
| --- | --- | --- |
| TASK-057 | Deploy backend to Azure VM environment and run smoke checks (`health`, auth, recipes, admin). |  |
| TASK-058 | Configure production secrets/origins and Atlas pool limits. |  |
| TASK-059 | Enable `VITE_USE_BACKEND_API=true` for internal cohort and monitor telemetry. |  |
| TASK-061 | Enable global API mode after release-gate pass from testing plan. |  |
| TASK-062 | Archive rollout metrics in `Kitchen_Odyssey/plan/rollout-report-1.md`. |  |
| TASK-063 | Retire localStorage source-of-truth only after stable release windows and gate pass. |  |

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
- Image upload/storage redesign remains out of scope (URL-based media only).

## 8. Testing Plan Split

Testing work was intentionally removed from this architecture plan.

Authoritative testing plan:
- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-testing-1.md`

Testing tasks moved there include:
- TASK-004, TASK-035, TASK-046 through TASK-056, TASK-060

## 9. Related Documents

- `Kitchen_Odyssey/plan/design-overhaul-1.md`
- `Kitchen_Odyssey/docs/api-contract-specification-1.md`
- `Kitchen_Odyssey/docs/migration-data-mapping-1.md`
- `Kitchen_Odyssey/docs/security-considerations-1.md`
- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-testing-1.md`
