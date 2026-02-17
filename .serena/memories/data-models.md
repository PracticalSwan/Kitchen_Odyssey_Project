# Kitchen Odyssey - Data Models & Storage Layer

## Storage Layer Overview

**Location:** `src/lib/storage.js`
**Type:** Centralized localStorage wrapper
**Key Prefix:** `kitchen_odyssey_*` (backward compatibility)
**Seed Data:** 3 admins, 9 users, 12 recipes

## Data Models

### User Model

```javascript
{
  // Identity
  id: string,                    // Unique identifier (generated)
  email: string,                 // Email address (unique)
  password: string,              // Plain text (will be hashed in backend)

  // Profile
  username: string,              // Display username (unique)
  firstName: string,
  lastName: string,
  birthday: string,              // ISO date string
  avatar: string,                // Dicebear avatar URL or custom

  // Bio & Location
  bio: string,
  location: string,
  cookingLevel: string,          // 'Beginner', 'Intermediate', 'Advanced'

  // Role & Status
  role: 'admin' | 'user',        // User role
  status: 'active' | 'inactive' | 'pending' | 'suspended',
                                  // active/inactive = session state
                                  // pending/suspended = account state

  // Timestamps
  joinedDate: string,            // ISO timestamp when user registered
  lastActive: string,            // ISO timestamp of last activity

  // Relationships
  favorites: string[],           // Array of recipe IDs
  viewedRecipes: string[]        // Array of recipe IDs
}
```

#### User Status Behavior
- **Login Flow:** `inactive` → `active` (updates `lastActive`)
- **Logout Flow:** `active` → `inactive` (does NOT update `lastActive`)
- **Pending User:** Awaiting admin approval (persists across sessions)
- **Suspended User:** Account locked by admin (persists across sessions)

#### Derived User Flags
```javascript
isAdmin = role === 'admin'
isPending = status === 'pending'
isSuspended = status === 'suspended'
isGuest = user === null && guestId !== null
canInteract = user && status === 'active' && !isAdmin && !isGuest
```

### Recipe Model

```javascript
{
  // Identity
  id: string,                    // Unique identifier (generated)
  title: string,
  description: string,

  // Classification
  category: string[],            // Array of categories (1-3)
                                  // Options: Breakfast, Lunch, Dinner, Dessert,
                                  // Appetizer, Salad, Soup, Pasta, Vegan,
                                  // Quick & Easy, Comfort Food

  // Metadata
  difficulty: string,            // 'Easy', 'Medium', 'Hard'
  prepTime: number,              // Minutes (1-1440)
  cookTime: number,              // Minutes (0-1440)
  servings: number,              // Servings (1-100)

  // Media
  image: string,                 // Image URL (has default)
  images: string[],              // Additional images (future feature)

  // Content
  ingredients: Array<{
    name: string,
    quantity: string,
    unit: string
  }>,
  instructions: string[],        // Array of instruction steps

  // Author
  author: string,                // Author username
  authorId: string,              // Author user ID
  authorAvatar: string,          // Author avatar URL

  // Status
  status: 'published' | 'pending' | 'rejected',

  // Interactions
  likedBy: string[],             // Array of user IDs who liked
  viewedBy: string[],            // Array of user IDs who viewed

  // Reviews
  reviews: Array<{
    id: string,
    userId: string,
    userName: string,
    userAvatar: string,
    rating: number,              // 1-5 stars
    comment: string,
    createdAt: string
  }>,

  // Timestamps
  createdAt: string,             // ISO timestamp
  updatedAt: string              // ISO timestamp
}
```

#### Recipe Status Workflow
```
Create Recipe → status: 'pending'
                    ↓
            Admin Review
           /            \
    Approve            Reject
        ↓                  ↓
  status: 'published'  status: 'rejected'
```

#### Recipe Visibility Rules
- **Published:** Visible to all users on Home/Search
- **Pending:** Visible only to author and admins
- **Rejected:** Visible only to author and admins
- **Owner Access:** Authors can view their own pending/rejected recipes

#### Quality Constraints (Random Recipe)
```javascript
// Random recipe suggestion filter
const qualityRecipes = recipes.filter(r =>
  r.status === 'published' &&
  r.likedBy.length >= 5 &&
  r.reviews.length >= 1
)

// Fallback: Any published recipe
if (qualityRecipes.length === 0) {
  return recipes.filter(r => r.status === 'published')
}
```

### Review Model

```javascript
{
  // Identity
  id: string,                   // Unique identifier
  recipeId: string,             // Associated recipe ID
  userId: string,               // Reviewer user ID

  // Reviewer Info
  userName: string,
  userAvatar: string,

  // Rating
  rating: number,               // 1-5 stars

  // Content
  comment: string,

  // Timestamp
  createdAt: string             // ISO timestamp
}
```

#### Review Constraints
- **One Review Per User:** Only one review per user per recipe (upsert on add)
- **Owner Exclusion:** Users cannot review their own recipes
- **Status Restrictions:** Pending/suspended users cannot review
- **Guest Restrictions:** Guest users cannot review

## Storage Layer API

### Initialization

```javascript
storage.initialize()
```
- Checks localStorage for existing data
- Seeds data if empty (3 admins, 9 users, 12 recipes)
- Ensures all required keys exist

### User Management

```javascript
// Get all users
storage.getUsers()
→ Returns: User[]

// Get user by ID
storage.getUserById(id)
→ Returns: User | undefined

// Save user (create or update)
storage.saveUser(user)
→ Returns: void

// Delete user
storage.deleteUser(id)
→ Returns: void

// Get current user
storage.getCurrentUser()
→ Returns: User | null

// Set current user
storage.setCurrentUser(user)
→ Returns: void

// Clear current user
storage.clearCurrentUser()
→ Returns: void
```

### Recipe Management

```javascript
// Get all recipes
storage.getRecipes()
→ Returns: Recipe[]

// Get recipe by ID
storage.getRecipeById(id)
→ Returns: Recipe | undefined

// Save recipe (create or update)
storage.saveRecipe(recipe)
→ Returns: void

// Delete recipe
storage.deleteRecipe(id)
→ Returns: void
```

### Authentication

```javascript
// Login
storage.login(email, password)
→ Returns: { success: boolean, user?: User, error?: string }
→ Side effects:
  - Sets user status to 'active' (from 'inactive')
  - Updates lastActive timestamp
  - Sets current user in context

// Logout
storage.logout(userId)
→ Returns: void
→ Side effects:
  - Sets user status to 'inactive' (from 'active')
  - Clears current user
  - Does NOT update lastActive

// Signup
storage.signup(userData)
→ Returns: { success: boolean, user?: User, error?: string }
→ Side effects:
  - Creates user with role: 'user', status: 'pending'
  - Generates ID, joinedDate, empty favorites/viewedRecipes
  - Logs activity ("joined platform")
  - Records new user in stats
  - Auto-logs in via storage.login()

// Get or create guest ID
storage.getOrCreateGuestId()
→ Returns: string (format: guest-{randomId})
```

### Reviews

```javascript
// Get reviews for recipe
storage.getReviews(recipeId)
→ Returns: Review[]

// Add review (upserts by userId + recipeId)
storage.addReview(recipeId, review)
→ Returns: void

// Delete review
storage.deleteReview(recipeId, reviewId)
→ Returns: void

// Get average rating
storage.getAverageRating(recipeId)
→ Returns: number (average of all review ratings)
```

### Interactions

```javascript
// Toggle like
storage.toggleLike(recipeId, userId)
→ Returns: void
→ Adds/removes userId from recipe.likedBy

// Toggle favorite
storage.toggleFavorite(recipeId, userId)
→ Returns: void
→ Adds/removes recipeId from user.favorites

// Check if user liked recipe
storage.hasUserLiked(recipeId, userId)
→ Returns: boolean

// Check if user favorited recipe
storage.hasUserFavorited(recipeId, userId)
→ Returns: boolean

// Get like count
storage.getLikeCount(recipeId)
→ Returns: number

// Get view count
storage.getViewCount(recipeId)
→ Returns: number
```

### View Tracking

```javascript
// Record view
storage.recordView({ viewerId, recipeId, viewerType })
→ Returns: void
→ Side effects:
  - Adds viewerId to recipe.viewedBy
  - Adds to daily stats views
  - Bypassed for guest IDs (viewerId starts with 'guest-')
```

#### Guest Mode Bypass Rules
Guest IDs (format: `guest-{randomId}`) bypass:
- Per-recipe `viewedBy` tracking
- Daily stats `views` tracking
- `recordActiveUser` tracking

### Search History

```javascript
// Add search history
storage.addSearchHistory(userId, query)
→ Returns: void
→ Side effects:
  - Dedupes existing queries per user
  - Limits to 10 entries per user
  - Removes oldest if limit exceeded

// Get search history
storage.getSearchHistory(userId)
→ Returns: string[] (array of queries)

// Clear search history
storage.clearSearchHistory(userId)
→ Returns: void
```

### Statistics

```javascript
// Get daily stats
storage.getDailyStats(date)
→ Returns: { views: number, activeUsers: number, date: string }

// Record new user
storage.recordNewUser()
→ Returns: void
→ Increments new user count for today

// Record active user
storage.recordActiveUser()
→ Returns: void
→ Increments active user count for current hour

// Get new users today
storage.getNewUsersToday()
→ Returns: number

// Get new contributors today
storage.getNewContributorsToday()
→ Returns: number

// Get daily active users
storage.getDailyActiveUsers()
→ Returns: number

// Get daily views
storage.getDailyViews()
→ Returns: number
```

### Activity Log

```javascript
// Add activity
storage.addActivity(type, text)
→ Returns: void
→ Side effects:
  - Creates activity entry with timestamp
  - Caps at 200 entries (removes oldest)

// Get recent activity
storage.getRecentActivity(limit)
→ Returns: Array<{ type, text, timestamp }>
→ Returns last N entries (default: 5)
```

### Random Recipe

```javascript
// Get random suggestion
storage.getRandomSuggestion()
→ Returns: Recipe
→ Filters:
  - Primary: recipes with >= 5 likes AND >= 1 review
  - Fallback: Any published recipe
```

### Utilities

```javascript
// Update last active timestamp
storage.updateLastActive(userId)
→ Returns: void

// Reset all data (development only)
storage.resetData()
→ Returns: void
→ Clears localStorage and re-seeds data
```

## Default Data (Seed)

### Default Admins
```javascript
// 3 admin accounts (all inactive until first login)
{
  username: 'admin1', email: 'admin1@kitchen_odyssey.com',
  password: 'admin123', role: 'admin', status: 'inactive'
}
{
  username: 'admin2', email: 'admin2@kitchen_odyssey.com',
  password: 'admin123', role: 'admin', status: 'inactive'
}
{
  username: 'admin3', email: 'admin3@kitchen_odyssey.com',
  password: 'admin123', role: 'admin', status: 'inactive'
}
```

### Default Users
```javascript
// 9 regular users (mix of active, inactive, pending, suspended)
// Includes all status types for testing
```

### Default Recipes
```javascript
// 12 recipes across categories
// Mix of published, pending, rejected statuses
// Includes various difficulty levels and categories
```

### Default Avatars
```javascript
// 6 Dicebear avatar URLs
const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=6'
]
```

## localStorage Keys

All keys use `kitchen_odyssey_*` prefix:
```javascript
kitchen_odyssey_users                    // User array
kitchen_odyssey_recipes                  // Recipe array
kitchen_odyssey_current_user             // Current logged-in user
kitchen_odyssey_guest_id                 // Guest ID (if in guest mode)
kitchen_odyssey_reviews                  // Review array (nested in recipes)
kitchen_odyssey_search_history           // Search history per user
kitchen_odyssey_daily_stats              // Daily statistics (date-keyed)
kitchen_odyssey_activity                 // Activity log entries
```

## Data Migration Path

### Phase 1: localStorage → MongoDB Schema
```javascript
// User Schema (Mongoose)
const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed with bcrypt
  username: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  birthday: String,
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'pending'
  },
  avatar: String,
  bio: String,
  location: String,
  cookingLevel: String,
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
  viewedRecipes: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
  joinedDate: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
})

// Recipe Schema (Mongoose)
const recipeSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: [{ type: String }],
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  prepTime: Number,
  cookTime: Number,
  servings: Number,
  image: String,
  ingredients: [{
    name: String,
    quantity: String,
    unit: String
  }],
  instructions: [String],
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  author: String,
  authorAvatar: String,
  status: {
    type: String,
    enum: ['published', 'pending', 'rejected'],
    default: 'pending'
  },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  viewedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})
```

### Phase 2: API Adapter Pattern
```javascript
// storage.js becomes API adapter
const USE_API = import.meta.env.VITE_USE_BACKEND_API === 'true'

export const storage = {
  async getRecipes() {
    if (USE_API) {
      return await fetch('/api/v1/recipes').then(r => r.json())
    }
    return JSON.parse(localStorage.getItem('kitchen_odyssey_recipes') || '[]')
  }
  // ... other methods
}
```

## Related Documentation
- [architecture.md](./architecture.md) - System architecture
- [auth-context.md](./auth-context.md) - Authentication implementation
- [project-overview.md](./project-overview.md) - Project overview

## Memory Management
- **Project:** Kitchen_Odyssey (React frontend)
- **Last Updated:** 2026-02-17
- **Maintained By:** Serena MCP Server
- **Purpose:** Data models and storage layer reference
