# Design System: Kitchen Odyssey Home - Recipe Feed

**Project ID:** 12469199353397755583  
**Device Type:** Desktop  
**Platform:** Web Application

---

## 1. Visual Theme & Atmosphere

**Mood & Characteristics:**
- Clean, modern interface with generous whitespace
- Card-based layouts with clear visual hierarchy
- Professional yet approachable cooking application
- Airy breathing room between elements
- Minimalist aesthetic with intentional information density

**Primary Design Philosophy:**
- Content-first approach with recipe cards as focal points
- Distinct separation between sections using spacing and visual containers
- Consistent visual language across all major screens (13 visible, including 2 Admin User Management variants)

---

## 2. Color Palette & Roles

### Design Philosophy: Fresh Culinary 🍳
**Inspired by fresh ingredients, clean kitchens, and coastal waters**
- Light blue and cyan create a fresh, modern aesthetic
- Earthy neutrals evoke natural, organic cooking experience
- Sage greens provide freshness balance to cool blue tones

### 60-30-10 Color Harmony

**60% - Warm Neutrals (Foundation)**
- **Cream Background:** `#FAF7F2` - Warm, inviting base (not stark white)
- **Warm White:** `#FDFCF9` - Elevated surfaces, cards
- **Warm Grays:** `#F5F0E8` → `#2D2420` - 10-step scale from light to dark

**30% - Light Blue/Cyan (Primary)**
- **Brand:** `#0284C7` - CTA buttons, navigation, primary actions
- **Brand Accent:** `#06B6D4` - Active states, emphasis highlights
- **Brand Hover:** `#0891B2` - Hover states, interactive elements
- **Brand Light:** `#38BDF8` - Subtle backgrounds, lighter highlights
- **Brand Pale:** `#E0F2FE` - Very subtle tinted backgrounds

**10% - Accent Colors (Highlights & Special Features)**
- **Sage Green:** `#81B29A` - Freshness indicators, healthy options, secondary CTAs
- **Golden Ochre:** `#E9C46A` - Premium features, ratings, special highlights
- **Deep Brown:** `#3E2723` - Dark text, emphasis (softer than pure black)
- **Charcoal:** `#2D3436` - Primary text color

### Semantic Colors - Culinary Themed
- **Success/Active:** `#6B9080` (Fresh Sage Green) - Approved recipes, active users, successful actions
- **Warning/Pending:** `#F4A261` (Warm Amber) - Pending reviews, awaiting approval states
- **Error/Suspended:** `#C1121F` (Tomato Red) - Suspended users, rejected recipes, error messages (not harsh red)
- **Info:** `#457B9D` (Muted Blue) - Informational messages, neutral states

### Gradients
- **Brand Gradient:** `linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)` - Hero sections, emphasis cards
- **Sage Gradient:** `linear-gradient(135deg, #81B29A 0%, #6B9B82 100%)` - Freshness highlights
- **Gold Gradient:** `linear-gradient(135deg, #E9C46A 0%, #D4B052 100%)` - Premium badges, ratings
- **Warm Gradient:** `linear-gradient(135deg, #FAF7F2 0%, #F5F0E8 100%)` - Section backgrounds
- **Hero Gradient:** `linear-gradient(135deg, #38BDF8 0%, #06B6D4 50%, #0284C7 100%)` - Featured content

### Shadows - Cool Toned
- **Brand Shadow:** `0 4px 14px 0 rgba(6, 182, 212, 0.25)` - Colored glow for emphasis
- **Sage Shadow:** `0 4px 14px 0 rgba(129, 178, 154, 0.25)` - Fresh accent glow
- **Gold Shadow:** `0 4px 14px 0 rgba(233, 196, 106, 0.30)` - Premium element glow

### Surface Colors
- **Surface Primary:** `#FDFCF9` (Warm White) - Default cards, elevated sections
- **Surface Secondary:** `#FAF7F2` (Cream) - Page background, section containers
- **Surface Tertiary:** `#F5F0E8` (Warm Gray 10) - Nested sections, subdued areas

### Text Colors
- **Primary Text:** `#2D3436` (Charcoal) - Headlines, body text, primary content
- **Secondary Text:** `#8B7355` (Warm Gray 60) - Metadata, timestamps, labels
- **Placeholder Text:** `#C4B7A6` (Warm Gray 40) - Input placeholders, empty states
- **Accent Text:** `#3E2723` (Deep Brown) - Emphasized text, dark contrast

---

## 3. Typography Rules

**Font Family:** Work Sans (Google Font)  
**Font Weight Scale:**
- **Bold/700+:** Screen titles, recipe names, prominent headings
- **Semi-bold/600:** Section headings, card titles, prominent labels
- **Medium/500:** Subheadings, emphasis text, category names
- **Regular/400:** Body text, descriptions, instructions
- **Light/300-400:** Secondary text, timestamps, metadata

**Type Scale:**
- **H1 (Page Titles):** 32-40px - Main section headings
- **H2 (Card Titles):** 20-24px - Recipe names, user names
- **H3 (Section Headers):** 16-18px - Form sections, tab labels
- **Body (Content):** 14-16px - Descriptions, instructions
- **Small (Metadata):** 12-14px - Time estimates, counts, secondary info

**Line Heights:**
- **Display/Headings:** 1.1-1.2 (tight spacing for impact)
- **Body Text:** 1.5-1.6 (readable for recipes, descriptions)
- **Metadata:** 1.3-1.4 (condensed for secondary text)

---

## 4. Component Stylings

### 4.1 Cards
- **Border Radius:** 8px (roundness: ROUND_EIGHT)
- **Box Shadow:** Subtle elevation with soft blur (`shadow-sm` to `shadow-md`)
- **Structure:**
  - Recipe Card: Image top, content bottom (title, tags, metadata, actions)
  - User Card: Avatar left, name/role/stats right
  - Form Card: Sectioned content with distinct headers

**Recipe Card Pattern:**
```css
- Aspect ratio: 4:3 for thumbnails (preserved)
- Image overlay: Optional badges (difficulty, time) in top-right
- Spacing: 12-16px padding inside card
- Title: 2-3 lines max, truncation if longer
- Metadata row: Icons+text (time, difficulty, likes, reviews)
```

### 4.2 Buttons
- **Border Radius:** 8px (consistent with cards)
- **Primary:** Brand accent (`brand-accent` token) background, white text, hover darken
- **Secondary:** White/gray background, dark text, subtle border
- **Tertiary:** Text-only buttons (link style), underline hover
- **States:**
  - Hover: Slight color shift or opacity change
  - Active: Invert colors or press effect
  - Disabled: Grayed out with reduced opacity (50-60%)
  - Loading: Spinner or disabled text (e.g., "Saving...")

### 4.3 Inputs & Form Controls
- **Border Radius:** 6-8px (slightly rounded)
- **Border:** 1px solid #e5e7eb (light gray)
- **Focus:** Brand accent ring/border (`brand-accent` token)
- **Labels:** Above input, primary text color (dark gray)
- **Helper Text:** Below input, smaller font (12-14px)
- **Error State:** Red border/text with error message helper

### 4.4 Modals
- **Backdrop:** Semi-transparent black (rgba 0,0,0,0.5) with blur
- **Structure:**
  - Header: Title + close button (top-right)
  - Body: Scrollable content area
  - Footer: Action buttons (cancel/submit)
- **Animation:** Fade-in with scale or slide-up effect (0.2-0.3s)

### 4.5 Badges & Tags
- **Border Radius:** 4-6px (pill shape)
- **Colors:** Muted backgrounds (light colors) with darker text
- **Sizes:**
  - Small (status): 12-14px height, compact
  - Medium (category): 16-20px height, moderate padding
  - Large (badge): 20-24px height, prominent

### 4.6 Navigation
- **Navbar:**
  - Fixed top or sticky
  - Logo left (text or icon)
  - Navigation links center
  - User actions right (profile, notifications)
  - Mobile: Hamburger menu triggers dropdown
- **Sidebar (Admin):**
  - Fixed left
  - Icon + text navigation items
  - Active state: Highlighted with brand color or pill indicator

### 4.7 Tables (Admin)
- **Headers:** Sticky top, sortable with sort indicators
- **Rows:** Hover highlight, border-bottom separation
- **Status Badges:** Rendered inline (green/red/yellow pills)
- **Responsive:** Horizontal scroll on mobile, preserve column layout
- **Bulk Actions:** Checkbox column left, action buttons right

---

## 5. Layout Principles

### 5.1 Grid Systems
**Responsive Breakpoints:**
- **Mobile (< 640px):** 1 column grid, stacked cards/elements
- **Tablet (640px - 1024px):** 2-3 column grids, side-by-side layouts
- **Desktop (> 1024px):** 4-5 column grids, full-width utilization

**Spacing Scale (Tailwind-based):**
- 4: 16px - Small gaps between related items
- 6: 24px - Medium gaps (between sections)
- 8: 32px - Large gaps (between major containers)
- 12: 48px - Very large gaps (page margins)
- 16: 64px - Extra large gaps (hero sections)

### 5.2 Container Widths
- **Page Container:** Max-width 1200-1280px (matches Stitch desktop)
- **Content Area:** 640-960px (readable width for text)
- **Sidebar Width:** 240-280px (fixed)
- **Navbar Height:** 64px (fixed or sticky)

### 5.3 Section Patterns
**Hero Section:**
- Full-width or centered container
- Large heading (H1) with supporting subtext
- Prominent call-to-action button
- Optional background image with gradient overlay

**Search Section:**
- Floating search bar with icon and clear button
- Optional filters (sidebar or dropdown chips)
- Results grid below with empty state handling

**Recipe Grid:**
- Regular grid with consistent card sizing
- Gaps of 16-24px between cards
- Responsive column adjustment (1→2→3→4)

**Tabbed Content:**
- Tabs horizontal with active indicator (pill or underline)
- Content area below with scroll if needed
- Smooth transitions between tab switches

### 5.4 Visual Hierarchy
1. **Page Title (H1):** Most prominent, top of content
2. **Section Headings (H2):** Distinct from body, moderate size
3. **Card Titles (H2/H3):** Slightly larger than body, emphasis
4. **Body Text (P):** Readable, proper line height
5. **Metadata (Small):** Muted color, smaller font, secondary

---

## 6. Accessibility & Interaction

### 6.1 Interactive Elements
- **Hover States:** All buttons, cards, links have hover feedback
- **Focus States:** Visible ring/outline (2px around element)
- **Active States:** Press effect or color inversion
- **Transitions:** Smooth (0.2-0.3s) using CSS transitions

### 6.2 Keyboard Navigation
- **Tab Order:** Logical sequence through interactive elements
- **Enter/Space:** Activate buttons and interactive items
- **Escape:** Close modals, dismiss dropdowns
- **Focus Trapping:** Modals keep focus until closed

### 6.3 Loading & Empty States
- **Loading:** Spinner or skeleton loader, prevent interaction
- **Empty:** Clear message with illustration/icon
- **Error:** Friendly error message with retry action

---

## 7. Screen-Specific Patterns

### 7.1 Home (Kitchen Odyssey Home - Recipe Feed)
- Hero section: "Fresh from the Kitchen" heading with supporting subtext
- Category filter pills below hero (Trending, Under 30min, Vegetarian, Desserts, Breakfast, Easy) with Material icons
- Sort by dropdown (e.g., "Trending") for recipe feed ordering
- Search bar prominent, centered below hero
- Recipe feed grid (responsive columns)
- Recipe cards with image, overlay favorite icon, timer/duration badge, title, star rating, author avatar + name, difficulty level
- "Load More Recipes" button at bottom of feed (not pagination)
- "Surprise Me" button for random recipe feature (per random-recipe plan; not visible in Stitch but required)

### 7.2 Search & Filtering
- Left sidebar for filters (categories, difficulty, time range)
- Right panel for results grid
- Active filter chips above results
- Empty state when no matches

### 7.3 Recipe Detail
- Breadcrumb navigation (Home / Recipes / {Recipe Title})
- Full-width hero image with title/metadata overlay
- Tabbed content (Ingredients, Instructions, Reviews)
- Ingredients: Checkable list, quantity styling
- Instructions: Step numbering, time estimates per step
- **Nutrition Info Panel:** Calories, Protein, Carbs, Fat displayed in a card below instructions
- **Pending User Restriction:** Lock icons on Like/Save buttons, Reviews section locked, "Pending Status" info card at bottom with description and "View Status Details" link

### 7.4 Authentication (Login/Signup)
- Split-screen layout showing Login and Signup as distinct states/variants
- Login: "Welcome Back" heading, email (mail icon), password (lock + visibility toggle), "Forgot Password?" link, "Log In" button
- Signup: Email, Password, Confirm Password, "Sign Up" button
- Error state: Red "Authentication Failed" alert banner
- Post-signup: Green "Account Pending Approval" success notice
- Navbar: "Home" and "About" links + dark-mode toggle icon
- "Continue as Guest" button (guest mode integration; not visible in Stitch but required per guest-mode plan)

### 7.5 User Profile
- Profile header (avatar, name, bio, stats)
- Tabbed navigation (My Recipes, Favorites, Activity)
- Content grids for each tab
- Edit Profile modal accessible

### 7.6 Admin Panels
- Stats cards in dashboard (users, recipes, daily active, pending)
- **All metrics computed from real-time data** — no hardcoded values
- Table layout for recipe/user management
- Bulk actions (checkboxes, multi-select)
- Status indicators (Role/Status badges with color coding)

#### Admin Dashboard Metrics

| Metric | Calculation | Source |
|--------|-------------|--------|
| **Total Users** | Non-admin users count | `users.filter(u => u.role !== 'admin').length` |
| **User Growth** | Month-over-month percentage | `(usersThisMonth / usersLastMonth) * 100` (from `joinedDate`) |
| **Pending Recipes** | Count of pending submissions | `recipes.filter(r => r.status === 'pending').length` |
| **Active Recipes** | Recipes with views OR likes | `publishedRecipes.filter(r => engages(r)).length` |
| **Active %** | Active recipes as percentage of published | `(activeRecipes / publishedCount) * 100` |
| **Total Likes** | Sum of all likedBy entries | Published recipes `likedBy.reduce((acc, r) => acc + r.likedBy.length, 0)` |
| **Average Likes** | Likes per published recipe | `totalLikes / publishedCount` |
| **Category Share** | Category's share of published recipes | `(recipesInCategory / totalPublished) * 100` |

#### Recent Activity Modal
- Displays up to 200 activity entries
- Scrollable content with full timestamps
- Close button only (no outside click or Escape key dismissal)

#### Recipe Trends Full Report
- All categories displayed (not just top 4)
- Visual progress bars for share percentage
- Recipe counts and like counts per category
- Summary footer with totals

#### Modals
- `persistent` prop available for close-button-only behavior
- Used for data-heavy modals where accidental dismissal loses context
- Standard modals close on backdrop click or Escape key

- **User Management Table enhancements:**
  - "Add New User" button + "Export" button in header actions bar
  - Role filter dropdown ("All Roles") and Status filter dropdown ("All Statuses")
  - Pagination: "Showing X to Y of Z results", page numbers, Previous/Next buttons
  - **Variant A:** Current sidebar nav (Admin Stats, User List, Admin Recipes)
  - **Variant B:** Expanded sidebar nav (Dashboard, User Management, Recipes, Orders, Analytics, Settings)

---

## 8. Responsive Considerations

### Mobile (< 640px)
- Single column layouts
- Collapsible filters (sidebar becomes accordion)
- Touch targets: Minimum 44x44px
- Horizontal scrolling for tables
- Simplified navigation (hamburger menu)

### Tablet (640px - 1024px)
- 2-3 column grids
- Visible sidebars (collapsed to icons optional)
- Responsive card sizing
- Maintained visual hierarchy

### Desktop (> 1024px)
- 4-5 column grids
- Full sidebar visibility
- Max-width containers for readability
- Ample whitespace utilization

---

## 9. Design Consistency Notes

**Global Constants:**
- Border Radius: 8px (buttons, cards, inputs)
- Primary Color: `#06B6D4` (Brand Accent/Cyan) via `brand-accent` Tailwind token (no hardcoded hex in components)
- Secondary Color: `#0284C7` (Brand Blue) via `brand` Tailwind token
- Accent Colors: `#81B29A` (Sage Green) via `sage` Tailwind token, `#E9C46A` (Golden Ochre) via `gold` Tailwind token
- Font: Work Sans (Google Font)
- Spacing: Tailwind scale (4, 6, 8, 12, 16)

**Component Reuse:**
- All modals: Same backdrop, header/footer pattern
- All cards: Same shadow, radius, content structure
- All buttons: Same hover/active/disabled states
- All inputs: Same focus ring, error states

**Pattern Enforcement:**
- Visual hierarchy strictly follows H1 → H2 → H3 → Body → Metadata
- Status colors: Green (active), Yellow (pending), Red (suspended)
- Interactive elements always have hover/focus transitions
- Empty states always have clear messaging + illustration

---

## 10. Stitch-Screen Reference Mapping

| Screen ID | Title | Design Pattern | Key Components |
|------------|--------|----------------|----------------|
| 6a35b85562824db1b1a501edc5f00fa9 | Cookhub Home - Recipe Feed | Hero + Grid | Hero section, category pills, sort dropdown, recipe cards, "Load More" |
| 0c3d91cadee54c5588df173fe6274d6c | Search and Filtering Results | Sidebar + Grid | Filter sidebar, results grid, filter chips |
| f85a1327eda741199830866d7ac291b2 | Search Results Empty State | Centered Empty | Empty message, illustration, retry button |
| d4bb7f8218a042aa9b7270a97d6e3e6d | User Authentication | Split-screen | Login/Signup variants, error/pending banners |
| caa7bca340144607854ef2514e1c5e93 | Recipe Detail View | Hero + Tabs | Full-width hero, tabbed content, review section, nutrition panel |
| c2c636b8cc2b4c25af090b49dd2e028c | Create New Recipe Form | Multi-section | Form accordion, dynamic lists, image upload |
| 3e4a18d80f1f412d922d3e89e602b580 | User Profile with Tabs | Header + Tabs | Profile header, tabbed content grids |
| 88f0e358ae8d4b63bcc6a00b464b0255 | Edit Profile Modal Interface | Modal Form | Profile edit form, save/cancel buttons |
| eaa464a04f24435eb75999e84101439a | Admin Dashboard Overview | Stats Grid | Stats cards, quick actions, charts |
| 173ac4fe760e4dd39f4426e92a2bee27 | Admin Recipe Management Table | Data Table | Recipe table, bulk actions, status badges |
| 403a08a1375f49e3a54d8d016520c93c | Admin User Management Table (V.A) | Data Table | User table, pagination, role/status filters, Export, Add New User |
| a4f60a77581b4f5a915584c4e096e78e | Admin User Management Table (V.B) | Data Table | Same table, expanded sidebar (Dashboard/Users/Recipes/Orders/Analytics/Settings) |
| c6e8592646c244938fc914893f3efa92 | Pending User Restricted State | Restricted View | Lock icons on actions, pending status card, nutrition panel |

---

## 11. Design Tokens Summary (Tailwind Mapping)

**Primary Colors (Light Blue/Cyan Palette):**
```css
--color-brand-accent: #06B6D4; /* Primary CTAs, navigation */
--color-brand: #0284C7;        /* Hover states */
--color-brand-hover: #0891B2;  /* Interactive states */
--color-brand-light: #38BDF8;  /* Lighter accents */
--color-brand-pale: #E0F2FE;   /* Very subtle backgrounds */
```

**Secondary Colors (Fresh Accents):**
```css
--color-sage: #81B29A;         /* Sage green for freshness */
--color-gold: #E9C46A;         /* Golden ochre for highlights */
```

**Warm Neutrals (60% - Foundation):**
```css
--color-cream: #FAF7F2;        /* Main background */
--color-warm-white: #FDFCF9;   /* Card surfaces */
--color-charcoal: #2D3436;     /* Primary text */
--color-deep-brown: #3E2723;   /* Dark accents */
```

**Semantic Colors:**
```css
--color-success: #6B9080;      /* Fresh sage green */
--color-warning: #F4A261;      /* Warm amber */
--color-error: #C1121F;        /* Tomato red (not harsh) */
--color-info: #457B9D;         /* Muted blue */
```

**Gradients:**
```css
--gradient-brand: linear-gradient(135deg, #06B6D4 0%, #0284C7 100%);
--gradient-hero: linear-gradient(135deg, #38BDF8 0%, #06B6D4 50%, #0284C7 100%);
--gradient-sage: linear-gradient(135deg, #81B29A 0%, #6B9B82 100%);
--gradient-gold: linear-gradient(135deg, #E9C46A 0%, #D4B052 100%);
--gradient-warm: linear-gradient(135deg, #FAF7F2 0%, #F5F0E8 100%);
```

**Shadows:**
```css
--shadow-brand: 0 4px 14px 0 rgba(6, 182, 212, 0.25);
--shadow-sage: 0 4px 14px 0 rgba(129, 178, 154, 0.25);
--shadow-gold: 0 4px 14px 0 rgba(233, 196, 106, 0.30);
```

**Spacing:**
```css
--spacing-sm: 16px;
--spacing-md: 24px;
--spacing-lg: 32px;
--spacing-xl: 48px;
--spacing-2xl: 64px;
```

**Border Radius:**
```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
```

**Transitions:**
```css
--transition-fast: 150ms;
--transition-base: 200ms;
--transition-slow: 300ms;
```

---

## 12. Notes for Implementation

1. **Color Contrast:** Ensure all text meets WCAG AA (4.5:1 for body, 3:1 for large text)
2. **Image Ratios:** Maintain 4:3 for recipe cards, preserve on responsive resize
3. **Touch Targets:** 44x44px minimum for mobile interactive elements
4. **Scroll Behavior:** Smooth scrolling for anchor links, preserve scroll position on nav
5. **Modal Focus:** Trap focus within modal tab order, return on close
6. **Lazy Loading:** Implement for recipe images to improve performance
7. **Skeleton Loaders:** Show during async data fetch to prevent content shift
8. **Form Validation:** Real-time feedback with clear error messages below inputs

---

## 13. Integration Points

**Guest Mode Integration:**
- "Continue as Guest" button on Login/Signup screens
- Guest badge in Navbar (icon + text)
- Restricted states for interactive elements (disabled with "Login to {action}" message)
- Profile page redirect to login for guest users

**Random Recipe Integration:**
- "Surprise Me" button in Home hero section
- RecipeSuggestionModal for displaying random recipe
- Loading states during suggestion fetch
- Quality constraints (>= 5 likes, >= 1 review)

**Event System:**
- `favoriteToggled`: Dispatch on like/unlike
- `recipeUpdated`: Dispatch on create/edit/delete
- Components listen for events to update state immediately

---

**Generated from Stitch Project ID: 12469199353397755583**
**Date:** February 17, 2026
**Design Overhaul Completed:** February 17, 2026 — Color system updated from Terracotta to Light Blue/Cyan (Fresh Culinary design).
**Note:** Stitch project uses "Cookhub" branding; implementation uses "Kitchen Odyssey" branding.
