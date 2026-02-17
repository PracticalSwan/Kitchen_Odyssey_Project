# Migration Docs

## Scope
Continuation of migration-plan review/hardening with no implementation start.

## Final decisions
- Canonical backend folder name: `kitchen-odyssey-backend` (kebab-case).
- Keep frontend in `Kitchen_Odyssey`; backend is sibling under `Project2`.
- Primary deployment target for plan: Azure VM.
- MongoDB Atlas free-tier handling is mandatory in plan controls.
- MongoDB Atlas connection verified working (databases: `sample_mflix`, `admin`, `local`).

## Next.js 16 Critical Changes (verified via Context7, 2026-02-18)
- `middleware.js` renamed to `proxy.js` — export is `export function proxy(request)`, runs on Node.js runtime (not Edge).
- Migration codemod available: `npx @next/codemod@latest middleware-to-proxy .`
- Route handler `params` is now a Promise — must use `const { id } = await params`.
- `headers()` and `cookies()` from `next/headers` are now async.
- Prefer `Response.json()` over `NextResponse.json()` for simple responses.
- `after()` API from `next/server` available for post-response work (logging, analytics).
- Proxy file location with `src/` structure: `src/proxy.js`.

## Mongoose Connection Pattern
- Use cached connection *promise* pattern (`.then(() => mongoose)`) to prevent connection storms.
- Include `dbName` in connection options.
- `maxPoolSize`, `minPoolSize`, `serverSelectionTimeoutMS` configurable via env vars.

## Docs updated (2026-02-18)
- `plan/architecture-nextjs-mongodb-migration-1.md` — Added Section 3.5 (Next.js 16 API Patterns), updated SEC-007/TASK-005/TASK-042 for proxy.js, updated EC-010 MongoDB connection, updated CORS with proxy.js alternative, noted MongoDB Atlas verified.
- `docs/security-considerations-1.md` — Updated framework note for proxy.js, updated security checklist.

## Previous docs updated (2026-02-17)
- `plan/architecture-nextjs-mongodb-migration-1.md`
- `docs/testing-strategy-1.md`
- `docs/security-considerations-1.md`
- `docs/api-contract-specification-1.md`
- `docs/migration-data-mapping-1.md`
- `CLAUDE.md`

## Key consistency fixes
- All `middleware.js` references updated to `proxy.js` across plan and docs.
- Unified env naming around `VITE_USE_BACKEND_API` and `ALLOWED_ORIGINS`.
- Security doc framework note clarifying Express snippets are reference patterns (now also notes proxy.js).

## Next step boundary
Do not start implementation until explicitly requested by user.
