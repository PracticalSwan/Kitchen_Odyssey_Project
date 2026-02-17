# Active Context

## Current State
All three implementation phases are complete:
1. ✅ **Guest Mode** — Implemented 2026-02-14 (11/11 tests)
2. ✅ **Random Recipe Suggestion** — Implemented 2026-02-14
3. ✅ **Design Overhaul** — Implemented June 2025 (17 source files, 32/32 Playwright tests)

## Design Overhaul Summary (Most Recent)
- All hardcoded `#137fec` replaced with `brand-accent` Tailwind token
- Design tokens defined in `src/index.css` `@theme` block: `--color-brand-accent: #137fec`
- Custom animations: fade-in, slide-up, scale-in
- Home hero: "Fresh from the Kitchen" with gradient background
- RecipeCard: overlay heart icon, timer badge, author avatar, star rating
- Auth: Social auth buttons (Google + GitHub), icon-enhanced inputs
- Navbar: ChefHat logo, active route highlighting
- RecipeDetail: Breadcrumbs, rounded-full step numbers, amber review stars
- All Admin/UI components updated to use brand-accent token

## Testing
- 32/32 Playwright tests passing (~19.7s)
- 4 test files: random-recipe.spec.js, guest-mode.spec.js, guest-analytics.spec.js, guest-transitions.spec.js
- Zero compile/lint errors, zero hardcoded color references remaining

## Key Design Decisions
- Guest "Continue as Guest" button kept (not in Stitch, required per guest-mode plan)
- "Surprise Me" button kept (not in Stitch, required per random-recipe plan)
- localStorage key prefix `kitchen_odyssey_` unchanged for backward compatibility
- Stitch "Cookhub" branding → "Kitchen Odyssey" in implementation

## Tech Stack
- React 19.2.0, Vite 7.2.4, Tailwind CSS 4.1.18, React Router DOM 7.13.0
- Lucide React 0.562.0, clsx + tailwind-merge (`cn()` utility)
- Playwright 1.58.2 (testing)

## Color System v4.0 (Light Blue/Cyan)
- `#0284C7` (brand), `#06B6D4` (accent), `#0891B2` (hover), `#38BDF8` (light), `#E0F2FE` (pale)
- Previous: Terracotta v2.0 → multi-variant v3.0 (reverted) → v4.0 (current)

## Unified Sort System
- Both Home and Search use identical SORT_OPTIONS: `trending` (default), `newest`, `rating`, `title`
- Trending = most reviews → most likes → highest rating (tiebreaker chain)
- Rating sort tiebreaker: likes count

## Documentation Updated
- DESIGN.md — Updated with brand-accent token references, completion date
- README.md — design-overhaul-1.md status → "(Completed)"
- Serena memories — design-overhaul-plan, active-context, ui-components-and-styling

## Next Steps
- No pending implementation tasks
- Safari cross-browser testing (requires macOS)


## Migration Plan Docs Update (2026-02-17)
- Documentation-only continuation completed; implementation was intentionally not started.
- Backend folder naming standardized to `Project2/kitchen-odyssey-backend` (kebab-case) across migration architecture and supporting docs.
- Architecture plan hardened for Atlas free-tier operations (pool limits, pagination/projection/lean guardrails, retention/TTL, quota alerting).
- Deployment target in migration plan set to Azure VM; preview platforms kept optional.
- Consistency fixes applied: `VITE_USE_BACKEND_FOR_REVIEWS` typo fixed, CORS env aligned to `ALLOWED_ORIGINS`, security headers wording aligned to Next.js middleware/route responses.
- Remaining next step (when approved): create `kitchen-odyssey-backend` and execute Phase 2 scaffolding tasks only.

## Migration Plan Code Modernization (2026-02-18)
- All code snippets in migration plan verified against Next.js 16.1.6 and Mongoose 9.0.1 via Context7.
- **Next.js 16 proxy.js**: All `middleware.js` references updated to `proxy.js` (SEC-007, TASK-005, TASK-042). New Section 3.5 added covering 5 critical Next.js 16 API patterns.
- **Async params/headers**: Route handler examples updated to `await params` and async `headers()`/`cookies()` patterns.
- **Response.json()**: Preferred over `NextResponse.json()` for simple responses.
- **MongoDB Atlas**: Connection verified working. EC-010 connection code updated to Mongoose cached promise pattern with `.then(() => mongoose)`.
- **CORS**: Added `proxy.js` global CORS alternative alongside route-handler approach in Section 3.3.
- **Security doc**: Framework note and checklist updated for `proxy.js` and Node.js runtime.
- Implementation boundary maintained: documentation-only, no code scaffold changes.


## Architecture Plan Streamlining (2026-02-17)
- Migration architecture plan was reduced to process-only content per user request.
- Removed changelog/version-style noise and non-essential reference sections.
- Preserved actionable implementation phases and operational controls for Atlas free tier.
- Boundary maintained: documentation-only change; implementation remains pending explicit approval.

## UI Behavior Update (2026-02-17)
- Home recipe pagination now loads 30 items per batch.
- "Load More Recipes" is shown only when filtered results exceed 30 recipes.
- RecipeCard now includes a brief description preview and visible like count.


## Recipe Detail Layout Fix (2026-02-17)
- Reviews section moved out of the sticky right sidebar and placed below the content grid.
- Ingredients now remain isolated in the sidebar, preventing long review threads from stretching sidebar height.
- Behavior for review submission, rating, delete, and "View all" toggle remains unchanged; change is layout-only.

- README updated under "UI Update (2026-02-17)" to document the Recipe Detail review section placement change.

## Plan Docs Frontend Sync (2026-02-18)
- Architecture migration plan (Rev 3): sort unification (4 modes), color v4.0, owner access (REQ-018), batch loading (REQ-019), RecipeCard fields (TASK-028), admin real metrics (TASK-020), design-overhaul notes (TASK-034), EC-010 query projection expanded, endpoint table updated.
- API contract v1.1: Sort params → trending/newest/rating/title, limit default 30, filter param added, category multi-select, GET /recipes/:id owner access rule + full response schema, create recipe categories → array, reviewCount added to list response.
- Migration data mapping: `category` (String) → `categories` ([String]) in schema, interface, index, mapping table, and migration rules.
- Serena memories updated: ui-components (color v4.0, sort unified, RecipeCard fields), features (sort unified, color v4.0), design-overhaul-plan (color history, RecipeCard, reviews layout, Modal persistent), active-context (color v4.0, sort system).
- Lint run after change still reports pre-existing repository issues (playwright config `process` globals, unused vars in Home/tests, and `set-state-in-effect` in RecipeDetail); no new layout-specific lint error introduced.

- Recipe detail sidebar behavior adjusted: Ingredients panel is now non-sticky (`space-y-8`), so it remains in normal flow and growing Instructions/Ingredients content pushes the Reviews section lower on the page.


## Admin Dashboard Metrics Fixes (2026-02-17)
- **All metrics now compute from real data** — no hardcoded percentages or values
- **Total Users card**: Shows month-over-month growth from `joinedDate` (e.g., "+12% vs last month" or "No new users this month")
- **Active Recipes card**: Shows percentage of published recipes with engagement (views OR likes)
- **Total Likes card**: Renamed from misleading "Daily Likes"; shows total likes across all published recipes + average per recipe
- **Recipe Trends percentages**: Real share of published recipes per category (recipesInCategory / totalPublished * 100)
- **Progress bars**: Dynamic width based on actual category data
- **"View All" button** on Recent Activity → Persistent modal showing up to 200 activity entries, scrollable, close-button-only
- **"View Full Report" button** on Recipe Trends → Persistent modal showing ALL categories with table layout (rank, category, progress bars, counts) + summary footer
- **Modal.jsx enhancement**: Added `persistent` prop; when true, disables backdrop click and Escape key closing
- Files modified: `src/pages/Admin/AdminStats.jsx`, `src/components/ui/Modal.jsx`
- Documentation updated: CHANGELOG.md, README.md (Admin Dashboard Metrics subsection), DESIGN.md (Admin Panels 7.6)
- Serena memories updated: `admin-features`, `ui-components-and-styling`, `active-context`


## My Recipes Navigation Fix (2026-02-17)
- Recipe detail access guard now allows authors to open their own non-published recipes (pending/rejected) from the Profile -> My Recipes tab.
- Previous behavior redirected non-admin users to Home for any non-published recipe, which blocked owners from reviewing their own submissions.
- Updated `src/pages/Recipe/RecipeDetail.jsx` to permit owner access while keeping non-owner restrictions unchanged.
- Documentation updated: `README.md` (recipe visibility clarification), `CHANGELOG.md` (fix entry).
- Validation: `npm run build` passed (Vite build successful).
