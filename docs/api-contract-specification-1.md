---
goal: Define implementation-critical API contract for Kitchen Odyssey backend services
version: 2.0
last_updated: 2026-02-17
owner: Project Team
status: Planned
tags: ['api', 'contract', 'rest', 'migration']
---

# API Contract Specification

## 1. Scope

This document captures only the API contract details required to implement and integrate the migration.

- Base prefix: `/api/v1`
- Frontend integration target: `Kitchen_Odyssey/src/lib/storageApiAdapter.js`
- Behavioral parity target: existing `src/lib/storage.js` semantics

## 2. Base URL and Auth Conventions

Development:
- `http://localhost:3000/api/v1`

Production:
- `https://<backend-domain>/api/v1`

Authentication:
- Access/refresh tokens are stored in HttpOnly cookies.
- Guest requests may include `X-Guest-ID` when available.
- Write endpoints require authenticated active non-admin users unless marked admin-only.

## 3. Response Contract

Success envelope:

```json
{
  "success": true,
  "data": {},
  "message": "optional"
}
```

Error envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {}
  }
}
```

## 4. Endpoint Matrix

### 4.1 Authentication

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Email/password login, sets auth cookies. |
| POST | `/auth/signup` | Public | Creates user with `pending` or configured default status. |
| POST | `/auth/guest-session` | Public | Optional guest bootstrap endpoint if guest mode is backend-assisted. |
| POST | `/auth/logout` | User/Admin | Ends current session. |
| POST | `/auth/logout-all` | User/Admin | Invalidates all sessions (`tokenVersion` strategy). |
| POST | `/auth/refresh` | Cookie-based | Rotates/refreshes access token. |
| GET | `/auth/me` | User/Admin | Returns current authenticated user profile and role/status. |

### 4.2 Users

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/users` | Admin | Paginated user listing. |
| GET | `/users/:id` | User/Admin | Self or admin access model. |
| PATCH | `/users/:id` | User/Admin | Profile updates with ownership/admin checks. |
| DELETE | `/users/:id` | Admin | Deletion must enforce reference cleanup. |

### 4.3 Recipes and Interactions

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/recipes` | Public | Supports filter, pagination, and sort: `trending`, `newest`, `rating`, `title`. Default `limit=30`. |
| GET | `/recipes/:id` | Mixed | Published visible to all; non-published visible only to owner/admin. |
| POST | `/recipes` | Active user | Create recipe. |
| PATCH | `/recipes/:id` | Owner/Admin | Update recipe with ownership checks. |
| DELETE | `/recipes/:id` | Owner/Admin | Delete recipe with cascade handling. |
| POST | `/recipes/:id/like` | Active non-admin | Toggle like. |
| POST | `/recipes/:id/favorite` | Active non-admin | Toggle favorite. |
| POST | `/recipes/:id/view` | Public | Records view; guest analytics rules apply. |
| GET | `/recipes/:id/reviews` | Public | Paginated reviews for recipe. |
| POST | `/recipes/:id/reviews` | Active non-admin | Add review. |
| DELETE | `/reviews/:id` | Author/Admin | Remove review with ownership/admin checks. |
| GET | `/recipes/:id/rating` | Public | Returns average/count rating summary. |
| GET | `/recipes/random-suggestion` | Public | Preserves existing random suggestion quality constraints. |

### 4.4 Admin Moderation

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| PATCH | `/admin/users/:id/status` | Admin | Status transitions (`pending`, `active`, `suspended`, etc.). |
| PATCH | `/admin/recipes/:id/status` | Admin | Recipe moderation status updates. |

### 4.5 Metrics and Activity

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/stats/daily` | Admin | Daily aggregates for dashboard. |
| GET | `/stats/active-users` | Admin | Active user trend/count output used by AdminStats. |
| GET | `/stats/views` | Admin | View metrics output used by AdminStats. |
| GET | `/activity` | Admin | Paginated activity feed. |
| POST | `/activity` | Internal/Admin | Activity log write endpoint. |
| GET | `/search-history` | User/Admin | User search history retrieval. |
| POST | `/search-history` | User/Admin | Add search entry. |
| DELETE | `/search-history` | User/Admin | Clear user history. |
| GET | `/health` | Public/Internal | Service health and dependency status. |

## 5. Required Query and Payload Rules

Recipes list query constraints:
- `sort` allowed values: `trending`, `newest`, `rating`, `title`
- `limit` default: `30`
- Pagination required for large datasets

Role constraints:
- `canInteract` parity must be enforced server-side: active non-admin, non-guest only.
- Admin moderation endpoints are admin-only.

Stats constraints:
- Stats responses must return computed data (not placeholders) expected by `AdminStats.jsx`.

## 6. Status Codes

Minimum codes that all handlers should use consistently:
- `200`, `201`, `204`
- `400` validation/input errors
- `401` unauthenticated
- `403` unauthorized/forbidden
- `404` not found
- `409` conflict (when applicable)
- `429` rate limited
- `500` internal server error

## 7. Related Documents

- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-1.md`
- `Kitchen_Odyssey/docs/migration-data-mapping-1.md`
- `Kitchen_Odyssey/docs/security-considerations-1.md`
- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-testing-1.md`
