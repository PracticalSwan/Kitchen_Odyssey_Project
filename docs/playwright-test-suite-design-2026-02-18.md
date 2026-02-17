# Playwright Test Suite Design

**Date:** 2026-02-18
**Project:** Kitchen Odyssey Recipe Sharing System
**Status:** Approved
**Author:** Claude (Sonnet 4.5)

---

## Overview

Comprehensive end-to-end test suite design for Kitchen Odyssey application covering authentication, recipe management, user profiles, and administrative functions. Tests will execute manually with AI-assisted debugging for failed tests.

**Context:** Post-migration testing (localStorage → Next.js + MongoDB Atlas backend with JWT auth)

---

## Architecture

### Directory Structure

```
Kitchen_Odyssey/tests/
├── helpers/                          # Shared utilities and fixtures
│   ├── auth.js                       # Login/signup/logout helpers
│   ├── navigation.js                 # Navigation shortcuts
│   ├── selectors.js                  # Reusable Playwright selectors
│   ├── cleanup.js                    # Test data cleanup utilities
│   └── data.js                       # Seed data fixtures
│
├── auth/                             # Authentication tests
│   ├── login.spec.js                 # Login flows, validation
│   ├── signup.spec.js                # Registration, validation, pending status
│   ├── logout.spec.js                # Logout, session clearing
│   ├── password-reset.spec.js        # Password reset flow
│   └── session-management.spec.js    # JWT token handling
│
├── home/                             # Home page & discovery
│   ├── home-page.spec.js             # Page load, recipe cards, surprise me
│   ├── search.spec.js                # Search function, results, history
│   ├── filters.spec.js               # Category filters (cuisine, diet, time)
│   └── recipe-suggestions.spec.js    # Surprise me modal functionality
│
├── layout/                           # Layout and navigation
│   ├── navigation.spec.js            # Navbar, role-based links
│   └── responsive.spec.js            # Mobile/tablet/desktop layouts
│
├── recipes/                          # Recipe core features
│   ├── recipe-view.spec.js           # View details, ingredients, instructions
│   ├── recipe-actions.spec.js        # Like, save, share, ingredient checklist
│   ├── recipe-reviews.spec.js        # Ratings, reviews, review CRUD
│   ├── recipe-creator.spec.js        # View chef/creator profile
│   ├── recipe-crud.spec.js           # Create, edit, delete own recipes
│   ├── recipe-images.spec.js         # Image upload, display, fallback
│   ├── recipe-sharing.spec.js        # Share recipe (link, social, email)
│   ├── recipe-scaling.spec.js        # Adjust servings, scale ingredients
│   └── recipe-printing.spec.js       # Print view functionality
│
├── user/                             # User profile & management
│   ├── profile.spec.js               # View/edit profile, statistics
│   ├── favorites.spec.js             # View favorited recipes
│   ├── my-recipes.spec.js            # View/edit/delete own recipes
│   └── account-settings.spec.js      # Password, notifications, preferences
│
├── admin/                            # Admin dashboard & management
│   ├── admin-dashboard.spec.js       # Stats, recent activity, full report
│   ├── user-management.spec.js       # Approve, suspend, delete, filter, search
│   ├── recipe-management.spec.js     # Approve, reject, delete, view recipes
│   └── admin-notifications.spec.js   # Notification handling
│
├── journeys/                         # End-to-end user workflows
│   ├── guest-journey.spec.js         # Extend existing guest tests
│   ├── user-onboarding.spec.js       # Signup → create recipe → explore
│   ├── recipe-lifecycle.spec.js      # Create → approve → manage → delete
│   └── admin-workflow.spec.js        # Approve users → manage recipes → reports
│
├── security/                         # Security testing
│   └── xss-prevention.spec.js        # Input sanitization, injection prevention
│
├── accessibility/                    # Accessibility testing
│   └── a11y.spec.js                  # Keyboard navigation, ARIA, screen readers
│
├── errors/                           # Error handling
│   └── error-handling.spec.js        # 404, 500, network errors, retries
│
├── data/                             # Data management
│   ├── search-history.spec.js        # Search history functionality
│   └── pagination.spec.js            # Pagination controls and behavior
│
├── performance/                      # Performance testing
│   └── loading-states.spec.js        # Loading spinners, skeletons, lazy loading
│
├── integration/                      # Cross-feature integration
│   └── cross-role-workflow.spec.js   # Multi-user workflows
│
└── setup/
    ├── global-setup.js               # Pre-test setup (verify backend, users)
    └── global-teardown.js            # Post-test cleanup
```

**Total: 39 test files**

---

## Test Data Strategy

### Pre-existing Seed Data (from database)

```
Admin:  admin@kitchenodyssey.com / admin
User:   user@kitchenodyssey.com / user
Guest:  (uses guest mode, no account)
```

### Test Data Creation Rules

- **New recipes:** Prefix with `E2E Test - ` for identification
- **New users:** Use timestamp + random suffix (e.g., `e2e-test-1739871234@example.com`)
- **Cleanup:** Delete test-created data in `afterEach` or `afterAll` hooks

### Sequential Execution

Tests that modify state use `test.describe.configure({ mode: 'serial' })` to prevent conflicts.

---

## Helper Utilities

### `helpers/auth.js`

```javascript
// Login as specific user role
async function loginAsAdmin(page)
async function loginAsUser(page)
async function loginAsGuest(page)
async function logout(page)

// Signup with unique email
async function signupUser(page, userData)
```

### `helpers/navigation.js`

```javascript
async function gotoHome(page)
async function gotoSearch(page)
async function gotoRecipe(page, recipeId)
async function gotoProfile(page, userId)
async function gotoAdmin(page)
```

### `helpers/selectors.js`

```javascript
// Common reusable selectors
const loginForm = { email: '#email', password: '#password', submitBtn: 'button[type="submit"]' }
const recipeCard = 'a[href*="/recipe/"]'
const likeBtn = '[data-testid="like-btn"]'
const saveBtn = '[data-testid="save-btn"]'
const searchInput = 'input[placeholder*="Search"]'
const surpriseMeBtn = 'button:has-text("Surprise Me")'
```

### `helpers/cleanup.js`

```javascript
async function cleanupTestRecipes(page, authToken)
async function cleanupTestUser(page, email, authToken)
```

### `helpers/data.js`

```javascript
export const testRecipe = {
  title: 'E2E Test - Chocolate Chip Cookies',
  description: 'Delicious homemade cookies',
  cuisine: 'American',
  dietary: ['Vegetarian'],
  prepTime: 20,
  cookTime: 12,
  servings: 24,
  ingredients: [...],
  instructions: [...],
  tags: ['dessert', 'baking']
};

export const testUser = {
  name: 'E2E Test User',
  email: `e2e-test-${Date.now()}@example.com`,
  password: 'TestPass123!',
  bio: 'Automated test user'
};
```

---

## Test Coverage Details

### Auth Tests

**login.spec.js**
- Valid login (admin, user)
- Invalid credentials (wrong email, wrong password)
- Empty field validation
- "Remember me" functionality
- Redirect after successful login
- Login from different entry points

**signup.spec.js**
- Valid signup with all fields
- Email validation (duplicate, invalid format)
- Password validation (length, matching)
- Role assignment defaults to 'user'
- Pending status flow
- Redirect to login after signup
- Form field validation messages

**logout.spec.js**
- Logout button visibility and click
- Session clearing (JWT token, localStorage)
- Redirect to login page after logout
- Cannot access protected routes after logout

**password-reset.spec.js**
- Request password reset with valid email
- Invalid email handling
- Reset token validation
- New password submission
- Password confirmation matching
- Reset link expiration
- Redirect to login after successful reset

**session-management.spec.js**
- JWT token storage in HttpOnly cookie
- Token refresh on expiry
- Session timeout handling
- Concurrent login handling
- "Remember me" persists session

### Home Tests

**home-page.spec.js**
- Page loads with recipe cards
- "Surprise Me" button functionality
- Recipe cards display correctly (title, image, chef, stats)
- Pagination works
- Responsive layout
- Empty state handling

**search.spec.js**
- Search by recipe name, ingredients, chef
- Search results pagination
- No results state
- Search history display and selection
- Clear search functionality

**filters.spec.js**
- Filter by cuisine type
- Filter by dietary restrictions
- Filter by cooking time
- Filter by difficulty level
- Multiple filters combination
- Clear all filters
- Filter persistence across navigation

**recipe-suggestions.spec.js**
- "Surprise Me" opens suggestion modal
- Modal displays random recipes
- Close modal functionality
- Navigate to suggested recipe
- Suggestions refresh on each open

### Layout Tests

**navigation.spec.js**
- Navbar links for guest (Login, Sign Up, Discover, Search)
- Navbar links for logged-in user (Discover, Search, Create, My Recipes, Profile, Logout)
- Navbar links for admin (includes Admin)
- Mobile menu toggle
- Guest badge visibility
- Breadcrumb navigation

**responsive.spec.js**
- Mobile viewport (< 768px)
- Tablet viewport (768px - 1024px)
- Desktop viewport (> 1024px)
- Touch interactions on mobile

### Recipe Tests

**recipe-view.spec.js**
- View recipe details
- Ingredient checklist toggle
- View recipe creator/chef profile link
- Recipe images display
- Servings adjustment
- Prep/cook time display

**recipe-actions.spec.js**
- Like/unlike recipe
- Save/favorite recipe
- Share recipe (copy link, social buttons)
- Visual feedback for actions
- Like/favorite counts update in real-time

**recipe-reviews.spec.js**
- View existing reviews and ratings
- Submit new review with rating (1-5 stars)
- Edit own review
- Delete own review
- Review validation
- Average rating calculation

**recipe-crud.spec.js**
- Create recipe with all fields
- Edit own recipe
- Delete own recipe with confirmation
- Recipe status (pending → approved/rejected)
- Form validation
- Draft/publish functionality

**recipe-creator.spec.js**
- View creator profile from recipe
- Creator stats display
- Link to creator's other recipes

**recipe-images.spec.js**
- Image upload during creation
- Image preview before submission
- Multiple images handling
- Image fallback on load failure
- Image zoom/lightbox view
- Image alt text accessibility
- Image size limits
- Invalid file type rejection

**recipe-sharing.spec.js**
- Copy recipe link to clipboard
- Share to social media
- Email recipe functionality
- Share link opens recipe correctly
- Shared recipe accessible to guests

**recipe-scaling.spec.js**
- Adjust servings (increase/decrease)
- Ingredient quantities scale correctly
- Original quantities preserved
- Reset to original servings
- Decimal handling in scaling

**recipe-printing.spec.js**
- Print view opens correctly
- Print layout excludes navbar/sidebar
- Images print correctly
- Ingredient checklist prints cleanly

### User Tests

**profile.spec.js**
- View own profile
- Edit profile (name, bio, avatar)
- View profile statistics
- View other users' profiles (public view)
- Profile picture display

**favorites.spec.js**
- View favorited recipes
- Remove from favorites
- Favorites filtering/sorting
- Empty favorites state

**my-recipes.spec.js**
- View own recipes
- Edit own recipe from list
- Delete own recipe from list
- Filter by status (pending, published, rejected)

**account-settings.spec.js**
- Change password
- Email preferences
- Notification settings
- Account deletion request
- Privacy settings

### Admin Tests

**admin-dashboard.spec.js**
- Dashboard loads for admin only
- Stats display (total users, recipes, likes, reviews)
- Recent Activity feed
- Full Report functionality
- Date range filters for reports
- Metric accuracy verification
- Correct date calculations for metrics

**user-management.spec.js**
- View all users table
- Search users by name/email
- Filter users by role
- Filter users by status
- Approve pending user
- Suspend user
- Delete user with confirmation
- User count accuracy

**recipe-management.spec.js**
- View pending recipes queue
- Approve recipe
- Reject recipe (with/without reason)
- Delete published/rejected recipes
- View published recipes
- View rejected recipes
- Filter by status
- Search recipes by title/chef

**admin-notifications.spec.js**
- Notification display for pending approvals
- Mark notifications as read
- Clear all notifications
- Notification count badge
- Real-time notification updates

### Security Tests

**xss-prevention.spec.js**
- Script injection in recipe title/description
- HTML injection in reviews
- SQL injection attempts in search
- CSRF token validation
- Input sanitization
- Output encoding

### Accessibility Tests

**a11y.spec.js**
- Keyboard navigation (Tab, Enter, Escape)
- Focus management
- ARIA labels on interactive elements
- Screen reader announcements
- Color contrast compliance
- Alt text on all images
- Form error associations
- Skip to main content link

### Error Handling Tests

**error-handling.spec.js**
- 404 page for invalid routes
- 500 error page display
- Network error handling
- API timeout handling
- Graceful error messages
- Retry mechanism on failure
- Error boundary catches React errors

### Data Management Tests

**search-history.spec.js**
- Search history saved and displayed
- Clear search history
- Search history persists across sessions
- Click history item re-runs search
- Search history limit
- Duplicate search handling

**pagination.spec.js**
- Pagination controls appear
- Next/Previous page navigation
- Page number navigation
- Items per page selection
- Pagination preserves filters
- URL updates with page params
- Empty page handling

### Performance Tests

**loading-states.spec.js**
- Loading spinner during API calls
- Skeleton screens for recipe cards
- Progressive image loading
- Lazy loading for long lists
- Optimistic UI updates
- Debounced search input

### Journey Tests

**guest-journey.spec.js** (extend existing)
- Enter guest mode
- Browse recipes
- Search recipes
- View recipe details
- Blocked actions show login prompts
- Transition to logged-in user

**user-onboarding.spec.js**
Complete flow: Signup → Login → Create first recipe → Explore homepage → Like recipe → Save favorite

**recipe-lifecycle.spec.js**
Complete flow: Login → Create recipe → Wait for approval → Admin approves → Recipe visible → Edit recipe → User likes/reviews → Delete recipe

**admin-workflow.spec.js**
Complete flow: Admin login → View dashboard → Approve pending users → Review pending recipes → Approve/reject recipes → View full report

**cross-role-workflow.spec.js**
- User creates recipe → Admin approves → Another user views and reviews
- User signs up → Admin approves → User logs in → Creates recipe
- User gets suspended → Cannot create recipes → Admin reactivates

---

## Configuration

### Playwright Config

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,                          // No retries for manual testing
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'always' }],      // Auto-open HTML report
    ['list'],                           // Console output
  ],

  use: {
    baseURL: 'http://localhost:5174/recipe-sharing-system-deploy/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5174/recipe-sharing-system-deploy/',
    reuseExistingServer: true,
  },
});
```

### NPM Scripts

```json
{
  "scripts": {
    "test": "playwright test",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "test:auth": "playwright test tests/auth",
    "test:home": "playwright test tests/home",
    "test:recipes": "playwright test tests/recipes",
    "test:user": "playwright test tests/user",
    "test:admin": "playwright test tests/admin",
    "test:journeys": "playwright test tests/journeys",
    "test:ui": "playwright test tests/layout",
    "test:all": "playwright test --workers=1",
    "test:debug": "playwright test --debug",
    "test:headed": "playwright test --headed",
    "test:report": "playwright show-report"
  }
}
```

---

## Manual Test Execution & AI Debugging

### Running Tests

```bash
# Quick test (specific file)
npx playwright test tests/auth/login.spec.js

# Run with browser visible
npx playwright test tests/auth/login.spec.js --headed

# Interactive debugging
npx playwright test tests/auth/login.spec.js --debug

# Run single test
npx playwright test -g "exact test name"

# View HTML report
npx playwright show-report

# Open trace file
npx playwright show-trace trace.zip
```

### AI Debugging Workflow

1. **Run test with detailed output:**
   ```bash
   npx playwright test tests/auth/login.spec.js --reporter=list
   ```

2. **Gather artifacts:**
   - Test file path
   - Error output (copy full error)
   - Screenshot: `test-results/[test-name]/`
   - Trace: `trace.zip`
   - Relevant code files

3. **Provide to AI:**
   ```
   Test file: tests/auth/login.spec.js
   Error: [paste error output]

   I ran the test and it failed. The test is trying to [describe].

   Here's the test code:
   [paste test code]

   Here's the component being tested:
   [paste component code]

   Please fix the issue.
   ```

4. **Verify the fix:**
   ```bash
   npx playwright test tests/auth/login.spec.js
   ```

### Common Failure Patterns

| Failure Type | Likely Cause | What to Give AI |
|--------------|--------------|-----------------|
| Element not found | Selector changed, timing | Test code + component HTML/JSX |
| Timeout | Slow API, network | Test code + API endpoint |
| Assertion failed | Logic error, state | Test code + component logic |
| Auth failure | JWT, session | Test code + AuthContext + API |
| 404/500 | Missing route, server | Test code + App.jsx + API |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Create helper files
- Basic auth tests (login, logout)
- Verify test infrastructure

### Phase 2: Guest & Basic Features (Week 1)
- Guest journey tests
- Home page, search, view
- Navigation tests

### Phase 3: User Actions (Week 2)
- Signup tests
- Recipe actions (like, save, review)
- Recipe CRUD (create, edit, delete)
- Profile, favorites

### Phase 4: Admin Features (Week 3)
- Admin dashboard
- User management
- Recipe management

### Phase 5: Advanced Features (Week 4)
- Filters, suggestions
- Images, sharing, scaling
- Responsive design

### Phase 6: Security & Accessibility (Week 5)
- XSS prevention
- Accessibility
- Error handling
- Performance

### Phase 7: End-to-End Journeys (Week 4-5)
- User onboarding
- Recipe lifecycle
- Admin workflow
- Cross-role workflows

---

## Pre-Test Checklist

Before running test suite:
- [ ] Backend server running (`cd kitchen-odyssey-backend && pnpm run dev`)
- [ ] Frontend server running (`cd Kitchen_Odyssey && pnpm run dev`)
- [ ] MongoDB Atlas connected
- [ ] Seed users exist (admin@kitchenodyssey.com, user@kitchenodyssey.com)
- [ ] Previous test data cleaned up

---

## Success Criteria

Each phase is complete when:
- ✓ All tests in phase pass consistently
- ✓ No flaky tests (random failures)
- ✓ Helper functions work as expected
- ✓ Test data cleanup works properly
- ✓ Can give failing test + output to AI and get fixes

---

## Design Decisions

1. **Hybrid organization:** Feature-based tests for maintainability + journey tests for end-to-end verification
2. **Manual execution:** No CI/CD, tests run manually with AI-assisted debugging
3. **Shared database:** Single MongoDB Atlas, using seed data + test prefixes for isolation
4. **Sequential execution:** State-changing tests run serially to prevent conflicts
5. **Comprehensive coverage:** 39 test files covering all major features and edge cases

---

## Next Steps

1. Write implementation plan (invoke writing-plans skill)
2. Create helper files
3. Implement Phase 1 (Foundation)
4. Progress through phases 2-7
5. Refine tests based on AI debugging feedback
