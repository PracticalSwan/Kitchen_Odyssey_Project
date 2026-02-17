# Changelog

All notable changes to Kitchen Odyssey will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed - 2026-02-17

#### Code Quality
- **AuthContext.jsx** - Fixed missing `isGuest` dependency in useEffect dependency array
  - Prevents potential stale closure bug when guest mode state changes
  - Resolves `react-hooks/exhaustive-deps` ESLint warning

- **RecipeDetail.jsx** - Refactored setState calls in useEffect
  - Wrapped state updates in `requestAnimationFrame` callback to prevent cascading renders
  - Added proper cleanup with `cancelAnimationFrame`
  - Resolves `react-hooks/set-state-in-effect` ESLint error

#### Build Status
- ✅ ESLint: 0 errors, 0 warnings across all 26 React components
- ✅ Build: Passing (2.24s, 1743 modules transformed)

### Files Modified
- `src/context/AuthContext.jsx` (line 66)
- `src/pages/Recipe/RecipeDetail.jsx` (lines 33-65)

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
