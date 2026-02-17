---
goal: Define implementation-critical mapping from localStorage schema to MongoDB collections
version: 2.0
last_updated: 2026-02-17
owner: Project Team
status: Planned
tags: ['migration', 'data-mapping', 'localStorage', 'mongodb']
---

# Migration Data Mapping: localStorage to MongoDB

## 1. Scope

This document contains only mapping and migration rules required to implement import safely.

Source of truth before migration:
- `Kitchen_Odyssey/src/lib/storage.js`

Primary localStorage keys:
- `cookhub_users`
- `cookhub_recipes`
- `cookhub_reviews`
- `cookhub_search_history`
- `cookhub_daily_stats`
- `cookhub_activity_logs`

Keys intentionally not migrated as persistent records:
- `cookhub_current_user`
- `cookhub_guest_id` (remains client-local for guest continuity)

## 2. Target Collections

| Source Key | Target Collection | Notes |
| --- | --- | --- |
| `cookhub_users` | `users` | Password hashing required during import. |
| `cookhub_recipes` | `recipes` | Preserve ownership, status, and interaction counters. |
| `cookhub_reviews` | `reviews` | Preserve recipe/user linkage and rating metadata. |
| `cookhub_search_history` | `search_history` | Preserve per-user chronological history. |
| `cookhub_daily_stats` | `daily_stats` | Preserve daily aggregate metrics in UTC-aligned format. |
| `cookhub_activity_logs` | `activity_logs` | Preserve recent admin/system activity; older data can be TTL-managed. |

## 3. Core Field Transformations

### 3.1 Users (`cookhub_users` -> `users`)

- `id` -> `_id` (string, stable)
- `password` -> `passwordHash` (bcrypt hash during import)
- `role`, `status` -> preserved with allowed enum validation
- `favorites`, `viewedRecipes` -> arrays preserved
- `tokenVersion` -> initialize to `0` if missing
- Timestamps normalized to UTC-compatible ISO format

Mandatory rule:
- Never write plaintext password to MongoDB.

### 3.2 Recipes (`cookhub_recipes` -> `recipes`)

- `id` -> `_id`
- `authorId`/owner identity preserved
- `status` preserved (`published`, `pending`, `rejected`, etc.)
- `likedBy`, `favoritedBy`, counters preserved or recomputed deterministically
- Category/tag arrays normalized to consistent array shape
- Numeric fields (`prepTime`, `cookTime`, servings/rating counts) coerced to valid number range

### 3.3 Reviews (`cookhub_reviews` -> `reviews`)

- `id` -> `_id`
- `recipeId` and `userId` links preserved
- `rating`, `comment`, `createdAt` preserved with validation
- Invalid orphan references must be flagged before commit

### 3.4 Search History (`cookhub_search_history` -> `search_history`)

- Preserve entry order and timestamps
- Associate each record with user identity key
- Deduplicate only if current behavior requires dedup on write

### 3.5 Daily Stats (`cookhub_daily_stats` -> `daily_stats`)

- Preserve day key and aggregate values
- Store canonical day boundary in UTC
- Keep metrics compatible with AdminStats calculations

### 3.6 Activity Logs (`cookhub_activity_logs` -> `activity_logs`)

- Preserve actor, action, target, and timestamp metadata
- Apply retention policy for old events after migration stabilization

## 4. Import Execution Flow

### 4.1 Preconditions

- Backup localStorage export snapshot
- Validate required fields and ID uniqueness
- Validate referential integrity (`recipeId`, `userId` links)
- Confirm environment points to non-production migration target when rehearsing

### 4.2 Import Steps

1. Parse source snapshot.
2. Run schema-level validation per collection.
3. Transform records (including password hashing and UTC normalization).
4. Upsert by stable IDs to support idempotency.
5. Log batch summary and write rollback artifact.

### 4.3 Post-Import Verification

- Record counts match expected totals per collection.
- Referential checks pass (no orphaned review/recipe/user links).
- Spot-check auth-critical users for valid password hash format.
- Validate key frontend screens against API-backed data.

## 5. Rollback Strategy

Rollback utility requirements:
- Must target migration batch identifier.
- Must reverse only records created/changed by that batch.
- Must produce audit summary (deleted/restored/skipped).

Minimum rollback artifacts:
- Batch ID
- Timestamp
- Affected IDs by collection
- Operation type per record (`insert`, `update`)

## 6. Migration Safety Rules

- Import script must support `dry-run` mode.
- Import must be idempotent (safe re-run).
- Fail fast on schema violations or unresolved references.
- Never run destructive cleanup before validation and backup are complete.

## 7. Related Documents

- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-1.md`
- `Kitchen_Odyssey/docs/api-contract-specification-1.md`
- `Kitchen_Odyssey/docs/security-considerations-1.md`
- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-testing-1.md`
