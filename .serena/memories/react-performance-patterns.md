# React Performance Patterns & Component Best Practices

## Purpose

This memory documents comprehensive React performance optimization patterns, custom hooks, and component composition strategies for Kitchen Odyssey. Following these practices ensures UI remains responsive while providing excellent user experience across all 13 screens.

## Created & Updated

**Created**: 2026-02-12
**Last Updated**: 2026-02-12
**Source**: design-overhaul-1.md v1.4 enhancements
**Aligned with**: react-development skill patterns

## Performance Optimization Strategies

### Memoization Strategy

**When to Use:**
- Large lists rendering (>10-20 items)
- Expensive calculations in render
- Complex child props that don't change frequently
- Critical user-facing components

**Implementation Guidelines:**

#### 1. React.memo for Large Lists
```javascript
// src/components/recipe/RecipeCard.jsx
import React from 'react'

const RecipeCard = React.memo(function RecipeCard({ recipe, onLike, onFavorite }) {
  // Component implementation
  return (
    <Card image={recipe.image} badges={<Badge>{recipe.difficulty}</Badge>}>
      <h3>{recipe.title}</h3>
      <p>{recipe.description}</p>
    </Card>
  )
})

// Only re-renders if `recipe`, `onLike`, or `onFavorite` props change
```

**Use Cases:**
- Home page recipe grid (10s of recipes)
- Search results (potentially 100s of recipes)
- Profile "My Recipes" and "Favorites" tabs
- Admin recipe management tables

#### 2. useCallback for Event Handlers
```javascript
// Parent component (Home.jsx, Search.jsx, Profile.jsx)
import { useCallback } from 'react'

const handleLike = useCallback((recipeId) => {
  // Like recipe logic
  dispatch({ type: 'LIKE_RECIPE', payload: recipeId })
}, [])

const handleFavorite = useCallback((recipeId) => {
  // Favorite recipe logic
  dispatch({ type: 'FAVORITE_RECIPE', payload: recipeId })
}, [])

// Pass stable function references to children
<RecipeCard recipe={recipe} onLike={handleLike} onFavorite={handleFavorite} />
```

**Benefits:**
- Prevents child re-renders when parent state changes
- Functions maintain identity across parent re-renders
- Critical for large lists (Home, Search, Profile)

#### 3. useMemo for Expensive Calculations
```javascript
import { useMemo } from 'react'

const filteredRecipes = useMemo(() => {
  return recipes.filter(recipe => {
    return recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           recipe.ingredients.some(ing => ing.includes(searchQuery))
  })
}, [recipes, searchQuery])

// Only recalculates when recipes or searchQuery changes
```

**Use Cases:**
- Recipe search filtering
- Sorted recipe lists (by date, popularity, rating)
- Admin table sorting and filtering

### Virtualization for Large Lists

**When to Use:**
- Tables with >50 rows (admin tables)
- Lists with >100 items (search results with pagination)
- Performance profiling shows render bottlenecks

**Implementation Options:**

#### Option 1: react-window (Recommended)
```javascript
import { FixedSizeList } from 'react-window'

function RecipeList({ recipes }) {
  const Row = useCallback(({ index, style }) => (
    <div style={style}>
      <RecipeCard recipe={recipes[index]} />
    </div>
  ), [recipes])

  return (
    <FixedSizeList
      height={600}
      itemCount={recipes.length}
      itemSize={400}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

#### Option 2: react-virtualized (Alternative)
```javascript
import { Table, Column } from 'react-virtualized'

function AdminRecipeTable({ recipes }) {
  return (
    <Table
      width={800}
      height={600}
      headerHeight={50}
      rowHeight={60}
      rowCount={recipes.length}
      rowGetter={({ index }) => recipes[index]}
    >
      <Column width={200} label="Title" dataKey="title" />
      <Column width={150} label="Author" dataKey="author" />
      <Column width={100} label="Status" dataKey="status" />
    </Table>
  )
}
```

**Priority for Implementation:**
1. AdminRecipes.jsx table if >50 recipes
2. UserList.jsx table if >50 users
3. Search.jsx results grid if >50 recipes

### Code Splitting Strategy

#### 1. Lazy Loading Route Components
```javascript
// src/App.jsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Lazy load routes
const Home = lazy(() => import('./pages/Recipe/Home'))
const Search = lazy(() => import('./pages/Recipe/Search'))
const RecipeDetail = lazy(() => import('./pages/Recipe/RecipeDetail'))
const CreateRecipe = lazy(() => import('./pages/Recipe/CreateRecipe'))
const Profile = lazy(() => import('./pages/Recipe/Profile'))
const AdminStats = lazy(() => import('./pages/Admin/AdminStats'))
const AdminRecipes = lazy(() => import('./pages/Admin/AdminRecipes'))
const UserList = lazy(() => import('./pages/Admin/UserList'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/recipes/create" element={<CreateRecipe />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/admin" element={<AdminStats />} />
          <Route path="/admin/recipes" element={<AdminRecipes />} />
          <Route path="/admin/users" element={<UserList />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

**Benefits:**
- Reduces initial bundle size by ~30-50%
- Faster page load time for LCP improvement
- Code only loaded when route is visited

**Bundle Size Targets:**
- Home route: <80KB
- RecipeDetail route: <100KB (includes images)
- Admin routes: <90KB each
- Total initial bundle: <150KB (including shared code)

#### 2. Lazy Loading Components
```javascript
// src/pages/Recipe/Home.jsx
import { lazy, Suspense, useState } from 'react'

const RecipeCard = lazy(() => import('../components/recipe/RecipeCard'))
const RecipeSuggestionModal = lazy(() => import('../components/recipe/RecipeSuggestionModal'))

function Home() {
  const [showSuggestionModal, setShowSuggestionModal] = useState(false)

  return (
    <div>
      <HeroSection />
      <Suspense fallback={<CardSkeleton />}>
        <RecipeCard recipe={featuredRecipe} />
      </Suspense>
      {showSuggestionModal && (
        <Suspense fallback={<div>Loading suggestion...</div>}>
          <RecipeSuggestionModal onClose={() => setShowSuggestionModal(false)} />
        </Suspense>
      )}
    </div>
  )
}
```

**When to Defer Loading:**
- Below-fold components (RecipeCard below hero)
- Modal components (RecipeSuggestionModal, EditProfileModal)
- Complex interactive components (admin tables)

## Custom Hooks Library

### useDebounce Hook

**Purpose:** Delay function execution until user stops typing/interacting

**Implementation:**
```javascript
// src/hooks/useDebounce.js
import { useState, useEffect } from 'react'

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

export default useDebounce
```

**Usage Examples:**

#### Search Input Debouncing
```javascript
// src/pages/Recipe/Search.jsx
import { useState, useEffect } from 'react'
import useDebounce from '../hooks/useDebounce'

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  useEffect(() => {
    // API call only happens 500ms after user stops typing
    if (debouncedSearchQuery) {
      searchRecipes(debouncedSearchQuery)
    } else {
      clearSearchResults()
    }
  }, [debouncedSearchQuery])

  return (
    <Input
      label="Search recipes"
      value={searchQuery}
      onChange={setSearchQuery}
      helperText="Type to search by name, ingredient, or category"
    />
  )
}
```

#### Filter Value Debouncing
```javascript
// src/pages/Recipe/Search.jsx (continuation)
const [difficultyFilter, setDifficultyFilter] = useState('all')
const debouncedDifficultyFilter = useDebounce(difficultyFilter, 300)

useEffect(() => {
  if (debouncedDifficultyFilter !== 'all') {
    filterByDifficulty(debouncedDifficultyFilter)
  }
}, [debouncedDifficultyFilter])
```

**Delay Recommendations:**
- Search input: 500ms (balance between responsiveness and performance)
- Filter changes: 300ms (filters typically faster than search)
- Auto-save: 1000ms (explicit user action, can be slower)

### useLocalStorage Hook

**Purpose:** Memoized localStorage operations with type safety

**Implementation:**
```javascript
// src/hooks/useLocalStorage.js
import { useState, useEffect, useCallback } from 'react'

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

export default useLocalStorage
```

**Usage Examples:**

#### User Preferences
```javascript
// src/pages/Recipe/Home.jsx
import useLocalStorage from '../hooks/useLocalStorage'

function Home() {
  const [viewMode, setViewMode] = useLocalStorage('kitchen_odyssey_viewMode', 'grid')
  const [recentRecipes, setRecentRecipes] = useLocalStorage('kitchen_odyssey_recent', [])

  return (
    <div>
      <Button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
        Switch to {viewMode === 'grid' ? 'List' : 'Grid'} View
      </Button>
      <RecipeGrid recipes={recipes} viewMode={viewMode} />
    </div>
  )
}
```

#### Search History
```javascript
// src/pages/Recipe/Search.jsx
const [searchHistory, setSearchHistory] = useLocalStorage('kitchen_odyssey_searchHistory', [])

const handleSearch = useCallback((query) => {
  if (query.trim()) {
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, 10)
      return newHistory
    })
    searchRecipes(query)
  }
}, [])
```

### useMediaQuery Hook

**Purpose:** Responsive breakpoint detection for JS logic

**Implementation:**
```javascript
// src/hooks/useMediaQuery.js
import { useState, useEffect } from 'react'

function getMediaQueryList(query) {
  return window.matchMedia(query)
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    const mediaQueryList = getMediaQueryList(query)
    return mediaQueryList.matches
  })

  useEffect(() => {
    const mediaQueryList = getMediaQueryList(query)
    const documentChangeHandler = () => setMatches(mediaQueryList.matches)

    try {
      mediaQueryList.addEventListener('change', documentChangeHandler)
    } catch (e) {
      // Safari fallback
      mediaQueryList.addListener(documentChangeHandler)
    }

    return () => {
      try {
        mediaQueryList.removeEventListener('change', documentChangeHandler)
      } catch (e) {
        mediaQueryList.removeListener(documentChangeHandler)
      }
    }
  }, [query])

  return matches
}

export default useMediaQuery
```

**Usage Examples:**

#### Conditional Rendering by Breakpoint
```javascript
// src/pages/Recipe/Search.jsx
import useMediaQuery from '../hooks/useMediaQuery'

function SearchPage() {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1024px)')

  return (
    <div>
      {isMobile && <MobileSearchLayout />}
      {isTablet && <TabletSearchLayout />}
      {!isMobile && !isTablet && <DesktopSearchLayout />}
    </div>
  )
}
```

#### Dynamic Grid Columns
```javascript
// src/pages/Recipe/Home.jsx
function RecipeGrid({ recipes }) {
  const isLargeScreen = useMediaQuery('(min-width: 1280px)')
  const columns = isLargeScreen ? 5 : 4

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
      }}
    >
      {recipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
    </div>
  )
}
```

## Component Composition Patterns

### Button Component Composition

**Design Pattern:** Compound component with flexible children API

**Implementation:**
```javascript
// src/components/ui/Button.jsx
import { forwardRef } from 'react'
import { cn } from '../utils/cn'

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', isLoading = false, children, className, ...props },
  ref
) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50'

  const variantClasses = {
    primary: 'bg-[#C8102E] hover:bg-[#a50d26] text-white focus:ring-[#C8102E]',
    secondary: 'bg-[#137fec] hover:bg-[#0d63c2] text-white focus:ring-[#137fec]',
    outline: 'border border-[#e5e7eb] hover:bg-gray-50 text-gray-900 focus:ring-gray-500',
    ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    icon: 'p-2 rounded-lg hover:bg-gray-100', // For icon-only buttons
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-2.5 text-lg',
  }

  return (
    <button
      ref={ref}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Icon name="Loader2" className="animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  )
})
```

**Composition Examples:**

#### Standard Button with Text
```javascript
<Button variant="primary" size="md" onClick={handleSave} isLoading={isSaving}>
  Save Recipe
</Button>
```

#### Icon + Text Button
```javascript
<Button variant="primary" size="sm" onClick={handleLike}>
  <Icon name="Heart" className="mr-2" />
  Like Recipe
</Button>
```

#### Icon-Only Button
```javascript
<Button variant="icon" onClick={toggleTheme} aria-label="Toggle dark mode">
  <Icon name={isDark ? "Sun" : "Moon"} />
</Button>
```

#### Action Group
```javascript
<div className="flex gap-2">
  <Button variant="outline" size="sm">Cancel</Button>
  <Button variant="primary" size="sm">Submit</Button>
</div>
```

### Card Component Composition

**Design Pattern:** Slot-based composition with optional image, badges, footer

**Implementation:**
```javascript
// src/components/ui/Card.jsx
import { forwardRef } from 'react'
import { cn } from '../utils/cn'

export const Card = forwardRef(function Card(
  { children, image, badges, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-lg shadow-sm overflow-hidden hover-lift',
        className
      )}
      {...props}
    >
      {image && (
        <div className="relative">
          <img src={image} alt="" className="w-full aspect-[4/3] object-cover" />
          {badges && (
            <div className="absolute top-2 right-2 flex gap-2">
              {badges}
            </div>
          )}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
})
```

**Card Sub-Components (for complex cards):**
```javascript
export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900 mb-2', className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className }) {
  return (
    <p className={cn('text-sm text-gray-600 line-clamp-2', className)}>
      {children}
    </p>
  )
}

export function CardFooter({ children, className }) {
  return (
    <div className={cn('border-t border-gray-200 p-4', className)}>
      {children}
    </div>
  )
}
```

**Composition Examples:**

#### Recipe Card with Badges
```javascript
<Card
  image={recipe.image}
  badges={
    <>
      <Badge variant="sm" color="primary">{recipe.difficulty}</Badge>
      <Badge variant="sm" color="secondary">{recipe.time}</Badge>
    </>
  }
>
  <CardTitle>{recipe.title}</CardTitle>
  <CardDescription>{recipe.description}</CardDescription>
  <CardFooter>
    <div className="flex justify-between items-center">
      <Button variant="icon" onClick={handleLike} aria-label="Like recipe">
        <Icon name="Heart" />
      </Button>
      <span className="text-sm text-gray-500">{recipe.views} views</span>
    </div>
  </CardFooter>
</Card>
```

#### User Card
```javascript
<Card image={user.avatar} badges={<Badge variant="sm">{user.role}</Badge>}>
  <CardTitle>{user.name}</CardTitle>
  <CardDescription>{user.bio}</CardDescription>
</Card>
```

### Modal Component Composition

**Design Pattern:** Portal-based modal with backdrop and focus management

**Implementation Guidelines:**
- Use React Portal for body append
- Implement focus trapping (tab loop in modal)
- Restore focus to trigger element on close
- Support full-screen variant
- Backdrop blur animation

**Performance Notes:**
- Lazy load modals that aren't frequently used
- Use React.memo for modal content components
- Avoid expensive state calculations in modal render

## Performance Profiling

### Using React DevTools Profiler

**Installation:**
```bash
npm install --save-dev @welldone-software/why-did-you-render
```

**Profiling Steps:**
1. Open React DevTools Profiler tab
2. Click "Record"
3. Interact with application (click buttons, type input, navigate)
4. Click "Stop"
5. Analyze flame graph for:
   - Expensive renders (red/yellow bars)
   - Unnecessary re-renders (same component re-rendering multiple times)
   - Memoization opportunities (children in parent re-render)

**Common Performance Issues:**
- Passing new objects/arrays as props (creates new reference every render)
- Inline arrow functions in JSX (creates new function every render)
- Large state objects in parent (causes all children to re-render)
- Unnecessary useEffect dependencies

### Using Chrome DevTools Performance Tab

**Profiling Steps:**
1. Open Chrome DevTools Performance tab
2. Click "Record"
3. Perform interaction (e.g., scroll through recipe grid)
4. Click "Stop"
5. Analyze waterfall for:
   - Long tasks (>50ms indicates main thread blocking)
   - Layout thrashing (forcing layout reflows)
   - Excessive paint operations

**Optimization Targets:**
- Main thread blocking <30ms per frame (smooth 60fps)
- No forced reflows in scroll
- Minimal paint operations
- <2.5s Largest Contentful Paint (LCP)

## Bundle Analysis

### Using Vite Bundle Analyzer

**Installation:**
```bash
npm install --save-dev rollup-plugin-visualizer
```

**Configuration:**
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      filename: 'dist/stats.html',
    })
  ]
})
```

**Analysis:**
```bash
npm run build
# Opens visualization showing bundle composition
```

**Look For:**
- Large dependencies (>50KB) that could be split
- Duplicate code across routes
- Unused dependencies in production build
- Opportunities for tree-shaking

## Performance Budgets

### Current Targets (design-overhaul v1.4)

**Page Load Targets:**
- Home page: LCP <2.5s, bundle <80KB
- Recipe detail: LCP <2.5s, bundle <100KB (includes images)
- Admin pages: LCP <2.5s, bundle <90KB
- Total initial bundle: <150KB

**Rendering Targets:**
- No main thread blocks >50ms
- No layout shifts on interaction
- Smooth 60fps scrolling
- Instant button clicks (<100ms to visual feedback)

**Bundle Size Targets:**
- Vendor bundle: <75KB (React, Router, Tailwind)
- Route-specific: <50KB each
- Total production build: <250KB

## Related Documents

- [design-overhaul-plan](./design-overhaul-plan.md) - Implementation plan with performance guidelines
- [ui-components-and-styling](./ui-components-and-styling.md) - Design system and components
- [project-overview](./project-overview.md) - Overall project architecture
- design-overhaul-1.md - Implementation tasks (TASK-OV-073 through TASK-OV-079 with performance patterns)

---

**Performance Ready**: ✅ All patterns documented with implementation examples and usage guidelines.
