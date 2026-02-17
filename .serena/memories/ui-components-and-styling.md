UI layer: reusable components — Button (variants: primary/outline/ghost/danger/secondary + size: sm/default/lg/icon + isLoading), Input (icon prop, password toggle, brand-accent focus ring), Card (hover border brand-accent/25), Badge (secondary uses brand-accent/10), Table (sortable headers + status badges + checkbox rows), Tabs (active tab text brand-accent), Modal (backdrop blur + focus trapping).

**Color System (Design Overhaul Completed):**
- All `#137fec` hardcoded references eliminated from source files
- Brand accent accessed exclusively via `brand-accent` Tailwind token
- Token defined in src/index.css `@theme` block: `--color-brand-accent: #137fec`
- Brand red: `#C8102E` (--color-brand), used for primary CTA, navigation, hero gradients
- 60-30-10 Rule: 60% surfaces (#f5f7fa/#ffffff), 30% secondary (#e5e7eb/#6b7280), 10% brand accents

**Design Tokens (src/index.css @theme block):**
- Colors: --color-brand: #C8102E, --color-brand-accent: #137fec, --color-cool-gray-*
- Radius: --radius-sm: 6px, --radius-md: 8px, --radius-lg: 12px, --radius-xl: 16px, --radius-full: 9999px
- Animations: fade-in, slide-up, scale-in keyframes

**Typography:** Work Sans (Google Font), weights 300-700, H1 32-40px, Body 14-16px

**Layout Components:**
- Navbar: sticky, ChefHat logo icon, active route highlighting, Search link, guest badge
- Sidebar (admin): fixed left, hover text brand-accent
- AuthLayout: gradient from-brand to-brand-accent, copyright footer

**Page Patterns:**
- Home: gradient hero "Fresh from the Kitchen", category filter pills, sort dropdown, load-more button
- RecipeCard: dark overlay heart (top-right), timer badge, author avatar bar, star rating
- Search: pill-based filters, centered layout, SearchX empty state
- RecipeDetail: breadcrumbs (Link + ChevronRight), rounded-full instruction steps, amber review stars, 340px sticky sidebar
- CreateRecipe: rounded-full step numbers bg-brand-accent, resize-none textareas
- Profile: avatar selector brand-accent states, empty state links brand-accent
- Admin: progress bars/links brand-accent, role filter focus ring brand-accent
- Auth: social auth buttons (Google + GitHub), icon-enhanced inputs, error/success banners

**Responsiveness:** Mobile <640px (1 col), Tablet 640-1024px (2-3 cols), Desktop >1024px (4-5 cols)
**Accessibility:** WCAG AA, focus-visible outline brand-accent, 44x44px touch targets, modal focus trapping
**Utils:** cn() via clsx+twMerge, lucide-react icons
**Guest Mode Integration:** "Continue as Guest" button on Auth pages, guest badge in Navbar, restricted states
**Random Recipe:** "Surprise Me" button in Home hero, RecipeSuggestionModal component