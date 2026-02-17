# Recipe Detail Page - Recent Changes (2026-02-18)

## Layout Changes

### Action Buttons Layout (Refined)
The Like, Save, and Share buttons have been **moved from the image overlay** to **under the hero image**, with a refined split layout:

**Button arrangement:**
- **Left side:** Edit and Delete buttons (owner controls only visible to recipe owner)
- **Right side:** Like, Save, and Share buttons (visible to all users)
- All 5 buttons have consistent sizing: `h-9` height, `px-4` padding, `text-sm` font
- Container uses `justify-between` to separate the two groups

**Button styling:**
- **Like/Save buttons:** Toggle between outlined (default) and solid primary (selected)
  - Unselected: `border border-warm-gray-20 bg-warm-white text-charcoal`
  - Selected: `bg-brand-accent text-white` (heart/bookmark filled)
- **Share button:** Outlined style with "Copied!" feedback when clicked
- **Edit/Delete buttons:** Standard `Button` component with `variant="outline"` and `size="sm"`
  - Delete has red border and text: `border-red-200 text-red-500 hover:bg-red-50`

**Icons:** All icons use `h-4 w-4` for consistency (Heart, Bookmark, Share2, Edit, Trash2)

## New Utility: `formatCount()`

Added to `src/lib/utils.js`:

```javascript
export const formatCount = (count) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return Math.floor(count / 1000) + 'K';
    return Math.floor(count / 1000000) + 'M';
};
```

**Usage:** Recipe detail page displays like counts using this formatter:
- `< 1000`: Display as-is (e.g., "42", "999")
- `>= 1000 && < 1,000,000`: Display with K suffix (e.g., "1K", "42K", "999K")
- `>= 1,000,000`: Display with M suffix (e.g., "1M", "42M", "999M")

**Files modified:**
- `src/lib/utils.js` - Added `formatCount()` export
- `src/pages/Recipe/RecipeDetail.jsx` - Layout restructure, button organization
