# Kitchen Odyssey Frontend

![Development Status](https://img.shields.io/badge/status-active-brightgreen)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646cff)
![Playwright Tests](https://img.shields.io/badge/Tests-Comprehensive%20Suite%20Passing-green)

A modern recipe-sharing platform built with React 19 and Vite, featuring moderated content publication, role-based access control, and comprehensive discovery tools.

![Kitchen Odyssey Logo](./src/assets/Logo.png)

## Overview

Kitchen Odyssey is a modern recipe-sharing platform featuring moderated content publication, user onboarding workflows, and comprehensive discovery tools. The application uses a split architecture with React + Vite frontend and Next.js backend API, with MongoDB Atlas for persistent storage.

### Key Capabilities

**User Management**
- Role-based access control (Admin, Contributor, Guest)
- User registration with admin-activated accounts (pending → active)
- Profile customization with avatars, bios, and cooking levels
- Status workflow: Pending → Active (contributor) or Suspended
- Session management and activity tracking for DAU metrics
- Resilient token refresh flow: transient refresh failures no longer downgrade authenticated users into guest mode

**Recipe Management**
- Create, edit, and delete recipes with rich metadata
- Categories, difficulty levels, preparation/cooking times
- Ingredient lists with quantities and units
- Step-by-step instructions with time estimates
- Submission workflow: Pending → Published or Rejected

**Discovery & Engagement**
- Advanced search with keyword matching
- Filter by category, difficulty, and time (Under 30min uses prepTime + cookTime)
- Unified sorting: Trending, Newest, Highest Rated, A-Z
- Interactive ingredient checklists
- Recipe ratings (1-5 stars) with reviews
- Like and favorite recipes
- "Surprise Me" quality-based random suggestions (≥5 likes, ≥1 review)
- View counts and engagement analytics

**Admin Controls**
- Real-time dashboard with computed metrics (all dynamic, no hardcoded values)
- User activation, deactivation, and suspension
- Recipe approval and content moderation
- Activity logging for audit trails
- Daily Active Users (DAU) tracking with session heartbeat
- Search history and engagement metrics

#### Admin Dashboard Metrics

All dashboard metrics are computed from real-time data, refreshed on user/recipe updates.

| Metric | Calculation | Description |
|---------|-------------|-------------|
| **Total Users** | Non-admin users count | Excludes admin accounts from user count |
| **User Growth** | `(thisMonthUsers / lastMonthUsers) * 100` | Month-over-month growth from `joinedDate` comparisons |
| **Pending Recipes** | `status === 'pending'` count | Recipes awaiting approval |
| **Active Recipes** | Recipes with views OR likes | Shows engaged recipes as percentage of total published |
| **Total Likes** | Sum of all `likedBy` entries | Total lifetime likes across all published recipes |
| **Average Likes** | `totalLikes / publishedCount` | Average likes per recipe |
| **Category Trends** | `recipesInCategory / totalPublished * 100` | Each category's share of published recipes |

**Recent Activity Modal** - Shows all activity entries (up to 200) with full timestamps. Close button only (no outside click or Escape).

**Recipe Trends Full Report** - Complete category breakdown with visual progress bars, recipe counts, and like counts. Close button only.

**Guest Mode** - Browse recipes without account creation. Full access to search, filtering, and viewing content. Read-only access to reviews and ratings. Uses localStorage for session ID only (no backend persistence).

## Getting Started

### Prerequisites
- Node.js v18 or higher
- npm (included with Node.js)
- MongoDB Atlas account (for backend storage)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Kitchen_Odyssey

# Install frontend dependencies
npm install

# Start backend (in ../kitchen-odyssey-backend)
cd ../kitchen-odyssey-backend
npm install
npm run dev    # Backend on http://localhost:3000

# Start frontend (in Kitchen_Odyssey)
cd Kitchen_Odyssey
npm run dev     # Frontend on http://localhost:5173
```

The application requires both backend and frontend running:
- **Backend API**: http://localhost:3000/api/v1
- **Frontend UI**: http://localhost:5173

### Docker Compose (Production-style)

From `kitchen-odyssey-backend/`, run both services with Docker:

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Containerized setup notes:
- Frontend is served by Nginx on port `80`.
- Frontend proxies `/api/*` requests to backend container (`backend:3000`).
- Backend env values are read from `kitchen-odyssey-backend/.env`.
- Frontend source path defaults to sibling folder `../Kitchen_Odyssey` (configurable with `FRONTEND_CONTEXT`).

### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Environment Configuration

Frontend environment variables (`.env`):

| Flag | Description | Default |
|------|-------------|---------|
| `VITE_USE_BACKEND_API` | Enables backend API mode | `true` |
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api/v1` |

**Note:** Backend mode is required for all authenticated operations. Guest mode uses localStorage for session ID only.

### Testing

```bash
# Run all Playwright tests
npx playwright test

# Run tests with visible output
npx playwright test --reporter=list

# Run specific test file
npx playwright test tests/guest-mode.spec.js

# Run comprehensive end-to-end regression tests
npx playwright test tests/comprehensive.spec.js --reporter=list

# Run tests in headed mode (visible browser)
npx playwright test --headed
```

**Test Coverage:**
- `comprehensive.spec.js` — Full regression coverage for auth, guest mode, discovery/search, recipe interactions, profile flows, admin dashboard, user management, recipe moderation, and sign out.
- Extended comprehensive scenarios also validate review-upsert updates, search-history persistence after reload, admin metric/report consistency, and user-email search in admin management.
- `guest-transitions.spec.js` - Includes a transient refresh failure regression check to ensure logged-in users are not switched to Guest UI state.
- `guest-mode.spec.js` — 13 tests (functionality + blocking)
- `guest-analytics.spec.js` — 4 tests (analytics isolation)
- `guest-transitions.spec.js` — 5 tests (mode transitions)
- `random-recipe.spec.js` — 11 tests (Surprise Me feature)

**Backend validation + clean reset for deterministic runs:**
```bash
# Backend tests
cd ../kitchen-odyssey-backend
npm test

# Reset database seed data after E2E runs
node src/scripts/seed.js --clean
```

## Project Team

| Name | Student ID | Role |
|------|-----------|------|
| Sithu Win San | 6726077 | Frontend Development |
| Aung Thura Hein | 6726135 | Backend Development |

## Project Structure

```
Kitchen_Odyssey/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/         # Navigation & layout components
│   │   ├── recipe/         # Recipe-specific components
│   │   └── ui/            # Generic UI primitives
│   ├── context/             # React contexts for state management
│   ├── layouts/             # Layout templates
│   ├── lib/                # Utilities (storage.js, utils.js)
│   ├── pages/               # Page components
│   │   ├── Auth/          # Login and signup
│   │   ├── Admin/         # Admin dashboard and panels
│   │   └── Recipe/        # Recipe pages and user features
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── tests/                  # Playwright E2E tests
│   ├── guest-mode.spec.js
│   ├── guest-analytics.spec.js
│   ├── guest-transitions.spec.js
│   └── random-recipe.spec.js
├── docs/                   # Testing documentation
├── plan/                   # Feature implementation plans
├── public/                 # Static assets
└── guides/                 # Setup guides
```

## Technology Stack

- **React 19.2.0** - Modern UI library with hooks
- **Vite 7.2.4** - Fast build tool with HMR
- **React Router DOM 7.13.0** - Client-side routing (HashRouter)
- **Tailwind CSS 4.1.18** - Utility-first styling
- **Lucide React 0.562.0** - Icon library
- **Playwright 1.58.2** - End-to-end testing
- **ESLint 9.39.1** - Code quality and linting
- **date-fns 4.1.0** - Date manipulation
- **clsx 2.1.1 + tailwind-merge 3.4.0** - Intelligent class merging

**Backend Integration:**
- **Backend API** - Next.js 16.1.6 with MongoDB Atlas
- **Authentication** - JWT with HttpOnly cookies (access + refresh tokens)
- **Data Storage** - MongoDB Atlas (`kitchen_odyssey` database)
- **Guest Mode** - Minimal localStorage for session ID only (no backend persistence)

## Design System

Kitchen Odyssey follows a "Fresh Culinary" design philosophy inspired by fresh ingredients, clean kitchens, and coastal waters.

**Color Palette (60-30-10 Harmony):**

| Category | Colors | Purpose |
|----------|---------|---------|
| **Foundation (60%)** | Warm Neutrals | Page backgrounds, card surfaces |
| | `#FAF7F2` (Cream) | Main background (white with warm tint) |
| | `#FDFCF9` (Warm White) | Cards, elevated sections |
| | `#F5F0E8 → #2D2420` | 10-step warm gray scale |
| **Primary (30%)** | Light Blue/Cyan | CTAs, navigation, interactive elements |
| | `#0284C7` (Brand) | Primary buttons, links |
| | `#06B6D4` (Brand Accent) | Active states, highlights |
| | `#0891B2` (Brand Hover) | Hover states, interactive |
| | `#38BDF8` (Brand Light) | Subtle backgrounds |
| | `#E0F2FE` (Brand Pale) | Very subtle tinted backgrounds |
| **Accent (10%)** | Sage Green & Golden Ochre | Freshness indicators, highlights |
| | `#81B29A` (Sage) | Healthy options, secondary CTAs |
| | `#E9C46A` (Gold) | Premium features, ratings |

**Semantic Colors:**
- Success: `#6B9080` (Fresh Sage)
- Warning: `#F4A261` (Warm Amber)
- Error: `#C1121F` (Tomato Red)
- Info: `#457B9D` (Muted Blue)

**Typography:**
- Font: Work Sans (Google Fonts)
- Weight Scale: Light (300) → Bold (700)
- Type Scale: H1 (32-40px) → Body (14-16px) → Small (12-14px)

**Design Tokens (Tailwind Classes):**
- Primary accent: `brand-accent` (`#06B6D4`)
- Buttons/interactions: `hover:bg-brand-pale/50` with cyan tint on hover
- Shadows: Colored glow for emphasis (`rgba(6, 182, 212, 0.25)`)

See [DESIGN.md](DESIGN.md) for complete design specifications with 60-30-10 harmony rules.

## Reset Application Data

After code changes to seed data, reset the backend database:

**Backend (kitchen-odyssey-backend):**
```bash
# Drop and re-seed MongoDB Atlas database
cd ../kitchen-odyssey-backend
node src/scripts/seed.js --clean
```

**Frontend (Guest Mode Only):**
- Guest mode uses localStorage for session ID only
- To reset guest session: Open DevTools → Application → Local Storage → Delete `kitchen_odyssey_guest_id`

## Test Credentials

**Admin Accounts:**
| Email | Password | Name |
|-------|----------|------|
| admin@kitchenodyssey.com | admin | Admin User |
| olivia@kitchenodyssey.com | admin | Olivia Admin |
| marcus@kitchenodyssey.com | admin | Marcus Admin |

Additional test users with various roles are pre-configured.

> [!NOTE]
> Demo account emails use `@kitchenodyssey.com` domain for backward compatibility. Internal localStorage keys use `kitchen_odyssey_*` prefix.

## Documentation

### Architecture & Design
- [DESIGN.md](DESIGN.md) — System architecture and design system
- [PROPOSAL.md](PROPOSAL.md) — Project proposal and specifications
- [DESIGN.md](DESIGN.md) — Design system with color palette and component patterns

### Implementation Guides
- [SETUP_GUIDE.md](../SETUP_GUIDE.md) — Complete setup for MongoDB Atlas and backend integration
- [guides/](guides/) — Setup guides and implementation documentation
  - [nextjs-project-setup.md](guides/nextjs-project-setup.md) — Next.js project setup

### Migration Planning
- [Architecture Migration Plan](plan/architecture-nextjs-mongodb-migration-1.md) — Next.js + MongoDB migration strategy
- [Design Overhaul](plan/design-overhaul-1.md) — Design system refresh and color palette updates

### Feature Documentation
- [Guest Mode](plan/feature-guest-mode-1.md) — Guest mode implementation and restrictions
- [Random Recipe Suggestion](plan/feature-random-recipe-suggestion-1.md) — "Surprise Me" feature specification

### Testing
- [docs/testing/](docs/testing/) — Testing documentation and checklists

---

Built with React 19, Vite, and Tailwind CSS.
