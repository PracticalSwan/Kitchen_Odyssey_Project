# Kitchen Odyssey - Feature Implementations

## 2026-02-26 Update
- Playwright-based test count references in this file are historical only.
- Active quality workflow uses lint/build and runtime verification.

## Feature Overview

This document details the implementation of all major features in Kitchen Odyssey.

---

## 1. Guest Mode

**Status:** ✅ Implemented (2026-02-14)
**Tests:** 11/11 Playwright tests passing
**Plan:** [plan/feature-guest-mode-1.md](../plan/feature-guest-mode-1.md)

### Implementation Details

#### Entry Points
- **Login Page:** "Continue as Guest" button
- **Signup Page:** "Continue as Guest" button

#### AuthContext Integration
```javascript
const enterGuestMode = () => {
  const guestId = storage.getOrCreateGuestId()
  setIsGuest(true)
  setCurrentUser(null)
  window.addEventListener('storage', handleStorageChange)
}
```

#### Guest ID Format
```javascript
guest-{randomId}  // e.g., guest-a1b2c3d4
```

#### Analytics Bypass
Guest mode bypasses:
- Per-recipe `viewedBy` tracking
- Daily stats `views` tracking
- `recordActiveUser()` tracking

#### UI Restrictions
```jsx
{isGuest && (
  <Alert variant="info">
    You're in guest mode. <Link to="/login">Log in</Link> for full access.
  </Alert>
)}

{!isGuest && canInteract && (
  <Button onClick={handleLike}>Like Recipe</Button>
)}
```

#### Navbar Badge
```jsx
{isGuest && (
  <Badge variant="secondary">Guest</Badge>
)}
```

---

## 2. Random Recipe Suggestion

**Status:** ✅ Implemented (2026-02-14)
**Tests:** 12 Playwright tests
**Plan:** [plan/feature-random-recipe-suggestion-1.md](../plan/feature-random-recipe-suggestion-1.md)

### Implementation Details

#### Home Hero Button
```jsx
<Button
  variant="outline"
  onClick={() => setShowRandomModal(true)}
>
  Surprise Me
</Button>
```

#### Quality Filter
```javascript
// In storage.js
getRandomSuggestion() {
  // Primary: recipes with >= 5 likes AND >= 1 review
  const qualityRecipes = recipes.filter(r =>
    r.status === 'published' &&
    r.likedBy.length >= 5 &&
    r.reviews.length >= 1
  )

  // Fallback: Any published recipe
  if (qualityRecipes.length === 0) {
    const published = recipes.filter(r => r.status === 'published')
    return published[Math.floor(Math.random() * published.length)]
  }

  return qualityRecipes[Math.floor(Math.random() * qualityRecipes.length)]
}
```

#### RecipeSuggestionModal Component
```jsx
<RecipeSuggestionModal
  isOpen={showRandomModal}
  onClose={() => setShowRandomModal(false)}
  onTryAnother={handleTryAnother}
  onViewRecipe={handleViewRecipe}
  recipe={randomRecipe}
/>
```

**Modal Content:**
- Recipe image
- Title with difficulty badge
- Like count
- Review count
- "View Recipe" button
- "Try Another" button

#### Guest Compatibility
```jsx
// Guest users can view suggestions
{isGuest && (
  <Button onClick={() => navigate(`/recipe/${recipe.id}`)}>
    View Recipe
  </Button>
)}

// But do NOT increment view counts
const handleViewRecipe = (recipe) => {
  if (!isGuest) {
    storage.recordView({ viewerId: user.id, recipeId: recipe.id, viewerType: 'user' })
  }
  navigate(`/recipe/${recipe.id}`)
}
```

---

## 3. Design Overhaul (v2.0)

**Status:** ✅ Implemented (June 2025, updated 2026-02-17)
**Tests:** 32/32 Playwright tests passing
**Design:** [DESIGN.md](../../DESIGN.md)

### Color System v4.0 - Light Blue/Cyan

#### Design Tokens
```css
@theme {
  --color-brand: #0284C7;           /* sky-600 */
  --color-brand-accent: #06B6D4;    /* cyan-500, Primary CTAs */
  --color-brand-hover: #0891B2;     /* cyan-600 */
  --color-brand-light: #38BDF8;     /* sky-400 */
  --color-brand-pale: #E0F2FE;      /* sky-100 */

  --color-sage: #81B29A;            /* Accent: success */
  --color-gold: #E9C46A;            /* Accent: warning */

  --color-cream: #FAF7F2;           /* Background */
  --color-warm-white: #FDFCF9;      /* Cards */
}
```
**History:** v1.0 (#137fec) → v2.0 Terracotta → v3.0 Multi-variant (reverted) → v4.0 Light Blue/Cyan

#### Component Updates
All white backgrounds replaced with warm neutrals:
- Cards: `bg-warm-white`
- Buttons: `bg-brand-accent`
- Inputs: Focus ring `brand-accent/25`

---

## 4. Recipe Management

### Create Recipe

**Location:** `/create-recipe`
**Component:** `src/pages/Recipe/CreateRecipe.jsx`

#### Validation Rules
```javascript
{
  title: { min: 3, max: 100 },
  description: { min: 10, max: 500 },
  categories: { min: 1, max: 3 },
  prepTime: { min: 1, max: 1440 },
  cookTime: { min: 0, max: 1440 },
  servings: { min: 1, max: 100 },
  image: { optional: true, default: 'https://...' },
  ingredients: { min: 1, each: { name, quantity } },
  instructions: { min: 1, each: { min: 5 } }
}
```

#### Multi-Select Categories
```jsx
<Select
  multiple
  value={categories}
  onChange={setCategories}
  options={CATEGORY_OPTIONS}
  max={3}
/>
```

#### Recipe Status
```javascript
const newRecipe = {
  ...recipeData,
  status: 'pending',  // All new recipes start as pending
  createdAt: new Date().toISOString()
}
```

### Edit Recipe

**Location:** `/edit-recipe/:id`
**Component:** `src/pages/Recipe/CreateRecipe.jsx` (shared)

#### Edit Mode Detection
```jsx
const recipeId = useParams().id
const isEditMode = !!recipeId

useEffect(() => {
  if (isEditMode) {
    const recipe = storage.getRecipeById(recipeId)
    setFormData(recipe)
  }
}, [recipeId])
```

#### Status Preservation
```javascript
// Editing preserves status unless rejected → pending
const updatedRecipe = {
  ...formData,
  status: originalStatus === 'rejected' ? 'pending' : originalStatus,
  updatedAt: new Date().toISOString()
}
```

### Recipe Visibility

**Rules:**
- **Published:** Visible to all users (Home, Search)
- **Pending:** Visible only to author and admins
- **Rejected:** Visible only to author and admins

**Owner Access:**
```jsx
// RecipeDetail.jsx - Owner can view their non-published recipes
const isOwner = user && user.id === recipe.authorId
const isAccessible =
  recipe.status === 'published' ||
  isOwner ||
  isAdmin

if (!isAccessible) {
  return <Navigate to="/home" />
}
```

---

## 5. Search & Discovery

### Search Page

**Location:** `/search`
**Component:** `src/pages/Recipe/Search.jsx`

#### URL State Sync
```jsx
const [searchParams, setSearchParams] = useSearchParams()

const filters = {
  q: searchParams.get('q') || '',
  category: searchParams.getAll('category') || [],
  difficulty: searchParams.get('difficulty') || '',
  sort: searchParams.get('sort') || 'popular'
}

const updateFilters = (key, value) => {
  setSearchParams(prev => {
    const newParams = new URLSearchParams(prev)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    return newParams
  })
}
```

#### Filters
- **Keyword:** Title-only search (debounced)
- **Category:** Multi-select toggle (up to 3, comma-separated in URL)
- **Difficulty:** Single-select dropdown
- **Sort (unified with Home):**
  - Trending (default) — most reviews → most likes → highest rating
  - Newest First (createdAt desc)
  - Highest Rated — average rating desc, likes tiebreaker
  - A-Z (title asc)

#### Search History
```javascript
// Debounced (1.5s delay)
useEffect(() => {
  const timer = setTimeout(() => {
    if (filters.q && user && !isGuest) {
      storage.addSearchHistory(user.id, filters.q)
    }
  }, 1500)

  return () => clearTimeout(timer)
}, [filters.q, user, isGuest])

// Display recent searches
{searchHistory.map(query => (
  <Chip onClick={() => updateFilters('q', query)}>
    {query}
  </Chip>
))}
```

### Home Page

**Location:** `/home`
**Component:** `src/pages/Recipe/Home.jsx`

#### Batch Loading
```javascript
const [displayCount, setDisplayCount] = useState(30)

const displayedRecipes = filteredRecipes.slice(0, displayCount)

const handleLoadMore = () => {
  setDisplayCount(prev => prev + 30)
}
```

#### "Load More" Button
```jsx
{filteredRecipes.length > displayCount && (
  <Button onClick={handleLoadMore}>
    Load More Recipes
  </Button>
)}
```

---

## 6. Reviews & Ratings

### One Review Per User
```javascript
// storage.addReview() upserts by userId + recipeId
const addReview = (recipeId, review) => {
  const recipe = getRecipeById(recipeId)
  const existingIndex = recipe.reviews.findIndex(
    r => r.userId === review.userId
  )

  if (existingIndex >= 0) {
    // Update existing review
    recipe.reviews[existingIndex] = { ...review, id: generateId() }
  } else {
    // Add new review
    recipe.reviews.push({ ...review, id: generateId() })
  }

  saveRecipe(recipe)
}
```

### Rating Display
```jsx
// Star rating component
<div className="flex items-center gap-1">
  {[1, 2, 3, 4, 5].map(star => (
    <Star
      key={star}
      className={star <= averageRating ? 'fill-amber-400' : 'text-gray-300'}
    />
  ))}
  <span className="text-sm">({reviews.length})</span>
</div>
```

### Delete Own Review
```jsx
{user && review.userId === user.id && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => handleDeleteReview(review.id)}
  >
    <Trash2 className="w-4 h-4" />
  </Button>
)}
```

---

## 7. Admin Dashboard

### AdminStats (Dashboard)

**Location:** `/admin`
**Component:** `src/pages/Admin/AdminStats.jsx`

#### Real Metrics

```javascript
// Total Users with MoM growth
const totalUsers = users.filter(u => u.role !== 'admin').length
const usersThisMonth = users.filter(u => {
  const joined = new Date(u.joinedDate)
  return joined.getMonth() === currentMonth && joined.getFullYear() === currentYear
}).length
const growth = lastMonthUsers > 0
  ? Math.round(((usersThisMonth - lastMonthUsers) / lastMonthUsers) * 100)
  : 0

// Active Recipes (% published with engagement)
const activeRecipes = publishedRecipes.filter(r =>
  r.viewedBy.length > 0 || r.likedBy.length > 0
).length
const activePercentage = Math.round((activeRecipes / publishedCount) * 100)

// Total Likes + Average
const totalLikes = publishedRecipes.reduce((sum, r) => sum + r.likedBy.length, 0)
const avgLikes = publishedCount > 0 ? (totalLikes / publishedCount).toFixed(1) : 0
```

#### Recipe Trends
```javascript
const categoryScore = (category) => {
  const recipesInCategory = publishedRecipes.filter(r =>
    r.category.includes(category)
  )
  const likes = recipesInCategory.reduce((sum, r) => sum + r.likedBy.length, 0)
  return recipesInCategory.length * 2 + likes
}

const topCategories = allCategories
  .map(cat => ({
    name: cat,
    score: categoryScore(cat),
    recipes: publishedRecipes.filter(r => r.category.includes(cat)).length,
    likes: publishedRecipes.filter(r => r.category.includes(cat))
      .reduce((sum, r) => sum + r.likedBy.length, 0)
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 4)
```

#### Persistent Modals

**Recent Activity Modal:**
```jsx
<Modal
  isOpen={showActivityModal}
  onClose={() => setShowActivityModal(false)}
  title="Recent Activity"
  persistent={true}  // Only closeable via close button
>
  <div className="max-h-96 overflow-y-auto">
    {recentActivity.map(entry => (
      <ActivityEntry key={entry.timestamp} {...entry} />
    ))}
  </div>
</Modal>
```

**Recipe Trends Full Report:**
```jsx
<Modal
  isOpen={showTrendsModal}
  onClose={() => setShowTrendsModal(false)}
  title="Recipe Trends - Full Report"
  persistent={true}
>
  <table className="w-full">
    <thead>
      <tr>
        <th>Rank</th>
        <th>Category</th>
        <th>Recipes</th>
        <th>Likes</th>
        <th>Share</th>
      </tr>
    </thead>
    <tbody>
      {allCategories.map((cat, index) => (
        <tr key={cat}>
          <td>{index + 1}</td>
          <td>{cat}</td>
          <td>{getRecipeCount(cat)}</td>
          <td>{getLikeCount(cat)}</td>
          <td>
            <ProgressBar value={getShare(cat)} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</Modal>
```

### AdminRecipes

**Location:** `/admin/recipes`
**Component:** `src/pages/Admin/AdminRecipes.jsx`

#### Tabs
```jsx
<Tabs
  tabs={[
    { key: 'pending', label: 'Pending', count: pendingRecipes.length },
    { key: 'published', label: 'Published', count: publishedRecipes.length },
    { key: 'rejected', label: 'Rejected', count: rejectedRecipes.length }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

#### Recipe Table
```jsx
<Table>
  <thead>
    <tr>
      <th>Image</th>
      <th>Title</th>
      <th>Author</th>
      <th>Categories</th>
      <th>Status</th>
      <th>Date</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {recipes.map(recipe => (
      <tr key={recipe.id}>
        <td><img src={recipe.image} alt="" className="w-12 h-12 rounded" /></td>
        <td>{recipe.title}</td>
        <td>{recipe.author}</td>
        <td>
          {recipe.category.map(cat => (
            <Badge key={cat}>{cat}</Badge>
          ))}
        </td>
        <td><StatusBadge status={recipe.status} /></td>
        <td>{formatDate(recipe.createdAt)}</td>
        <td>
          {activeTab === 'pending' && (
            <>
              <Button onClick={() => handleApprove(recipe)}>Approve</Button>
              <Button onClick={() => handleReject(recipe)}>Reject</Button>
            </>
          )}
          <Button onClick={() => handlePreview(recipe)}>Preview</Button>
          <Button onClick={() => handleDelete(recipe)}>Delete</Button>
        </td>
      </tr>
    ))}
  </tbody>
</Table>
```

### UserList

**Location:** `/admin/users`
**Component:** `src/pages/Admin/UserList.jsx`

#### User Display Status
```javascript
const getDisplayStatus = (user) => {
  if (user.status === 'suspended') return 'suspended'
  if (user.status === 'pending') return 'pending'
  if (user.status === 'inactive') return 'inactive'

  // Active users: check lastActive within 5 minutes
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  const lastActive = new Date(user.lastActive).getTime()

  return lastActive > fiveMinutesAgo ? 'active' : 'inactive'
}
```

#### User Actions (Limited)
```jsx
{/* Only 3 actions: Approve, Suspend, Delete */}
<Button
  onClick={() => handleApprove(user)}
  disabled={user.status === 'active' || user.status === 'inactive'}
>
  <ShieldCheck className="w-4 h-4" />
</Button>

<Button
  onClick={() => handleSuspend(user)}
  disabled={user.status === 'suspended'}
>
  <Ban className="w-4 h-4" />
</Button>

<Button onClick={() => handleDelete(user)}>
  <Trash2 className="w-4 h-4" />
</Button>

{/* Note: Admins CANNOT edit user details (name, email, profile, etc.) */}
```

---

## 8. Profile Management

### View Profile

**Location:** `/profile` or `/profile/:id`
**Component:** `src/pages/Profile/Profile.jsx`

#### Own vs Other Profile
```jsx
const profileId = useParams().id
const isOwnProfile = !profileId || profileId === user?.id

const profileUser = isOwnProfile
  ? user
  : storage.getUserById(profileId)
```

#### Profile Header
```jsx
<div className="profile-header">
  <Avatar src={profileUser.avatar} size="xl" />
  <h1>{profileUser.username}</h1>
  <Badge>{profileUser.cookingLevel}</Badge>
  <p>{profileUser.bio}</p>
  <p>{profileUser.location}</p>
  <p>Joined {formatDate(profileUser.joinedDate)}</p>

  {isOwnProfile && (
    <Button onClick={() => setShowEditModal(true)}>
      Edit Profile
    </Button>
  )}
</div>
```

#### Profile Tabs
```jsx
<Tabs
  tabs={[
    { key: 'recipes', label: 'Recipes' },
    { key: 'favorites', label: 'Favorites' }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>

{activeTab === 'recipes' && (
  <RecipeGrid
    recipes={
      isOwnProfile
        ? getAllUserRecipes(profileUser.id)  // All statuses
        : getPublishedUserRecipes(profileUser.id)  // Published only
    }
    showStatusBadge={isOwnProfile}
  />
)}
```

### Edit Profile

**Modal Component:** `EditProfileModal`

#### Avatar Selector
```jsx
<div className="avatar-selector">
  {DEFAULT_AVATARS.map(avatar => (
    <img
      key={avatar}
      src={avatar}
      alt=""
      className={selectedAvatar === avatar ? 'ring-2 ring-brand-accent' : ''}
      onClick={() => setSelectedAvatar(avatar)}
    />
  ))}
  <Input
    label="Or enter custom URL"
    value={customAvatar}
    onChange={(e) => setCustomAvatar(e.target.value)}
  />
</div>
```

#### Editable Fields
- First Name
- Last Name
- Username
- Email
- Avatar (6 presets or custom URL)
- Bio
- Location
- Cooking Level

---

## Related Documentation
- [data-models.md](./data-models.md) - Data models and schemas
- [authentication.md](./authentication.md) - Auth system
- [ui-components-and-styling.md](./ui-components-and-styling.md) - Component library

## Memory Management
- **Project:** Kitchen_Odyssey (React frontend)
- **Last Updated:** 2026-02-18
- **Maintained By:** Serena MCP Server
- **Purpose:** Feature implementation reference
