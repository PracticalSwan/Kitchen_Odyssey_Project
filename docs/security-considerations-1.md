---
goal: Define implementation-critical security controls for Kitchen Odyssey backend migration
version: 2.0
last_updated: 2026-02-17
owner: Project Team
status: Planned
tags: ['security', 'auth', 'jwt', 'csrf', 'rate-limiting', 'nosql-injection']
---

# Security Considerations

## 1. Scope

This document keeps only mandatory security controls required to implement the backend migration safely.

Backend target:
- `Project2/kitchen-odyssey-backend` (Next.js 16 route handlers + `src/proxy.js`)

## 2. Authentication Controls

- Store passwords as bcrypt hashes only (minimum cost factor per environment policy).
- Use short-lived access token + refresh token model in HttpOnly cookies.
- Include `tokenVersion` in token validation flow to support forced logout/logout-all.
- Reject weak or malformed credentials at validation layer before auth logic.

Cookie baseline (production):
- `HttpOnly: true`
- `Secure: true`
- `SameSite: Lax` or stricter based on deployment topology

## 3. Authorization Controls

- Enforce role checks on every privileged route.
- Enforce resource ownership checks for user-owned content.
- Preserve application interaction rule server-side:
  - Only active, non-admin, non-guest users can like/favorite/review.

Admin-only domains:
- User moderation/status updates
- Recipe moderation/status updates
- Admin metrics and activity endpoints

## 4. Input and Query Hardening

- Validate payloads and params per route schema (required fields, types, ranges, enums).
- Reject unknown/unexpected operators in query payloads.
- Sanitize user-controlled strings before persistence/output as needed.
- Use safe query construction patterns (no direct trust of client-provided filter objects).

Minimum guard list:
- Type checks for IDs, pagination, sorting, and status fields
- Enum allowlists for role/status/sort values
- Length limits for text fields

## 5. CSRF, CORS, and Request Policy

- Apply CSRF protections to state-changing authenticated routes.
- Use explicit `ALLOWED_ORIGINS` allowlist; do not use wildcard with credentials.
- Implement `OPTIONS` preflight responses consistently.
- Add payload size limits to write endpoints.

## 6. Abuse Protection and Headers

- Rate limit auth and write-heavy routes separately from read routes.
- Emit framework-native security headers via `src/proxy.js` and/or route handlers.
- Deny oversized or malformed requests early.

## 7. Secrets and Environment Hygiene

- Secrets must be environment-only (`JWT_SECRET`, DB credentials, security salts/keys).
- `.env.example` must be tracked; `.env*` secrets must never be committed.
- Use distinct credentials for local, test, and production environments.

## 8. Observability and Audit Baseline

- Structured logs for auth failures, forbidden access attempts, and validation failures.
- Correlation IDs for tracing cross-layer failures.
- Monitor rate limit hits, auth anomalies, and repeated validation/injection attempts.

## 9. Implementation Checklist

- Password hashing is enforced at create/import/update paths.
- Route-level validation exists on all write endpoints.
- Role and ownership checks exist on protected endpoints.
- CORS allowlist and credential behavior are environment-correct.
- Rate limiting and request size limits are enabled.
- Security headers and CSRF protections are active.
- Sensitive values are not hardcoded.

Security test execution details are defined in:
- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-testing-1.md`

## 10. Related Documents

- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-1.md`
- `Kitchen_Odyssey/docs/api-contract-specification-1.md`
- `Kitchen_Odyssey/docs/migration-data-mapping-1.md`
- `Kitchen_Odyssey/plan/architecture-nextjs-mongodb-migration-testing-1.md`
