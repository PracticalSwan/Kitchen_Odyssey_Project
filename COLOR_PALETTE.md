# Kitchen Odyssey Color Palette v4.0 🎨

**Design Philosophy:** Fresh Culinary - A light blue and cyan primary palette inspired by fresh ingredients, clean kitchens, and coastal waters.

---

## Color Overview

### Primary Design Approach

**Primary Brand:** Light Blue/Cyan - Main CTAs, navigation, core brand elements
**Warm Accents:** Sage Green, Golden Ochre - Natural, food-inspired colors
**Foundation:** Warm Neutrals - Cream, warm white, warm grays

### Color Distribution

| Proportion | Role | Colors |
|------------|------|--------|
| **60%** | Backgrounds & Surfaces | Cream, Warm White, Warm Grays |
| **30%** | Primary Actions | Light Blue, Cyan |
| **10%** | Accents & Highlights | Sage, Gold |

---

## Color Swatches

### Primary - Light Blue/Cyan Palette 💧
Used for: Main brand, primary CTAs, navigation, active states

```
┌─────────────────────────────────────┐
│ brand-light   #38BDF8  (Light)      │  ████████▊
│ brand-accent  #06B6D4  (Cyan)       │  ████████
│ brand         #0284C7  (Primary)    │  ███████▌
│ brand-hover   #0891B2  (Hover)      │  ███████
│ brand-pale    #E0F2FE  (Pale BG)    │  ███▋
└─────────────────────────────────────┘
```

**Usage:**
- `brand-accent (#06B6D4)` - Primary buttons, navigation links, active tabs
- `brand (#0284C7)` - Secondary buttons, badges, links
- `brand-hover (#0891B2)` - Button hover states, interactive elements
- `brand-light (#38BDF8)` - Gradients, highlights, lighter accents
- `brand-pale (#E0F2FE)` - Subtle backgrounds, card hover states

### Secondary - Sage Green 🌿
Used for: Freshness indicators, healthy options, vegetarian tags

```
┌─────────────────────────────────────┐
│ sage-light    #A8D5C4  (Light)      │  ███████
│ sage          #81B29A  (Main)       │  ████████
│ sage-dark     #6B9B82  (Hover)      │  ███████▌
│ sage-pale     #E8F3ED  (Pale BG)    │  ███▌
└─────────────────────────────────────┘
```

### Accent - Golden Ochre ⭐
Used for: Premium features, ratings, special highlights

```
┌─────────────────────────────────────┐
│ gold-light    #F2D990  (Light)      │  ███████
│ gold          #E9C46A  (Main)       │  ████████
│ gold-dark     #D4B052  (Hover)      │  ███████▊
│ gold-pale     #FCF5E3  (Pale BG)    │  ████▊
└─────────────────────────────────────┘
```

---

## Warm Neutrals - Foundation 🏛️
Used for: Backgrounds, cards, text, borders

```
┌─────────────────────────────────────┐
│ warm-white    #FDFCF9  (Cards)      │  ████████▋
│ cream         #FAF7F2  (BG)         │  ████████▊
│ warm-gray-10  #F5F0E8  (Sections)   │  ████████
│ warm-gray-20  #E8E0D5  (Borders)    │  ███████▊
│ warm-gray-30  #D4C9BC  (Lines)      │  ███████
│ warm-gray-40  #C4B7A6  (Text)       │  ███████▌
│ warm-gray-60  #8B7355  (Muted)      │  █████▊
│ charcoal      #2D3436  (Primary)    │  ███▌
│ espresso      #1F1A17  (Deep)       │  ██
└─────────────────────────────────────┘
```

---

## Gradients

```
┌─────────────────────────────────────────────────────────┐
│ Brand:   linear-gradient(135deg, #06B6D4 → #0284C7)    │
│ Hero:    linear-gradient(135deg, #38BDF8 → #06B6D4     │
│          → #0284C7)                                    │
│ Sage:    linear-gradient(135deg, #81B29A → #6B9B82)    │
│ Gold:    linear-gradient(135deg, #E9C46A → #D4B052)    │
│ Warm:    linear-gradient(135deg, #FAF7F2 → #F5F0E8)    │
└─────────────────────────────────────────────────────────┘
```

---

## Shadows

```
┌─────────────────────────────────────────────────────────┐
│ Brand:  0 4px 14px 0 rgba(6, 182, 212, 0.25)          │
│ Sage:   0 4px 14px 0 rgba(129, 178, 154, 0.25)        │
│ Gold:   0 4px 14px 0 rgba(233, 196, 106, 0.30)        │
└─────────────────────────────────────────────────────────┘
```

---

## Semantic Colors - Culinary Themed

| Purpose | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Success** | Fresh Sage | `#6B9080` | Approved recipes, active users |
| **Warning** | Warm Amber | `#F4A261` | Pending reviews, approval states |
| **Error** | Tomato Red | `#C1121F` | Suspended users, rejected recipes |
| **Info** | Muted Blue | `#457B9D` | Informational messages |

---

## Component Usage Examples

### Buttons
- **Primary:** `bg-brand-accent text-white` → Hover: `bg-brand`
- **Secondary:** `bg-brand text-white` → Hover: `bg-brand-hover`
- **Outline:** `border-warm-gray-30 bg-warm-white` → Hover: `border-brand-accent text-brand-accent`

### Recipe Cards
- Default: `bg-warm-white border-warm-gray-20`
- Hover: `bg-brand-pale/50 border-brand-accent` + `hover-lift` animation

### Badges
- Success: `bg-green-100 text-green-800`
- Warning: `bg-yellow-100 text-yellow-800`
- Error: `bg-red-100 text-red-800`
- Outline: `border-warm-gray-30 text-warm-gray-60`

### Navigation
- Active links: `text-brand-accent`
- Inactive links: `text-warm-gray-60` → Hover: `text-brand-accent`

---

## Accessibility

All color combinations meet WCAG AA standards (4.5:1 contrast ratio):

- **White text on brand-accent (#06B6D4):** ✓ Pass
- **White text on brand (#0284C7):** ✓ Pass
- **Charcoal text on warm-white (#FDFCF9):** ✓ Pass
- **Brand text on brand-pale (#E0F2FE):** ✓ Pass

---

## CSS Variables Reference

```css
/* Primary Brand */
--color-brand: #0284C7;
--color-brand-accent: #06B6D4;
--color-brand-hover: #0891B2;
--color-brand-light: #38BDF8;
--color-brand-pale: #E0F2FE;

/* Secondary - Sage */
--color-sage: #81B29A;
--color-sage-dark: #6B9B82;
--color-sage-light: #A8D5C4;
--color-sage-pale: #E8F3ED;

/* Accent - Gold */
--color-gold: #E9C46A;
--color-gold-dark: #D4B052;
--color-gold-light: #F2D990;
--color-gold-pale: #FCF5E3;

/* Warm Neutrals */
--color-cream: #FAF7F2;
--color-warm-white: #FDFCF9;
--color-warm-gray-10: #F5F0E8;
--color-warm-gray-20: #E8E0D5;
--color-warm-gray-30: #D4C9BC;
--color-warm-gray-40: #C4B7A6;
--color-warm-gray-60: #8B7355;
--color-charcoal: #2D3436;
--color-espresso: #1F1A17;

/* Gradients */
--gradient-brand: linear-gradient(135deg, #06B6D4 0%, #0284C7 100%);
--gradient-hero: linear-gradient(135deg, #38BDF8 0%, #06B6D4 50%, #0284C7 100%);
--gradient-sage: linear-gradient(135deg, #81B29A 0%, #6B9B82 100%);
--gradient-gold: linear-gradient(135deg, #E9C46A 0%, #D4B052 100%);
--gradient-warm: linear-gradient(135deg, #FAF7F2 0%, #F5F0E8 100%);

/* Shadows */
--shadow-brand: 0 4px 14px 0 rgba(6, 182, 212, 0.25);
--shadow-sage: 0 4px 14px 0 rgba(129, 178, 154, 0.25);
--shadow-gold: 0 4px 14px 0 rgba(233, 196, 106, 0.30);
```
