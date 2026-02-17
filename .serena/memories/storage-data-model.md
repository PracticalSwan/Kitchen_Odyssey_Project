storage.js: localStorage keys (cookhub_ prefix): USERS, RECIPES, CURRENT_USER, GUEST_ID, REVIEWS, SEARCH_HISTORY, DAILY_STATS, ACTIVITY. Exports DEFAULT_AVATARS (6 dicebear URLs). Seeds 3 admins + 9 users (all start as 'inactive' except pending/suspended users who keep their status) and 12 recipes (published/pending/rejected). User model: id, username, firstName, lastName, email, password, birthday, role, status, joinedDate, lastActive, avatar, bio, location, cookingLevel, favorites[], viewedRecipes[]. Recipe model: id, title, description, category(string), prepTime, cookTime, servings, difficulty, ingredients[{name,quantity,unit}], instructions[], images[], authorId, status, createdAt, likedBy[], viewedBy[]. Core APIs: initialize, getUsers/getRecipes, saveUser/saveRecipe, deleteUser/deleteRecipe, deleteReview, getRecipeById. Auth: login (validates credentials, sets status to 'active' if was 'active'/'inactive', records active user, updates lastActive), logout (sets status to 'inactive' if was 'active'/'inactive', does NOT update lastActive - logging out isn't an "active" activity, removes current user), getCurrentUser/setCurrentUser, getOrCreateGuestId: produce guest-${generateId()}. Reviews: getReviews(recipeId), addReview (upserts by userId+recipeId), deleteReview, getAverageRating. Interaction: toggleFavorite, toggleLike, hasUserLiked, hasUserFavorited, getLikeCount, getViewCount. Views: recordView({viewerId, recipeId, viewerType}) adds to viewedBy and daily stats views (bypassed for guest IDs starting with guest-). Search: addSearchHistory (dedupes per user, limit 10), getSearchHistory, clearSearchHistory. Stats: getDailyStats, recordNewUser, recordActiveUser, getNewUsersToday, getNewContributorsToday, getDailyActiveUsers, getDailyViews. Activity: addActivity (cap 200), getRecentActivity(limit). Utility: resetData, updateLastActive. Random Recipe: getRandomSuggestion() filters recipes with >= 5 likes and >= 1 review; fallback to any published recipe.

## User Status Behavior (2026-02-17)

User status tracks SESSION state (logged in/out), not account standing:
- 'active': User is currently logged in and using the app
- 'inactive': User is registered but not logged in
- 'pending': New user awaiting admin approval (account state, persists)
- 'suspended': Account suspended by admin (account state, persists)

Login flow: inactive → active (updates lastActive)
Logout flow: active → inactive (does NOT update lastActive)
Seed data: All users start as 'inactive' (except pending/suspended)

## Planning Correction (2026-02-14)

- Guest-ID planning format is guest-{randomId}.
- Planned behavior for Guest Mode and Random Recipe: recordView() must not append guest IDs to recipe viewedBy and must not add guest entries to daily_stats.views.