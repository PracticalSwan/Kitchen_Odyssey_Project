---
goal: Complete Design Overhaul - Modernize UI based on Google Stitch designs while preserving all functionality
version: 1.8
date_created: 2026-02-11
last_updated: 2026-02-14
owner: Project Team
status: 'On Hold'
tags: ['design', 'ui-overhaul', 'stitch', 'components', 'responsive', 'accessibility', 'automated-testing', 'web-testing', 'performance', 'react-patterns', 'color-theory']
---

# Introduction

![Status: On Hold](https://img.shields.io/badge/status-On%20Hold-orange)

This implementation plan provides a complete design overhaul for the Kitchen Odyssey Recipe Sharing System, transforming the current UI to match modern Google Stitch designs while preserving all existing functionality, logic, and features. The overhaul updates all major screens (13 total) with improved visual hierarchy, modern component patterns, responsive layouts, and enhanced accessibility, ensuring seamless integration with Guest Mode and Random Recipe Suggestion features.

**Testing Methodology Update (v1.3):** All testing sections in this plan are now aligned with Playwright best practices for a Vite + React app. Testing implementation follows established patterns for:
- Page Object Model (POM) architecture with reusable page classes
- Fixtures for authentication state reuse (admin, user, guest)
- Global setup for saving auth states to storage files
- Playwright test structure with beforeEach/afterEach hooks and test.step()
- Visual regression testing with screenshot comparison
- Accessibility testing via @axe-core/playwright for WCAG AA compliance
- Chrome DevTools integration for performance profiling and debugging
- Comprehensive testing checklist covering functionality, responsive, cross-browser, accessibility, performance, and error handling

---

## Changelog

### Version 1.8 (2026-02-14)
- Session delta documentation update: recorded broad UI refinement changes across shared components, layouts, and admin/recipe/auth pages.
- Confirmed branding/docs state remains: app name "Kitchen Odyssey" with demo credentials still using `@cookhub.com`.

### Version 1.7 (2026-02-14)
- Documentation clarification: branding is "Kitchen Odyssey" while demo credentials remain `@cookhub.com`.
- Synchronized README + Serena memory notes to avoid ambiguity between app naming and demo-account domains.

### Version 1.6 (2026-02-14)
- Documentation alignment update for brand rename to "Kitchen Odyssey" across plan references and related docs.
- Added implementation note that auth branding lockup (logo + title) is centered in `AuthLayout` for Login/Signup consistency.
- Confirmed localStorage key prefix `cookhub_` remains unchanged for backward compatibility.

### Version 1.5 (2026-02-14)
- Clarified guest analytics requirement to exclude guest views from per-recipe view counts (`viewedBy` / `getViewCount`) in addition to `daily_stats.views`.
- Updated cross-feature references to `FREQ-RS-000-1`, `FREQ-RS-000-2`, and `AC-RS-033`.
- Updated guest-mode test task descriptions (`TASK-OV-122`) to verify per-recipe view counts, `daily_stats.views`, and `activeUsers` all exclude guest entries.
- Updated metadata and consistency wording for plan-only references.

### Version 1.4 (2026-02-12)
- **Major Update**: Enhanced plan with frontend-design, react-development, and Playwright testing patterns
- **Frontend Design**:
  - Added 60-30-10 color rule application to DESIG-OV-002 with detailed breakdown
  - Added design tokens CSS variables specification with complete color, spacing, radius, and transition tokens
  - Added comprehensive accessibility verification checklist (9 items: contrast, ARIA, keyboard, focus, screen reader, touch targets, heading hierarchy, forms, images)
- **React Development**:
  - Added performance optimization guidelines (memoization strategy for Card, Button, Table components)
  - Added custom hooks reuse patterns (useDebounce, useLocalStorage, useMediaQuery)
  - Added code splitting strategy (React.lazy for RecipeCard, Modal components)
  - Added useFormValidation hook pattern with full implementation example and usage
  - Added useDebounce hook pattern with implementation example
  - Added component composition examples for Button and Card components
- **Testing Execution**:
  - Added test execution order matrix (17 steps across Week 1 & Week 2)
  - Aligned test tasks with implementation phases (Phase 1-7 milestones)
  - Added test maintenance guidelines with visual regression baseline update process
  - Added flaky test resolution strategies (timing, state conflicts, race conditions, viewport issues)
  - Added test failure analysis recommendations (debug tools, flaky test tagging, documentation)
- Enhanced tags: ['design', 'ui-overhaul', 'stitch', 'components', 'responsive', 'accessibility', 'automated-testing', 'web-testing', 'performance', 'react-patterns', 'color-theory']
- Total estimated test cases increased to ~229 covering all skill patterns

### Version 1.3 (2026-02-11)
- **Major Update**: Complete testing alignment with Playwright testing guidelines
- Added 'web-testing' to tags
- Changed version from 1.2 to 1.3

Detailed changes documented in Testing Methodology update above.

## 1. Requirements & Constraints

### Functional Requirements

- **FREQ-OV-001**: All 13 screens from Stitch project must be implemented in new design
- **FREQ-OV-002**: No hardcoded data values in the UI (counts, names, images, metrics) - all data must come from:
  - `src/lib/storage.js` for recipe data, user data, metrics, search history, activity logs
  - `src/context/AuthContext.jsx` for user authentication state (user, isGuest, canInteract)
  - Dynamic component props for data-bound values
  - Conditional rendering based on real data states (no mocked UI for any screen)
  - Static labels are allowed when not derived from data
  - Test with varied data sets (empty, 1 item, 100 items) during implementation
  - VIOLATION: Any hardcoded recipe names, user counts, or fixed data in JSX will fail tests
- **FREQ-OV-003**: All existing functionality must be preserved and connected to new design
- **FREQ-OV-004**: Guest mode functionality must be fully integrated (isGuest state, guest badges, restricted states)
- **FREQ-OV-005**: Random recipe suggestion must be integrated ("Surprise Me" button, RecipeSuggestionModal)
- **FREQ-OV-006**: All authentication flows (login, signup, guest mode) must work in new design
- **FREQ-OV-007**: Recipe management (create, edit, delete) must work in new design
- **FREQ-OV-008**: Search and filtering functionality must be preserved
- **FREQ-OV-009**: Admin dashboard and management tables must remain functional
- **FREQ-OV-010**: User profile with tabs must work in new design
- **FREQ-OV-011**: Responsive design must work across mobile, tablet, and desktop
- **FREQ-OV-012**: All interactive features (like, favorite, review) must work with new design
- **FREQ-OV-013**: Restricted states (pending, suspended, guest) must be clearly communicated
- **FREQ-OV-014**: Empty states must be handled gracefully with Stitch-inspired designs
- **FREQ-OV-015**: Loading states must provide visual feedback
- **FREQ-OV-016**: Error states must be handled with user-friendly messages
- **FREQ-OV-017**: Guest usage of Random Recipe Suggestion must not increment any view metrics (FREQ-RS-000-1, FREQ-RS-000-2, AC-RS-033)
  - per-recipe view counts (`viewedBy` / `getViewCount`) must not include guest views
  - `daily_stats.views` must not contain guest ID entries
  - `activeUsers` array must not contain guest IDs
  - Verifies complete guest analytics bypass across Random Recipe feature

### Technical Constraints

- **CON-OV-001**: No new base UI components; reuse existing primitives (Modal, Button, Card, Input, Badge, Tabs, Table). Feature-specific components are allowed only when they compose existing UI components
- **CON-OV-002**: Use hybrid color system blending brand identity (#C8102E) with Stitch modern accent (#137fec) — see detailed DESIG-OV-002 below
- **CON-OV-003**: Maintain existing routing (HashRouter) and navigation patterns
- **CON-OV-004**: Preserve existing AuthContext state management (user, isGuest, canInteract)
- **CON-OV-005**: Maintain existing storage.js API surface (all data operations)
- **CON-OV-006**: Follow existing React patterns (hooks, callbacks, event listeners)
- **CON-OV-007**: Avoid hardcoded copy when it should come from data; static UI labels are acceptable
- **CON-OV-008**: Maintain existing layout components (Navbar, Sidebar, AuthLayout, AdminLayout)
- **CON-OV-009**: Preserve all event-driven updates (favoriteToggled, recipeUpdated, etc.)

### Design Constraints

- **DESIG-OV-001**: Match Stitch design patterns (card-based layouts, ample whitespace, clear typography)
- **DESIG-OV-002**: Maintain hybrid color system respecting both Kitchen Odyssey's cooking theme (#C8102E) and Stitch's modern aesthetic (#137fec):
  - **Primary Navigation & Brand Identity:** Use #C8102E (existing brand wine red) for:
    - Navbar logo and primary navigation links
    - Primary CTA buttons (Create Recipe, Save, etc.)
    - Hero section gradients (blending #C8102E → #137fec)
    - Brand-identity elements requiring strong visual connection
  - **Modern Accent & Interactive Highlights:** Use #137fec (Stitch blue/teal) for:
    - Secondary buttons and link states
    - Hover states on primary buttons
    - Active tabs and indicator pills
    - Focus rings and outline states
    - Status badges (green/red/yellow) with warm gray text
    - Card border hover effects (opacity 0.1-0.2)
    - Active section indicators in navigation
  - **Text & Background:** Maintain warm gray/cool-gray scales from existing design for:
    - Primary text (dark gray/black)
    - Secondary text (medium gray)
    - Placeholder and disabled states (light gray)
    - Surface backgrounds (white/off-white)
  - **Color Contrast Requirements:** Ensure all color combinations meet WCAG AA standards:
    - Primary text on light backgrounds: 4.5:1 minimum
    - Large text on colored backgrounds: 3:1 minimum
    - Verify with contrast checker during implementation (TASK-OV-099)
  - **Implementation Note:** This hybrid approach preserves Kitchen Odyssey's established cooking theme while adopting Stitch's modern, polished aesthetic

**60-30-10 Rule Application:**
- **60% - Primary Surfaces**: Cool/neutral backgrounds (#f5f7fa, #ffffff) - page backgrounds, card surfaces
- **30% - Secondary Elements**: Secondary colors and borders (#e5e7eb, #6b7280) - borders, secondary text, muted elements
- **10% - Brand Accents**: #C8102E (primary) + #137fec (secondary) - CTAs, navigation, interactive highlights

**Design Tokens Implementation:**
```css
/* src/styles/design-tokens.css */
:root {
  /* 60% - Primary Surfaces */
  --color-primary-bg: #f5f7fa;
  --color-primary-surface: #ffffff;
  --color-primary-text: #334155;
  
  /* 30% - Secondary Elements */
  --color-secondary-border: #e5e7eb;
  --color-secondary-text: #6b7280;
  --color-secondary-muted: #94a3b8;
  
  /* 10% - Brand Accents */
  --color-brand-primary: #C8102E;
  --color-brand-secondary: #137fec;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  /* Spacing Scale */
  --spacing-sm: 16px;   /* 4 */
  --spacing-md: 24px;   /* 6 */
  --spacing-lg: 32px;   /* 8 */
  --spacing-xl: 48px;   /* 12 */
  --spacing-2xl: 64px; /* 16 */
  
  /* Border Radius */
  --radius-md: 8px;
  
  /* Transitions */
  --transition-fast: 150ms;
  --transition-base: 200ms;
  --transition-slow: 300ms;
}
```
- **DESIG-OV-002.1**: Use consistent 8px border radius for all components matching Stitch's "ROUND_EIGHT" setting:
  - All buttons (primary, secondary, tertiary): 8px border radius
  - All cards (recipe cards, user cards, form cards): 8px border radius
  - All inputs (text inputs, selects, textareas): 8px border radius
  - All modals: 8px border radius
  - Small badges/tags: 4-6px border radius (slightly smaller pill shape)
  - This consistency is critical for polished, cohesive appearance across all 13 screens
- **DESIG-OV-002.2**: Use "Work Sans" font family as specified in Stitch design theme:
  - Import Work Sans from Google Fonts (add to public/index.html or index.html)
  - Apply as primary font family across all pages and components
  - Use weight scale consistently: 300 (light), 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)
  - This replaces or supplements existing font choices to match Stitch typography exactly
- **DESIG-OV-003**: Maintain visual hierarchy from Stitch (headings > subheadings > body text) with specific font weights and sizes:
  - H1 (Page Titles): 32-40px, weight 700 (bold), line-height 1.1-1.2
  - H2 (Card/Section Titles): 20-24px, weight 600 (semi-bold), line-height 1.2-1.3
  - H3 (Tab Labels/Form Sections): 16-18px, weight 500-600, line-height 1.3-1.4
  - Body (Content): 14-16px, weight 400 (regular), line-height 1.5-1.6
  - Small (Metadata): 12-14px, weight 300-400, line-height 1.3-1.4
- **DESIG-OV-004**: Use Tailwind responsive breakpoints for grid systems with exact breakpoint values:
  - **Mobile (< 640px):** 1 column grid for all content using Tailwind's default (no breakpoint prefix)
  - **Small tablet (640px-768px):** 2 column grid using `sm:` prefix for cards and sections
  - **Large tablet (768px-1024px):** 2-3 column grid using `md:` and `lg:` prefixes
  - **Desktop (1024px-1280px):** 4 column grid using `xl:` prefix
  - **Large desktop (> 1280px):** 5 column grid for hero/featured sections using `2xl:` prefix
  - All responsive classes must use Tailwind's consistent breakpoint prefixes (no custom breakpoints)
- **DESIG-OV-005**: Implement consistent spacing using Tailwind spacing scale with exact pixel mappings:
  - **4 (16px):** Small gaps between related items — card grid gaps, form field spacing, padding inside containers
  - **6 (24px):** Medium gaps (between sections) — spacing between content sections, sidebar-to-content spacing
  - **8 (32px):** Large gaps (between major containers) — major page sections, wrapper padding
  - **12 (48px):** Very large gaps (page margins) — page margins, padding between top-level sections
  - **16 (64px):** Extra large gaps (hero sections) — hero section padding, prominent visual breaks
  - Use these exact Tailwind scale values (no custom spacing values) for consistency
- **DESIG-OV-006**: Interactive elements must have hover states and transitions (0.2-0.3s duration using Tailwind transition utilities)
- **DESIG-OV-007**: Use color-coded status indicators (green for active, yellow for pending, red for suspended)
- **DESIG-OV-008**: Modal overlays must have backdrop blur and fade-in animations
- **DESIG-OV-009**: Tables must have sticky headers, sortable columns, responsive overflow
- **DESIG-OV-010**: Images must have aspect ratio preservation and skeleton loaders
- **DESIG-OV-011**: Forms must have client-side validation with clear error messages

### Accessibility Requirements

- **A11Y-OV-001**: All interactive elements must have proper ARIA labels
- **A11Y-OV-002**: Focus management must be implemented (focus trapping in modals)
- **A11Y-OV-003**: Keyboard navigation must work (Tab, Enter, ESC keys)
- **A11Y-OV-004**: Color contrast must meet WCAG AA standards (4.5:1 ratio minimum)
- **A11Y-OV-005**: Screen reader announcements for dynamic content changes
- **A11Y-OV-006**: Focus visible state must be clearly indicated

### Testing Requirements

- **TEST-OV-001**: Manual testing of all 13 screens to ensure design matches Stitch
- **TEST-OV-002**: Test all existing functionality with new design (no regressions)
- **TEST-OV-003**: Responsive testing on mobile (375px), tablet (768px), desktop (1920px)
- **TEST-OV-004**: Accessibility testing with keyboard navigation and screen readers
- **TEST-OV-005**: Test guest mode integration across all screens (badge visibility, restricted states, and no guest view-count increments)
- **TEST-OV-006**: Test random recipe suggestion integration (button, modal, loading states)
- **TEST-OV-007**: Cross-browser testing (Chrome, Firefox, Edge, Safari)
- **TEST-OV-008**: Verify no hardcoded values (test with different data sets) - Supported by automated tests (TASK-OV-121)
- **TEST-OV-009**: Verify all existing events (favoriteToggled, recipeUpdated) still fire correctly - Supported by automated tests (TASK-OV-123)
- **TEST-OV-010**: Run automated Playwright test suite - Execute all automated tests (TASK-OV-114 through TASK-OV-128) to ensure no regressions
- **TEST-OV-011**: Verify visual regression tests pass - Ensure no unintended layout/visual changes across 13 screens
- **TEST-OV-012**: Review performance metrics against baselines - Ensure Core Web Vitals (LCP, CLS, FID, TTI) remain acceptable

### Guidelines & Patterns

- **GUD-OV-001**: Follow Stitch design patterns identified from screen screenshots
- **GUD-OV-002**: Maintain existing component structure and naming conventions
- **GUD-OV-003**: Use existing state management patterns (useState, useEffect, useCallback)
- **GUD-OV-004**: Reuse existing validation patterns from forms
- **GUD-OV-005**: Follow existing routing patterns (useNavigate, useParams)
- **GUD-OV-006**: Use existing event dispatching patterns (window.dispatchEvent)
- **GUD-OV-007**: Maintain existing layout patterns (Navbar fixed top, Sidebar fixed left for admin)
- **GUD-OV-008**: Follow existing animation patterns (animate-page-in, transitions)
- **PAT-OV-001**: Reuse existing Modal component wrapper pattern for all modals
- **PAT-OV-002**: Follow existing Card component structure for recipe/user cards
- **PAT-OV-003**: Use existing Badge component for status indicators
- **PAT-OV-004**: Follow existing Table component pattern for admin tables
- **PAT-OV-005**: Use existing Tabs component for multi-panel interfaces
- **PAT-OV-006**: Use existing cn() utility for className merging

## 2. Implementation Steps

### Prerequisite: Complete Existing Features

**CRITICAL**: This design overhaul plan MUST be executed AFTER both existing feature plans are complete:

- **PREREQ-OV-001**: ✅ Complete [feature-guest-mode-1.md](./feature-guest-mode-1.md) implementation
  - Adds isGuest state to AuthContext
  - Adds "Continue as Guest" button to Login/Signup pages
  - Implements guest mode functionality (read-only browsing, no metrics)
  - Status: ✅ **Implemented** (2026-02-14) — Live-tested with Playwright MCP (8/8 tests passed)

- **PREREQ-OV-002**: ✅ Complete [feature-random-recipe-suggestion-1.md](./feature-random-recipe-suggestion-1.md) implementation
  - Adds "Surprise Me" button to Home page
  - Adds RecipeSuggestionModal component
  - Implements random recipe suggestion with quality constraints
  - Status: ✅ **Implemented** (2026-02-14) — Live-tested with Playwright MCP (3/3 tests passed)

**Implementation Order Analysis**: Guest Mode and Random Recipe features are compatible and must be completed before the Design Overhaul to avoid rework. This order prevents integration conflicts and ensures all new states are represented in the redesigned screens.

**Rationale**: Both features add components, state, and functionality that the new design must display and respect. Implementing design overhaul first would require significant revisions to account for these features.

### Implementation Phase 1: Authentication Pages Redesign (Estimated: 3-4 hours)

- GOAL-001: Redesign Login and Signup pages with modern card-based layout, integrated guest mode

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-001 | Update `src/pages/Auth/Login.jsx` - Redesign with card-based layout matching Stitch "User Authentication" screen |           |            |
| TASK-OV-002 | Update `src/pages/Auth/Login.jsx` - Ensure "Continue as Guest" button (from guest mode plan) is integrated with new design |           |            |
| TASK-OV-003 | Update `src/pages/Auth/Login.jsx` - Enhance form inputs with better spacing, focus states, validation feedback |           |            |
| TASK-OV-004 | Update `src/pages/Auth/Login.jsx` - Add social auth placeholders (buttons) matching Stitch design (functionality optional) |           |            |
| TASK-OV-005 | Update `src/pages/Auth/Signup.jsx` - Redesign with card-based layout matching Stitch design |           |            |
| TASK-OV-006 | Update `src/pages/Auth/Signup.jsx` - Ensure "Continue as Guest" button is integrated with new design |           |            |
| TASK-OV-007 | Update `src/pages/Auth/Signup.jsx` - Enhance form with multi-section layout (personal info, account credentials) |           |            |
| TASK-OV-008 | Update `src/layouts/AuthLayout.jsx` - Update background and centering logic for new auth card design |           |            |
| TASK-OV-009 | Verify `src/pages/Auth/Login.jsx` and `src/pages/Auth/Signup.jsx` - Test all authentication flows (login, signup, guest mode) |           |            |

### Implementation Phase 2: Home Page Overhaul (Estimated: 4-5 hours)

- GOAL-002: Overhaul Home page with enhanced hero, integrated search, recipe feed, and "Surprise Me" button

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-010 | Update `src/pages/Recipe/Home.jsx` - Redesign hero section with modern imagery, gradient overlay, stronger typography (matching Stitch "Kitchen Odyssey Home" screen) |           |            |
| TASK-OV-011 | Update `src/pages/Recipe/Home.jsx` - Integrate "Surprise Me" button (from random recipe plan) in hero section with prominent placement |           |            |
| TASK-OV-012 | Update `src/pages/Recipe/Home.jsx` - Redesign search bar with floating effect, icon integration, clear button (matching Stitch design) |           |            |
| TASK-OV-013 | Update `src/pages/Recipe/Home.jsx` - Add "Featured Recipes" section above main feed (if not already present) |           |            |
| TASK-OV-014 | Update `src/pages/Recipe/Home.jsx` - Redesign recipe card grid with better spacing, gap consistency, responsive breakpoints |           |            |
| TASK-OV-015 | Verify `src/components/recipe/RecipeCard.jsx` - Ensure RecipeCard component supports new design (image overlays, hover effects, badges) |           |            |
| TASK-OV-016 | Update `src/pages/Recipe/Home.jsx` - Add skeleton loader for recipe cards during loading state |           |            |
| TASK-OV-017 | Update `src/pages/Recipe/Home.jsx` - Implement empty state for recipe feed (matching Stitch design) |           |            |
| TASK-OV-018 | Integrate `src/components/recipe/RecipeSuggestionModal.jsx` - Ensure modal from random recipe plan works with new home design |           |            |
| TASK-OV-019 | Verify `src/pages/Recipe/Home.jsx` - Test navigation to search, recipe detail, profile from home page |           |            |

### Implementation Phase 3: Search Page Redesign (Estimated: 3-4 hours)

- GOAL-003: Redesign Search page with filter sidebar, results grid, and empty state

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-020 | Update `src/pages/Recipe/Search.jsx` - Redesign layout with left sidebar for filters, right panel for results (matching Stitch "Search and Filtering Results") |           |            |
| TASK-OV-021 | Update `src/pages/Recipe/Search.jsx` - Implement filter components (categories dropdown, difficulty slider, time range) in sidebar |           |            |
| TASK-OV-022 | Update `src/pages/Recipe/Search.jsx` - Redesign results grid with consistent spacing, responsive layout |           |            |
| TASK-OV-023 | Update `src/pages/Recipe/Search.jsx` - Add active filter indicators (chips/tags showing current filters) |           |            |
| TASK-OV-024 | Update `src/pages/Recipe/Search.jsx` - Implement empty state design with clear message and illustration (matching Stitch "Search Results Empty State") |           |            |
| TASK-OV-025 | Update `src/pages/Recipe/Search.jsx` - Add loading skeleton for search results |           |            |
| TASK-OV-026 | Update `src/pages/Recipe/Search.jsx` - Ensure mobile-responsive filters (collapsible sidebar on mobile) |           |            |
| TASK-OV-027 | Verify `src/pages/Recipe/Search.jsx` - Test search with various queries, filters, and combinations |           |            |

### Implementation Phase 4: Recipe Detail Overhaul (Estimated: 4-5 hours)

- GOAL-004: Overhaul RecipeDetail page with immersive layout, tabbed content, and guest restrictions

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-028 | Update `src/pages/Recipe/RecipeDetail.jsx` - Redesign with full-width hero image with recipe title and metadata overlay (matching Stitch "Recipe Detail View") |           |            |
| TASK-OV-029 | Update `src/pages/Recipe/RecipeDetail.jsx` - Implement tabbed content layout using existing Tabs component: Ingredients, Instructions, Reviews |           |            |
| TASK-OV-030 | Update `src/pages/Recipe/RecipeDetail.jsx` - Redesign ingredients section with checkable list, quantity styling |           |            |
| TASK-OV-031 | Update `src/pages/Recipe/RecipeDetail.jsx` - Redesign instructions section with step numbering, clear typography, time estimates per step |           |            |
| TASK-OV-032 | Update `src/pages/Recipe/RecipeDetail.jsx` - Ensure like/favorite buttons respect guest mode (disabled with "Login to {action}" messages) |           |            |
| TASK-OV-033 | Update `src/pages/Recipe/RecipeDetail.jsx` - Redesign reviews section with user avatar, rating stars, timestamp, helpful voting |           |            |
| TASK-OV-034 | Update `src/pages/Recipe/RecipeDetail.jsx` - Implement guest restriction overlay/badge for interactive elements |           |            |
| TASK-OV-035 | Update `src/pages/Recipe/RecipeDetail.jsx` - Add "Related Recipes" section at bottom (optional, following Stitch pattern) |           |            |
| TASK-OV-036 | Update `src/pages/Recipe/RecipeDetail.jsx` - Ensure mobile-responsive layout (hero image proportions, tab accessibility) |           |            |
| TASK-OV-037 | Verify `src/pages/Recipe/RecipeDetail.jsx` - Test all actions (like, favorite, review, share) with different user types (admin, user, pending, guest) |           |            |

### Implementation Phase 5: Create Recipe Form Overhaul (Estimated: 4-5 hours)

- GOAL-005: Overhaul CreateRecipe page with enhanced form UI, validation, and preview

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-038 | Update `src/pages/Recipe/CreateRecipe.jsx` - Redesign with multi-section accordion or stepped form layout (matching Stitch "Create New Recipe Form") |           |            |
| TASK-OV-039 | Update `src/pages/Recipe/CreateRecipe.jsx` - Implement image upload area with drag-and-drop UI, preview functionality |           |            |
| TASK-OV-040 | Update `src/pages/Recipe/CreateRecipe.jsx` - Enhance form sections with clear headings, helper text, input grouping |           |            |
| TASK-OV-041 | Update `src/pages/Recipe/CreateRecipe.jsx` - Implement ingredients dynamic list with add/remove buttons, quantity/unit fields |           |            |
| TASK-OV-042 | Update `src/pages/Recipe/CreateRecipe.jsx` - Implement instructions dynamic list with add/remove buttons, step reordering |           |            |
| TASK-OV-043 | Update `src/pages/Recipe/CreateRecipe.jsx` - Add client-side validation with real-time error messages |           |            |
| TASK-OV-044 | Update `src/pages/Recipe/CreateRecipe.jsx` - Implement form preview (showing recipe card preview before submit) |           |            |
| TASK-OV-045 | Update `src/pages/Recipe/CreateRecipe.jsx` - Ensure guest mode blocks access with clear message ("Login to create recipes") |           |            |
| TASK-OV-046 | Update `src/pages/Recipe/CreateRecipe.jsx` - Add "Save as Draft" button (optional, following Stitch pattern) |           |            |
| TASK-OV-047 | Verify `src/pages/Recipe/CreateRecipe.jsx` - Test form submission with valid and invalid data, empty fields |           |            |

**useFormValidation Hook Pattern (per react-development skill):**
```javascript
// src/hooks/useFormValidation.js
function useFormValidation(initialValues, validationSchema) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Real-time validation on change
    if (touched[name]) {
      validateField(name, value)
    }
  }, [touched, validationSchema])

  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, values[name])
  }, [values, validationSchema])

  const validateField = useCallback((name, value) => {
    const error = validationSchema[name]?.(value)
    setErrors(prev => ({ ...prev, [name]: error || null }))
  }, [validationSchema])

  return { values, errors, touched, handleChange, handleBlur }
}

// Usage in CreateRecipe.jsx
const { values, errors, touched, handleChange, handleBlur } = useFormValidation(
  { title: '', description: '', ingredients: [] },
  {
    title: value => value.length === 0 ? 'Title is required' : null,
    description: value => value.length < 10 ? 'Description must be at least 10 characters' : null,
  }
)

// Error UI
<Input
  label="Title"
  value={values.title}
  onChange={value => handleChange('title', value)}
  onBlur={() => handleBlur('title')}
  error={touched.title && errors.title}
  helperText="Enter a descriptive title for your recipe"
/>
```

**useDebounce Hook Pattern:**
```javascript
// src/hooks/useDebounce.js
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Usage in Search.jsx
const [searchQuery, setSearchQuery] = useState('')
const debouncedSearchQuery = useDebounce(searchQuery, 500)

useEffect(() => {
  // API call only happens 500ms after user stops typing
  if (debouncedSearchQuery) {
    searchRecipes(debouncedSearchQuery)
  }
}, [debouncedSearchQuery])
```

**Component Composition Patterns (per react-development skill):**

**Button Component Composition:**
```javascript
// src/components/ui/Button.jsx
export function Button({ variant, size, children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center',
        variantClasses[variant],
        sizeClasses[size]
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// Usage with icon composition
<Button variant="primary">
  <Icon name="CheckCircle" />
  <span>Save Recipe</span>
</Button>

// Icon-only variant
<Button variant="icon" aria-label="Like">
  <Icon name="Heart" />
</Button>
```

**Card Component Composition:**
```javascript
// src/components/ui/Card.jsx
export function Card({ children, image, badges, footer }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {image && (
        <div className="relative">
          <img src={image} alt="" className="w-full" />
          {badges && <div className="absolute top-2 right-2">{badges}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && <div className="border-t p-4">{footer}</div>}
    </div>
  )
}

// Usage in RecipeCard
<Card
  image={recipe.image}
  badges={<Badge variant="sm">{recipe.difficulty}</Badge>}
  footer={<RecipeActions recipe={recipe} />}
>
  <h3>{recipe.title}</h3>
  <p>{recipe.description}</p>
</Card>
```

### Implementation Phase 6: User Profile Overhaul (Estimated: 3-4 hours)

- GOAL-006: Overhaul Profile page with tabbed layout, profile header, and edit modal

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-048 | Update `src/pages/Recipe/Profile.jsx` - Redesign profile header with avatar, name, bio, stats (recipes, followers, following) |           |            |
| TASK-OV-049 | Update `src/pages/Recipe/Profile.jsx` - Implement tabbed navigation using existing Tabs component: My Recipes, Favorites, Activity, Settings |           |            |
| TASK-OV-050 | Update `src/pages/Recipe/Profile.jsx` - Redesign "My Recipes" tab with grid of user's recipes, edit/delete actions |           |            |
| TASK-OV-051 | Update `src/pages/Recipe/Profile.jsx` - Redesign "Favorites" tab with favorited recipes grid |           |            |
| TASK-OV-052 | Update `src/pages/Recipe/Profile.jsx` - Redesign "Activity" tab with recent actions log (created, liked, favorited) |           |            |
| TASK-OV-053 | Update `src/pages/Recipe/Profile.jsx` - Create/Edit Profile modal using existing Modal component (matching Stitch "Edit Profile Modal Interface") |           |            |
| TASK-OV-054 | Update `src/pages/Recipe/Profile.jsx` - Ensure guest mode redirects profile page to login (from guest mode plan) |           |            |
| TASK-OV-055 | Update `src/pages/Recipe/Profile.jsx` - Implement editable fields in modal with save changes functionality |           |            |
| TASK-OV-056 | Update `src/pages/Recipe/Profile.jsx` - Add empty states for each tab (no recipes, no favorites, no activity) |           |            |
| TASK-OV-057 | Verify `src/pages/Recipe/Profile.jsx` - Test all tabs, profile editing, navigation to recipe detail |           |            |

### Implementation Phase 7: Admin Dashboard (Estimated: 2-3 hours)

- GOAL-007: Overhaul Admin Dashboard with stats cards, navigation, and overview metrics

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-058 | Update `src/pages/Admin/AdminStats.jsx` - Redesign dashboard overview with modern cards showing key metrics (total users, total recipes, daily active, pending approvals) |           |            |
| TASK-OV-059 | Update `src/pages/Admin/AdminStats.jsx` - Implement chart placeholders for trends (user growth, recipe submission, activity) using existing styling (optional functionality) |           |            |
| TASK-OV-060 | Update `src/pages/Admin/AdminStats.jsx` - Add quick action cards (approve recipes, suspend user, send notification) |           |            |
| TASK-OV-061 | Update `src/pages/Admin/AdminStats.jsx` - Ensure responsive grid layout for cards (1 col mobile, 2 cols tablet, 3-4 cols desktop) |           |            |
| TASK-OV-062 | Verify `src/pages/Admin/AdminStats.jsx` - Test dashboard loads with accurate data from storage.js |           |            |

### Implementation Phase 8: Admin Table Components Overhaul (Estimated: 3-4 hours)

- GOAL-008: Overhaul Admin Recipe and User management tables with enhanced Table component, sorting, filtering

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-063 | Verify `src/components/ui/Table.jsx` - Ensure Table component supports sticky headers, sortable columns, status badges |           |            |
| TASK-OV-064 | Update `src/pages/Admin/AdminRecipes.jsx` - Redesign recipe management table with improved columns (image preview, title, author, status, likes, actions) |           |            |
| TASK-OV-065 | Update `src/pages/Admin/AdminRecipes.jsx` - Implement table sorting by clicking column headers |           |            |
| TASK-OV-066 | Update `src/pages/Admin/AdminRecipes.jsx` - Implement table filtering (search by recipe name, filter by status) |           |            |
| TASK-OV-067 | Update `src/pages/Admin/AdminRecipes.jsx` - Add bulk actions (approve multiple, delete multiple) using checkboxes |           |            |
| TASK-OV-068 | Update `src/pages/Admin/AdminRecipes.jsx` - Ensure responsive overflow handling for tables (horizontal scroll on mobile) |           |            |
| TASK-OV-069 | Update `src/pages/Admin/UserList.jsx` - Redesign user management table with improved columns (avatar, username, email, status, role, joined date, actions) |           |            |
| TASK-OV-070 | Update `src/pages/Admin/UserList.jsx` - Implement table sorting and filtering (search by username, filter by status/role) |           |            |
| TASK-OV-071 | Update `src/pages/Admin/UserList.jsx` - Add status quick-change dropdown (pending → active → suspended) |           |            |
| TASK-OV-072 | Verify both admin tables - Test sort, filter, bulk actions, row actions (edit, delete, approve, suspend) |           |            |

### Implementation Phase 9: Component Library Enhancements (Estimated: 4-5 hours)

- GOAL-009: Enhance existing UI components to support new design requirements without creating new components

### Performance Optimization Guidelines (per react-development skill)

**Memoization Strategy:**
- **TASK-OV-073 (Card)**: Wrap RecipeCard in React.memo when receiving large recipe arrays
- **TASK-OV-075 (Button)**: Memoize onClick handlers with useCallback in parent components
- **TASK-OV-078 (Table)**: Implement virtualization for tables with >50 rows (consider react-window or react-virtualized)

**Custom Hooks Reuse:**
- Create `useDebounce` hook for search input (500ms delay)
- Create `useLocalStorage` hook for localStorage operations (memoized)
- Create `useMediaQuery` hook for responsive breakpoints

**Code Splitting:**
- Lazy load RecipeCard with React.lazy() for initial page load optimization
- Lazy load Modal components with dynamic import
- Reduce initial JS bundle size through Vite code splitting

**Component Priority Order:**
Execute component enhancements in the following order to maximize efficiency and minimize blocking:

1. **P0 (Critical - Blocks Core Functionality):** Must complete first
   - TASK-OV-076: Modal enhancements (used by 13/13 screens)
   - TASK-OV-074: Input enhancements (used by 4/13 screens: auth pages, profile, create/edit forms)
   - TASK-OV-075: Button enhancements (used by all screens)

2. **P1 (High Impact - Major Design Fidelity):** Complete after P0
   - TASK-OV-073: Card enhancements (used by 8/13 screens: home, search, profile, admin user list, etc.)
   - TASK-OV-078: Table enhancements (used by 2/13 screens: admin recipes, admin users)

3. **P2 (Medium - Advanced Features):** Complete after P1
   - TASK-OV-077: Tabs enhancements (used by 2/13 screens: recipe detail, profile)

4. **P3 (Low - Nice-to-Have):** Complete last
   - TASK-OV-079: Badge enhancements (nice-to-have for status badges)

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-073 | Update `src/components/ui/Card.jsx` - Add support for image overlays, badge positioning, hover effects (needed for recipe/user cards) |           |            |
| TASK-OV-074 | Update `src/components/ui/Input.jsx` - Add support for floating labels, validation states, helper text (needed for modern forms) |           |            |
| TASK-OV-075 | Update `src/components/ui/Button.jsx` - Add support for loading states, icon-only variants, tertiary styles (needed for diverse button needs) |           |            |
| TASK-OV-076 | Update `src/components/ui/Modal.jsx` - Add support for full-screen modal variant, backdrop blur animations, improved focus trapping |           |            |
| TASK-OV-077 | Update `src/components/ui/Tabs.jsx` - Add support for vertical tabs (sidebar style), pill indicator, scrollable tabs |           |            |
| TASK-OV-078 | Update `src/components/ui/Table.jsx` - Add support for sortable headers, status badges, checkbox rows, responsive overflow |           |            |
| TASK-OV-079 | Update `src/components/ui/Badge.jsx` - Add support for size variants (sm, md, lg) and icon badges |           |            |
| TASK-OV-080 | Verify all component updates - Test components individually to ensure backwards compatibility and new features work |           |            |

### Implementation Phase 10: Layout Component Updates (Estimated: 2-3 hours)

- GOAL-010: Update Navbar, Sidebar, and layout wrappers to support new design

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-081 | Update `src/components/layout/Navbar.jsx` - Redesign with modern logo, search integration, guest mode badge, user menu dropdown |           |            |
| TASK-OV-082 | Update `src/components/layout/Navbar.jsx` - Ensure mobile hamburger menu functionality with new design |           |            |
| TASK-OV-083 | Update `src/components/layout/Sidebar.jsx` - Redesign admin sidebar with modern icon+text navigation, active state indicators, collapsible sections |           |            |
| TASK-OV-084 | Update `src/layouts/RootLayout.jsx` - Ensure proper spacing, background, responsive container width |           |            |
| TASK-OV-085 | Update `src/layouts/AuthLayout.jsx` - Ensure background, centering logic works with new auth card design |           |            |
| TASK-OV-086 | Update `src/layouts/AdminLayout.jsx` - Ensure sidebar+content layout works with new sidebar design |           |            |
| TASK-OV-087 | Verify all layouts - Test navigation between different user types (guest, user, admin) with new navbar/sidebar |           |            |

### Implementation Phase 11: Responsive Design & Polish (Estimated: 3-4 hours)

- GOAL-011: Ensure all screens work across mobile, tablet, desktop with smooth transitions and animations

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-088 | Test and fix mobile layouts (< 640px) for all 13 screens - adjust font sizes, spacing, grid columns |           |            |
| TASK-OV-089 | Test and fix tablet layouts (640px - 1024px) for all 13 screens - adjust grid columns, sidebar behavior |           |            |
| TASK-OV-090 | Test and fix desktop layouts (> 1024px) for all 13 screens - verify max-width containers, visual balance |           |            |
| TASK-OV-091 | Implement hover transitions for all interactive elements (buttons, cards, links) using Tailwind transition utilities |           |            |
| TASK-OV-092 | Implement fade-in animations for page loads using existing animate-page-in class or similar |           |            |
| TASK-OV-093 | Implement modal fade-in/backdrop blur animations using Tailwind utilities in existing Modal component |           |            |
| TASK-OV-094 | Add loading spinners or skeletons for all async data fetching (home, search, recipe detail, profile, admin tables) |           |            |
| TASK-OV-095 | Verify touch targets meet minimum size (44px x 44px) for all clickable elements on mobile |           |            |

### Implementation Phase 12: Accessibility & Cross-Browser Testing (Estimated: 2-3 hours)

- GOAL-012: Ensure WCAG AA compliance and cross-browser compatibility

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-096 | Audit all interactive elements for ARIA labels - add missing labels where needed |           |            |
| TASK-OV-097 | Test keyboard navigation through entire application - ensure Tab, Enter, ESC work everywhere |           |            |
| TASK-OV-098 | Test with screen reader (NVDA, JAWS, or VoiceOver) - verify content is announced clearly |           |            |
| TASK-OV-099 | Verify color contrast ratios using contrast checker (aim for WCAG AA: 4.5:1 text, 3:1 large text) |           |            |

**Accessibility Verification Checklist (per frontend-design skill):**
- [ ] **Color Contrast** (TASK-OV-099): Verify 4.5:1 ratio for body text, 3:1 for large text (≥18px or ≥14px bold)
- [ ] **ARIA Labels** (TASK-OV-096): All interactive elements have aria-label or text content
- [ ] **Keyboard Navigation** (TASK-OV-097): Logical Tab order, Enter/Space activation, ESC for modals
- [ ] **Focus Management** (TASK-OV-097): Visible focus states (2px+ ring), focus trapping in modals
- [ ] **Screen Reader** (TASK-OV-098): Content announced clearly, dynamic content uses aria-live
- [ ] **Touch Targets** (TASK-OV-095): Minimum 44x44px on mobile, 8px gap between targets
- [ ] **Heading Hierarchy** (TASK-OV-096): Sequential H1→H2→H3, no skipping
- [ ] **Form Accessibility** (TASK-OV-096): Labels associated via for/id, errors via aria-describedby
- [ ] **Image Accessibility** (TASK-OV-096): Alt text for all images, decorative images have alt=""
| TASK-OV-100 | Test in Google Chrome - verify all screens render correctly, no console errors |           |            |
| TASK-OV-101 | Test in Mozilla Firefox - verify layout, localStorage, event handlers work |           |            |
| TASK-OV-102 | Test in Microsoft Edge - verify Chromium compatibility, no rendering issues |           |            |
| TASK-OV-103 | Test in Apple Safari (if available) - verify WebKit rendering, touch interactions |           |            |

### Implementation Phase 13: Integration Testing & Regression Prevention (Estimated: 3-4 hours)

- GOAL-013: Verify all existing functionality works with new design, no regressions

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-104 | Test guest mode integration - Login as guest, verify "Guest" badge in navbar, verify restricted states on all screens |           |            |
| TASK-OV-105 | Test random recipe suggestion - Click "Surprise Me", verify modal opens, verify suggestion meets quality constraints |           |            |
| TASK-OV-106 | Test authentication flows - Login, signup, logout, profile access, account creation for all user types |           |            |
| TASK-OV-107 | Test recipe management - Create recipe with all fields, edit recipe, delete recipe, view statistics |           |            |
| TASK-OV-108 | Test search and filter - Search by name, ingredient, category; apply difficulty, time filters; verify results accuracy |           |            |
| TASK-OV-109 | Test interactions - Like recipe, favorite recipe, add review, remove review; verify updates reflect immediately |           |            |
| TASK-OV-110 | Test admin operations - Approve/reject/suspend users, approve/reject recipe, view dashboard metrics |           |            |
| TASK-OV-111 | Test navigation - Navigate between all pages, verify browser history, back button, direct URL access |           |            |
| TASK-OV-112 | Verify events (favoriteToggled, recipeUpdated) - Ensure they still fire correctly from new design components |           |            |
| TASK-OV-113 | Verify no hardcoded values - Test with different data sets (empty recipes, 1 recipe, 100 recipes) |           |            |

### Implementation Phase 14: Automated Testing Setup (Estimated: 4-6 hours)

- GOAL-014: Implement automated testing with Playwright and Chrome DevTools to catch regressions during development and after implementation

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-114 | Install and configure Playwright - Add @playwright/test package, configure test environment with browser providers (chromium, firefox, webkit) |           |            |
| TASK-OV-115 | Create test configuration - Setup `playwright.config.js` with test directory, baseURL, viewport configuration, trace on failure |           |            |
| TASK-OV-116 | Create reusable test utilities - Build helper functions for authentication (login, signup, guest mode), data seeding, cleanup |           |            |
| TASK-OV-117 | Write visual regression tests - Create screenshot comparison tests for all 13 screens to catch layout shifts and visual changes |           |            |
| TASK-OV-118 | Write user flow tests - Create end-to-end tests for critical paths: authentication, recipe creation, search, admin operations |           |            |
| TASK-OV-119 | Write responsive tests - Create tests for mobile (375px), tablet (768px), desktop (1920px) viewports for all screens |           |            |
| TASK-OV-120 | Write accessibility tests - Use Playwright's built-in a11y assertions (axe-core) to verify WCAG AA compliance on all screens |           |            |
| TASK-OV-121 | Write dynamic data tests - Create tests that verify UI works with empty state, single item, bulk data (100 items) to catch hardcoded values |           |            |
| TASK-OV-122 | Write guest mode tests - Verify guest badge visibility, restricted states, and "Login to {action}" messages appear correctly. **CRITICAL**: Include test for guest Random Recipe analytics bypass (FREQ-RS-000-1, FREQ-RS-000-2, AC-RS-033) - verify per-recipe view counts, `daily_stats.views`, and `activeUsers` do NOT contain guest entries when guest uses "Surprise Me" button |           |            |
| TASK-OV-123 | Write event system tests - Verify favoriteToggled and recipeUpdated events fire correctly and listening components update |           |            |
| TASK-OV-124 | Configure Chrome DevTools integration - Setup Playwright to launch Chrome with DevTools protocol for performance and debugging |           |            |
| TASK-OV-125 | Set up performance benchmarks - Use Chrome DevTools Performance API to capture Core Web Vitals (LCP, CLS, FID, TTI) baselines |           |            |
| TASK-OV-126 | Create CI/CD integration - Add Playwright tests to GitHub Actions or similar CI environment to run on every pull request |           |            |
| TASK-OV-127 | Document test coverage - Create README in test directory explaining test structure, how to run, how to add new tests |           |            |
| TASK-OV-128 | Run initial test suite - Execute all tests, capture baseline screenshots and metrics, fix any immediate failures |           |            |

**TEST EXECUTION ORDER (Recommended):**

**Week 1: Infrastructure & Critical Paths**
1. TASK-OV-114 to TASK-OV-116: Install Playwright, configuration, utilities, Page Objects (8)
2. TASK-OV-118: Write user flow tests for 8 critical paths (authentication, recipe creation, admin)
3. TASK-OV-118-A: Run user flow tests after Phase 1 (Auth pages) complete
4. TASK-OV-118-B: Run user flow tests after Phase 2 (Home page) complete
5. TASK-OV-118-C: Run user flow tests after Phase 3 (Search) complete
6. TASK-OV-118-D: Run user flow tests after Phase 4 (Recipe Detail) complete
7. TASK-OV-118-E: Run user flow tests after Phase 5 (Create Recipe) complete
8. TASK-OV-118-F: Run user flow tests after Phase 6 (Profile) complete
9. TASK-OV-118-G: Run user flow tests after Phase 7 (Admin) complete

**Week 2: Non-Regression Testing**
10. TASK-OV-117: Visual regression tests (can be written incrementally as pages ready)
11. TASK-OV-119: Responsive tests (can be written incrementally as pages ready)
12. TASK-OV-120: Accessibility tests (can be written incrementally as pages ready)
13. TASK-OV-121: Dynamic data tests (require only functional pages, no styling needed)
14. TASK-OV-122: Guest mode tests (after Phase 1 Auth + guest mode integration)
15. TASK-OV-123: Event system tests (after all user flows implemented)
16. TASK-OV-124 to TASK-OV-125: Chrome DevTools integration & performance benchmarks
17. TASK-OV-126 to TASK-OV-128: CI/CD integration, documentation, initial test suite run

**Test Maintenance Guidelines:**

**Visual Regression Baseline Updates:**
- Baseline screenshots should be updated only when intentional design changes are made
- Update process: Run tests → Identify changed screenshots → Review each diff → Update baselines if changes are intentional
- Exclude dynamic content from screenshot comparison: dates, timestamps, user-specific IDs

**Flaky Test Resolution:**
- **Timing Issues**: Use waitForSelector() instead of fixed timeouts, increase wait times as needed
- **State Conflicts**: Ensure test cleanup in afterEach resets localStorage and application state between tests
- **Race Conditions**: Use waitForResponse() for API calls before asserting results
- **Viewport Issues**: Specific viewport tests should use consistent viewport size, no dynamic resizing in same test
- **Test Failure Analysis:**
  - When test fails, review console errors, network logs, and trace files
  - Use Playwright Inspector (npx playwright test --debug) for interactive debugging
  - Tag tests with @flaky if consistently failing, investigate root cause
  - Document known flaky tests in test directory README with investigation status

**Automated Testing Strategy (Based on Playwright testing guidelines):**

#### Test Organization
- **Page Object Model**: Page Objects in `tests/pages/*.js` - encapsulate selectors and interactions
- **Fixtures**: Custom fixtures in `tests/fixtures.js` for auth reuse, test data, cleanup
- **Global Setup**: `tests/global-setup.js` saves auth states (admin, user, guest) to avoid repeated login
- **Test Files**: Organized by feature (`tests/login.spec.js`, `tests/recipe-create.spec.js`, etc.)

#### Comprehensive Test Coverage

**Visual Regression Testing:**
- Compare screenshots across all pages to detect layout shifts or unintended design changes
- Use pixel difference thresholds (TASK-OV-117)
- Capture baselines for 13 screens x 3 viewports = 39 baseline screenshots
- Run on every PR/TASK-OV-126 via CI/CD pipeline

**User Flow Testing (Following Page Object Model pattern):**
- Verify critical paths work end-to-end with Page Objects (TASK-OV-118)
- 8 critical paths:
  - Authentication paths: login, signup, guest mode, logout (4 tests)
  - Recipe management: create, edit, delete (2 tests)
  - Admin operations: approve user, approve recipe (2 tests)
- Each test follows structure: beforeEach -> test.steps -> cleanup in afterEach

**Responsive Testing (pattern in this plan):**
- Viewport array: Mobile (375px, 414px), Tablet (768px, 1024px), Desktop (1280px, 1440px, 1920px)
- Test all 13 screens at each viewport (TASK-OV-119)
- Check navigation accessibility on mobile (hamburger menu vs. desktop nav)
- Verify no horizontal scrollbars (except tables)
- Total checks: 13 screens x ~7 viewports = 91 responsive checks

**Accessibility Testing (pattern in this plan):**
- Use axe-core via Playwright (@axe-core/playwright) (TASK-OV-120)
- Test all 13 screens for WCAG AA violations
- Check areas per this checklist:
  - All interactive elements keyboard accessible
  - Focus states visible (2px ring)
  - ARIA labels on icon-only buttons
  - Form fields have labels or aria-label
  - Images have alt text (except decorative)
  - Touch targets ≥ 44x44px on mobile

**Dynamic Data Testing (Test for hardcoded values):**
- Test 5 data scenarios per this plan (TASK-OV-121):
  - Empty state (no recipes, no users)
  - Single item (1 recipe, 1 user)
  - Moderate data (10 recipes, 10 users)
  - Bulk data (100 recipes, 100 users)
  - Edge cases (invalid data, very long text)
- Verify UI scales, no hardcoded names/counts visible
- Prevents FAIL-OV-002 violations

**Guest Mode Testing:**
- Verify guest badge visibility in navbar (TASK-OV-122)
- Test restricted states on all 8 pages (disabled buttons, "Login to {action}" messages)
- Verify Profile redirects to login for guest users
- Verify metrics not tracked in localStorage
- **CRITICAL**: Verify guest usage of "Surprise Me" button does NOT increment view metrics (FREQ-RS-000-1, FREQ-RS-000-2, AC-RS-033)
  - per-recipe view counts (`viewedBy` / `getViewCount`) must not include guest IDs
  - `daily_stats.views` must not contain guest ID entries
  - `activeUsers` array must not contain guest IDs

**Event System Testing:**
- Verify favoriteToggled event fires on like/unlike (TASK-OV-123)
- Verify recipeUpdated event fires on create/edit/delete
- Ensure listening components (Home, Search, Profile) update state immediately
- Test with all user types (admin, user, pending, guest)

**Performance Monitoring (Chrome DevTools pattern in this plan):**
- Use Chrome DevTools Performance API (TASK-OV-124)
- Capture Core Web Vitals baselines: LCP, CLS, FID, TTI (TASK-OV-125)
- Compare against thresholds per this checklist:
  - Page load time < 3 seconds
  - LCP < 2.5 seconds
  - CLS < 0.1
  - No layout shifts on interaction
  - Images optimized

**Cross-Browser Testing:**
- Test on Chromium, Firefox, WebKit (TASK-OV-100 through TASK-OV-103)
- Verify identical behavior across browsers
- Check event listeners work (favoriteToggled, recipeUpdated)
- Verify flexbox/grid layouts match Chrome

**Continuous Integration (Following CI pattern from e2e example):**
- GitHub Actions workflow (TASK-OV-126)
- Run full test suite on every PR
- Parallelize tests across workers
- Fail PR if any test fails
- Upload test artifacts (screenshots, traces, coverage)

**Test Coverage Targets (Updated):**
- Visual regression: 13 screens × 3 viewports = 39 baseline screenshots
- User flow tests: 8 critical paths with Page Objects
- Accessibility tests: 13 screens with axe-core assertions
- Responsive tests: 13 screens × 7 viewports = 91 responsive checks
- Dynamic data tests: 5 data scenarios × 8 critical screens = 40 data validation tests
- Cross-browser tests: 3 browsers × 8 critical paths = 24 cross-browser checks
- Performance tests: Core Web Vitals for all 13 screens

**Total Estimated Tests:** ~229 test cases covering all testing patterns in this plan

## 3. Alternatives

### Alternative Approaches Considered

- **ALT-OV-001**: Create new design system from scratch with custom components
  - **Decision**: REJECTED
  - **Rationale**: Violates CON-OV-001 (no new base UI components); existing components work and maintain consistency
  - **Trade-off**: More flexibility vs. more development time and potential inconsistencies

- **ALT-OV-002**: Use external component library (Material UI, Ant Design, etc.)
  - **Decision**: REJECTED
  - **Rationale**: Project has established component patterns; external libs add bundle size, bloat, learning curve
  - **Trade-off**: Faster development vs. increased bundle size, less control

- **ALT-OV-003**: Implement design overhaul feature-by-feature incrementally
  - **Decision**: CONSIDERED (partial approval)
  - **Rationale**: Could reduce risk, but user requested "complete overhaul" in one phase
  - **Trade-off**: Smaller, manageable chunks vs. disjointed design during transition
  - **Implementation Note**: Phases in this plan allow granular testing while maintaining design consistency

- **ALT-OV-004**: Preserve current design and only add Stitch screens as new pages
  - **Decision**: REJECTED
  - **Rationale**: User requested "overhaul" of current design; mixing old and new creates inconsistency
  - **Trade-off**: Less risk vs. poor UX, confusion, maintenance burden

- **ALT-OV-005**: Implement design overhaul before guest mode and random recipe features
  - **Decision**: REJECTED
  - **Rationale**: Both features add components/state that new design must support
  - **Trade-off**: Start overhaul sooner vs. risk of breaking changes when features added
  - **Implementation Note**: PREREQ-OV-001 and PREREQ-OV-002 enforce correct order

- **ALT-OV-006**: Use Stitch-generated HTML/CSS directly without React conversion
  - **Decision**: REJECTED
  - **Rationale**: Would create unmaintainable code, lose event listeners, state management, functionality
  - **Trade-off**: Fast implementation vs. unmaintainable codebase, broken functionality

**Chosen Approach**: Comprehensive design overhaul in single implementation plan, executed AFTER guest mode and random recipe features are complete. Reuse existing components with enhancements. Maintain full functionality. Follow Stitch design patterns. This balances design quality, development time, maintainability, and feature integration.

## 4. Dependencies

### Prerequisite Feature Dependencies (CRITICAL)

- **DEP-OVERHAUL-001**: [feature-guest-mode-1.md](./feature-guest-mode-1.md) - Guest Mode Implementation (Status MUST be Completed)
  - Provides: isGuest state in AuthContext, "Continue as Guest" button in Login/Signup pages
  - Required for: Guest badges in Navbar, restricted states in RecipeDetail, CreateRecipe blocking
  - **Blocking**: TASK-OV-002, TASK-OV-006, TASK-OV-034, TASK-OV-045, TASK-OV-054

- **DEP-OVERHAUL-002**: [feature-random-recipe-suggestion-1.md](./feature-random-recipe-suggestion-1.md) - Random Recipe Suggestion (Status MUST be Completed)
  - Provides: "Surprise Me" button in Home page, RecipeSuggestionModal component, getRandomSuggestion function
  - Required for: Hero design integration, modal integration, loading states
  - **Blocking**: TASK-OV-011, TASK-OV-018

### Internal Dependencies

- **DEP-OVERHAUL-003**: `src/context/AuthContext.jsx` - Must exist with complete guest mode implementation
- **DEP-OVERHAUL-004**: `src/lib/storage.js` - Must exist with complete API (including getRandomSuggestion from random recipe plan)
- **DEP-OVERHAUL-005**: `src/components/ui/Modal.jsx` - Must exist and support enhancements
- **DEP-OVERHAUL-006**: `src/components/ui/Button.jsx` - Must exist and support loading states
- **DEP-OVERHAUL-007**: `src/components/ui/Card.jsx` - Must exist and support image overlays
- **DEP-OVERHAUL-008**: `src/components/ui/Input.jsx` - Must exist and support validation states
- **DEP-OVERHAUL-009**: `src/components/ui/Tabs.jsx` - Must exist and support vertical layout
- **DEP-OVERHAUL-010**: `src/components/ui/Table.jsx` - Must exist and support sorting/filtering
- **DEP-OVERHAUL-011**: `src/components/ui/Badge.jsx` - Must exist and support size variants
- **DEP-OVERHAUL-012**: `src/components/recipe/RecipeCard.jsx` - Must exist and support hover effects
- **DEP-OVERHAUL-013**: `src/components/recipe/RecipeSuggestionModal.jsx` - Must exist from random recipe plan

### External Dependencies

- **DEP-OVERHAUL-014**: Tailwind CSS v4 - Already in project
- **DEP-OVERHAUL-015**: React Router - HashRouter, useNavigate, useParams (already in use)
- **DEP-OVERHAUL-016**: Lucide React Icons (Search, X, etc.) - Already in use
- **DEP-OVERHAUL-017**: Playwright - Automated testing (to be installed in TASK-OV-114)
- **DEP-OVERHAUL-018**: @axe-core/playwright - Accessibility testing via Playwright (to be installed in TASK-OV-114)

### Data Dependencies

- **DEP-OVERHAUL-017**: storage.js complete API - All data reading/writing functions
- **DEP-OVERHAUL-018**: getUser(), setCurrentUser() - Auth functions working
- **DEP-OVERHAUL-019**: getRecipes(), getRecipeById() - Recipe functions working
- **DEP-OVERHAUL-020**: SEARCH_HISTORY localStorage key - Search history tracking working
- **DEP-OVERHAUL-021**: DAILY_STATS localStorage key - Analytics recording working (excluding guests)
- **DEP-OVERHAUL-022**: ACTIVITY localStorage key - Activity logging working

### Build Dependencies

- **DEP-OVERHAUL-023**: Vite dev server - Must be running for development
- **DEP-OVERHAUL-024**: Node.js environment - For build process
- **DEP-OVERHAUL-025**: Modern browsers (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+) - For ES6+ support

## 5. Files

### Authentication Pages (Modified)

- **FILE-OV-001**: `src/pages/Auth/Login.jsx`
  - Redesign with card-based layout
  - Integrate "Continue as Guest" button (from guest mode plan)
  - Enhance form inputs with spacing, focus states
  - Add social auth placeholder buttons

- **FILE-OV-002**: `src/pages/Auth/Signup.jsx`
  - Redesign with card-based layout
  - Integrate "Continue as Guest" button (from guest mode plan)
  - Enhance form with multi-section layout (personal, credentials)

- **FILE-OV-003**: `src/layouts/AuthLayout.jsx`
  - Update background and centering logic for new auth card design

 Home Page (Modified)

- **FILE-OV-004**: `src/pages/Recipe/Home.jsx`
  - Redesign hero section with modern imagery, gradient overlay, typography
  - Integrate "Surprise Me" button (from random recipe plan) in hero
  - Redesign search bar with floating effect, icon, clear button
  - Add optional "Featured Recipes" section
  - Redesign recipe card grid with spacing, responsive breakpoints
  - Add skeleton loader for cards
  - Implement empty state for recipe feed
  - Integrate RecipeSuggestionModal (from random recipe plan)

### Search Page (Modified)

- **FILE-OV-005**: `src/pages/Recipe/Search.jsx`
  - Redesign layout with left filter sidebar, right results panel
  - Implement filter components (categories, difficulty, time) in sidebar
  - Redesign results grid with spacing, responsive breakpoints
  - Add active filter chips showing current filters
  - Implement empty state design (matching Stitch "Search Results Empty State")
  - Add loading skeleton for results
  - Ensure mobile-responsive filters (collapsible sidebar)

### Recipe Detail Page (Modified)

- **FILE-OV-006**: `src/pages/Recipe/RecipeDetail.jsx`
  - Redesign with full-width hero image, title/metadata overlay
  - Implement tabbed content using existing Tabs component (Ingredients, Instructions, Reviews)
  - Redesign ingredients section with checkable list, quantity styling
  - Redesign instructions section with step numbering, clear typography, time estimates
  - Ensure like/favorite buttons respect guest mode (disabled with messages)
  - Redesign reviews section with avatar, rating stars, timestamp, helpful voting
  - Implement guest restriction overlay/badge for interactive elements
  - Add optional "Related Recipes" section
  - Ensure mobile-responsive layout

### Create Recipe Page (Modified)

- **FILE-OV-007**: `src/pages/Recipe/CreateRecipe.jsx`
  - Redesign with multi-section accordion or stepped form layout
  - Implement image upload area with drag-and-drop, preview
  - Enhance form sections with headings, helper text, input grouping
  - Implement dynamic ingredients list with add/remove, quantity/unit fields
  - Implement dynamic instructions list with add/remove, step reordering
  - Add client-side validation with real-time error messages
  - Implement form preview (recipe card preview before submit)
  - Ensure guest mode blocks access with message
  - Add optional "Save as Draft" button

### Profile Page (Modified)

- **FILE-OV-008**: `src/pages/Recipe/Profile.jsx`
  - Redesign profile header with avatar, name, bio, stats
  - Implement tabbed navigation using existing Tabs component
  - Redesign "My Recipes" tab with recipe grid, edit/delete actions
  - Redesign "Favorites" tab with favorited recipes grid
  - Redesign "Activity" tab with recent actions log
  - Create/Edit Profile modal using existing Modal component
  - Ensure guest mode redirects profile page to login
  - Implement editable fields in modal with save functionality
  - Add empty states for each tab

### Admin Pages (Modified)

- **FILE-OV-009**: `src/pages/Admin/AdminStats.jsx`
  - Redesign dashboard overview with modern stats cards
  - Implement chart placeholders for trends (user growth, recipes, activity)
  - Add quick action cards (approve recipes, suspend users, send notifications)
  - Ensure responsive grid for cards

- **FILE-OV-010**: `src/pages/Admin/AdminRecipes.jsx`
  - Redesign recipe management table with enhanced columns
  - Implement table sorting by column headers
  - Implement table filtering (search, status filter)
  - Add bulk actions (approve multiple, delete multiple) with checkboxes
  - Ensure responsive overflow handling for tables

- **FILE-OV-011**: `src/pages/Admin/UserList.jsx`
  - Redesign user management table with enhanced columns
  - Implement table sorting and filtering
  - Add status quick-change dropdown
  - Ensure responsive overflow handling

### Layout Components (Modified)

- **FILE-OV-012**: `src/components/layout/Navbar.jsx`
  - Redesign with modern logo, search integration, guest mode badge
  - Implement user menu dropdown
  - Ensure mobile hamburger menu functionality

- **FILE-OV-013**: `src/components/layout/Sidebar.jsx`
  - Redesign admin sidebar with icon+text navigation
  - Add active state indicators, collapsible sections

- **FILE-OV-014**: `src/layouts/RootLayout.jsx`
  - Update spacing, background, responsive container width

- **FILE-OV-015**: `src/layouts/AuthLayout.jsx`
  - Update background, centering logic for new auth cards

- **FILE-OV-016**: `src/layouts/AdminLayout.jsx`
  - Ensure sidebar+content layout works with new sidebar

### UI Components (Enhanced, Not Created)

- **FILE-OV-017**: `src/components/ui/Modal.jsx`
  - Add support for full-screen variant
  - Add backdrop blur animations
  - Improve focus trapping logic

- **FILE-OV-018**: `src/components/ui/Button.jsx`
  - Add support for loading states (spinner or disabled text)
  - Add icon-only variant
  - Add tertiary style variant

- **FILE-OV-019**: `src/components/ui/Card.jsx`
  - Add support for image overlays (recipe card thumbnails)
  - Add support for badge positioning (status badges)
  - Add hover effects (transform, shadow)

- **FILE-OV-020**: `src/components/ui/Input.jsx`
  - Add support for floating labels
  - Add validation states (error colors, helper text)
  - Add helper text display

- **FILE-OV-021**: `src/components/ui/Tabs.jsx`
  - Add support for vertical tabs (sidebar style)
  - Add pill indicator (under tab instead of bottom border)
  - Add scrollable tabs for many tabs

- **FILE-OV-022**: `src/components/ui/Table.jsx`
  - Add support for sortable headers (click handlers, sort indicators)
  - Add support for status badges (render badge in status column)
  - Add support for checkbox rows (bulk actions)
  - Add responsive overflow handling (horizontal scroll on mobile)

- **FILE-OV-023**: `src/components/ui/Badge.jsx`
  - Add size variants (sm, md, lg)
  - Add icon badge support (icon + text)

## 6. Web Testing Methodology

This section defines comprehensive testing methodology for this plan. The testing approach for design overhaul integrates:

### Testing Pillars
1. **Playwright Automation** - Browser-based end-to-end testing
2. **Chrome DevTools Integration** - Performance profiling, console/network monitoring
3. **Accessibility Testing** - axe-core integration for WCAG compliance
4. **Visual Regression** - Screenshot comparison to prevent design drift
5. **Responsive Testing** - Multi-viewport validation (mobile, tablet, desktop)
6. **Cross-Browser Testing** - Chromium, Firefox, WebKit compatibility

### Test Architecture Patterns

#### Page Object Model (POM)
All tests must use the Page Object Model pattern described below:

```js
// Example: LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page
    this.emailInput = page.getByLabel('Email')
    this.passwordInput = page.getByLabel('Password')
    this.submitButton = page.getByRole('button', { name: 'Sign In' })
    this.errorAlert = page.getByRole('alert')
    this.guestButton = page.getByRole('button', { name: /guest/i })
  }

  async goto() { await this.page.goto('/login') }

  async login(email, password) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
```

**Required Page Objects:**
- `tests/pages/AuthPage.js` - Login/Signup pages
- `tests/pages/HomePage.js` - Home with hero, search, grid
- `tests/pages/SearchPage.js` - Search with filters, results
- `tests/pages/RecipeDetailPage.js` - Recipe detail with tabs (Ingredients, Instructions, Reviews)
- `tests/pages/CreateRecipePage.js` - Create form with dynamic lists
- `tests/pages/ProfilePage.js` - Profile with tabs (My Recipes, Favorites, Activity, Settings)
- `tests/pages/AdminStatsPage.js` - Admin dashboard overview
- `tests/pages/AdminRecipesPage.js` - Recipe management table
- `tests/pages/UserListPage.js` - User management table

#### Fixtures and Authentication Reuse
Use custom fixtures for authentication state reuse (avoids logging in for every test):

```js
// fixtures.js
import { test as base } from '@playwright/test'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'

export const test = base.extend({
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page)
    await use(authPage)
  },
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page)
    await use(homePage)
  },
  authenticatedAsUser: async ({ page }, use) => {
    // Reuse storage state from global-setup
    await use({ page, user: { email: 'user@test.com', role: 'user' } })
  },
})
export { expect } from '@playwright/test'
```

#### Global Setup for Auth States
Create auth state files for each user type:

```js
// global-setup.js
import { chromium } from '@playwright/test'

async function globalSetup() {
  const states = [
    { file: '.auth/admin.json', email: 'admin@test.com', password: 'admin123', path: '/admin' },
    { file: '.auth/user.json', email: 'user@test.com', password: 'user123', path: '/' },
    { file: '.auth/guest.json', loginAsGuest: true, path: '/' },
  ]
  // Save auth state for each user type
}
export default globalSetup
```

#### Test Structure Best Practices
All test files must follow this structure:

```js
test.describe('Recipe Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recipes')
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async ({ page, context }) => {
    // Cleanup: delete test data via API
    await page.request.delete('/api/test/cleanup')
    // Check console errors
    const errors = await page.evaluate(() => window._consoleErrors || [])
    expect(errors.length).toBe(0)
  })

  test('creates a recipe', async ({ page }) => {
    await test.step('Navigate to create form', async () => {
      await page.goto('/recipes/create')
    })

    await test.step('Fill recipe fields', async () => {
      await page.getByLabel('Title').fill('Test Recipe')
      await page.getByLabel('Description').fill('Test description')
    })

    await test.step('Submit form', async () => {
      await page.getByRole('button', { name: /create|submit/i }).click()
    })

    await test.step('Verify success', async () => {
      await expect(page.getByText(/created|saved|success/i)).toBeVisible()
      await expect(page).toHaveURL('/recipes/1')
    })
  })
})
```

## 7. Testing Implementation Guide

### Automated Testing Setup (Phase 14)

- GOAL-014: Implement comprehensive Playwright test suite with Page Objects, fixtures, Chrome DevTools, and CI/CD integration

| Task    | Description                                                   | Completed | Date       |
| -------- | ------------------------------------------------------------- | --------- | ---------- |
| TASK-OV-114 | Install and configure Playwright - Add @playwright/test package, configure test environment with browser providers (chromium, firefox, webkit) |           |            |
| TASK-OV-115 | Create test configuration - Setup `playwright.config.js` with test directory, baseURL, viewport configuration, trace on failure |           |            |
| TASK-OV-116 | Create reusable test utilities - Build helper functions for authentication (login, signup, guest mode), data seeding, cleanup |           |            |
| TASK-OV-116-A | Create Page Object classes - Implement tests/pages/*.js for all 8 pages (Auth, Home, Search, RecipeDetail, CreateRecipe, Profile, AdminStats, AdminRecipes, UserList) |           |            |
| TASK-OV-116-B | Create fixtures - Implement fixtures.js with auth state reuse, test data generation |           |            |
| TASK-OV-116-C | Create global setup - Implement global-setup.js to save auth states for admin, user, guest |           |            |
| TASK-OV-117 | Write visual regression tests - Create screenshot comparison tests for all 13 screens to catch layout shifts and visual changes |           |            |
| TASK-OV-118 | Write user flow tests - Create end-to-end tests for critical paths: authentication, recipe creation, search, admin operations |           |            |
| TASK-OV-119 | Write responsive tests - Create tests for mobile (375px), tablet (768px), desktop (1920px) viewports for all screens |           |            |
| TASK-OV-120 | Write accessibility tests - Use Playwright's built-in a11y assertions (axe-core) to verify WCAG AA compliance on all screens |           |            |
| TASK-OV-121 | Write dynamic data tests - Create tests that verify UI works with empty state, single item, bulk data (100 items) to catch hardcoded values |           |            |
| TASK-OV-122 | Write guest mode tests - Verify guest badge visibility, restricted states, and "Login to {action}" messages appear correctly. **CRITICAL**: Include test for guest Random Recipe analytics bypass (FREQ-RS-000-1, FREQ-RS-000-2, AC-RS-033) - verify per-recipe view counts, `daily_stats.views`, and `activeUsers` do NOT contain guest entries when guest uses "Surprise Me" button |           |            |
| TASK-OV-123 | Write event system tests - Verify favoriteToggled and recipeUpdated events fire correctly and listening components update |           |            |
| TASK-OV-124 | Configure Chrome DevTools integration - Setup Playwright to launch Chrome with DevTools protocol for performance and debugging |           |            |
| TASK-OV-125 | Set up performance benchmarks - Use Chrome DevTools Performance API to capture Core Web Vitals (LCP, CLS, FID, TTI) baselines |           |            |
| TASK-OV-126 | Create CI/CD integration - Add Playwright tests to GitHub Actions or similar CI environment to run on every pull request |           |            |
| TASK-OV-127 | Document test coverage - Create README in test directory explaining test structure, how to run, how to add new tests |           |            |
| TASK-OV-128 | Run initial test suite - Execute all tests, capture baseline screenshots and metrics, fix any immediate failures |           |            |

- **TEST-OV-DESIGN-001**: Screen-by-Screen Comparison (TASK-OV-001 through TASK-OV-008)
  - Side-by-side comparison with Stitch screenshots
  - Verify layout matches: card grid, sidebar placement, hero sections
  - Verify typography matches: heading sizes, font weights, line heights
  - Verify spacing matches: padding, margins, gaps
  - Verify color scheme matches: brand colors, status colors

- **TEST-OV-DESIGN-002**: Component Consistency Check (TASK-OV-073 through TASK-OV-079)
  - Verify all cards use same Card component
  - Verify all buttons use same Button component variants
  - Verify all inputs use same Input component styles
  - Verify all modals use same Modal component animations

### Functional Regression Testing

- **TEST-OV-FUNC-001**: Authentication Flow (TASK-OV-104)
  - Test login with valid credentials
  - Test login with invalid credentials
  - Test signup with new account
  - Test signup with duplicate email
  - Test "Continue as Guest" (guest mode integration)
  - Test logout

- **TEST-OV-FUNC-002**: Guest Mode Integration (TASK-OV-104)
  - Enter guest mode
  - Verify "Guest" badge appears in navbar
  - Verify like/favorite/review buttons are disabled
  - Verify appropriate messages shown ("Login to like", etc.)
  - Verify CreateRecipe redirects to login
  - Verify Profile redirects to login

- **TEST-OV-FUNC-003**: Random Recipe Suggestion (TASK-OV-105)
  - Click "Surprise Me" button
  - Verify modal opens with recipe
  - Verify recipe meets quality constraints (>= 5 likes, >= 1 review)
  - Test "Try Another" button
  - Verify loading states appear
  - Verify navigation to recipe detail works
  - **CRITICAL**: Verify guest usage does NOT increment per-recipe view counts, `daily_stats.views` (FREQ-RS-000-1, FREQ-RS-000-2, AC-RS-033), and verify `activeUsers` does NOT contain guest ID

- **TEST-OV-FUNC-004**: Recipe Management (TASK-OV-107)
  - Create new recipe with all fields (title, image, ingredients, instructions, difficulty, time)
  - Edit existing recipe
  - Delete own recipe
  - View recipe statistics (likes, reviews, views)
  - Verify updates reflect immediately in UI

- **TEST-OV-FUNC-005**: Search and Filter (TASK-OV-108)
  - Search by recipe name
  - Search by ingredient
  - Search by author
  - Filter by category (Breakfast, Lunch, Dinner, Dessert, etc.)
  - Filter by difficulty level
  - Filter by cooking time
  - Verify clear filters button works
  - Verify results match filters applied

- **TEST-OV-FUNC-006**: Interactive Features (TASK-OV-109)
  - Like recipe - verify count increments, button state changes
  - Unlike recipe - verify count decrements
  - Favorite recipe - verify added to favorites
  - Unfavorite recipe - verify removed from favorites
  - Add review - verify review appears, rating displayed
  - Delete review - verify review removed

- **TEST-OV-FUNC-007**: Admin Operations (TASK-OV-110)
  - View dashboard stats - verify metrics accurate
  - Approve user - verify status changes
  - Suspend user - verify restrictions apply
  - Activate user - verify access restored
  - Promote user to admin - verify access granted
  - Approve recipe - verify appears in feed
  - Reject/Pending recipe - verify doesn't appear in feed
  - Delete recipe - verify removed

- **TEST-OV-FUNC-008**: Navigation (TASK-OV-111)
  - Navigate between all pages via links
  - Use browser back button - verify history works
  - Direct URL access (refresh) - verify state preserved
  - Verify no broken links

- **TEST-OV-FUNC-009**: Event System (TASK-OV-112)
  - Like recipe - verify favoriteToggled event fires
  - Create recipe - verify recipeUpdated event fires
  - Edit recipe - verify recipeUpdated event fires
  - Verify other listening components update correctly

- **TEST-OV-FUNC-010**: No Hardcoded Values (TASK-OV-113)
  - Empty all recipes - verify proper empty states
  - Add 1 recipe - verify displays correctly
  - Add 100 recipes - verify pagination/grid scales
  - Verify no recipe names, counts, or data appears hardcoded

### Responsive Design Testing (responsive testing pattern in this plan)

- **TEST-OV-RESP-001**: Mobile (< 640px) - Viewports: 375px, 414px (TASK-OV-088, TASK-OV-119)
  - Test Auth pages (Login, Signup) - verify layout fits, single column
  - Test Home page - verify hero visible, search accessible, grid collapses to 1 column
  - Test Search page - verify filters collapsible (accordion/drawer), results in 1 column
  - Test Recipe Detail - verify hero image preserves aspect (4:3), tabs scrollable, ingredients readable
  - Test Profile - verify profile header fits, tabs scrollable horizontally, content stacks
  - Test Admin pages - verify tables horizontally scrollable with overflow-x, stats cards collapse to 1 column
  - Verify hamburger menu works, navigation drawer opens/closes
  - Verify touch targets ≥ 44x44px

- **TEST-OV-RESP-002**: Tablet (640px - 1024px) - Viewports: 768px, 1024px (TASK-OV-089, TASK-OV-119)
  - Test all screens - verify 2-3 column grids, filter sidebar visible (not collapsed)
  - Verify no layout shifts or horizontal scrolls (except tables)
  - Verify touch targets appropriately sized
  - Verify Search filters sidebar visible, results in 2 column grid
  - Verify Admin tables accommodate 2-3 columns before horizontal scroll

- **TEST-OV-RESP-003**: Desktop (> 1024px) - Viewports: 1280px, 1440px, 1920px (TASK-OV-090, TASK-OV-119)
  - Test all screens - verify 4-5 column grids, full utilization
  - Verify no excessive whitespace or cramped content
  - Verify max-width containers (1200-1280px) center content appropriately
  - Verify hero images display at full width
  - Verify Admin stats cards (total users, total recipes, etc.) display in 3-4 column grid

### Accessibility Testing (accessibility testing pattern in this plan)

- **TEST-OV-A11Y-001**: ARIA Labels (TASK-OV-096, per this checklist)
  - Inspect all buttons - verify aria-label or text content exists
  - Inspect icon-only buttons (favorite, close, etc.) - verify aria-label present
  - Inspect forms - verify inputs have aria-label or associated labels (via `for` attribute)
  - Inspect modals - verify aria-modal="true" attribute and role="dialog"
  - Inspect navigation - verify aria-label for icon-only links
  - Inspect tabs - verify role="tablist", role="tab", role="tabpanel" attributes
  - Verify dynamic content announcements with aria-live regions (search results, error messages)

- **TEST-OV-A11Y-002**: Keyboard Navigation (TASK-OV-097, per this checklist)
  - Tab through page sequentially - verify logical focus order follows DOM structure
  - Open modal - verify focus moves to first interactive element (not to modal container)
  - Close modal - verify focus returns to triggering element (focus restoration)
  - Use Enter/Space to activate buttons and links - verify works
  - Use ESC to close modals and dropdowns - verify works everywhere
  - Use arrow keys to navigate tab lists - verify works
  - Use arrow keys to navigate radio/checkbox groups - verify works
  - Verify focus visible state has 2px ring/outline

- **TEST-OV-A11Y-003**: Screen Reader Compatibility (TASK-OV-098, per this checklist)
  - Use NVDA, JAWS, or VoiceOver on Windows/Mac
  - Navigate through app - verify content announced clearly
  - Test modal open/close - verify announced with role and name
  - Test tab switches - verify panel name announced
  - Test dynamic content updates (search results, likes increment) - verify announced with aria-live
  - Test error messages - verify announced with role="alert" or aria-live="assertive"
  - Verify form validation errors linked to inputs via aria-describedby

- **TEST-OV-A11Y-004**: Color Contrast (TASK-OV-099, per this checklist)
  - Use web contrast checker on all screens (Chrome DevTools Accessibility Audit)
  - Verify primary text meets 4.5:1 ratio (WCAG AA standard)
  - Verify large text (≥18px or ≥14px bold) meets 3:1 ratio
  - Verify status badges (green/yellow/red) have sufficient contrast badge background vs. text
  - Verify brand accent (#137fec) vs. white text meets contrast
  - Verify primary brand (#C8102E) vs. white text meets contrast
  - Verify interactive elements (buttons, links) maintain contrast on hover/focus states
  - Fix any failing contrast issues per this checklist

- **TEST-OV-A11Y-005**: Heading Hierarchy
  - Check heading levels follow sequential order (H1 → H2 → H3, no skipping)
  - Verify h1 appears first on each page (page title)
  - Verify h2 for section/section titles, h3 for subsections
  - Verify headings contain descriptive text (not empty or decorative)

- **TEST-OV-A11Y-006**: Form Accessibility
  - Verify all form inputs have associated labels (via `<label for>` or `aria-label`/`aria-labelledby`)
  - Verify error messages linked to inputs via `aria-describedby`
  - Verify required fields indicated with `aria-required="true"` or `required` attribute
  - Verify helper text linked to inputs via `aria-describedby`
  - Verify form validation provides clear feedback via role="alert" or aria-live regions

- **TEST-OV-A11Y-007**: Touch Targets
  - Verify all interactive elements on mobile meet minimum 44x44px
  - Verify buttons, links, cards clickable areas are large enough
  - Verify spacing between touch targets to prevent accidental taps (8px minimum gap per this checklist)

- **TEST-OV-A11Y-008**: Image Accessibility
  - Verify all recipe images have alt text (descriptive, not "image123.png")
  - Verify decorative images have alt="" or role="presentation"
  - Verify image aspect ratios preserved for screen readers (alt text describes content)
  - Verify user avatars have alt="user's name" or empty for decorative

### Cross-Browser Testing

- **TEST-OV-BROWSER-001**: Google Chrome (TASK-OV-100)
  - Test all 13 screens in Chrome 90+
  - Verify localStorage works
  - Verify no console errors
  - Verify animations play smoothly
  - Verify responsive breakpoints work

- **TEST-OV-BROWSER-002**: Mozilla Firefox (TASK-OV-101)
  - Test all 13 screens in Firefox 88+
  - Verify event listeners work (favoriteToggled, recipeUpdated)
  - Verify flexbox/grid layouts match Chrome
  - Verify no layout differences

- **TEST-OV-BROWSER-003**: Microsoft Edge (TASK-OV-102)
  - Test all 13 screens in Edge 90+
  - Verify Chromium compatibility
  - Verify rendering matches Chrome (mostly)
  - Verify touch interactions work

- **TEST-OV-BROWSER-004**: Apple Safari (TASK-OV-103)
  - Test all 13 screens in Safari 14+ (if accessible)
  - Verify WebKit rendering
  - Verify touch interactions smooth on iOS
  - Verify flexbox/grid support
  - Check for Safari-specific CSS needs

---

## 8. Error Handling & Debugging

### Console Monitoring Strategy

- **TEST-OV-ERROR-001**: Console Error Tracking
  - Monitor console errors during all Playwright tests via `page.on('console')` listener
  - Categorize errors:
    - JavaScript errors (TypeError, ReferenceError, SyntaxError)
    - Warnings (deprecation warnings, ignored promises)
    - Info messages (analytics beacons, etc.)
  - Fail tests if any JavaScript errors occur (unless explicitly ignored)
  - Log warnings to review (deprecations indicate future breaking changes)
  - Use Chrome DevTools Console tab for manual debugging (filter by error/warning levels)

- **TEST-OV-ERROR-002**: Network Request Monitoring
  - Monitor all network requests via `page.on('request')` and `page.on('response')`
  - Track failed requests (status >= 400 or status === 0)
  - Verify no 404s for static assets (images, CSS, JS files)
  - Verify no 500s for API calls (indicate server errors)
  - Check slow requests (> 3 seconds) using `page.on('responsefinished')` timing data
  - Verify API response codes correct (200 OK for GET/POST, 201 Created, 204 No Content, etc.)
  - Use Chrome DevTools Network tab for manual debugging (filter by status code, response time)

- **TEST-OV-ERROR-003**: JavaScript Exception Handling
  - Capture unhandled promise rejections via `window.addEventListener('unhandledrejection')`
  - Capture global errors via `window.addEventListener('error')`
  - Verify React error boundaries catch component errors gracefully
  - Verify error boundaries show user-friendly error messages (not React stack traces in production)
  - Test error boundary triggers:
    - Intentional null reference in component
    - Intentional undefined property access
    - Intentional failed promise in useEffect
  - Verify crash recovery (user can navigate away, retry action, reload page)

- **TEST-OV-ERROR-004**: User-Friendly Error Messages
  - Verify all error messages are human-readable (not technical stack traces)
  - Verify error messages include actionable next steps ("Try again", "Contact support", etc.)
  - Verify form validation errors appear below affected inputs (not in modal alert)
  - Verify API error messages show what went wrong (e.g., "Email already in use" vs. generic error)
  - Verify guest users see helpful messages ("Login to like" vs. "Access denied")
  - Verify empty states show friendly messages ("No recipes found. Try adjusting filters" vs. blank screen)

- **TEST-OV-ERROR-005**: Network Error Handling
  - Verify offline handling with Service Worker (if implemented)
  - Verify slow network handling (use Chrome DevTools Network Throttling: Slow 3G)
  - Verify failed API requests show error to user with retry option
  - Verify timeout handling for long requests (> 10 seconds)
  - Optimize image loading (check for unnecessary large requests via Network tab)
  - Verify no race conditions from duplicate API calls

---

## 9. Performance Monitoring (Chrome DevTools pattern)

### Core Web Vitals Baselines

- **TEST-OV-PERF-001**: Largest Contentful Paint (LCP) (TASK-OV-125)
  - Measure LCP for all 13 screens (within 2.5 seconds threshold per this checklist)
  - Identify slow LCP culprits via Chrome DevTools Performance tab LCP marker
  - Optimize LCP by:
    - Lazy loading below-fold images
    - Preloading critical CSS/fonts
    - Optimizing image formats (WebP, appropriate sizes)
  - Set LCP performance budget at 2.5 seconds for all pages

- **TEST-OV-PERF-002**: Cumulative Layout Shift (CLS) (TASK-OV-125)
  - Measure CLS for all 13 screens (within 0.1 threshold per this checklist)
  - Identify layout shift culprits via Chrome DevTools Performance tab Layout Shift markers
  - Fix layout shifts by:
    - Reserving image space with aspect-ratio CSS
    - Avoiding dynamic content insertion without reserved space
    - Using transform animations (won't trigger layout shift)
  - Set CLS performance budget at 0.1 for all pages

- **TEST-OV-PERF-003**: First Input Delay (FID) (TASK-OV-125)
- Measure FID for interactive elements (target < 100ms though this plan doesn't specify a strict threshold)
  - Identify long tasks blocking main thread via Chrome DevTools Performance tab Long Tasks
  - Optimize FID by:
    - Code splitting large JS bundles
    - Debouncing event handlers if expensive
    - Using React.lazy() for route components
  - Verify no JavaScript tasks > 50ms block user input

- **TEST-OV-PERF-004**: Time to Interactive (TTI) (TASK-OV-125)
  - Measure TTI for all 13 screens (target < 5 seconds per this checklist: page load < 3 seconds)
  - Identify JavaScript execution blocking interactivity via Performance tab
  - Optimize TTI by:
    - Reducing initial JS bundle size (tree-shaking, code splitting)
    - Deferring non-critical JS (analytics, social widgets)
    - Using React.lazy for non-critical UI and memoizing heavy components
  - Set TTI performance budget at 5 seconds for all pages

- **TEST-OV-PERF-005**: Bundle Size Monitoring
  - Measure production bundle sizes for each route (goal: < 100KB JS per route)
- Use a bundle analyzer (e.g., rollup-plugin-visualizer) to generate a bundle report
  - Identify largest dependencies contributing to bundle size
  - Optimize by:
    - Using dynamic imports for heavy libraries (charts, PDF generator)
    - Replacing large libraries with lighter alternatives
    - Implementing tree-shaking to remove unused code
  - Verify no duplicate dependencies

- **TEST-OV-PERF-006**: Rendering Performance
  - Use Chrome DevTools Performance tab to profile render cycles
  - Identify forced reflows and unnecessary repaints
  - Verify unnecessary re-renders avoided (React DevTools Profiler)
  - Test with 100 recipes in grid to ensure rendering scales:
    - Virtualized long lists if needed (react-window or react-virtualized)
    - Pagination or infinite scroll if rendering > 50 items
  - Verify animations are GPU-accelerated (use transform/opacity, not left/top)

---

## 10. Testing Checklist

### Functional Testing

- [ ] All user flows work end-to-end
- [ ] Form validation tested for success and failure cases
- [ ] Error handling verified (per ERROR-001 through ERROR-005)
- [ ] Edge cases covered (empty state, bulk data, invalid data)

### Responsive Testing

- [ ] Tested on mobile (375px, 414px)
- [ ] Tested on tablet (768px, 1024px)
- [ ] Tested on desktop (1280px, 1440px, 1920px)
- [ ] Navigation accessible on mobile (hamburger menu)
- [ ] No horizontal scrollbars (except tables)

### Cross-Browser

- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Tested in Safari/WebKit
- [ ] Tested in Edge

### Accessibility

- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible
- [ ] ARIA labels on icon-only buttons
- [ ] Form fields have labels
- [ ] Images have alt text (except decorative)
- [ ] Touch targets ≥ 44x44px on mobile
- [ ] Heading hierarchy logical (H1 → H2 → H3)
- [ ] Color contrast meets WCAG AA (4.5:1 body, 3:1 large)
- [ ] Screen reader announcements for dynamic content

### Performance

- [ ] Page load time < 3 seconds
- [ ] LCP < 2.5 seconds (TASK-OV-125)
- [ ] CLS < 0.1
- [ ] No layout shifts on interaction
- [ ] Images optimized (WebP, lazy load)
- [ ] Bundle sizes monitored (< 100KB per route)
- [ ] Console errors logged and reviewed

### Error Handling

- [ ] Console errors logged and reviewed
- [ ] Failed network requests identified
- [ ] 404s checked and fixed
- [ ] 500 errors investigated
- [ ] User-friendly error messages shown

---

## 11. Risks & Assumptions

### Implementation Risks

- **RISK-OV-001**: Design overhaul may break existing event-driven updates (favoriteToggled, recipeUpdated)
  - **Mitigation**: Test event system thoroughly (TASK-OV-112); ensure dispatch calls preserved
  - **Impact**: High - Could cause stale data, synchronization issues

- **RISK-OV-002**: Component enhancements (Modal, Button, Card, etc.) may introduce breaking changes
  - **Mitigation**: Test components individually (TASK-OV-080) before full integration; maintain backward compatibility
  - **Impact**: Medium - Could break existing uses elsewhere in codebase

- **RISK-OV-003**: Guest mode and random recipe features may not be complete, blocking design overhaul
  - **Mitigation**: PREREQ-OV-001 and PREREQ-OV-002 enforce correct order; verify features complete before starting
  - **Impact**: High - Would cause significant rework or incomplete design

- **RISK-OV-004**: Stitch designs may not perfectly align with existing component patterns
  - **Mitigation**: Enhance components gradually as needed; compromise on minor design differences if necessary
  - **Impact**: Medium - Could affect design fidelity or require more component changes

- **RISK-OV-005**: Responsive design across 13 screens is complex and time-consuming
  - **Mitigation**: Use consistent breakpoints (640px, 768px, 1024px) and Tailwind responsive utilities
  - **Impact**: Low - Manageable with systematic approach, phases 10 and 11 address this

- **RISK-OV-006**: Cross-browser differences (Firefox vs. Chrome vs. Safari) may cause layout issues
  - **Mitigation**: Use standard CSS properties; vendor prefixes if needed; thorough cross-browser testing (Phase 12)
  - **Impact**: Low - Common challenge, phased testing catches issues

- **RISK-OV-007**: Overhaul touches major files (13 pages, 6 layouts, 9 components) - git conflicts possible
  - **Mitigation**: Work on isolated phases; commit frequently; use feature branches if needed
  - **Impact**: Medium - Git workflow best practices mitigate this

- **RISK-OV-008**: Hardcoded values may accidentally slip into new UI code
  - **Mitigation**: Code review specifically for hardcoded strings/numbers; systematic testing (TASK-OV-113)
  - **Impact**: Medium - Violates user requirement; testing catches this

- **RISK-OV-009**: Guest mode restrictions may not be obvious or clear in new design
  - **Mitigation**: Use clear messaging ("Login to {action}") and visual badges; test with guest users
  - **Impact**: Low - Usability issue, testing catches this

- **RISK-OV-010**: Performance regression from more complex UI renderings
  - **Mitigation**: Use React.memo for expensive components; lazy loading for heavy components; monitor bundle size
  - **Impact**: Low - Optimization opportunities exist; Vite handles bundling well
- **RISK-OV-011**: Flaky automated tests (visual regression, timing issues)
  - **Mitigation**: Use wait strategies (waitForSelector, waitForResponse), implement retry logic, use consistent viewports
  - **Impact**: Medium - False positives in CI/CD, requires test maintenance
- **RISK-OV-012**: Playwright/DevTools integration affects test reliability or performance
  - **Mitigation**: Test integration in isolation, monitor memory usage, use minimal DevTools features
  - **Impact**: Low - Playwright supports Chrome DevTools well; has patterns for common use cases
- **RISK-OV-013**: Continuous integration resource costs or timeout issues
  - **Mitigation**: Optimize test parallelization, implement efficient test caching, set reasonable timeouts
  - **Impact**: Low - GitHub Actions and similar CI platforms handle Playwright efficiently
- **RISK-OV-014**: Visual regression tests require frequent baseline updates (false positives from minor changes)
  - **Mitigation**: Use pixel difference thresholds, exclude dynamic content (dates, timestamps) from screenshot comparison
  - **Impact**: Medium - Test maintenance overhead; automated tests reduce manual testing burden

### Assumptions

- **ASSUMPTION-OV-001**: Both prerequisite features (guest mode, random recipe) will be complete before this plan starts
  - **Validation**: Check status of both plans; verify all tasks marked Completed
  - **Impact**: High - Blocking dependency; must enforce execution order

- **ASSUMPTION-OV-002**: Stitch screenshots show complete designs for all screens
  - **Validation**: Reference screenshots for each screen; assume hidden interactions follow standard patterns
  - **Impact**: Medium - May need inference for some interactions

- **ASSUMPTION-OV-003**: Existing components can be enhanced to support new design needs without major rewrites
  - **Validation**: Review component code; assess enhancement feasibility during implementation of TASK-OV-073 through TASK-OV-079
  - **Impact**: Medium - If infeasible, may need to revisit "no new components" constraint

- **ASSUMPTION-OV-004**: Tailwind v4 supports all CSS properties needed for Stitch designs
  - **Validation**: Review Tailwind v4 documentation; test during implementation
  - **Impact**: Low - Tailwind is expressive; any gaps can use custom CSS

- **ASSUMPTION-OV-005**: storage.js API remains stable (no breaking changes expected)
  - **Validation**: Review storage.js functions; ensure no breaking changes in guest mode/random recipe plans
  - **Impact**: Low - Unlikely; if changes occur, update references here

- **ASSUMPTION-OV-006**: CSS Grid and Flexbox support in target browsers is complete
  - **Validation**: Browser support targets: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
  - **Impact**: Low - All major browsers support these features

- **ASSUMPTION-OV-007**: User's browser supports ES6+ and modern JS features
  - **Validation**: Project already targets modern browsers; no polyfills needed
  - **Impact**: Low - Project requirements align with modern web standards
- **ASSUMPTION-OV-008**: Playwright supports all testing requirements (a11y, performance, Chrome DevTools)
  - **Validation**: Playwright documentation confirms axe-core integration, Chrome DevTools Protocol support
  - **Impact**: Low - Playwright actively maintained; supports all required features
- **ASSUMPTION-OV-009**: CI/CD platform (GitHub Actions, GitLab CI, etc.) supports Playwright and parallel test execution
  - **Validation**: Review CI platform documentation; confirm Playwright runner compatibility
  - **Impact**: Low - Major CI platforms support Playwright well; fallback: run locally on push
- **ASSUMPTION-OV-010**: Team has access to modern browsers for local test development
  - **Validation**: Chrome 90+, Firefox 88+, Safari 14+ for cross-browser manual testing
  - **Impact**: Low - Automated tests run Chromium, manual testing covers others

### Technical Debt Considerations

- **DEBT-OV-001**: Component files may become large with enhancement props/options
  - **Remediation**: Split into smaller components or hooks for complex logic
  - **Effort**: Medium (refactoring during maintenance)

- **DEBT-OV-002**: Visual regression baselines will need periodic updates
  - **Remediation**: Document baseline update procedure and use pixel-diff thresholds
  - **Effort**: Medium

- **DEBT-OV-003**: Design system lacks documentation (spacing scale, component usage)
  - **Remediation**: Create a lightweight design system guide (or Storybook later)
  - **Effort**: Medium

- **DEBT-OV-004**: No internationalization (i18n) support
  - **Remediation**: Plan translation keys and extraction for user-facing text
  - **Effort**: Large

- **DEBT-OV-005**: Automated accessibility monitoring is not continuous
  - **Remediation**: Add CI reporting/dashboard for a11y results
  - **Effort**: Medium

- **DEBT-OV-006**: Performance monitoring is lab-only (DevTools)
  - **Remediation**: Add RUM analytics in production if needed
  - **Effort**: Medium

- **DEBT-OV-007**: Cross-browser testing is manual
  - **Remediation**: Add automated cross-browser runs in CI (BrowserStack/Sauce Labs)
  - **Effort**: Large

- **DEBT-OV-008**: Edge-case data coverage is limited
  - **Remediation**: Add data generators for long text, unicode, and large lists
  - **Effort**: Small

---

## 12. Related Specifications / Further Reading

### Project Documentation

- [README](../README.md) - Setup and run instructions
- [DESIGN](../DESIGN.md) - UI and architecture notes
- [PROPOSAL](../PROPOSAL.md) - Project scope and goals
- [`src/lib/storage.js`](../src/lib/storage.js) - Local storage data model and APIs
- [`src/context/AuthContext.jsx`](../src/context/AuthContext.jsx) - Auth state and role checks
- [`src/components/ui/`](../src/components/ui/) - UI primitives used across screens
- [`src/layouts/`](../src/layouts/) - Layout and navigation patterns

### Existing Implementation Plans

- [Guest Mode Feature](./feature-guest-mode-1.md) - ✅ Implemented — Guest authentication, read-only access, no metrics tracking (PREREQ-OV-001)
- [Random Recipe Suggestion](./feature-random-recipe-suggestion-1.md) - ✅ Implemented — "Surprise Me" button, quality constraints, modal (PREREQ-OV-002)

### Stitch Design Screens

- **Stitch Project**: [https://stitch.withgoogle.com/projects/12469199353397755583](https://stitch.withgoogle.com/projects/12469199353397755583)
- **Screens Referenced**:
  - Kitchen Odyssey Home - Recipe Feed (TASK-OV-010 through TASK-OV-018)
  - Admin Recipe Management Table (TASK-OV-064 through TASK-OV-068)
  - Admin Dashboard Overview (TASK-OV-058 through TASK-OV-062)
  - Search and Filtering Results (TASK-OV-020 through TASK-OV-027)
  - User Authentication (TASK-OV-001 through TASK-OV-008)
  - Admin User Management Table (TASK-OV-069 through TASK-OV-072)
  - Pending User Restricted State (TASK-OV-034)
  - Recipe Detail View (TASK-OV-028 through TASK-OV-037)
  - Edit Profile Modal Interface (TASK-OV-053, TASK-OV-055)
  - Create New Recipe Form (TASK-OV-038 through TASK-OV-047)
  - Search Results Empty State (TASK-OV-024)
  - User Profile with Tabs (TASK-OV-048 through TASK-OV-057)

### React & UI/UX Documentation

- [React Hooks](https://react.dev/reference/react) - useState, useEffect, useCallback patterns
- [React Router](https://reactrouter.com/en/main) - useNavigate, useParams, routing patterns
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS, responsive design, spacing scale
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Color contrast, keyboard navigation, ARIA attributes
- [Playwright Documentation](https://playwright.dev/) - Automated testing, visual regression, browser automation

### Testing Patterns

- Page Object Model (POM) for reusable page interactions
- Fixtures for auth state reuse (admin, user, guest)
- Global setup for saving auth states to storage files
- beforeEach/afterEach + test.step() for structure
- Viewport arrays for responsive testing
- axe-core for a11y checks (WCAG AA)
- DevTools/console/network inspection for troubleshooting
- Visual regression via screenshot comparison

### Testing Tools & Libraries

- **Playwright** (@playwright/test) - Open-source test automation framework
- **@axe-core/playwright** - Accessibility testing via axe-core integration (TASK-OV-120)
- **Chrome DevTools Protocol** - Performance profiling, debugging, network inspection
- **Axe-Core** (https://www.deque.com/axe/) - Web accessibility testing engine
- **Core Web Vitals** (https://web.dev/vitals/) - Performance metrics (LCP, CLS, FID, TTI) guidelines

### Design Patterns

- [Google Material Design](https://m3.material.io/components) - Card-based layouts, elevation, ripple effects (referenced for patterns)
- [Smashing Magazine - UI Patterns](https://www.smashingmagazine.com/) - Modern web design trends, responsive grids
- [A List Apart - Forms](https://alistapart.com/topic/forms/) - Form best practices, validation, user feedback

### Future Enhancement Notes

When considering post-overhaul enhancements or iterations:

1. **Design System Documentation**: Create component library documentation (Storybook) for consistency
2. **Visual Regression Tests**: ✅ Implemented via Playwright (TASK-OV-117) - Expand with more complex scenarios
3. **Automated Accessibility Testing**: ✅ Implemented via axe-core + Playwright (TASK-OV-120) - Add continuous monitoring dashboard
4. **Internationalization**: Add translation support for global users
5. **Theme Support**: Add dark/light mode toggle (popular feature request)
6. **Progressive Web App**: Convert to PWA for offline support and installability
7. **Performance Monitoring**: ✅ Implemented via Chrome DevTools (TASK-OV-125) - Add analytics SDK for production monitoring
8. **A/B Testing**: Test design variants using existing analytics infrastructure
9. **E2E Test Expansion**: Add more complex user flows (e.g., guest → signup → create recipe)
10. **Test Coverage Dashboard**: Create visualization of test results, coverage, and pass/fail trends over time

**Critical Reminder**: This design overhaul plan MUST NOT be started until BOTH feature-guest-mode-1.md and feature-random-recipe-suggestion-1.md have status: 'Completed'. Executing this plan prematurely would require significant rework to account for the components, state, and functionality those plans introduce.

**IMPORTANT: NO IMPLEMENTATION YET** - This plan document is for future execution after prerequisites are met. All changes described here are for a future UI overhaul from current design to new Stitch UI. No code should be implemented now.




