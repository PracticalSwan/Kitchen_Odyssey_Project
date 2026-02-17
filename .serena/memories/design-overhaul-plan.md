# Design Overhaul Plan

## Status: ✅ Completed (June 2025)

**Created**: 2026-02-11
**Last Updated**: 2025-06 (Implementation completed)
**Version**: 2.0 (Implemented)
**Implementation Sequence**: Phase 3 of 3 — DONE

## Summary

Design overhaul fully implemented across 5 sessions. All 17 source files updated. Every hardcoded `#137fec` reference replaced with the `brand-accent` Tailwind token. All 32 Playwright tests passing.

## Files Modified (17 source + 1 test)
1. src/index.css — Design tokens, animations, scrollbar, focus-visible
2. src/components/ui/Input.jsx — Icon prop, password toggle, brand-accent focus
3. src/components/ui/Button.jsx — Secondary variant → brand-accent
4. src/components/ui/Badge.jsx — Secondary variant → brand-accent
5. src/components/ui/Card.jsx — Hover border → brand-accent/25
6. src/components/ui/Tabs.jsx — Active tab → brand-accent
7. src/components/layout/Navbar.jsx — ChefHat icon, active route highlighting
8. src/components/layout/Sidebar.jsx — Hover text → brand-accent
9. src/layouts/AuthLayout.jsx — Gradient from-brand to-brand-accent
10. src/pages/Auth/Login.jsx — Social auth, Mail/Lock icons
11. src/pages/Auth/Signup.jsx — Social auth, password hint
12. src/pages/Recipe/Home.jsx — Category pills, sort dropdown, load-more, gradient hero
13. src/pages/Recipe/Search.jsx — Pill filters, centered layout, SearchX empty state
14. src/pages/Recipe/RecipeDetail.jsx — Breadcrumbs, author section, instruction steps
15. src/pages/Recipe/CreateRecipe.jsx — Step numbers, textarea styling
16. src/pages/Recipe/Profile.jsx — Avatar selector, empty state links
17. src/pages/Admin/AdminStats.jsx — Progress bar, Pro Tip card → brand-accent
18. src/pages/Admin/UserList.jsx — Role filter focus ring → brand-accent
19. tests/guest-mode.spec.js — Updated heading assertion for new hero text

## Key Design Changes
- **Color tokens**: All hardcoded colors → `brand-accent` Tailwind class
  - v1.0: `#137fec` (original hardcoded blue)
  - v2.0: Terracotta (`#C05640` brand, `#E76F51` accent)
  - v3.0: Multi-variant (teal/sky/ocean) — reverted
  - **v4.0 (current):** Light blue/cyan (`#0284C7` brand, `#06B6D4` accent, `#0891B2` hover, `#38BDF8` light, `#E0F2FE` pale)
- **Home hero**: "Share Your Culinary Masterpiece" → "Fresh from the Kitchen"
- **RecipeCard**: Dark overlay heart, timer badge, author avatar, star rating, description preview (line-clamp-2), like count, category badges (max 3)
- **Auth pages**: Social auth buttons (Google + GitHub), icon-enhanced inputs
- **Navbar**: ChefHat logo icon, active route highlighting, Search link
- **RecipeDetail**: Breadcrumbs, rounded-full instruction step numbers, amber review stars. Reviews section moved BELOW content grid (not in sidebar).
- **Animations**: fade-in, slide-up, scale-in keyframes
- **Modal**: Added `persistent` prop — disables ESC and backdrop click (for admin data modals)

## Testing
- 32/32 Playwright tests passing (19.7s)
- Zero compile/lint errors
- Zero hardcoded `#137fec` references remaining in source
