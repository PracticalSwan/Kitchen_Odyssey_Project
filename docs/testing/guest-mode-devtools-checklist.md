# Guest Mode — Chrome DevTools Testing Checklist

## Purpose

This checklist provides step-by-step procedures for verifying Guest Mode behavior using Chrome DevTools. Use this during development and QA to confirm that guest analytics are properly isolated from real user metrics.

---

## Prerequisites

- Application running at `http://localhost:5174/recipe-sharing-system-deploy/`
- Chrome browser with DevTools open (`F12` or `Ctrl+Shift+I`)

---

## 1. localStorage Inspection

### 1.1 Verify Guest ID Key

1. Open **Application** tab → **Local Storage** → `http://localhost:5174`
2. Click **Continue as Guest** on Login page
3. Verify `cookhub_guest_id` key exists
4. Verify value matches pattern: `guest-{randomId}` (e.g., `guest-abc123`)

- [ ] `cookhub_guest_id` key present
- [ ] Value format: `guest-{randomId}`

### 1.2 Verify Guest ID Not in daily_stats

1. Stay in guest mode and browse recipes
2. In **Local Storage**, find `cookhub_daily_stats` key
3. Parse the JSON value
4. Check `views` array — no entries should contain `guest`
5. Check `activeUsers` array — no entries should start with `guest-`

- [ ] No guest entries in `daily_stats.views`
- [ ] No guest entries in `daily_stats.activeUsers`

### 1.3 Verify Recipe viewedBy Exclusion

1. In guest mode, navigate to a specific recipe (e.g., `#/recipes/recipe-1`)
2. In **Local Storage**, find `cookhub_recipes` key
3. Parse JSON and find the viewed recipe
4. Check `viewedBy` array — no entries should contain `guest`

- [ ] No guest ID in recipe `viewedBy` arrays

### 1.4 Verify Guest ID Cleared on Login

1. While in guest mode, note the `cookhub_guest_id` value
2. Click **Login** and log in as `user@cookhub.com`
3. Verify `cookhub_guest_id` key is removed from localStorage

- [ ] Guest ID cleared after login

---

## 2. React DevTools Inspection

### 2.1 AuthContext State Verification

1. Open **React DevTools** (Components tab)
2. Find `AuthContext.Provider` in the component tree
3. In guest mode, verify context value shows:
   - `isGuest: true`
   - `canInteract: false`
   - `user: null`
4. After logging in, verify:
   - `isGuest: false`
   - `user` object is populated

- [ ] `isGuest: true` when in guest mode
- [ ] `canInteract: false` when in guest mode
- [ ] `isGuest: false` after login

### 2.2 State Transition Verification

1. Enter guest mode → verify `isGuest: true`
2. Navigate to Login page → log in as user
3. Verify `isGuest: false` immediately after login
4. Logout → verify `isGuest: false` (not guest, just logged out)
5. Enter guest mode again → verify `isGuest: true`

- [ ] State transitions are clean with no stale values

---

## 3. Console Error Checking

### 3.1 Mode Transition Errors

1. Open **Console** tab, set filter to **Errors** and **Warnings**
2. Enter guest mode → check for errors
3. Browse Home page → check for errors
4. View recipe detail → check for errors
5. Navigate to Create Recipe page → check for errors
6. Navigate to Profile page → check for errors
7. Switch to Login → log in → check for errors
8. Logout → enter guest mode again → check for errors

- [ ] Zero errors during guest mode entry
- [ ] Zero errors during guest browsing
- [ ] Zero errors during mode transitions
- [ ] Zero errors on blocked pages (Create, Profile)

### 3.2 Interaction Blocking Errors

1. In guest mode, navigate to a recipe detail page
2. Attempt to click disabled Like button (should not fire)
3. Attempt to click disabled Save button (should not fire)
4. Check console for any unhandled errors

- [ ] No errors from clicking disabled buttons

---

## 4. Network Tab Inspection

### 4.1 No API Calls with Guest IDs

1. Open **Network** tab
2. Enter guest mode and browse recipes
3. Filter requests by XHR/Fetch
4. Verify no requests contain guest IDs in URL, headers, or body
5. (Note: Current app is client-side only — this verifies readiness for backend)

- [ ] No network requests with guest IDs

---

## 5. Performance Verification

### 5.1 No Memory Leaks

1. Open **Performance** tab
2. Enter guest mode
3. Navigate between pages 10+ times
4. Take heap snapshot
5. Verify no significant memory growth from guest state management

- [ ] No observable memory leaks during guest browsing

---

## Summary

| Category | Checks | Expected |
|----------|--------|----------|
| localStorage | Guest ID format, daily_stats exclusion, viewedBy exclusion, cleanup on login | All pass |
| React DevTools | isGuest state, canInteract, transitions | All pass |
| Console | Zero errors across all guest interactions | All pass |
| Network | No guest ID in requests | All pass |
| Performance | No memory leaks | All pass |
