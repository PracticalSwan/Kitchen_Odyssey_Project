# ADR-001: Frontend/Backend Split with MongoDB Atlas

## Status
Accepted

## Date
2026-02-18

## Context
Kitchen Odyssey currently runs as a frontend-only React+Vite application using localStorage for all data persistence. This approach has limitations:
- No persistent data across browsers/devices
- No server-side validation or authorization
- No real concurrent multi-user support
- Password storage in plaintext in localStorage

## Decision
Split into two separate deployable projects:
- **Frontend** (`Kitchen_Odyssey/`): React 19 + Vite, communicates via REST API
- **Backend** (`kitchen-odyssey-backend/`): Next.js 16.1.6 App Router, API-only, JavaScript
- **Database**: MongoDB Atlas Free Tier with Mongoose ODM

### Key Architectural Choices
1. **API versioning** under `/api/v1/*` for future compatibility
2. **Feature flag** (`VITE_USE_BACKEND_API`) for incremental rollout
3. **Adapter pattern** (`storageApiAdapter.js`) to swap localStorage for API calls without changing component code
4. **JWT in HttpOnly cookies** for authentication (access + refresh tokens)
5. **Repository/Service pattern** in backend for separation of concerns

## Alternatives Considered
1. **Monolith Next.js full-stack** – Rejected because the frontend is already built with Vite/React Router and changing routing would require full rewrite
2. **Firebase/Supabase BaaS** – Rejected due to vendor lock-in and course requirements for custom backend
3. **Express.js standalone** – Rejected; Next.js provides built-in API routes with less boilerplate

## Consequences
- Requires CORS configuration between frontend (port 5173) and backend (port 3000)
- Need migration utility to import localStorage seed data into MongoDB
- Frontend components need adapter layer but no structural changes
- Testing must verify behavioral parity between localStorage and API modes
