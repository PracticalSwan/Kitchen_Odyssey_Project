# Kitchen Odyssey - System Architecture

## Architecture Overview

**Type:** Single Page Application (SPA)
**Current Storage:** Client-side localStorage
**Target Storage:** MongoDB Atlas with RESTful API
**Deployment:** Static hosting (Vite build) → Azure VM with reverse proxy

## Technology Stack

### Frontend Framework
```
React 19.2.0
├── Hooks API (useState, useEffect, useContext, useCallback, useMemo)
├── Concurrent Features (automatic with React 19)
├── Error Boundaries (component-level error handling)
└── Fast Refresh (Vite HMR)
```

### Build & Dev Tools
```
Vite 7.3.1
├── ESBuild (ultra-fast bundling)
├── Hot Module Replacement
├── Optimized dev server
└── Production build to dist/
```

### Routing
```
React Router DOM 7.13.0
├── HashRouter (deployment-compatible)
├── Layout components (wrappers for route protection)
├── Navigation hooks (useNavigate, useLocation)
└── URL state management (search params)
```

### Styling
```
Tailwind CSS 4.1.18
├── Utility-first classes
├── Custom design tokens in @theme block
├── CSS variables for theming
└── Responsive breakpoints (mobile, tablet, desktop)
```

### State Management

#### Global State: Context API
- **AuthContext** (`src/context/AuthContext.jsx`)
  - Current user state
  - Guest mode flag
  - Auth actions (login, signup, logout, enterGuestMode)
  - Derived flags (isAdmin, isPending, isSuspended, canInteract)
  - Activity tracking (heartbeat every 1 min)

#### Local State: React Hooks
- Component-level state with `useState`
- Memoized callbacks with `useCallback`
- Expensive computations with `useMemo`

#### Cross-Component Communication
- **Window Events:**
  - `favoriteToggled` - Recipe like/favorite state changed
  - `recipeUpdated` - Recipe CRUD operation
  - `statsUpdated` - Analytics changed
  - `userUpdated` - User data changed

## Data Layer Architecture

### Current: localStorage Abstraction
```
src/lib/storage.js (Centralized data layer)
├── User Management (getUsers, saveUser, deleteUser)
├── Recipe Management (getRecipes, saveRecipe, deleteRecipe)
├── Reviews (getReviews, addReview, deleteReview)
├── Interactions (toggleFavorite, toggleLike)
├── Analytics (recordView, recordActiveUser, addActivity)
└── Search History (addSearchHistory, getSearchHistory)
```

### Target: API Client Adapter
```
src/lib/storage.js (becomes API adapter)
├── Toggle: VITE_USE_BACKEND_API
├── Fallback: localStorage when API unavailable
└── Endpoint calls: fetch to /api/v1/*
```

## Component Architecture

### Component Organization
```
src/
├── components/
│   ├── layout/           # Shared layout components
│   │   ├── Navbar.jsx   # Main navigation
│   │   └── Sidebar.jsx  # Admin sidebar
│   ├── recipe/           # Recipe-specific components
│   │   ├── RecipeCard.jsx
│   │   └── RecipeSuggestionModal.jsx
│   └── ui/               # Reusable UI primitives
│       ├── Button.jsx
│       ├── Modal.jsx
│       ├── Input.jsx
│       ├── Card.jsx
│       ├── Badge.jsx
│       ├── Table.jsx
│       └── Tabs.jsx
```

### Layout Pattern (Route Guards)
```
App.jsx
├── HashRouter
│   ├── AuthLayout        # Public routes (login, signup)
│   ├── RootLayout        # Protected user routes
│   └── AdminLayout       # Admin-only routes
```

### Component Patterns

#### 1. Compound Components
Modal component with composition:
```jsx
<Modal isOpen={isOpen} onClose={onClose} title="Title">
  <Modal.Body>Content</Modal.Body>
  <Modal.Footer>Actions</Modal.Footer>
</Modal>
```

#### 2. Render Props
RecipeCard action overlay for profile pages:
```jsx
<RecipeCard recipe={recipe} actionOverlay={<EditButton />} />
```

#### 3. Higher-Order Components
Layout wrappers as route protection:
```jsx
<RootLayout>
  <Home />
</RootLayout>
```

## Routing Architecture

### Route Structure
```
/                           # Redirects to /home
/login                      # Public (AuthLayout)
/signup                     # Public (AuthLayout)
/home                       # Protected (RootLayout)
/search                     # Protected (RootLayout)
/profile                    # Protected (RootLayout)
/profile/:id                # Protected (RootLayout)
/recipe/:id                 # Protected (RootLayout)
/create-recipe              # Protected (RootLayout)
/edit-recipe/:id            # Protected (RootLayout)
/admin                      # Admin only (AdminLayout)
/admin/recipes              # Admin only (AdminLayout)
/admin/users                # Admin only (AdminLayout)
```

### URL State Management
- **Search Page:** URL params for filters (q, category, difficulty, sort)
- **Recipe Detail:** ID param for recipe lookup
- **Profile:** ID param for user lookup (optional, defaults to current user)

### Navigation Guards
- **AuthLayout:** Redirects to /home if already logged in
- **RootLayout:** Redirects to /login if not logged in (guest bypass)
- **AdminLayout:** Redirects to /home if not admin

## Design System Architecture

### Design Tokens (`src/index.css`)
```css
@theme {
  /* Primary Colors */
  --color-brand: #C05640;
  --color-brand-accent: #E76F51;
  --color-brand-hover: #D65D3F;

  /* Accent Colors */
  --color-sage: #81B29A;
  --color-gold: #E9C46A;

  /* Warm Neutrals */
  --color-cream: #FAF7F2;
  --color-warm-white: #FDFCF9;
  --color-warm-gray-10 through --color-warm-gray-90;

  /* Gradients */
  --gradient-brand: linear-gradient(135deg, #C05640, #E76F51);
  --gradient-hero: linear-gradient(135deg, #E76F51, #F4A261);

  /* Shadows */
  --shadow-brand: 0 4px 12px rgba(192, 86, 64, 0.25);

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Animations */
  --animation-fade-in: fade-in 0.3s ease-out;
}
```

### Responsive Breakpoints
```css
/* Mobile First */
sm: 640px   /* Tablet */
md: 768px   /* Tablet Landscape */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
```

### Accessibility Standards
- **WCAG AA** compliance
- **Focus Management:** `focus-visible` outline with brand-accent
- **Touch Targets:** Minimum 44x44px
- **Modal Focus Trapping:** Keyboard navigation support
- **Semantic HTML:** Proper heading hierarchy, landmarks

## Authentication Flow

### Current Implementation (localStorage)
```
Login/Signup
├── Validate credentials
├── storage.login() / storage.signup()
├── Set user status to 'active'
├── Update lastActive timestamp
├── Set current user in context
└── Navigate to /home
```

### Guest Mode Flow
```
"Continue as Guest"
├── Generate guest ID (guest-{randomId})
├── Set isGuest = true in context
├── Bypass localStorage writes
├── Read-only access to recipes
└── No analytics tracking
```

### Target Implementation (JWT)
```
Login/Signup
├── POST /api/v1/auth/login or /signup
├── Server validates credentials
├── Server returns JWT token
├── Store JWT in HttpOnly cookie
├── Set auth state in context
└── All API requests include cookie
```

## Data Flow Patterns

### Recipe Discovery Flow
```
User lands on Home
├── AuthContext provides current user
├── storage.getRecipes() fetches published recipes
├── Filter/sort applied client-side
├── Recipes rendered in grid (30 per batch)
├── "Load More" fetches next batch
└── RecipeCard dispatches favoriteToggled on like/favorite
```

### Recipe Creation Flow
```
User clicks "Create Recipe"
├── Navigate to /create-recipe
├── CreateRecipe component mounts
├── Form validation on submit
├── storage.saveRecipe() creates recipe with status='pending'
├── dispatch recipeUpdated event
├── Navigate to profile (My Recipes tab)
└── Admin sees in pending queue
```

### Admin Approval Flow
```
Admin reviews pending recipe
├── AdminRecipes component fetches pending recipes
├── Admin clicks "Preview"
├── PreviewModal shows full recipe
├── Admin clicks "Approve"
├── storage.saveRecipe() updates status to 'published'
├── dispatch recipeUpdated event
├── addActivity logs approval action
└── Recipe appears in Home/Search
```

## Performance Optimizations

### React Optimizations
- **React.memo:** Prevent unnecessary re-renders for static components
- **useCallback:** Stable function references for event handlers
- **useMemo:** Cache expensive computations (filtered recipes, stats)
- **Code Splitting:** Lazy loading for heavy components (planned)

### Asset Optimizations
- **Image Optimization:** WebP format with fallbacks (planned)
- **Font Loading:** Google Fonts with display=swap
- **Bundle Size:** Tree-shaking via Vite/ESBuild

### Data Optimizations
- **Batch Loading:** 30 recipes per batch
- **Debouncing:** Search history updates (1.5s delay)
- **LocalStorage Caching:** Seed data prevents redundant initialization

## Testing Architecture

### Test Framework: Playwright
```
tests/
├── guest-mode.spec.js              # Guest mode functionality
├── guest-analytics.spec.js         # Analytics bypass verification
├── guest-transitions.spec.js       # Auth ↔ Guest transitions
└── random-recipe.spec.js           # Random recipe suggestion
```

### Testing Patterns
- **Page Object Model:** Reusable page abstractions
- **Fixtures:** Shared authentication states (admin, user, guest)
- **Visual Regression:** Baseline screenshots for UI verification
- **Accessibility Testing:** axe-core integration
- **Responsive Testing:** Multiple viewport sizes

## Deployment Architecture

### Current Setup
```
Vite Build
├── npm run build
├── Output: dist/
├── Base path: /recipe-sharing-system-deploy/
└── Static hosting (Azure VM with Nginx/Caddy)
```

### Target Setup (Post-Migration)
```
Frontend
├── Vite build → dist/
├── Deploy to Azure VM static file server
└── Reverse proxy (Nginx/Caddy) serves static files

Backend
├── Next.js 16 production build
├── Node.js server on Azure VM
├── MongoDB Atlas (cloud-hosted)
└── API routes at /api/v1/*
```

### Environment Variables
```bash
# Frontend (.env)
VITE_USE_BACKEND_API=false        # Migration toggle
VITE_API_URL=http://localhost:3000  # Backend URL

# Backend (.env)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:5173
NODE_ENV=production
```

## Migration Architecture

### Phase 1: Backend Scaffolding (Pending)
- Create Next.js project structure
- Configure MongoDB connection
- Set up environment templates
- Implement health check endpoint

### Phase 2: API Implementation (Planned)
- Auth endpoints (login, signup, logout)
- Recipe CRUD endpoints
- User management endpoints
- Review/interaction endpoints
- Analytics endpoints

### Phase 3: Frontend Integration (Planned)
- Create API client module
- Replace storage.js calls with API calls
- Implement JWT token handling
- Add error handling and retries
- Maintain localStorage fallback

### Phase 4: Testing & Deployment (Planned)
- Integration tests for API
- E2E tests with backend
- Performance testing
- Production deployment

## Security Considerations

### Current Security (Client-Side)
- **XSS Prevention:** React auto-escapes user input
- **CSRF:** Not applicable (localStorage only)
- **Password Storage:** Plain text (will be hashed in backend)

### Target Security (Backend)
- **Password Hashing:** bcrypt with salt rounds
- **JWT Tokens:** HttpOnly cookies, short expiration
- **CORS:** Configured allowed origins
- **Rate Limiting:** Per-IP and per-user limits
- **Input Validation:** Server-side validation on all endpoints
- **SQL Injection:** Not applicable (MongoDB NoSQL)
- **NoSQL Injection:** Parameterized queries via Mongoose

## Monitoring & Observability

### Current Monitoring
- **Activity Logs:** Last 200 entries in localStorage
- **Daily Stats:** Views, active users per day
- **Error Tracking:** Console errors (manual)

### Target Monitoring
- **Application Logs:** Winston or Pino logger
- **Error Tracking:** Sentry integration
- **Performance Monitoring:** Core Web Vitals
- **Analytics:** Custom dashboard with MongoDB aggregation

## Scalability Considerations

### Current Limitations
- **Data Size:** localStorage limit (~5-10MB)
- **Concurrent Users:** No server, no real limits
- **Data Persistence:** Device-specific

### Target Scalability
- **Database:** MongoDB Atlas horizontal scaling
- **Caching:** Redis for session cache (planned)
- **CDN:** Cloudflare for static assets (planned)
- **Load Balancing:** Nginx reverse proxy (planned)

## Related Documentation
- [DESIGN.md](../../DESIGN.md) - Design system specification
- [storage-data-model.md](./storage-data-model.md) - Data models and schemas
- [auth-context.md](./auth-context.md) - Authentication architecture
- [ui-components-and-styling.md](./ui-components-and-styling.md) - Component library

## Memory Management
- **Project:** Kitchen_Odyssey (React frontend)
- **Last Updated:** 2026-02-17
- **Maintained By:** Serena MCP Server
- **Purpose:** System architecture reference for developers
