# Changelog

All notable changes to Kitchen Odyssey will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
