---
goal: Define implementation-ready testing plan for the localStorage to Next.js + MongoDB migration
last_updated: 2026-02-17
revision_notes: >
  Rev 2 (2026-02-17): Added TASK-046-A (test seed fixtures and DB reset scripts).
  Added user profile CRUD and deletion cascade to minimum test matrix.
source: Extracted from architecture-nextjs-mongodb-migration-1.md and docs/testing-strategy-1.md to reduce context size in implementation docs
---

# Architecture Migration Testing Plan

## Introduction

This document is the single source of truth for migration testing.

It contains all testing tasks removed from:
- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-1.md`
- `Kitchen_Odyssey/docs/testing-strategy-1.md`

## 1. Scope

Testing must prove that API-backed mode preserves existing app behavior and constraints for:
- Auth flows (signup/login/logout/refresh/guest)
- Recipe discovery/detail/create/update/moderation
- Interactions (like/favorite/review) with role restrictions
- Admin operations and metrics screens
- Activity and search history behavior
- Rollout safety and parity against localStorage mode
- **Image upload for recipes and user avatars** (new feature)
- **Image deletion and cleanup cascade**
- **Image validation (size, type, security)**

Out of scope:
- Net-new product features unrelated to migration

## 2. Test Modes and Environment

### 2.1 Runtime Modes

- Mode A: `VITE_USE_BACKEND_API=false` (legacy localStorage baseline)
- Mode B: `VITE_USE_BACKEND_API=true` (backend API mode)

### 2.2 Required Environment Baseline

Backend:
- Dedicated test database URI (never production)
- Seed fixtures for users, recipes, reviews, stats, and activity
- Deterministic reset/cleanup between test runs
- **Local test image upload directory** (separate from production, cleaned between runs)
- **Mock filesystem for image operations** (optional, for faster unit tests)

Frontend:
- Stable auth states for guest/user/admin fixtures
- Predictable network timeout/retry settings for resilience tests

### 2.3 Core Comparison Rule

For overlapping scenarios, behavior in Mode B must match Mode A unless a documented migration exception exists.

## 3. Testing Workstream and Tasks

### Phase T1: Baseline and Contract State Setup

| Task | Description | Status |
| --- | --- | --- |
| TASK-004 | Define immutable baseline snapshots of current behavior before migration implementation. |  |

### Phase T2: Backend Correctness

| Task | Description | Status |
| --- | --- | --- |
| TASK-046 | Add backend unit tests for repositories/services (success, failure, boundary cases). |  |
| TASK-046-A | Create test seed fixtures and deterministic DB reset/cleanup scripts. Prerequisite for TASK-046 and TASK-047. Must cover all roles (guest, pending, active, admin) and representative recipe/review/stats data. |  |
| TASK-047 | Add backend integration tests for API routes using seeded test DB. |  |
| TASK-048 | Add API contract tests validating OpenAPI and response/error schemas. |  |

### Phase T3: Frontend Parity and Behavior

| Task | Description | Status |
| --- | --- | --- |
| TASK-049 | Extend Playwright coverage to run in both localStorage and API modes. |  |
| TASK-049-A | Add Playwright tests for recipe image upload flow (select file, preview, upload, update, delete). |  |
| TASK-049-B | Add Playwright tests for user avatar upload flow (select file, preview, upload, update profile, delete). |  |
| TASK-050 | Add migration parity suite validating same outcomes pre/post switch. |  |
| TASK-050-A | Add image upload parity tests: verify uploaded images display correctly in recipe cards, detail pages, and profile. |  |
| TASK-051 | Add edge-case suite (invalid payloads, race events, stale sessions, large datasets). |  |
| TASK-051-A | Add image upload edge case tests (oversized files, invalid types, network interruption, concurrent uploads, malformed images). |  |
| TASK-052 | Add guest analytics bypass tests for random suggestion and view/stat consistency. |  |

### Phase T4: Non-Functional and Security Validation

| Task | Description | Status |
| --- | --- | --- |
| TASK-053 | Add performance tests for latency/render stability against baseline. |  |
| TASK-053-A | Add image upload performance tests (upload latency for 1MB/5MB files, thumbnail generation time, concurrent upload throughput). |  |
| TASK-054 | Add accessibility regression tests (keyboard flow, focus, ARIA, modal behavior). |  |
| TASK-054-A | Add image upload accessibility tests (alt text defaults, file input labels, upload progress screen reader announcements). |  |
| TASK-055 | Add security tests (unauthorized access, role bypass, injection, token tampering, CSRF). |  |
| TASK-055-A | Add image upload security tests (malicious file upload, MIME type spoofing, path traversal attempts, virus/malware scanning integration). |  |
| TASK-055-B | Add input sanitization tests (XSS payloads in recipe fields, user bio, review comments; verify HTML/script tags are escaped). |  |
| TASK-055-C | Add error message leakage tests (verify stack traces, DB errors, internal paths not exposed to clients). |  |
| TASK-055-D | Add CORS configuration tests (verify Origin validation, reject unauthorized origins, preflight handling). |  |
| TASK-056 | Add concurrency tests for simultaneous interaction mutations. |  |
| TASK-056-A | Add image cleanup cascade tests (verify file deletion on user/recipe deletion, verify cleanup on image replacement). |  |
| TASK-056-B | Add Azure VM deployment tests (nginx static file serving, file permissions, disk space monitoring, backup/restore procedures). |  |

### Phase T5: Release Gate Validation

| Task | Description | Status |
| --- | --- | --- |
| TASK-060 | Execute full regression matrix across user roles and major flows before broad enablement. |  |

## 4. Minimum Test Matrix

Required role coverage:
- Guest
- Pending user
- Active user
- Admin

Required feature domains:
- Authentication/session lifecycle
- Recipe CRUD/listing/sorting/pagination
- Interaction constraints (`canInteract` parity)
- User profile CRUD (self-read, self-update, view other user, admin listing/deletion)
- Admin moderation and metrics
- Activity and search history
- Random suggestion behavior
- Deletion cascade and referential integrity (user/recipe deletion must clean dependent records across collections)
- **Recipe image upload** (upload, preview, save, update, delete, display in cards/detail)
- **User avatar upload** (upload, preview, save, update profile, delete, display in profile/comments)
- **Image validation** (file size limits, MIME type enforcement, malicious file rejection)
- **Image cleanup** (file deletion on recipe/user deletion, old image cleanup on replacement)
- **Image serving via nginx** (static file delivery, caching headers, 404 handling with placeholders)
- **Azure VM deployment** (PM2 process management, nginx configuration, SSL/TLS, firewall rules, disk space monitoring)
- **Input sanitization** (XSS prevention in all user-generated content fields)
- **Error handling UX** (user-friendly error messages, retry options, loading states)

Required failure modes:
- Validation errors (`400`)
- Unauthorized/forbidden (`401/403`)
- Not found (`404`)
- Conflict/race (`409` where applicable)
- Rate limit (`429`)
- Internal server error (`500`)

## 5. Release Exit Criteria

Migration can pass testing gate only if all are true:
- No failing contract tests (TASK-048)
- No failing parity tests (TASK-050, TASK-050-A)
- No critical security failures (TASK-055, TASK-055-A, TASK-055-B, TASK-055-C, TASK-055-D)
- No unresolved high-severity defects in core role/flow matrix (TASK-060)
- Performance and accessibility checks pass agreed thresholds (TASK-053/TASK-054, TASK-053-A/TASK-054-A)
- **Image upload tests pass** (TASK-049-A, TASK-049-B, TASK-051-A, TASK-055-A, TASK-056-A)
- **Image cleanup cascade verified** (no orphaned files in upload directory after test runs)
- **Azure VM deployment verified** (nginx serving images correctly, PM2 process management stable, backup/restore procedures tested)
- **Input sanitization verified** (no XSS vulnerabilities in user-generated content)

## 6. Reporting Artifacts

- Test run summary per phase (pass/fail + blocker list)
- Defect list with severity and ownership
- Final gate decision attached to rollout report

## 7. Related Documents

- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-1.md`
- `Kitchen_Odyssey/docs/api-contract-specification-1.md`
- `Kitchen_Odyssey/docs/migration-data-mapping-1.md`
- `Kitchen_Odyssey/docs/security-considerations-1.md`
- `Kitchen_Odyssey/plan/rollout-report-1.md`
