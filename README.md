# Kitchen Odyssey

A collaborative web application for sharing, discovering, and managing recipes with role-based access control and a comprehensive approval workflow.

[![Development Status](https://img.shields.io/badge/status-active-brightgreen)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)
[![React Version](https://img.shields.io/badge/React-19.2.0-blue)](https://react.dev)

## Overview

Kitchen Odyssey is a modern recipe-sharing platform featuring moderated content publication, user onboarding workflows, and comprehensive discovery tools. The application uses client-side storage with localStorage for lightweight, demonstration-ready deployment.

**Key Capabilities:**
- Role-based access control (Admin, Contributor, Guest)
- Recipe approval workflow with content moderation
- Guest mode for read-only browsing without account creation
- Advanced search, filtering, and quality-based recommendations
- Real-time analytics and activity logging
- Full recipe lifecycle management with engagement features

### User Management
- User registration with admin-activated accounts
- Three-tier role system: Admin, Contributor, Guest
- Profile customization with avatars, bios, and cooking levels
- Status workflow: Pending → Active (contributor) or Suspended
- Session management and activity tracking
- User deletion cascades to authored recipes and related engagement records

### Recipe Management
- Create, edit, and delete recipes with rich metadata
- Categories, difficulty levels, preparation/cooking times
- Ingredient lists with quantities and units
- Step-by-step instructions with time estimates
- Submission workflow: Pending → Published or Rejected
- Only published recipes are visible to other users
- Authors and admins can open their own non-published recipes from "My Recipes"

### Discovery & Engagement
- Advanced search with keyword matching
- Filter by category, difficulty, and time
- "Under 30min" Discover filter uses total time (`prepTime + cookTime`)
- Discover (Home) filter chips support both `category` and `categories` recipe schemas
- Unified "Sort by" behavior on Discover and Search pages: Trending, Newest, Highest Rated, and A-Z
- Interactive ingredient checklists
- Recipe ratings (1-5 stars) with reviews
- Like and favorite recipes
- "Surprise Me" quality-based random suggestions (≥5 likes, ≥1 review)
- View counts and engagement analytics

### Admin Controls
- Real-time dashboard with platform analytics
- User activation, deactivation, and suspension
- Recipe approval and content moderation
- Activity logging for audit trails
- Daily Active Users (DAU) tracking with session heartbeat
- Search history and engagement metrics

#### Admin Dashboard Metrics

All dashboard metrics are computed from real-time data, refreshed on user/recipe updates. No hardcoded values.

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

### Guest Mode
- Browse recipes without account creation
- Full access to search, filtering, and viewing content
- Read-only access to reviews and ratings
- No analytics tracking or session logging

## Getting Started

### Prerequisites
- Node.js v16 or higher
- npm (included with Node.js)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Kitchen_Odyssey

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Testing

```bash
# Run all Playwright tests
npx playwright test

# Run tests with visible output
npx playwright test --reporter=list

# Run specific test file
npx playwright test tests/guest-mode.spec.js

# Run tests in headed mode (visible browser)
npx playwright test --headed
```

**Test Coverage:**
- **32 automated tests** covering Guest Mode and Random Recipe Suggestion
- `guest-mode.spec.js` — 13 tests (functionality + blocking)
- `guest-analytics.spec.js` — 4 tests (analytics isolation)
- `guest-transitions.spec.js` — 5 tests (mode transitions)
- `random-recipe.spec.js` — 11 tests (Surprise Me feature)

## Project Team

| Name | Student ID |
|------|-----------|
| Sithu Win San | 6726077 |
| Aung Thura Hein | 6726135 |

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

### Frontend
- **React 19.2.0** - Modern UI library with hooks
- **React Router DOM 7.13.0** - Client-side routing
- **Vite 7.2.4** - Fast build tool with HMR
- **Tailwind CSS 4.1.18** - Utility-first styling
- **Lucide React 0.562.0** - Icon library

### Development Tools
- **ESLint 9.39.1** - Code quality and linting
- **Playwright 1.58.2** - End-to-end testing
- **date-fns 4.1.0** - Date manipulation
- **clsx 2.1.1** - Conditional className utility
- **tailwind-merge 3.4.0** - Intelligent class merging

### Data Storage
- **localStorage** - Client-side persistence with comprehensive seed data
- **Pre-populated test data** - Multiple users, recipes, and accounts ready for testing

## Test Credentials

**Admin Accounts:**
| Email | Password | Name |
|-------|----------|------|
| admin@kitchen_odyssey.com | admin | Admin User |
| olivia@kitchen_odyssey.com | admin | Olivia Admin |
| marcus@kitchen_odyssey.com | admin | Marcus Admin |

Additional test users with various roles are pre-configured.

> [!NOTE]
> Demo account emails use `@kitchen_odyssey.com` domain for backward compatibility. Internal localStorage keys use `kitchen_odyssey_*` prefix.

## Documentation

- [DESIGN.md](DESIGN.md) — System architecture and design system
- [PROPOSAL.md](PROPOSAL.md) — Project proposal and specifications
- [guides/](guides/) — Setup guides and implementation documentation
- [plan/](plan/) — Feature plans and design documents
  - [feature-guest-mode-1.md](plan/feature-guest-mode-1.md) — Guest Mode implementation
  - [feature-random-recipe-suggestion-1.md](plan/feature-random-recipe-suggestion-1.md) — Random Recipe Suggestion
  - [design-overhaul-1.md](plan/design-overhaul-1.md) — Design system overhaul
- [docs/testing/](docs/testing/) — Testing documentation and checklists

---

Built with React 19, Vite, and Tailwind CSS.
