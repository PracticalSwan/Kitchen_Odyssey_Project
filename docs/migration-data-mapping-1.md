---
goal: Define field-by-field mapping from localStorage schema to MongoDB collections
version: 1.0
date_created: 2026-02-17
last_updated: 2026-02-17
owner: Project Team
status: 'Planned'
tags: ['migration', 'data-mapping', 'localStorage', 'mongodb', 'schema']
---

# Migration Data Mapping: localStorage to MongoDB

## Introduction

This document defines the field-by-field mapping from the current localStorage schema (defined in `src/lib/storage.js`) to the MongoDB collections used in the backend. This mapping ensures complete data preservation during migration with clear transformation rules for any field changes.

---

## 1. Users Collection

### localStorage Structure

**Storage Key:** `cookhub_users`

**Schema Reference:** `SEED_DATA.users` in `src/lib/storage.js` (lines 29-258)

### MongoDB Collection Schema

**Collection Name:** `users`

**Mongoose Schema:**
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string; // Hashed
  birthday?: string;
  role: 'admin' | 'user';
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  joinedDate: string;
  lastActive?: string;
  avatar: string;
  bio?: string;
  location?: string;
  cookingLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
  favorites: string[]; // Array of recipe IDs
  viewedRecipes: string[]; // Array of recipe IDs
  tokenVersion?: number; // For session invalidation
  timezone?: string; // For daily stats aggregation
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, required: true }, // Maps to `id` field
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 30 },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: { type: String, required: true }, // bcrypt hashed
  birthday: String,
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'inactive'],
    default: 'pending'
  },
  joinedDate: { type: String, required: true },
  lastActive: String,
  avatar: { type: String, default: null },
  bio: { type: String, maxlength: 500 },
  location: { type: String, maxlength: 100 },
  cookingLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional']
  },
  favorites: [{ type: String, ref: 'recipes' }],
  viewedRecipes: [{ type: String, ref: 'recipes' }],
  tokenVersion: { type: Number, default: 0 },
  timezone: { type: String, default: 'UTC' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  _id: false, // Use custom `id` field as _id
  timestamps: true
});

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ lastActive: -1 });

export default mongoose.model<IUser>('users', UserSchema);
```

### Field Mapping

| localStorage Field | MongoDB Field | Type | Notes |
|-------------------|---------------|------|-------|
| `id` | `_id` | String | Primary key, indexed |
| `username` | `username` | String | No change |
| `firstName` | `firstName` | String | No change |
| `lastName` | `lastName` | String | No change |
| `email` | `email` | String | Unique, indexed, lowercase |
| `password` | `password` | String | **MIGRATION:** Hash with bcrypt before storing |
| `birthday` | `birthday` | String | No change (ISO 8601 date) |
| `role` | `role` | String | Enum: 'admin', 'user' |
| `status` | `status` | String | Enum: 'active', 'pending', 'suspended', 'inactive' |
| `joinedDate` | `joinedDate` | String | No change (ISO 8601) |
| `lastActive` | `lastActive` | String | No change (ISO 8601), indexed |
| `avatar` | `avatar` | String | No change (URL) |
| `bio` | `bio` | String | No change, max 500 chars |
| `location` | `location` | String | No change, max 100 chars |
| `cookingLevel` | `cookingLevel` | String | No change, enum values |
| `favorites` | `favorites` | Array[String] | Array of recipe IDs |
| `viewedRecipes` | `viewedRecipes` | Array[String] | Array of recipe IDs |
| â€” | `tokenVersion` | Number | **NEW:** Default 0, for session invalidation |
| â€” | `timezone` | String | **NEW:** Default 'UTC', for stats aggregation |
| â€” | `createdAt` | Date | **NEW:** Auto-generated on import |
| â€” | `updatedAt` | Date | **NEW:** Auto-managed |

### Migration Rules

1. **Password Hashing:** All passwords must be hashed using bcrypt (10 rounds) before storing in MongoDB. Current localStorage stores plain text passwords.
2. **ID Preservation:** Use existing `id` field as MongoDB `_id` to maintain foreign key relationships.
3. **Timestamp Conversion:** Ensure `joinedDate` and `lastActive` are valid ISO 8601 strings.
4. **Defaults:** Set `tokenVersion: 0` and `timezone: 'UTC'` for all imported users.

---

## 2. Recipes Collection

### localStorage Structure

**Storage Key:** `cookhub_recipes`

**Schema Reference:** `SEED_DATA.recipes` in `src/lib/storage.js` (lines 259-558)

### MongoDB Collection Schema

**Collection Name:** `recipes`

**Mongoose Schema:**
```typescript
import mongoose, { Schema } from 'mongoose';

export interface IRecipe {
  id: string;
  title: string;
  description: string;
  category: string;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  instructions: string[];
  images: string[];
  authorId: string;
  author?: {
    id: string;
    username: string;
    avatar: string;
  };
  status: 'published' | 'pending' | 'rejected';
  createdAt: string;
  likedBy: string[]; // Array of user IDs
  viewedBy: string[]; // Array of user IDs (NOT guests)
  likeCount: number; // Denormalized for performance
  viewCount: number; // Denormalized for performance
  averageRating: number; // Denormalized for performance
  reviewCount: number; // Denormalized for performance
}

const RecipeSchema = new Schema<IRecipe>({
  _id: { type: String, required: true },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  category: { type: String, required: true },
  prepTime: { type: Number, required: true, min: 0 },
  cookTime: { type: Number, required: true, min: 0 },
  servings: { type: Number, required: true, min: 1 },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  ingredients: [{
    name: { type: String, required: true },
    quantity: { type: String, required: true },
    unit: { type: String, default: '' }
  }],
  instructions: [{ type: String, required: true }],
  images: [String],
  authorId: { type: String, required: true, ref: 'users' },
  author: {
    id: { type: String },
    username: { type: String },
    avatar: { type: String }
  },
  status: {
    type: String,
    enum: ['published', 'pending', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: String, required: true },
  likedBy: [{ type: String, ref: 'users' }],
  viewedBy: [{ type: String, ref: 'users' }],
  likeCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 }
}, {
  _id: false,
  timestamps: true
});

// Indexes
RecipeSchema.index({ authorId: 1 });
RecipeSchema.index({ status: 1 });
RecipeSchema.index({ category: 1 });
RecipeSchema.index({ difficulty: 1 });
RecipeSchema.index({ createdAt: -1 });
RecipeSchema.index({ title: 'text', description: 'text' }); // Full-text search

export default mongoose.model<IRecipe>('recipes', RecipeSchema);
```

### Field Mapping

| localStorage Field | MongoDB Field | Type | Notes |
|-------------------|---------------|------|-------|
| `id` | `_id` | String | Primary key |
| `title` | `title` | String | No change, text-searchable |
| `description` | `description` | String | No change, text-searchable |
| `category` | `category` | String | No change, indexed |
| `prepTime` | `prepTime` | Number | No change (minutes) |
| `cookTime` | `cookTime` | Number | No change (minutes) |
| `servings` | `servings` | Number | No change |
| `difficulty` | `difficulty` | String | No change, enum values |
| `ingredients[]` | `ingredients[]` | Array | No change structure |
| `instructions[]` | `instructions[]` | Array[String] | No change |
| `images[]` | `images[]` | Array[String] | No change (URLs) |
| `authorId` | `authorId` | String | No change, foreign key to users |
| â€” | `author` | Object | **NEW:** Denormalized author info (populated) |
| `status` | `status` | String | No change, enum values, indexed |
| `createdAt` | `createdAt` | String | No change (ISO 8601), indexed |
| `likedBy[]` | `likedBy[]` | Array[String] | No change (user IDs) |
| `viewedBy[]` | `viewedBy[]` | Array[String] | No change (user IDs only, NOT guests) |
| â€” | `likeCount` | Number | **NEW:** Denormalized count |
| â€” | `viewCount` | Number | **NEW:** Denormalized count |
| â€” | `averageRating` | Number | **NEW:** Denormalized, 0-5 |
| â€” | `reviewCount` | Number | **NEW:** Denormalized count |

### Migration Rules

1. **ID Preservation:** Use existing `id` field as MongoDB `_id`.
2. **Denormalized Counts:** Calculate `likeCount`, `viewCount`, `averageRating`, and `reviewCount` from arrays and reviews during import.
3. **Author Population:** `author` field should be populated from user collection based on `authorId`.
4. **Guest Views:** Ensure `viewedBy` contains only user IDs (no guest IDs like `guest-xxx`).

---

## 3. Reviews Collection

### localStorage Structure

**Storage Key:** `cookhub_reviews`

**Schema Reference:** Inferred from `storage.getReviews()`, `storage.addReview()` in `src/lib/storage.js` (lines 667-753)

### MongoDB Collection Schema

**Collection Name:** `reviews`

**Mongoose Schema:**
```typescript
import mongoose, { Schema } from 'mongoose';

export interface IReview {
  id: string;
  recipeId: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    avatar: string;
  };
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  updatedAt: string;
}

const ReviewSchema = new Schema<IReview>({
  _id: { type: String, required: true },
  recipeId: { type: String, required: true, ref: 'recipes' },
  userId: { type: String, required: true, ref: 'users' },
  user: {
    id: { type: String },
    username: { type: String },
    avatar: { type: String }
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000
  },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, {
  _id: false,
  timestamps: true
});

// Indexes
ReviewSchema.index({ recipeId: 1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ recipeId: 1, userId: 1 }, { unique: true }); // One review per user per recipe
ReviewSchema.index({ createdAt: -1 });

export default mongoose.model<IReview>('reviews', ReviewSchema);
```

### Field Mapping

| localStorage Field | MongoDB Field | Type | Notes |
|-------------------|---------------|------|-------|
| `id` | `_id` | String | Primary key (format: `review-{timestamp}`) |
| `recipeId` | `recipeId` | String | Foreign key to recipes |
| `userId` | `userId` | String | Foreign key to users |
| â€” | `user` | Object | **NEW:** Denormalized user info |
| `rating` | `rating` | Number | No change (1-5) |
| `comment` | `comment` | String | No change |
| `createdAt` | `createdAt` | String | No change (ISO 8601) |
| â€” | `updatedAt` | String | **NEW:** Track review updates |

### Migration Rules

1. **Unique Constraint:** One review per user per recipe. During import, if duplicates exist, keep the newest.
2. **User Population:** `user` field should be populated from user collection.
3. **Recipe Updates:** After importing reviews, update recipe `averageRating` and `reviewCount` fields.

---

## 4. Search History Collection

### localStorage Structure

**Storage Key:** `cookhub_search_history`

**Schema Reference:** Inferred from `storage.getSearchHistory()`, `storage.addSearchHistory()` in `src/lib/storage.js` (lines 673-735)

### MongoDB Collection Schema

**Collection Name:** `search_history`

**Mongoose Schema:**
```typescript
import mongoose, { Schema } from 'mongoose';

export interface ISearchHistory {
  id: string;
  userId: string;
  query: string;
  createdAt: string;
}

const SearchHistorySchema = new Schema<ISearchHistory>({
  _id: { type: String, required: true },
  userId: { type: String, required: true, ref: 'users' },
  query: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  createdAt: { type: String, required: true }
}, {
  _id: false,
  timestamps: true
});

// Indexes
SearchHistorySchema.index({ userId: 1, createdAt: -1 });
SearchHistorySchema.index({ userId: 1, query: 1 }); // For duplicate detection

export default mongoose.model<ISearchHistory>('search_history', SearchHistorySchema);
```

### Field Mapping

| localStorage Field | MongoDB Field | Type | Notes |
|-------------------|---------------|------|-------|
| `id` | `_id` | String | Primary key (format: `search-{timestamp}`) |
| `userId` | `userId` | String | Foreign key to users (guest IDs NOT stored) |
| `query` | `query` | String | No change (trimmed search term) |
| `createdAt` | `createdAt` | String | No change (ISO 8601) |

### Migration Rules

1. **Guest Exclusion:** Do NOT import search history for guest IDs (starting with `guest-`). Only import for registered users.
2. **Deduplication:** During import, remove duplicate (userId, query) pairs, keeping newest.
3. **Limit Enforcement:** After import, limit each user to 10 most recent searches.

---

## 5. Daily Stats Collection

### localStorage Structure

**Storage Key:** `cookhub_daily_stats`

**Schema Reference:** Inferred from `storage.getDailyStats()`, `storage.recordActiveUser()`, `storage.recordNewUser()` in `src/lib/storage.js` (lines 909-951)

### MongoDB Collection Schema

**Collection Name:** `daily_stats`

**Mongoose Schema:**
```typescript
import mongoose, { Schema } from 'mongoose';

export interface IDailyStats {
  date: string; // YYYY-MM-DD format
  newUsers: string[]; // Array of user IDs
  newContributors: string[]; // Array of user IDs (non-admin)
  activeUsers: string[]; // Array of user IDs (NOT guests)
  views: Array<{
    viewerKey: string; // User ID only (NOT guest IDs)
    viewerType: 'user'; // Only 'user' type stored
    recipeId: string;
    viewedAt: string; // ISO 8601
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DailyStatsSchema = new Schema<IDailyStats>({
  date: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  newUsers: [{ type: String, ref: 'users' }],
  newContributors: [{ type: String, ref: 'users' }],
  activeUsers: [{ type: String, ref: 'users' }],
  views: [{
    viewerKey: { type: String, required: true },
    viewerType: { type: String, enum: ['user'], required: true },
    recipeId: { type: String, required: true, ref: 'recipes' },
    viewedAt: { type: String, required: true }
  }]
}, {
  timestamps: true
});

// Indexes
DailyStatsSchema.index({ date: 1 }, { unique: true });
DailyStatsSchema.index({ 'views.recipeId': 1 });
DailyStatsSchema.index({ 'views.viewedAt': -1 });

export default mongoose.model<IDailyStats>('daily_stats', DailyStatsSchema);
```

### Field Mapping

| localStorage Field | MongoDB Field | Type | Notes |
|-------------------|---------------|------|-------|
| (date key) | `date` | String | **CHANGE:** Use object key as `date` field |
| `newUsers[]` | `newUsers[]` | Array[String] | No change (user IDs only) |
| `newContributors[]` | `newContributors[]` | Array[String] | No change (user IDs only) |
| `activeUsers[]` | `activeUsers[]` | Array[String] | No change (user IDs only, NOT guests) |
| `views[]` | `views[]` | Array | No change structure |
| `views[].viewerKey` | `views[].viewerKey` | String | No change (user ID only, NOT guests) |
| `views[].viewerType` | `views[].viewerType` | String | Only 'user' stored (guest views excluded) |
| `views[].recipeId` | `views[].recipeId` | String | No change |
| `views[].viewedAt` | `views[].viewedAt` | String | No change (ISO 8601) |
| â€” | `createdAt` | Date | **NEW:** Auto-managed |
| â€” | `updatedAt` | Date | **NEW:** Auto-managed |

### Migration Rules

1. **Date Conversion:** localStorage uses object with date keys; MongoDB uses one document per date with `date` field.
2. **Guest Exclusion:** Ensure NO guest IDs in any arrays (newUsers, newContributors, activeUsers, views).
3. **Array Deduplication:** Remove duplicate user IDs from each array during import.

---

## 6. Activity Logs Collection

### localStorage Structure

**Storage Key:** `cookhub_activity`

**Schema Reference:** Inferred from `storage.addActivity()`, `storage.getRecentActivity()` in `src/lib/storage.js` (lines 982-1001)

### MongoDB Collection Schema

**Collection Name:** `activity_logs`

**Mongoose Schema:**
```typescript
import mongoose, { Schema } from 'mongoose';

export interface IActivityLog {
  id: string;
  type: 'user' | 'recipe' | 'review';
  text: string;
  time: string; // ISO 8601
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  _id: { type: String, required: true },
  type: {
    type: String,
    enum: ['user', 'recipe', 'review'],
    required: true
  },
  text: { type: String, required: true, maxlength: 500 },
  time: { type: String, required: true }
}, {
  _id: false,
  timestamps: true
});

// Indexes
ActivityLogSchema.index({ time: -1 });
ActivityLogSchema.index({ type: 1 });

export default mongoose.model<IActivityLog>('activity_logs', ActivityLogSchema);
```

### Field Mapping

| localStorage Field | MongoDB Field | Type | Notes |
|-------------------|---------------|------|-------|
| `id` | `_id` | String | Primary key (format: `activity-{timestamp}-{random}`) |
| `type` | `type` | String | No change, enum values |
| `text` | `text` | String | No change |
| `time` | `time` | String | No change (ISO 8601), indexed |
| â€” | `createdAt` | Date | **NEW:** Auto-managed |

### Migration Rules

1. **ID Preservation:** Preserve existing IDs (format: `activity-{timestamp}-{random}`).
2. **Time Conversion:** Ensure `time` field is valid ISO 8601.
3. **Retention:** Activity logs older than 6 months should be archived/deleted post-migration.

---

## 7. Current User Session (Not Migrated)

### localStorage Structure

**Storage Key:** `cookhub_current_user`

**Schema Reference:** `storage.getCurrentUser()`, `storage.setCurrentUser()` in `src/lib/storage.js` (lines 623-627)

### Migration Decision

**NOT MIGRATED TO MONGODB**

**Rationale:**
- Current user session is client-side state only
- Backend uses JWT tokens for session management
- No persistent storage needed for active sessions

**Handling:**
- During migration, ignore `cookhub_current_user` localStorage entries
- Users will re-authenticate after cutover
- Existing sessions will expire naturally

---

## 8. Guest ID (Not Migrated)

### localStorage Structure

**Storage Key:** `cookhub_guest_id`

**Schema Reference:** `storage.getOrCreateGuestId()` in `src/lib/storage.js` (lines 629-635)

### Migration Decision

**NOT MIGRATED TO MONGODB**

**Rationale:**
- Guest IDs are ephemeral, client-side only
- Per requirements, guest activity is NOT tracked in analytics
- No need for persistent guest ID storage on backend

**Handling:**
- Continue using `localStorage` for guest ID persistence
- Guest ID passed via `X-Guest-ID` header in API requests
- Backend identifies guests by ID prefix (`guest-*`)

---

## Import Script Implementation

### Script Location

```
Project2/kitchen-odyssey-backend/scripts/import-localstorage-snapshot.js
```

### Usage

```bash
# Dry run (no changes made)
npm run import:dry-run -- --snapshot=./snapshot.json

# Actual import
npm run import -- --snapshot=./snapshot.json

# Import with rollback file generation
npm run import -- --snapshot=./snapshot.json --rollback=./rollback-batch-1.json
```

### Snapshot Format

The import script expects a JSON file with the following structure:

```json
{
  "users": [
    { "id": "user-1", "username": "John Doe", ... }
  ],
  "recipes": [
    { "id": "recipe-1", "title": "Spaghetti Carbonara", ... }
  ],
  "reviews": [
    { "id": "review-1", "recipeId": "recipe-1", "userId": "user-1", ... }
  ],
  "search_history": [
    { "id": "search-1", "userId": "user-1", "query": "pasta", ... }
  ],
  "daily_stats": {
    "2026-02-17": {
      "newUsers": ["user-1"],
      "activeUsers": ["user-1", "user-2"],
      "views": [...]
    }
  },
  "activity": [
    { "id": "activity-1", "type": "user", "text": "...", ... }
  ],
  "exportedAt": "2026-02-17T12:00:00Z"
}
```

### Export Script (Frontend)

To export localStorage data for migration:

```javascript
// scripts/export-localstorage.js
function exportLocalStorage() {
  const snapshot = {
    users: JSON.parse(localStorage.getItem('cookhub_users') || '[]'),
    recipes: JSON.parse(localStorage.getItem('cookhub_recipes') || '[]'),
    reviews: JSON.parse(localStorage.getItem('cookhub_reviews') || '[]'),
    search_history: JSON.parse(localStorage.getItem('cookhub_search_history') || '[]'),
    daily_stats: JSON.parse(localStorage.getItem('cookhub_daily_stats') || '{}'),
    activity: JSON.parse(localStorage.getItem('cookhub_activity') || '[]'),
    exportedAt: new Date().toISOString()
  };

  return JSON.stringify(snapshot, null, 2);
}

// Download as file
function downloadSnapshot() {
  const snapshot = exportLocalStorage();
  const blob = new Blob([snapshot], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kitchen-odyssey-snapshot-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Validation Checks

### Pre-Import Validation

1. **User Passwords:** Verify all users have passwords (not empty/undefined)
2. **Email Format:** Validate all emails match regex pattern
3. **ID Consistency:** Verify all foreign key references exist
   - `recipes.authorId` â†’ `users.id`
   - `reviews.recipeId` â†’ `recipes.id`
   - `reviews.userId` â†’ `users.id`
4. **Guest Exclusion:** Verify NO guest IDs in:
   - `recipes.viewedBy`
   - `daily_stats.activeUsers`
   - `daily_stats.views`
5. **Timestamp Format:** Verify all ISO 8601 strings are valid

### Post-Import Validation

1. **Record Counts:**
   ```javascript
   localStorage.users.length === MongoDB.users.count()
   localStorage.recipes.length === MongoDB.recipes.count()
   ```

2. **Data Integrity:**
   ```javascript
   // Verify user passwords are hashed
   all users.password.length === 60 // bcrypt hash length

   // Verify denormalized counts
   recipe.likeCount === recipe.likedBy.length
   recipe.viewCount === recipe.viewedBy.length
   ```

3. **Index Verification:**
   ```javascript
   // Check indexes are created
   db.users.getIndexes()
   db.recipes.getIndexes()
   db.reviews.getIndexes()
   ```

---

## Rollback Strategy

### Rollback File Format

```json
{
  "batchId": "batch-1",
  "timestamp": "2026-02-17T12:00:00Z",
  "collections": {
    "users": { "inserted": ["user-1", "user-2"], "modified": [] },
    "recipes": { "inserted": ["recipe-1"], "modified": [] }
  }
}
```

### Rollback Script

```bash
# Rollback a specific batch
npm run rollback -- --batch=./rollback-batch-1.json
```

The rollback script will:
1. Delete all documents inserted in the batch
2. Does NOT restore modified documents (requires full backup)
3. Log rollback actions for audit trail

---

## Data Transformation Summary

| Transformation Type | Description |
|---------------------|-------------|
| Password Hashing | Plain text â†’ bcrypt (10 rounds) |
| Guest ID Exclusion | Remove all `guest-*` IDs from analytics |
| ID as Primary Key | Use existing `id` as MongoDB `_id` |
| Denormalized Counts | Calculate counts from arrays during import |
| Date Object â†’ String | localStorage date keys â†’ `date` field |
| Session State | Not migrated (JWT-based auth) |
| Guest Persistence | Not migrated (continue using localStorage) |

---

## Post-Migration Cleanup

After successful migration and verification:

1. **Frontend:** Keep `localStorage` code paths for fallback (first 2 weeks)
2. **Frontend:** Remove `localStorage` write operations after stability confirmed
3. **Frontend:** Remove `localStorage` read operations after 2 stable releases
4. **Backend:** Implement activity log archival (delete logs > 6 months old)
5. **Monitoring:** Set up alerts for MongoDB storage usage (80% capacity)

---

## Related Documents

- `../architecture-nextjs-mongodb-migration-1.md` - Main migration plan
- `api-contract-specification-1.md` - API endpoint contracts
- `security-considerations-1.md` - NoSQL injection prevention
- `testing-strategy-1.md` - Migration testing approach
- `../../src/lib/storage.js` - Current localStorage implementation


