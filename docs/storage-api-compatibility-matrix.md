# Storage-to-API Compatibility Matrix (TASK-003)

Maps every `storage.js` public function to its API endpoint equivalent in `storageApiAdapter.js`.

## Function Mapping

| # | storage.js Function | API Endpoint | Method | Auth | Adapter Notes |
|---|---|---|---|---|---|
| 1 | `initialize()` | N/A | - | - | No-op in API mode; DB is pre-seeded |
| 2 | `getUsers()` | `GET /api/v1/users` | GET | Admin | Admin-only; pages must handle pagination |
| 3 | `getRecipes()` | `GET /api/v1/recipes` | GET | Public | Default limit=30; supports sort/filter params |
| 4 | `saveUser(user)` | `PATCH /api/v1/users/:id` | PATCH | User/Admin | Self-update or admin; send only changed fields |
| 5 | `saveRecipe(recipe)` | `POST /api/v1/recipes` or `PATCH /api/v1/recipes/:id` | POST/PATCH | Active user | POST for new (no id), PATCH for existing |
| 6 | `deleteUser(userId)` | `DELETE /api/v1/users/:id` | DELETE | Admin | Server handles cascade cleanup |
| 7 | `login(email, password)` | `POST /api/v1/auth/login` | POST | Public | Sets HttpOnly cookie; returns user object |
| 8 | `getCurrentUser()` | `GET /api/v1/auth/me` | GET | Cookie | Returns user from JWT; null if no token |
| 9 | `setCurrentUser(user)` | N/A | - | - | Handled server-side via JWT; local state only |
| 10 | `getOrCreateGuestId()` | `POST /api/v1/auth/guest-session` | POST | Public | Returns/creates guest ID; remains client-local |
| 11 | `updateLastActive(userId)` | `PATCH /api/v1/users/:id` | PATCH | User | Server auto-updates on authenticated requests |
| 12 | `logout(userId)` | `POST /api/v1/auth/logout` | POST | User/Admin | Clears HttpOnly cookie |
| 13 | `getReviews(recipeId?)` | `GET /api/v1/recipes/:id/reviews` | GET | Public | Paginated; requires recipeId |
| 14 | `getSearchHistory(userId?)` | `GET /api/v1/search-history` | GET | User/Admin | Scoped to authenticated user |
| 15 | `clearSearchHistory(userId?)` | `DELETE /api/v1/search-history` | DELETE | User/Admin | Clears for authenticated user |
| 16 | `addSearchHistory({userId, query})` | `POST /api/v1/search-history` | POST | User/Admin | Server handles dedup and limit |
| 17 | `getAverageRating(recipeId)` | `GET /api/v1/recipes/:id/rating` | GET | Public | Returns {average, count} |
| 18 | `addReview(review)` | `POST /api/v1/recipes/:id/reviews` | POST | Active non-admin | One per user per recipe; upserts |
| 19 | `toggleFavorite(userId, recipeId)` | `POST /api/v1/recipes/:id/favorite` | POST | Active non-admin | Returns {favorited: boolean} |
| 20 | `toggleLike(userId, recipeId)` | `POST /api/v1/recipes/:id/like` | POST | Active non-admin | Returns {liked: boolean, count: number} |
| 21 | `recordView(viewerIdOrOpts, recipeId?)` | `POST /api/v1/recipes/:id/view` | POST | Public | Sends viewerType; server handles guest bypass |
| 22 | `getLikeCount(recipeId)` | Embedded in `GET /api/v1/recipes/:id` | GET | Public | Accessible via recipe response `likedBy.length` |
| 23 | `hasUserLiked(userId, recipeId)` | Embedded in recipe response | GET | Public | Check `recipe.likedBy.includes(userId)` client-side |
| 24 | `hasUserFavorited(userId, recipeId)` | Embedded in user response | GET | User | Check `user.favorites.includes(recipeId)` client-side |
| 25 | `getViewCount(recipeId)` | Embedded in `GET /api/v1/recipes/:id` | GET | Public | Accessible via recipe response `viewedBy.length` |
| 26 | `deleteRecipe(recipeId)` | `DELETE /api/v1/recipes/:id` | DELETE | Owner/Admin | Server handles cascade (reviews, favorites) |
| 27 | `deleteReview(reviewId)` | `DELETE /api/v1/reviews/:id` | DELETE | Author/Admin | Ownership + admin checks server-side |
| 28 | `getRecipeById(recipeId)` | `GET /api/v1/recipes/:id` | GET | Mixed | Published=public; non-published=owner/admin only |
| 29 | `resetData()` | N/A | - | - | Test-only; use seed fixtures in test environment |
| 30 | `getDailyStats()` | `GET /api/v1/stats/daily` | GET | Admin | Returns computed daily aggregates |
| 31 | `recordNewUser(userId, role?)` | N/A | - | - | Server records automatically on signup |
| 32 | `recordActiveUser(userId)` | N/A | - | - | Server records automatically on login |
| 33 | `getNewUsersToday()` | `GET /api/v1/stats/active-users` | GET | Admin | Server computes from user collection |
| 34 | `getNewContributorsToday()` | `GET /api/v1/stats/active-users` | GET | Admin | Server computes from user collection |
| 35 | `getDailyActiveUsers()` | `GET /api/v1/stats/active-users` | GET | Admin | Server computes from user collection |
| 36 | `getDailyViews()` | `GET /api/v1/stats/views` | GET | Admin | Server computes from daily_stats collection |
| 37 | `addActivity(activity)` | `POST /api/v1/activity` | POST | Internal/Admin | Server generates timestamps and IDs |
| 38 | `getRecentActivity(limit?)` | `GET /api/v1/activity` | GET | Admin | Supports `limit` query param |
| 39 | `getRandomSuggestion()` | `GET /api/v1/recipes/random-suggestion` | GET | Public | Server applies quality constraints |

## Adapter Strategy

The `storageApiAdapter.js` will export an object with the **exact same function signatures** as `storage.js`:

```javascript
// storageApiAdapter.js exports
export const storageApi = {
  initialize: async () => { /* no-op */ },
  getUsers: async () => { /* GET /users */ },
  getRecipes: async (params) => { /* GET /recipes */ },
  // ... mirrors all 39 functions above
}
```

### Behavioral Differences
1. All adapter functions are **async** (return Promises)
2. `initialize()` becomes a no-op since DB is pre-seeded
3. `setCurrentUser()` is local state only; server handles session via cookies
4. `recordNewUser()` and `recordActiveUser()` are automatic on server-side
5. `resetData()` only available in test environment via seed fixtures
6. Helper checks (`hasUserLiked`, `hasUserFavorited`, `getLikeCount`, `getViewCount`) use cached recipe/user data from API responses

### Feature Flag Integration
```javascript
import { storage } from './storage.js';
import { storageApi } from './storageApiAdapter.js';

const getDataSource = () =>
  import.meta.env.VITE_USE_BACKEND_API === 'true' ? storageApi : storage;
```
