# Kitchen Odyssey - Project Overview

## 2026-02-26 Update
- Project now operates with backend-required authenticated flows; migration is complete.
- Playwright references in older sections are historical and no longer part of active workflow.

## Project Identity

**Project Name:** Kitchen Odyssey (branded as "Kitchen Odyssey" in UI)
**Workspace:** `Project2/Kitchen_Odyssey`
**Type:** Recipe sharing platform with social features
**Status:** Production-ready with localStorage persistence; API migration planned

## Current Implementation Status

### ✅ Complete Features (v2.0)
1. **Guest Mode** — Implemented 2026-02-14 (11/11 tests passing)
2. **Random Recipe Suggestion** — Implemented 2026-02-14
3. **Design Overhaul** — Implemented June 2025 (17 source files, 32/32 Playwright tests)
4. **Admin Dashboard** — Real metrics, persistent modals (2026-02-17)
5. **Recipe Management** — Full CRUD with approval workflow
6. **User Profiles** — View and edit profiles with avatar selection
7. **Reviews & Ratings** — 1-5 star ratings with one-review-per-user constraint
8. **Search & Discovery** — Multi-filter search with history tracking

### 🔄 Migration In Progress
- **Backend:** Next.js 16.1.6 scaffold created at `Project2/kitchen-odyssey-backend`
- **Database:** MongoDB Atlas connection verified (not yet integrated)
- **Status:** Documentation complete; implementation pending explicit approval

## Technology Stack

### Frontend Core
- **React:** 19.2.0 (latest, with modern hooks and concurrent features)
- **Vite:** 7.3.1 (build tool and dev server)
- **Tailwind CSS:** 4.1.18 (utility-first styling)
- **React Router DOM:** 7.13.0 (HashRouter for deployment compatibility)

### UI & Styling
- **Design Tokens:** Custom theme in `src/index.css` with CSS variables
- **Primary Color:** Terracotta (`#E76F51` via `brand-accent`)
- **Secondary:** Brand (`#C05640`)
- **Accents:** Sage Green (`#81B29A`), Golden Ochre (`#E9C46A`)
- **Typography:** Work Sans (Google Font, weights 300-700)
- **Icons:** Lucide React 0.562.0
- **Utilities:** clsx + tailwind-merge (`cn()` helper)

### Testing
- **Playwright:** 1.58.2
- **Test Coverage:** 32/32 tests passing (~19.7s)
- **Test Files:** 4 spec files covering guest mode, random recipe, analytics, transitions

### Data Persistence (Current)
- **Storage:** localStorage with `kitchen_odyssey_*` key prefix
- **Seed Data:** 3 admins, 9 users, 12 recipes
- **Data Layer:** Centralized `src/lib/storage.js` module

### Data Persistence (Target - Post-Migration)
- **Backend:** Next.js 16.1.6 API Routes
- **Database:** MongoDB Atlas with Mongoose ODM
- **Auth:** JWT tokens in HttpOnly cookies
- **API Versioning:** `/api/v1/*`

## User Roles & Access Control

### Roles
- **Admin:** Full platform access, user/recipe management, analytics
- **User:** Can create recipes, like, favorite, review
- **Guest:** Read-only browsing, no analytics, no localStorage persistence

### User Status
- **`active`:** User is currently logged in (session state)
- **`inactive`:** User is registered but not logged in (session state)
- **`pending`:** New user awaiting admin approval (account state, persists)
- **`suspended`:** Account locked by admin (account state, persists)

### Status Flow
- Login: `inactive` → `active` (updates `lastActive`)
- Logout: `active` → `inactive` (does NOT update `lastActive`)
- Pending/suspended users retain their status across sessions

## Key Features by Category

### Recipe Management
- **Create/Edit:** Comprehensive validation with multi-select categories
- **Approval Workflow:** Recipes start as `pending`, admin approves/rejects
- **Statuses:** `published`, `pending`, `rejected`
- **Visibility:** Authors can view their own non-published recipes

### Interactions
- **Likes:** Heart icon toggle on recipe cards
- **Favorites:** Bookmark recipes for quick access
- **Reviews:** 1-5 star ratings with comments (one per user per recipe)
- **Views:** Tracked per recipe and in daily analytics

### Discovery
- **Home:** Published recipes grid with hero section, batch loading (30 items)
- **Search:** URL params sync, multi-select filters, search history
- **Random Recipe:** "Surprise Me" button shows quality-filtered suggestions
  - Quality constraint: `>= 5 likes AND >= 1 review`
  - Fallback: Any published recipe

### Admin Features
- **Dashboard:** Real metrics (users, recipes, likes, trends)
- **User Management:** Approve, suspend, delete users (no profile editing)
- **Recipe Management:** Approve/reject pending recipes, manage all recipes
- **Analytics:** Daily stats, activity logs, category trends

### Guest Mode
- **Access:** "Continue as Guest" button on auth pages
- **Restrictions:** No analytics, no localStorage writes, read-only
- **Guest ID:** `guest-{randomId}` format, stored in localStorage
- **Compatibility:** Works with Random Recipe (read-only access)

## Project Structure

```
Kitchen_Odyssey/
├── src/
│   ├── components/
│   │   ├── layout/      # Navbar, Sidebar
│   │   ├── recipe/      # RecipeCard, RecipeSuggestionModal
│   │   └── ui/          # Button, Modal, Input, Card, Badge, Table, Tabs
│   ├── context/         # AuthContext
│   ├── layouts/         # AuthLayout, RootLayout, AdminLayout
│   ├── lib/             # storage.js, utils.js
│   └── pages/           # Auth/, Admin/, Recipe/
├── public/              # Static assets
├── tests/               # Playwright tests
├── plan/                # Implementation plans
├── docs/                # API contracts, testing docs
├── DESIGN.md            # Design system specification
├── README.md            # Project documentation
└── CHANGELOG.md         # Version history
```

## Routing

**Router:** HashRouter (NOT BrowserRouter) - critical for deployment compatibility
**Base Path:** `/recipe-sharing-system-deploy/` (Vite config)

### Layout Wrappers
1. **AuthLayout:** Public pages (Login, Signup)
2. **RootLayout:** Authenticated user pages (Home, Search, Profile, RecipeDetail, CreateRecipe)
3. **AdminLayout:** Admin-only pages (AdminStats, AdminRecipes, UserList)

### Route Protection
- Protected routes check auth at layout level
- Admin routes protected by role check
- Guest mode bypasses auth but shows restrictions

## Event-Driven Updates

Components use window events for cross-component state sync:
- **`favoriteToggled`:** Dispatched when recipe is liked/unliked
- **`recipeUpdated`:** Dispatched on create/edit/delete
- **`statsUpdated`:** Dispatched when analytics change
- **`userUpdated`:** Dispatched when user data changes

## Important Implementation Details

### localStorage Prefix Convention
All keys use `kitchen_odyssey_*` prefix (e.g., `kitchen_odyssey_users`, `kitchen_odyssey_recipes`) despite Kitchen Odyssey branding. This is intentional for backward compatibility.

### Guest Mode Analytics Bypass
Guest IDs starting with `guest-` bypass:
- Per-recipe `viewedBy` tracking
- Daily stats `views` tracking
- `recordActiveUser` tracking

### Random Recipe Quality Filter
`storage.getRandomSuggestion()` filters recipes with:
- **Primary constraint:** `>= 5 likes AND >= 1 review`
- **Fallback:** Any published recipe if no recipes meet quality constraint

### Modal Persistence
Data-heavy modals use `persistent` prop:
- When `persistent=true`: Only closeable via close button
- Backdrop click and Escape key disabled
- Used for: Admin Recent Activity (200 entries), Recipe Trends Full Report

## Recent Updates (2026-02-17)

### UI Fixes
- Home pagination: Loads 30 items per batch
- Recipe Detail: Reviews moved out of sticky sidebar (below content)
- My Recipes: Authors can now view their own pending/rejected recipes

### Admin Dashboard
- All metrics compute from real data (no hardcoded values)
- Total Users: Month-over-month growth from `joinedDate`
- Active Recipes: % of published with engagement
- Total Likes: Total + average per recipe
- Recipe Trends: Real category share percentages
- Persistent modals for Recent Activity and Full Report

### Migration Plan
- Backend folder standardized to `kitchen-odyssey-backend`
- All code verified against Next.js 16.1.6 and Mongoose 9.0.1
- `middleware.js` → `proxy.js` migration documented
- MongoDB Atlas connection verified working

## Development Commands

```bash
cd Kitchen_Odyssey
npm install              # Install dependencies
npm run dev             # Start dev server on http://localhost:5173
npm run build           # Production build to dist/
npm run preview         # Preview production build locally
npm run lint            # Run ESLint
npx playwright test     # Run all Playwright tests
```

## Next Steps

1. **Backend Implementation** (pending approval)
   - Create `kitchen-odyssey-backend` if not exists
   - Implement Phase 2 tasks from migration plan
   - Add MongoDB connection and models

2. **API Integration** (after backend)
   - Replace `storage.js` calls with API client
   - Implement JWT auth with HttpOnly cookies
   - Add `VITE_USE_BACKEND_API` toggle for gradual migration

3. **Testing** (ongoing)
   - Maintain test coverage at current level
   - Add API integration tests post-migration
   - Cross-browser testing (Safari requires macOS)

## Related Documentation

- [DESIGN.md](../DESIGN.md) - Design system and architecture
- [README.md](../README.md) - Project setup and usage
- [CHANGELOG.md](../CHANGELOG.md) - Version history
- [plan/architecture-nextjs-mongodb-migration-1.md](../plan/architecture-nextjs-mongodb-migration-1.md) - Migration plan

## Memory Management

This memory is maintained for:
- **Project:** Kitchen_Odyssey (React frontend)
- **Last Updated:** 2026-02-17
- **Maintained By:** Serena MCP Server
- **Purpose:** Quick reference for project context, status, and key decisions
