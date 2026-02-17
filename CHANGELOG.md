# Changelog

All notable changes to Kitchen Odyssey will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — Phase 6: Security & Observability Hardening

#### Security Utilities (Backend)
- **Rate Limiting** (`rateLimit.js`) — In-memory sliding window rate limiter for auth (20/15min), write (50/15min), and read (100/15min) endpoints
- **Input Validation** (`validate.js`) — Schema-based validation with `sanitizeString`, `sanitizeQuery` (NoSQL injection defense), and validators for email, username, password, recipe title, comment, search query
- **Structured Logging** (`logger.js`) — JSON structured logger with `createLogger(context)` and `correlationId(request)` for request tracing
- **Security Headers** — Added `X-DNS-Prefetch-Control`, `Strict-Transport-Security`, `Permissions-Policy` to `next.config.mjs`
- **Rate limiting applied** to auth login/signup (auth tier), recipe creation (write tier), review submission (write tier)
- **Input validation applied** to login and signup routes using `schemas` validators
- **33 new unit tests** (validate: 22, rateLimit: 5, logger: 6) — total: 82 tests passing

#### Files Created
- `kitchen-odyssey-backend/src/lib/rateLimit.js`
- `kitchen-odyssey-backend/src/lib/validate.js`
- `kitchen-odyssey-backend/src/lib/logger.js`
- `kitchen-odyssey-backend/tests/validate.test.js`
- `kitchen-odyssey-backend/tests/rateLimit.test.js`
- `kitchen-odyssey-backend/tests/logger.test.js`

#### Files Modified
- `kitchen-odyssey-backend/src/app/api/v1/auth/login/route.js` (rate limiting + input validation)
- `kitchen-odyssey-backend/src/app/api/v1/auth/signup/route.js` (rate limiting + input validation)
- `kitchen-odyssey-backend/src/app/api/v1/recipes/route.js` (rate limiting)
- `kitchen-odyssey-backend/src/app/api/v1/recipes/[id]/reviews/route.js` (rate limiting)
- `kitchen-odyssey-backend/next.config.mjs` (additional security headers)

### Added — Phase 5: Frontend Integration

#### API Client & Storage API Adapter
- **apiClient.js** — HTTP client wrapping fetch with HttpOnly cookie auth, JSON envelope unwrapping, and `ApiError` class
- **storageApi.js** — Drop-in replacement for `storage.js` mapping 34 methods to backend API calls

#### Async Component Conversion (All 10 Components)
- **AuthContext.jsx** — Async session restore, login/logout/signup, `userId` computed property for `_id`/`id` compatibility
- **Home.jsx** — Async recipe loading via `useEffect`, `handleSurpriseMe`/`handleTryAnother` async
- **Search.jsx** — Async recipe/search history loading, async search logging and clear
- **CreateRecipe.jsx** — Async edit mode loading, async `handleSubmit`
- **RecipeDetail.jsx** — Async recipe/author/review loading, all 6 event handlers async
- **Profile.jsx** — Async profile user and recipe loading, async delete handler
- **RecipeCard.jsx** — Async author/rating loading via `Promise.all`, async like/save handlers
- **RecipeSuggestionModal.jsx** — Async reviews loading
- **AdminRecipes.jsx** — Async recipe/user loading, async status/delete/preview handlers
- **UserList.jsx** — Async user loading, async status change/delete handlers
- **AdminStats.jsx** — Async stats loading via `Promise.all`

#### Files Created
- `src/lib/apiClient.js`
- `src/lib/storageApi.js`

#### Files Modified
- `src/context/AuthContext.jsx`
- All 10 component files listed above

### Changed - 2026-02-17

#### Sort Consistency (Discover + Search)
- Search page sort control now uses the same model as Discover (`Home`) sort:
  - `Trending`, `Newest`, `Highest Rated`, `A-Z`
- Removed Search-only sort mode (`Difficulty: Low → High`) to keep both pages aligned
- Search URL/default/reset sort behavior now uses `trending` as the baseline (same as Discover)

#### Files Modified
- `src/pages/Recipe/Search.jsx`
- `README.md`

### Changed - 2026-02-17

#### Light Blue/Cyan Color System
- **Color System v4.0** - Changed primary color from terracotta to light blue and cyan
  - **Brand colors:** `#0284C7` (brand), `#06B6D4` (brand-accent), `#0891B2` (hover), `#38BDF8` (light), `#E0F2FE` (pale)
  - **Gradients:** Updated brand gradient to `#06B6D4 → #0284C7` and hero gradient to `#38BDF8 → #06B6D4 → #0284C7`
  - **Shadows:** Updated brand shadow to use cyan `rgba(6, 182, 212, 0.25)`
  - **RecipeCard hover:** Added `hover:bg-brand-pale/50` for cyan tint on card hover with full border color change
- **Design Philosophy:** "Fresh Culinary" - inspired by fresh ingredients, clean kitchens, and coastal waters
- **Files Modified:**
  - `src/index.css` - Updated brand color variables, gradients, and shadows
  - `src/components/recipe/RecipeCard.jsx` - Enhanced hover state with cyan background
  - `DESIGN.md` - Updated color palette documentation

### Reverted - 2026-02-17

#### Multi-Color Palette System → Single Color
- **Reverted** multi-color palette (v3.0) back to single-color terracotta scheme
  - Removed Teal, Sky Blue, and Ocean Blue color families
  - Removed corresponding gradients and shadow utilities
  - Button component: Removed `teal`, `sky`, and `ocean` variants
  - Badge component: Removed `teal`, `sky`, and `ocean` variants
  - Filter chips: Reverted to single-color approach (all use brand/terracotta)
  - "Surprise Me" button: Reverted to outline style with white/10 background
- **Kept** warm neutral backgrounds (cream, warm-white, warm-grays) - these remain
- **Kept** Sage Green and Golden Ochre accent colors

#### Files Modified
- `src/index.css` - Removed 12 color variables, 3 gradients, 3 shadow utilities, 6 utility classes
- `src/components/ui/Button.jsx` - Removed teal/sky/ocean variants
- `src/components/ui/Badge.jsx` - Removed teal/sky/ocean variants
- `src/pages/Recipe/Home.jsx` - Reverted filter chips and "Surprise Me" button

### Fixed - 2026-02-17

#### Recipe Navigation (My Recipes)
- **RecipeDetail.jsx** - Updated access guard so recipe owners can open their own pending/rejected recipes from the "My Recipes" tab
- Prevents unintended redirect to Home when clicking non-published recipes authored by the current user

#### Files Modified
- `src/pages/Recipe/RecipeDetail.jsx` (detail access condition for owner-authored non-published recipes)
- `README.md` (Recipe Management behavior clarification)

### Changed - 2026-02-17

#### Multi-Color Palette System
- **Color System v3.0** - Expanded from single terracotta palette to vibrant multi-color system
  - Added Teal (`#2A9D8F`) - Used for "Surprise Me" button and fresh features
  - Added Sky Blue (`#0EA5E9`) - Used for breakfast filters and light CTAs
  - Added Ocean Blue (`#075985`) - Used for easy recipes and professional elements
  - Enhanced existing Sage Green (`#81B29A`) and Golden Ochre (`#E9C46A`) accents
  - All white backgrounds replaced with warm neutral palette (cream, warm-white, warm-grays)
- **Component Updates**
  - Filter chips now use unique colors per filter (Trending=Terracotta, Quick=Teal, Vegetarian=Sage, Desserts=Gold, Breakfast=Sky, Easy=Ocean)
  - Button component: Added `teal`, `sky`, and `ocean` variants
  - Badge component: Added `teal`, `sky`, and `ocean` variants
  - 21 components updated with warm neutral backgrounds
- **New CSS Variables**
  - `--color-teal*` - Teal color family (4 variants)
  - `--color-sky*` - Sky blue color family (4 variants)
  - `--color-ocean*` - Ocean blue color family (4 variants)
  - `--gradient-teal`, `--gradient-sky`, `--gradient-ocean`
  - `--shadow-teal`, `--shadow-sky`, `--shadow-ocean`
- **Accessibility** - All new color combinations meet WCAG AA standards (4.5:1+ contrast)

#### Files Modified
- `src/index.css` - Added 12 new color variables, 3 gradients, 3 shadow utilities, 3 badge classes
- `src/components/ui/Button.jsx` - Added teal, sky, ocean variants
- `src/components/ui/Badge.jsx` - Added teal, sky, ocean variants
- `src/components/ui/Card.jsx` - Updated to warm-white background
- `src/components/ui/Modal.jsx` - Updated to warm-white background
- `src/components/ui/Input.jsx` - Updated to warm-white background
- `src/components/ui/Tabs.jsx` - Updated to warm grays
- `src/components/ui/Table.jsx` - Updated to warm grays
- `src/components/layout/Navbar.jsx` - Updated to warm-white with cream backdrop
- `src/components/layout/Sidebar.jsx` - Updated to warm-white background
- `src/layouts/RootLayout.jsx` - Updated to cream background
- `src/layouts/AdminLayout.jsx` - Updated to cream background
- `src/layouts/AuthLayout.jsx` - Updated to warm-white background
- `src/components/recipe/RecipeCard.jsx` - Updated to warm grays
- `src/pages/Recipe/Home.jsx` - "Surprise Me" button now teal, multi-color filter chips
- All page components - Updated white backgrounds to warm neutral palette
- `DESIGN.md` - Updated color palette section
- `COLOR_PALETTE.md` - Complete rewrite with multi-color documentation

### Changed - 2026-02-18

#### Migration Plan Code Modernization (Documentation Only)
- **Next.js 16 proxy.js** — All `middleware.js` references updated to `proxy.js` across migration plan (SEC-007, TASK-005, TASK-042) and security doc
- **Next.js 16 API Patterns** — New Section 3.5 added to migration plan covering async params, async headers/cookies, `Response.json()`, `after()` API, and proxy.js usage
- **MongoDB Atlas** — Connection verified; EC-010 connection code updated to Mongoose cached promise pattern
- **CORS** — Added `proxy.js` global CORS alternative alongside route-handler approach
- **Security doc** — Framework note and checklist updated for `proxy.js` and Node.js runtime

#### Files Modified
- `plan/architecture-nextjs-mongodb-migration-1.md` (8 edits — frontmatter, SEC-007, TASK-005, TASK-042, EC-010, Sections 3.3–3.7)
- `docs/security-considerations-1.md` (3 edits — framework note, checklist, last_updated)

---

### Fixed - 2026-02-17

#### Code Quality
- **AuthContext.jsx** - Fixed missing `isGuest` dependency in useEffect dependency array
  - Prevents potential stale closure bug when guest mode state changes
  - Resolves `react-hooks/exhaustive-deps` ESLint warning

- **RecipeDetail.jsx** - Refactored setState calls in useEffect
  - Wrapped state updates in `requestAnimationFrame` callback to prevent cascading renders
  - Added proper cleanup with `cancelAnimationFrame`
  - Resolves `react-hooks/set-state-in-effect` ESLint error

- **Home.jsx** - Fixed Discover sorting/filtering data references
  - Updated `Under 30min` filter to use total recipe time (`prepTime + cookTime`)
  - Replaced non-persisted sort fields (`reviewCount`, `averageRating`) with storage-derived metrics (`getReviews`, `getAverageRating`, likes)
  - Ensures `rating` and `trending` sort orders reflect actual stored engagement data

- **storage.js** - Added cascade cleanup in `deleteUser`
  - Deleting a user now removes their authored recipes
  - Cleans related reviews, favorites/view history links, and daily stats references
  - Prevents orphaned recipe/author references in UI flows

- **RecipeDetail.jsx** - Guarded author profile link rendering
  - Avoids navigation to `/users/undefined` when author record is missing
  - Falls back to a non-link `By Unknown` display state

#### Build Status
- ✅ ESLint: 0 errors, 0 warnings across all 26 React components
- ✅ Build: Passing (2.24s, 1743 modules transformed)

### Files Modified
- `src/context/AuthContext.jsx` (line 66)
- `src/pages/Recipe/RecipeDetail.jsx` (lines 33-65, author fallback rendering)
- `src/pages/Recipe/Home.jsx` (quick filter + sort logic)
- `src/lib/storage.js` (`deleteUser` cascade cleanup)
- `README.md` (behavior notes for filtering/sorting and deletion cascade)

---

### Fixed - 2026-02-17

#### Admin Dashboard Metrics & UX
- **AdminStats.jsx** - Fixed all metrics to use real computed data instead of hardcoded values
  - **Total Users**: Now computes month-over-month growth from `joinedDate` comparisons
  - **Active Recipes**: Shows percentage of published recipes with engagement (likes/views)
  - **Total Likes**: Renamed from misleading "Daily Likes" and shows average likes per recipe
  - **Recipe Trends Progress Bar**: Dynamic width based on top categories' actual share
  - **Category Trend Percentages**: Real share of published recipes (`recipesInCategory / totalPublished * 100`)

- **AdminStats.jsx** - Fixed "View All" and "View Full Report" buttons
  - Both now launch scrollable modals with full data (up to 200 activity entries, all categories)
  - Modals only close via close button (NOT outside click or Escape key)

- **Modal.jsx** - Added `persistent` prop for close-button-only behavior
  - When `persistent=true`, backdrop click and Escape key are disabled
  - Use for data-heavy modals where accidental dismissal loses context

#### Files Modified
- `src/pages/Admin/AdminStats.jsx` (metrics calculations, modal implementations)
- `src/components/ui/Modal.jsx` (`persistent` prop support)
- `README.md` (updated admin dashboard metrics documentation)

---

## [0.0.0] - Initial Release

### Features
- Role-based access control (Admin, Contributor, Guest)
- Recipe approval workflow with content moderation
- Guest mode for read-only browsing
- Advanced search, filtering, and quality-based recommendations
- Real-time analytics and activity logging
- 32 automated Playwright tests covering Guest Mode and Random Recipe Suggestion

### Technology Stack
- React 19.2.0
- React Router DOM 7.13.0
- Vite 7.2.4
- Tailwind CSS 4.1.18
- ESLint 9.39.1
- Playwright 1.58.2
