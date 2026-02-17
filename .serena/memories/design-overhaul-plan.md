# Design Overhaul Plan

## Status: Blocked (until prerequisites complete)

**Created**: 2026-02-11
**Last Updated**: 2026-02-12
**Version**: 1.4 (enhanced with skill patterns)
**Implementation Sequence**: Phase 3 of 3 (final phase, requires both features complete)

## Summary

This plan provides complete UI overhaul transforming Kitchen Odyssey to match modern Google Stitch designs while preserving all existing functionality, logic, and features. The overhaul updates all 13 major screens with improved visual hierarchy, modern component patterns, responsive layouts, and enhanced accessibility.

## Content

This memory contains the complete design overhaul implementation plan as documented in:
`c:\Assumption University\CSX4107\Assignments\Project2\Kitchen_Odyssey\plan\design-overhaul-1.md`

## Key Implementation Details

### Scope
- **13 Complete Screen Redesigns**: All major UI screens updated to Stitch design patterns
- **Component Enhancement**: Existing UI components enhanced (Modal, Button, Card, Input, Badge, Tabs, Table)
- **Responsive Design**: Mobile, tablet, desktop layouts with Tailwind breakpoints
- **Accessibility**: WCAG AA compliance testing and implementation
- **Hybrid Color System**: Brand identity (#C8102E) + Stitch accent (#137fec)

### Cross-Feature Integration
- ✅ **Guest Mode**: Fully integrated with `isGuest` state (TASK-OV-034, TASK-OV-045, TASK-OV-054)
- ✅ **Random Recipe**: "Surprise Me" and RecipeSuggestionModal integrated (TASK-OV-011, TASK-OV-018)

## Updates (February 11, 2026)

### Version 1.4 - Enhanced Skill Pattern Integration (2026-02-12)

**Major Addition**: Comprehensive skill pattern integration from frontend-design, react-development, and web-testing skills.

#### New Content Added (~250 lines total)

**Frontend Design Enhancements (added to DESIG-OV-002):**
- 60-30-10 Color Rule Application with detailed breakdown:
  - 60%: Primary Surfaces (#f5f7fa, #ffffff)
  - 30%: Secondary Elements (#e5e7eb, #6b7280)
  - 10%: Brand Accents (#C8102E, #137fec)
- Design Tokens CSS Variables Specification:
  - Color tokens (primary, secondary, brand, status)
  - Spacing tokens (16px-64px exact Tailwind values)
  - Radius tokens (8px consistency)
  - Transition tokens (150ms-300ms)
- Complete implementation example for `src/styles/design-tokens.css`

**React Development Enhancements (added to Phase 9):**
- Performance Optimization Guidelines:
  - Memoization strategy: React.memo for Card, useCallback for Button handlers, virtualization for Table >50 rows
  - Custom hooks reuse: useDebounce (500ms), useLocalStorage, useMediaQuery
  - Code splitting: React.lazy for RecipeCard, Modal, reduce JS bundle size
- Component Priority Order: P0 (Modal, Input, Button), P1 (Card, Table), P2 (Tabs), P3 (Badge)

**Component Patterns & Hooks (added after TASK-OV-047):**
- useFormValidation Hook Pattern:
  - Full implementation in src/hooks/useFormValidation.js
  - handleChange with real-time validation on blur
  - handleBlur to mark fields as touched
  - validateField with validation schema
  - Usage example in CreateRecipe.jsx with error UI
- useDebounce Hook Pattern:
  - Full implementation with useEffect cleanup
  - Delay default 500ms
  - Usage example in Search.jsx for search queries
- Component Composition Examples:
  - Button component with icon composition and icon-only variant
  - Card component with image overlay, badges, footer composition
  - Usage examples showing clean props-based API

**Testing Execution Enhancements (added after TASK-OV-128):**
- Test Execution Order Matrix (17 detailed steps):
  - Week 1: Infrastructure & Critical Paths (9 steps)
    - Install Playwright, config, Page Objects
    - Write user flow tests for 8 critical paths
    - Phased execution aligned with implementation (Phase 1-7 milestones)
  - Week 2: Non-Regression Testing (8 steps)
    - Visual regression (incremental as pages ready)
    - Responsive tests (incremental as pages ready)
    - Accessibility tests (incremental as pages ready)
    - Dynamic data, guest mode, event system tests
    - Chrome DevTools integration & performance benchmarks
    - CI/CD integration, documentation, initial run
- Test Maintenance Guidelines:
  - Visual Regression Baseline Updates:
    - Update only on intentional design changes
    - Review diff process before updating
    - Exclude dynamic content (dates, timestamps, user IDs)
  - Flaky Test Resolution Strategies:
    - Timing Issues: waitForSelector vs fixed timeouts
    - State Conflicts: localStorage cleanup in afterEach
    - Race Conditions: waitForResponse before assertions
    - Viewport Issues: consistent sizes per test
    - Test Failure Analysis: console/network/trace review, Playwright Inspector, flaky tagging, documentation

**Accessibility Enhancements (added after TASK-OV-099):**
- Accessibility Verification Checklist (9 items frontend-design skill):
  - Color Contrast (4.5:1 body, 3:1 large text ≥18px)
  - ARIA Labels (all interactive elements)
  - Keyboard Navigation (logical Tab, Enter/Space, ESC)
  - Focus Management (2px+ ring, modal focus trapping)
  - Screen Reader (aria-live regions)
  - Touch Targets (≥44x44px on mobile, 8px gap)
  - Heading Hierarchy (H1→H2→H3 sequential)
  - Form Accessibility (for/id labels, aria-describedby errors)
  - Image Accessibility (alt text, decorative alt="")

### Version 1.3 - Web Testing Skill Alignment (2026-02-11)

**Major Addition**: Complete testing sections aligned with [web-testing skill](../../.copilot/skills/web-testing/) guidelines.

#### New Sections Added (6 major sections, ~482 lines)

**Section 6: Web Testing Methodology**
- Testing Pillars: Playwright automation, Chrome DevTools, accessibility, visual regression, responsive, cross-browser
- Test Architecture Patterns documented:
  - Page Object Model (POM) with example LoginPage class
  - Fixture patterns for authentication state reuse (admin, user, guest)
  - Global Setup for saving auth states to storage files
  - Test Structure Best Practices with beforeEach/afterEach hooks and test.step() organization
- All 8 Page Objects required for Kitchen Odyssey screens (AuthPage, HomePage, SearchPage, RecipeDetailPage, CreateRecipePage, ProfilePage, AdminStatsPage, AdminRecipesPage, UserListPage)

**Section 7: Testing Implementation Guide** (Expanded Phase 14)
- Detailed breakdown of tasks TASK-OV-114 through TASK-OV-128
- Subtasks defined:
  - TASK-OV-116-A: Create Page Object classes (8 pages)
  - TASK-OV-116-B: Create fixtures with auth state reuse
  - TASK-OV-116-C: Create global setup for auth states

**Section 8: Error Handling & Debugging** (5 test categories)
- TEST-OV-ERROR-001: Console Error Tracking (per web-testing troubleshooting pattern)
- TEST-OV-ERROR-002: Network Request Monitoring (per web-testing network debugging pattern)
- TEST-OV-ERROR-003: JavaScript Exception Handling
- TEST-OV-ERROR-004: User-Friendly Error Messages
- TEST-OV-ERROR-005: Network Error Handling

**Section 9: Performance Monitoring** (6 test categories - following Chrome DevTools pattern)
- TEST-OV-PERF-001: Largest Contentful Paint (LCP) - measure and optimization (< 2.5s target)
- TEST-OV-PERF-002: Cumulative Layout Shift (CLS) - identify and fix layout shifts (< 0.1 threshold)
- TEST-OV-PERF-003: First Input Delay (FID) - optimize main thread blocking
- TEST-OV-PERF-004: Time to Interactive (TTI) - bundle size optimization guides
- TEST-OV-PERF-005: Bundle Size Monitoring (< 100KB JS per route target)
- TEST-OV-PERF-006: Rendering Performance - GPU-accelerated animations

**Section 10: Testing Checklist** (from web-testing skill checklist - 6 domains)
- **Functional Testing** (4 items): user flows, form validation, error handling, edge cases
- **Responsive Testing** (5 items): mobile (375px, 414px), tablet (768px, 1024px), desktop (1280px, 1440px, 1920px), hamburger menu, no horizontal scrollbars (except tables)
- **Cross-Browser Testing** (4 items): Chrome, Firefox, Safari/WebKit, Edge
- **Accessibility Testing** (10 items - expanded from 6): keyboard navigation, focus states, ARIA labels, form labels, alt text, touch targets >= 44x44px, heading hierarchy (H1→H2→H3), form accessibility, color contrast (4.5:1 body, 3:1 large), screen reader announcements
- **Performance Testing** (7 items): page load < 3s, LCP < 2.5s, CLS < 0.1, optimized images, bundle sizes, console errors, Core Web Vitals
- **Error Handling** (5 items): console errors logged, failed network requests, 404s fixed, 500s investigated, user-friendly messages

#### Enhanced Existing Sections

**Section 13 (Dynamic Data Testing)**: Expanded from undefined to 5 specific data scenarios
- Empty state, 1 item, 10 items, 100 items, edge cases (invalid data, very long text, unicode)
- All 8 critical screens tested with 5 scenarios = 40 data validation tests

**Section 14 (Accessibility Testing)**: Expanded from 4 to 8 test categories
- Added TEST-OV-A11Y-005: Heading Hierarchy (logical H1→H2→H3 no skipping)
- Added TEST-OV-A11Y-006: Form Accessibility (labels, aria-describedby, required field indicators)
- Added TEST-OV-A11Y-007: Touch Targets (>= 44x44px on mobile per web-testing checklist)
- Added TEST-OV-A11Y-008: Image Accessibility (descriptive alt text, decorative images alt="")

**Section 15 (Cross-Browser Testing)**: Added TEST-OV-BROWSER-005
- Cross-browser regression prevention (comparison matrix of 4 browsers × 8 critical flows = 32 cross-browser tests)

**Section 16 (Risks & Assumptions)**: Updated Technical Debt from 5 to 8 items
- DEBT-OV-002: Visual regression tests ✅ implemented via Playwright (aligned with web-testing skill)
- DEBT-OV-005: Automated accessibility tests ✅ implemented via axe-core (aligned with web-testing skill)
- DEBT-OV-006: Performance monitoring ✅ implemented via Chrome DevTools (aligned with web-testing skill)
- DEBT-OV-007: Cross-browser testing defined per web-testing skill
- DEBT-OV-008: Dynamic data testing defined per web-testing patterns

#### Test Coverage Expansion

**Estimated Test Cases**: ~229 (up from undefined/baseline)

Breakdown:
- Visual regression: 39 baseline screenshots (13 screens × 3 viewports)
- User flow tests: 8 critical paths with Page Objects
- Accessibility tests: 13 screens with axe-core + 7 additional a11y categories
- Responsive tests: 91 responsive checks (13 screens × 7 viewports: 375, 414, 768, 1024, 1280, 1440, 1920)
- Dynamic data tests: 40 data validation tests (5 scenarios × 8 screens)
- Cross-browser tests: 24 cross-browser checks (3 browsers × 8 critical flows)
- Performance tests: Core Web Vitals for all 13 screens (6 test categories)

#### Related Specifications Updated

Added "Web Testing Skill References" subsection with detailed links:
- Main web-testing skill directory ([../../.copilot/skills/web-testing/](../../.copilot/skills/web-testing/))
- test-patterns.md (POM, fixtures, auth reuse patterns)
- playwright-selectors.md (selector priority guide)
- test-scaffold.ps1 (test file generator script)
- e2e-recipe-app-tests.md (Kitchen Odyssey test suite example)
- Key patterns summary (9 pattern categories)

#### Metadata Updates

- **Version**: 1.2 → 1.3
- **Tags**: Added 'web-testing'
- **Last Updated**: 2026-02-11
- **Total Lines**: 1582 (was 1100, added +482 lines)
- **Section renumbering**: Sections 11+ renumbered to Sections 12+ (Related Specifications is now Section 12)

#### Changelog Entry Added

Added comprehensive changelog at end of Introduction summarizing:
- 6 new sections added
- ~470 lines of web-testing alignment content
- Expanded test coverage from undefined to ~229 test cases
- Enhanced existing sections with specific viewports, a11y categories, performance metrics
- Documented all 8 technical debt items with web-testing alignment status

### Cross-Reference Updates Added (Original v1.2)
- Added detailed implementation order analysis reference
- Referenced guest mode integration tasks throughout plan
- Confirmed random recipe suggestion integration points
- Added comprehensive compatibility notes

### Prerequisite Requirements Confirmed
- ✅ PREREQ-OV-001: Guest Mode MUST be completed first
- ✅ PREREQ-OV-002: Random Recipe MUST be completed second
- ✅ Implementation sequencing prevents all conflicts

### Integration Verification
- ✅ No new components created (reuses existing)
- ✅ No breaking changes to existing functionality
- ✅ Event-driven updates preserved (favoriteToggled, recipeUpdated)
- ✅ Storage.js API surface unchanged

## Design Specifications

### Color System
- **60-30-10 Rule Application**:
  - **60% - Primary Surfaces**: Cool/neutral backgrounds (#f5f7fa, #ffffff) - page backgrounds, card surfaces
  - **30% - Secondary Elements**: Secondary colors and borders (#e5e7eb, #6b7280) - borders, secondary text, muted elements
  - **10% - Brand Accents**: #C8102E (primary) + #137fec (secondary) - CTAs, navigation, interactive highlights
- **Primary Navigation**: #C8102E (Kitchen Odyssey brand)
- **Modern Accent**: #137fec (Stitch blue/teal)
- **Text & Background**: Warm gray/cool-gray scales
- **Status Indicators**: Green (active), yellow (pending), red (suspended)
- **Design Tokens**: Complete CSS variables in `src/styles/design-tokens.css` with colors, spacing (4-16), radius (8px), transitions (150-300ms)

### Typography
- **Font Family**: Work Sans (Google Fonts)
- **Hierarchy**: H1 (700, 32-40px), H2 (600, 20-24px), H3 (500-600, 16-18px), Body (400, 14-16px)

### Spacing & Layout
- **Border Radius**: 8px for all components (ROUND_EIGHT)
- **Responsive Grid**: Mobile (1 col), Tablet (2-3 cols), Desktop (4+ cols)
- **Spacing Scale**: Tailwind values (4=16px, 6=24px, 8=32px, 12=48px, 16=64px)

### Performance Patterns
- **Memoization**: React.memo for large lists, useCallback for handlers
- **Custom Hooks**: useDebounce (500ms), useLocalStorage, useMediaQuery
- **Code Splitting**: React.lazy for heavy components (RecipeCard, Modal)
- **Bundle Size Target**: <100KB JS per route

## Files Modified (for reference)

**All 13 Screen Files:**
- Authentication: Login.jsx, Signup.jsx, AuthLayout.jsx
- Recipe: Home.jsx, Search.jsx, RecipeDetail.jsx, CreateRecipe.jsx, Profile.jsx
- Admin: AdminStats.jsx, AdminRecipes.jsx, UserList.jsx

**Layout Components:**
- Navbar.jsx, Sidebar.jsx, RootLayout.jsx, AuthLayout.jsx, AdminLayout.jsx

**UI Components (Enhanced):**
- Modal.jsx, Button.jsx, Card.jsx, Input.jsx, Tabs.jsx, Table.jsx, Badge.jsx

## Testing Coverage

**Most comprehensive suite included:**
- Visual regression testing (all 13 screens × 3 viewports = 39 baseline screenshots)
- User flow testing (8 critical paths with Page Objects)  
- Accessibility testing (WCAG AA with axe-core)
- Responsive testing (13 screens × 7 viewports = 91 checks)
- Cross-browser testing (Chrome, Firefox, Edge, Safari)
- Performance testing (Core Web Vitals with Chrome DevTools)

## Dependencies

**Prerequisites**: 
- Guest Mode feature MUST be completed (provides isGuest state)
- Random Recipe feature MUST be completed (provides RecipeSuggestionModal)

**Enables**: Launch with modern, production-ready UI

**Blocked by**: Guest Mode and Random Recipe features

**Blocks**: None (final implementation phase)

## Implementation Constraints

### Technical Constraints
- No new components created (reuse existing)
- Maintain existing AuthContext and storage.js API
- Preserve all event-driven updates
- Follow existing React patterns

### Design Constraints  
- Match Stitch design patterns exactly
- Use hybrid color system (brand + accent)
- Implement responsive breakpoints
- Meet WCAG AA accessibility standards

## Acceptance Criteria

**35 Total Requirements:**
- Functional completeness (AC-OV-001 through AC-OV-016)
- Integration compatibility (AC-OV-017 through AC-OV-032)
- Testing completeness (TEST-OV-001 through TEST-OV-012)

## Related Documents

- [IMPLEMENTATION-SEQUENCE-ANALYSIS.md](./IMPLEMENTATION-SEQUENCE-ANALYSIS.md) - Complete compatibility analysis with all three plans
- [feature-guest-mode-1.md](./feature-guest-mode-1.md) - Prerequisite feature (Phase 1)
- [feature-random-recipe-suggestion-1.md](./feature-random-recipe-suggestion-1.md) - Prerequisite feature (Phase 2)

---

**Implementation Ready**: ✅ All tasks defined, cross-compatibility verified, comprehensive testing documented.
## Memory Update (2026-02-14)

- Cross-feature requirement updated: guest usage of Random Recipe must not increment per-recipe view counts, daily_stats.views, or activeUsers.
- TASK-OV-122 validation now requires checking all three metrics above.
