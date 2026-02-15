# Recipe Sharing System

A collaborative web application for sharing, discovering, and managing recipes with role-based access control and a comprehensive approval workflow.

![Development Status](https://img.shields.io/badge/status-active-brightgreen)
![License](LICENSE)
![React Version](https://img.shields.io/badge/React-19.2.0--61DAFB)

## Branding Update (2026-02-14)

- Project branding name is now **Kitchen Odyssey**.
- UI labels previously showing CookHub have been updated to Kitchen Odyssey.
- Demo account emails remain unchanged and continue using `@cookhub.com`.
- Internal localStorage key prefixes (for example, `cookhub_*`) remain unchanged for backward compatibility.

## Features

### Core Functionality
- User authentication with role-based access control (Admin, Contributor, User)
- Guest mode for browsing without account creation (read-only)
- Recipe submission with admin approval workflow
- Full recipe lifecycle management (Create, Read, Update, Delete)
- Advanced discovery with search, filtering, and sorting
- Random recipe suggestion with quality-based recommendations

### User Experience
- Profile management with customizable profiles
- Recipe ratings and reviews (one per user per recipe)
- Favorites/saved recipes collection
- Interactive ingredient checklist
- Admin dashboard with analytics and metrics
- Activity tracking with real-time updates
- Daily Active Users (DAU) tracking with session heartbeat

### Admin Capabilities
- User activation and management
- Recipe approval and content moderation
- Site-wide analytics and engagement metrics
- Activity logging for admin actions

## Architecture

The system uses a client-side storage approach with localStorage, making it lightweight and suitable for demonstration and development purposes.

**User Workflow:**
1. Registration creates an account with "Pending" status
2. Admin reviews and activates user accounts
3. Contributors submit recipes for admin approval
4. Active users can view, like, review, and favorite published recipes

**User Roles:**
- **Admins** - Platform oversight, user activation, recipe approval, analytics
- **Contributors** (Active Users) - Full platform access, create recipes, engage with content
- **Guest/Pending** - Browse recipes while awaiting admin approval
- **Guest Mode Users** - Browse without account (read-only, no analytics tracking)

## Getting Started

### Prerequisites
- Node.js v16 or higher
- npm (included with Node.js)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd recipe-sharing-system

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

## Project Structure

```
recipe-sharing-system/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/        # Navigation & layout
│   │   ├── recipe/        # Recipe-specific components
│   │   └── ui/           # Generic UI primitives
│   ├── context/           # React context for state management
│   ├── layouts/           # Layout templates
│   ├── lib/              # Utilities & helpers
│   │   ├── storage.js    # LocalStorage & seed data
│   │   └── utils.js      # Helper functions
│   ├── pages/            # Page components
│   │   ├── Auth/         # Authentication pages
│   │   ├── Admin/        # Admin panels
│   │   └── Recipe/       # Recipe & user features
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/               # Static assets
├── package.json
├── vite.config.js
└── README.md
```

## Technology Stack

### Frontend Framework
- React 19.2.0 - Modern UI library
- React Router DOM 7.12.0 - Client-side routing

### Styling
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- Tailwind Merge 3.4.0 - Intelligent class merging
- Lucide React 0.562.0 - Icon library

### Development Tools
- Vite 7.2.4 - Fast build tool with HMR
- ESLint 9.39.1 - Code quality tool

### Utilities
- Clsx 2.1.1 - Conditional className utility
- date-fns 4.1.0 - Date formatting and manipulation

## Data Storage

The application uses browser localStorage for persistence with comprehensive seed data for immediate testing.

### Stored Data
- User accounts (credentials, profiles, roles, status)
- Recipes (content, status, metadata)
- Reviews and ratings (one per user per recipe)
- Session data (current logged-in user)
- Search history (queries with timestamps)
- Daily stats (views, active users)
- Activity logs (admin actions)

### Test Credentials

**Admin Accounts:**
| Email | Password | Name |
|-------|----------|------|
| admin@cookhub.com | admin | Admin User |
| olivia@cookhub.com | admin | Olivia Admin |
| marcus@cookhub.com | admin | Marcus Admin |

**User Accounts:** Multiple test users with various roles and statuses are pre-configured.

> **Note:** See [DESIGN.md](DESIGN.md) for complete system architecture and design documentation.

### Reset Data

```javascript
// Clear all localStorage data
localStorage.clear();
location.reload();

// Or use the storage utility
import { storage } from './src/lib/storage';
storage.resetData();
```

## Key Features by User Role

### Admin Dashboard

- **Analytics Dashboard:** Real-time metrics and site-wide analytics
  - Total users, new users, contributors
  - Published vs. pending recipes
  - Daily views and DAU tracking with hourly heartbeat
- **User Management:** View, activate, deactivate, and delete user accounts
- **Recipe Management:** Approve, reject, and moderate recipe submissions
- **Activity Logging:** Track all admin actions (user status changes, recipe approvals)

### Contributor (Active User)

- **Profile Management:** Edit biography, avatar, location, and cooking skill level
- **Recipe Creation:** Submit comprehensive recipes with images, ingredients, and instructions
- **My Recipes:** View, edit, delete, and track approval status of submitted recipes
- **Discovery:** Browse all approved recipes from the community
- **Search & Filter:** Keyword search with URL persistence, category/difficulty filters, multi-option sorting
- **Favorites:** Save recipes to personal collection
- **Reviews & Ratings:** Rate recipes (1-5 stars), write reviews, update or delete reviews
- **Engagement:** Like recipes, view counts, track popularity
- **Surprise Me:** Quality-based random recipe suggestions (≥5 likes and ≥1 review)

### Guest/Pending User

- **Browse:** View all approved recipes with full details
- **Search & Filter:** Full access to search, filtering, and viewing reviews/ratings
- **Limitations:** Cannot create recipes, like, favorite, or write reviews until account approved

### Guest Mode (No Account)

- **Read-Only Browsing:** Discover recipes without account creation
- **Same Capabilities as Guest/Pending:** Search, filter, view reviews/ratings
- **Analytics Isolation:** No tracking of views, no DAU counting, no activity logging

## Documentation

- [DESIGN.md](DESIGN.md) - System architecture and design system
- [PROPOSAL.md](PROPOSAL.md) - Project proposal and specifications
- [guides/](guides/) - Setup guides and implementation documentation
- [plan/](plan/) - Feature implementation plans and design documents

---

Built with React 19, Vite, and Tailwind CSS.
