# Kitchen Odyssey - UI Components & Styling

## Design System Overview

**Color Theme:** Light Blue/Cyan v4.0
**Typography:** Work Sans
**Icons:** Lucide React 0.562.0
**Utility:** clsx + tailwind-merge (`cn()` helper)

---

## Design Tokens

**Location:** `src/index.css` (Tailwind `@theme` block)

### Colors
```css
/* Primary - Light Blue/Cyan v4.0 */
--color-brand: #0284C7;               /* Brand primary (sky-600) */
--color-brand-accent: #06B6D4;        /* Main CTAs, navigation, active states (cyan-500) */
--color-brand-hover: #0891B2;         /* Hover states (cyan-600) */
--color-brand-light: #38BDF8;         /* Light accents, highlights (sky-400) */
--color-brand-pale: #E0F2FE;          /* Pale backgrounds, selected states (sky-100) */

/* Accents */
--color-sage: #81B29A;                /* Success states, healthy options */
--color-gold: #E9C46A;               /* Warnings, ratings, highlights */

/* Warm Neutrals (retained from v2.0) */
--color-cream: #FAF7F2;
--color-warm-white: #FDFCF9;
--color-warm-gray-10 through -90 retained

/* Semantic Colors (Tailwind defaults) */
--color-error: #ef4444;
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-info: #3b82f6;
```

### Gradients
```css
--gradient-brand: linear-gradient(135deg, #0284C7, #06B6D4);
--gradient-hero: linear-gradient(135deg, #06B6D4, #0284C7, #38BDF8);
```

### Shadows
```css
--shadow-brand: 0 4px 12px rgba(2, 132, 199, 0.25);
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1);
```

---

## Component Library

### Button (`src/components/ui/Button.jsx`)
Variants: primary, secondary, outline, ghost, danger
Sizes: sm, default, lg, icon

### Input (`src/components/ui/Input.jsx`)
Icon prop, password toggle, error state, focus ring (brand-accent/25)

### Card (`src/components/ui/Card.jsx`)
bg-warm-white, hover border brand-accent/25, shadow-card

### Badge (`src/components/ui/Badge.jsx`)
Variants: default, success, warning, error, outline, secondary
Colors: sage, gold

### Table (`src/components/ui/Table.jsx`)
Sortable headers, status badges

### Tabs (`src/components/ui/Tabs.jsx`)
Active: bg-warm-white text-brand-accent

### Modal (`src/components/ui/Modal.jsx`)
- Backdrop blur, focus trapping
- `persistent={true}` disables ESC key and backdrop click close (close button only)
- Used for admin data-heavy modals (activity log, full report)

---

## Layout Components

### Navbar (`src/components/layout/Navbar.jsx`)
Sticky, warm-white bg (95% opacity), backdrop blur, ChefHat logo, active route brand-accent

### Sidebar - Admin (`src/components/layout/Sidebar.jsx`)
Fixed left, warm-white bg, hover text brand-accent

---

## Recipe Components

### RecipeCard (`src/components/recipe/RecipeCard.jsx`)
**Visual elements:** image, timer badge (prep+cook), heart icon overlay, author avatar, star rating, difficulty badge, like count, description preview (line-clamp-2), category badges (max 3), hover bg-brand-pale/50

**Required recipe fields:** title, description, categories[], prepTime, cookTime, difficulty, ingredients[], instructions[], images[], authorId, likedBy[], averageRating, reviewCount

### RecipeSuggestionModal (`src/components/recipe/RecipeSuggestionModal.jsx`)
Random recipe display: image, title, difficulty, likes, reviews, "View Recipe" + "Try Another" buttons

---

## Page-Specific UI

### Home (Discover)
- **Sort:** Unified SORT_OPTIONS: trending (default), newest, rating, title
- **PAGE_SIZE:** 30 items per batch with "Load More" button
- **Filter chips:** Quick, Vegetarian, Desserts, Breakfast, Easy
- Hero section with gradient-hero background

### Search
- **Sort:** Same unified SORT_OPTIONS as Home
- Multi-category toggle (up to 3), URL param sync (q, sort, categories, difficulty)
- Debounced search history (1.5s), reset filters button

### RecipeDetail
- Breadcrumbs, recipe header, metadata, actions
- Content grid: Instructions (2/3) + Ingredients sidebar (1/3)
- **Reviews: BELOW content grid** (not in sidebar)
- **Owner access:** Authors can view own pending/rejected recipes

### CreateRecipe
- Multi-section form, step numbers (brand-accent), multi-select categories (max 3)

### AdminStats
- All metrics computed from real data (no hardcoded values)
- Persistent modals for "View All" activity and "View Full Report"

---

## Responsive Breakpoints
sm: 640px, md: 768px, lg: 1024px, xl: 1280px

## Recipe Grid
```jsx
grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6
```

---

## Color History
- v1.0: `#137fec` (hardcoded blue)
- v2.0: Terracotta (`#C05640` brand, `#E76F51` accent)
- v3.0: Multi-variant (teal/sky/ocean) — reverted
- **v4.0 (current):** Light blue/cyan (`#0284C7` brand, `#06B6D4` accent)

---

- **Last Updated:** 2026-02-18
- **Maintained By:** Serena MCP Server
