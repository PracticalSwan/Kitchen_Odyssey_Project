# Migration Docs

## Scope
Continuation of migration-plan review/hardening with no implementation start.

## Final decisions
- Canonical backend folder name: `Kitchen_Odyssey_Backend`.
- Keep frontend in `Kitchen_Odyssey`; backend is sibling under `Project2`.
- Primary deployment target for plan: Azure VM.
- MongoDB Atlas free-tier handling is mandatory in plan controls.

## Docs updated
- `plan/architecture-nextjs-mongodb-migration-1.md`
- `plan/docs/testing-strategy-1.md`
- `plan/docs/security-considerations-1.md`
- `plan/docs/api-contract-specification-1.md`
- `plan/docs/migration-data-mapping-1.md`
- `CLAUDE.md`

## Key consistency fixes
- Removed stale backend aliases.
- Unified env naming around `VITE_USE_BACKEND_API` and `ALLOWED_ORIGINS`.
- Added security doc framework note clarifying Express snippets are reference patterns and Next.js route-handler implementation is required.

## Next step boundary
Do not start implementation until explicitly requested by user.

## Plan Streamlining Update (2026-02-17)
- Simplified `plan/architecture-nextjs-mongodb-migration-1.md` to an execution-focused structure.
- Removed non-essential metadata and history content: YAML version/date/status/tags, status badge, and full changelog section.
- Removed reference-heavy/non-process sections: Alternatives, Dependencies, Files, and Related Specifications.
- Kept implementation-critical content only: requirements/constraints, auth/deployment/security strategy, edge cases, implementation phases, API contract overview, testing strategy, test matrix, risks/assumptions.
- Confirmed no implementation work was started.
