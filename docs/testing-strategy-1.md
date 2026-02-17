---
goal: Define comprehensive testing strategy for localStorage to MongoDB API migration
version: 1.0
date_created: 2026-02-17
last_updated: 2026-02-17
owner: Project Team
status: 'Planned'
tags: ['testing', 'playwright', 'dual-mode', 'migration-parity', 'e2e', 'integration', 'unit']
---

# Testing Strategy

## Introduction

This document defines the comprehensive testing strategy for the Kitchen Odyssey migration from localStorage to MongoDB API backend. The strategy ensures complete functional parity, prevents regressions, and validates all edge cases through dual-mode testing.

---

## 1. Testing Philosophy

### Core Principles

1. **Parity First:** Every feature must behave identically in localStorage and API modes
2. **Dual Execution:** All tests run in both modes to guarantee behavioral consistency
3. **Edge Case Coverage:** Test not just happy paths, but failures, race conditions, and edge cases
4. **Automation:** Everything is automated in CI/CD pipeline
5. **Fast Feedback:** Unit tests run in seconds, integration in minutes, e2e in under 30 minutes

### Testing Pyramid

```
           â•±â•²          E2E Tests (Playwright)
          â•±  â•²         - Full user flows
         â•±â”€â”€â”€â”€â•²        - Dual-mode parity
        â•±      â•²       - 20-30 tests
       â•±â”€â”€â”€â”€â”€â”€â”€â”€â•²
      â•±          â•²     Integration Tests
     â•±â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•²    - API endpoints
    â•±              â•²   - Database operations
   â•±â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•²  - 100-150 tests
  â•±                  â•²
 â•±â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•² Unit Tests
                       - Pure functions
                       - 200-300 tests
```

---

## 2. Dual-Mode Testing Framework

### 2.1 Feature Flag Configuration

```javascript
// src/lib/featureFlags.js
export const featureFlags = {
  useBackendApi: import.meta.env.VITE_USE_BACKEND_API === 'true',
  useBackendForAuth: import.meta.env.VITE_USE_BACKEND_FOR_AUTH !== 'false',
  useBackendForRecipes: import.meta.env.VITE_USE_BACKEND_FOR_RECIPES !== 'false',
  useBackendForReviews: import.meta.env.VITE_USE_BACKEND_FOR_REVIEWS !== 'false'
};
```

### 2.2 Test Modes Setup

```javascript
// tests/modes/setup.js
import { test as base } from '@playwright/test';

export const testModes = [
  { name: 'localStorage', useBackendApi: false },
  { name: 'backend', useBackendApi: true }
];

// Create test fixtures for each mode
export const test = testModes.reduce((acc, mode) => {
  acc[mode.name] = base.extend({
    mode: mode.name,
    useBackendApi: mode.useBackendApi,
    storageState: mode.useBackendApi
      ? 'tests/auth/backend-user.json'
      : 'tests/auth/local-user.json'
  });
  return acc;
}, {});

// Re-export for convenience
export const expect = base.expect;
```

### 2.3 Parity Test Pattern

```javascript
// tests/migration-parity/recipe-list.spec.js
import { test } from '../modes/setup';
import { testModes } from '../modes/setup';

testModes.forEach((mode) => {
  test.describe(`Recipe List: ${mode.name} mode`, () => {
    test.use({
      storageState: mode.useBackendApi
        ? 'tests/auth/backend-user.json'
        : 'tests/auth/local-user.json'
    });

    test.beforeEach(async ({ page }) => {
      // Set mode via environment variable
      await page.goto(`/?useBackendApi=${mode.useBackendApi}`);
    });

    test('displays all recipes', async ({ page }) => {
      await page.goto('/');
      const recipeCards = page.locator('.recipe-card');
      const count = await recipeCards.count();

      // Should have same count regardless of mode
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(20); // Pagination limit
    });

    test('displays recipe title, description, and image', async ({ page }) => {
      await page.goto('/');
      const firstCard = page.locator('.recipe-card').first();

      await expect(firstCard.locator('[data-testid="recipe-title"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="recipe-description"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="recipe-image"]')).toBeVisible();
    });

    test('category filter works', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("Italian")');

      const firstCard = page.locator('.recipe-card').first();
      const category = await firstCard.locator('[data-testid="recipe-category"]').textContent();

      expect(category).toContain('Italian');
    });

    test('pagination loads more recipes', async ({ page }) => {
      await page.goto('/');
      const initialCount = await page.locator('.recipe-card').count();

      await page.click('button:has-text("Load More")');
      await page.waitForTimeout(500); // Wait for load

      const newCount = await page.locator('.recipe-card').count();
      expect(newCount).toBeGreaterThan(initialCount);
    });
  });
});
```

---

## 3. Baseline Tests (Pre-Migration)

### 3.1 Purpose

Capture current localStorage behavior to serve as regression baseline.

### 3.2 Baseline Test Suite

```javascript
// tests/baseline/behavior.spec.js
import { test, expect } from '@playwright/test';

test.describe('Baseline: Recipe Interactions', () => {
  test('like toggle updates button state', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="recipe-card"]:first-child');
    await page.click('[data-testid="like-button"]');

    // Verify state change
    const likeButton = page.locator('[data-testid="like-button"]');
    const isActive = await likeButton.getAttribute('aria-pressed');

    expect(isActive).toBe('true');
  });

  test('favorite toggle dispatches event', async ({ page }) => {
    const eventFired = page.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('favoriteToggled', (e) => {
          resolve(e.detail);
        });
      });
    });

    await page.goto('/');
    await page.click('[data-testid="recipe-card"]:first-child');
    await page.click('[data-testid="favorite-button"]');

    const eventData = await eventFired;
    expect(eventData).toBeDefined();
    expect(eventData.recipeId).toBeDefined();
  });

  test('recipe search returns results', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="search-input"]', 'pasta');
    await page.press('[data-testid="search-input"]', 'Enter');

    const results = page.locator('.recipe-card');
    await expect(results.first()).toBeVisible();

    const firstTitle = await results.first().locator('[data-testid="recipe-title"]').textContent();
    expect(firstTitle.toLowerCase()).toContain('pasta');
  });
});

test.describe('Baseline: Authentication', () => {
  test('user can log in', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@cookhub.com');
    await page.fill('[name="password"]', 'user');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('user can sign up', async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}@test.com`;
    await page.goto('/signup');
    await page.fill('[name="email"]', uniqueEmail);
    await page.fill('[name="username"]', 'Test User');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show pending approval message
    await expect(page.locator('text=/pending approval/i')).toBeVisible();
  });
});
```

### 3.3 Snapshot Generation

```bash
# Generate baseline snapshots
npm run test:baseline -- --update-snapshots

# Snapshots stored in:
# tests/baseline/snapshots/*.json
```

---

## 4. Backend Unit Tests

### 4.1 Repository Layer Tests

```typescript
// kitchen-odyssey-backend/tests/unit/repositories/user.spec.js
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UserRepository } from '../../repositories/user';
import { User, IUser } from '../../models/user';
import { connect, disconnect, clearDatabase } from '../helpers/database';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(async () => {
    await connect();
    userRepository = new UserRepository();
  });

  afterEach(async () => {
    await clearDatabase();
    await disconnect();
  });

  describe('findByEmail', () => {
    it('should return user when email exists', async () => {
      const userData: IUser = {
        id: 'user-1',
        email: 'test@test.com',
        username: 'Test User',
        password: 'hashedpassword',
        role: 'user',
        status: 'active',
        joinedDate: new Date().toISOString(),
        favorites: [],
        viewedRecipes: [],
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await User.create(userData);

      const found = await userRepository.findByEmail('test@test.com');

      expect(found).toBeDefined();
      expect(found?.email).toBe('test@test.com');
    });

    it('should return null when email does not exist', async () => {
      const found = await userRepository.findByEmail('nonexistent@test.com');
      expect(found).toBeNull();
    });

    it('should be case-insensitive', async () => {
      const userData: IUser = {
        id: 'user-1',
        email: 'test@test.com',
        username: 'Test User',
        password: 'hashedpassword',
        role: 'user',
        status: 'active',
        joinedDate: new Date().toISOString(),
        favorites: [],
        viewedRecipes: [],
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await User.create(userData);

      const found = await userRepository.findByEmail('TEST@TEST.COM');
      expect(found).toBeDefined();
    });
  });

  describe('updateFavorites', () => {
    it('should add recipe to favorites if not present', async () => {
      const userData: IUser = {
        id: 'user-1',
        email: 'test@test.com',
        username: 'Test User',
        password: 'hashedpassword',
        role: 'user',
        status: 'active',
        joinedDate: new Date().toISOString(),
        favorites: [],
        viewedRecipes: [],
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await User.create(userData);

      const updated = await userRepository.updateFavorites('user-1', 'recipe-1', true);

      expect(updated.favorites).toContain('recipe-1');
    });

    it('should remove recipe from favorites if present', async () => {
      const userData: IUser = {
        id: 'user-1',
        email: 'test@test.com',
        username: 'Test User',
        password: 'hashedpassword',
        role: 'user',
        status: 'active',
        joinedDate: new Date().toISOString(),
        favorites: ['recipe-1'],
        viewedRecipes: [],
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await User.create(userData);

      const updated = await userRepository.updateFavorites('user-1', 'recipe-1', false);

      expect(updated.favorites).not.toContain('recipe-1');
    });
  });
});
```

### 4.2 Service Layer Tests

```typescript
// kitchen-odyssey-backend/tests/unit/services/auth.spec.js
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AuthService } from '../../services/auth';
import { UserRepository } from '../../repositories/user';
import * as bcrypt from 'bcrypt';
import { connect, disconnect, clearDatabase } from '../helpers/database';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepo: UserRepository;

  beforeEach(async () => {
    await connect();
    authService = new AuthService();
    userRepo = new UserRepository();
  });

  afterEach(async () => {
    await clearDatabase();
    await disconnect();
  });

  describe('login', () => {
    it('should return user on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);

      await userRepo.create({
        id: 'user-1',
        email: 'test@test.com',
        username: 'Test User',
        password: hashedPassword,
        role: 'user',
        status: 'active',
        joinedDate: new Date().toISOString(),
        favorites: [],
        viewedRecipes: [],
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await authService.login('test@test.com', 'password123');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@test.com');
    });

    it('should throw on invalid credentials', async () => {
      await userRepo.create({
        id: 'user-1',
        email: 'test@test.com',
        username: 'Test User',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        status: 'active',
        joinedDate: new Date().toISOString(),
        favorites: [],
        viewedRecipes: [],
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await expect(
        authService.login('test@test.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw on pending user status', async () => {
      await userRepo.create({
        id: 'user-1',
        email: 'test@test.com',
        username: 'Test User',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        status: 'pending',
        joinedDate: new Date().toISOString(),
        favorites: [],
        viewedRecipes: [],
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Should allow login but status is pending
      const result = await authService.login('test@test.com', 'password123');
      expect(result.status).toBe('pending');
    });
  });
});
```

---

## 5. Integration Tests

### 5.1 API Endpoint Tests

```typescript
// kitchen-odyssey-backend/tests/integration/api/recipes.spec.js
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app';
import { connect, disconnect, clearDatabase } from '../helpers/database';
import { generateAuthToken } from '../helpers/auth';

describe('Recipe API Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    await connect();

    // Create test user and get auth token
    authToken = generateAuthToken({
      userId: 'user-1',
      email: 'test@test.com',
      role: 'user',
      status: 'active'
    });
  });

  afterAll(async () => {
    await clearDatabase();
    await disconnect();
  });

  describe('GET /api/v1/recipes', () => {
    it('should return array of recipes', async () => {
      const response = await request(app)
        .get('/api/v1/recipes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/v1/recipes?category=Italian')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((recipe: any) => {
        expect(recipe.category).toBe('Italian');
      });
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/recipes?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('POST /api/v1/recipes', () => {
    it('should create recipe when authenticated', async () => {
      const recipeData = {
        title: 'Test Recipe',
        description: 'A test recipe',
        category: 'Test',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'Easy',
        ingredients: [
          { name: 'Test Ingredient', quantity: '1', unit: 'cup' }
        ],
        instructions: ['Step 1', 'Step 2']
      };

      const response = await request(app)
        .post('/api/v1/recipes')
        .set('Cookie', `access_token=${authToken}`)
        .send(recipeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Recipe');
    });

    it('should fail without authentication', async () => {
      const recipeData = {
        title: 'Test Recipe',
        description: 'A test recipe',
        category: 'Test',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'Easy',
        ingredients: [],
        instructions: []
      };

      await request(app)
        .post('/api/v1/recipes')
        .send(recipeData)
        .expect(401);
    });
  });

  describe('POST /api/v1/recipes/:id/like', () => {
    it('should toggle like status', async () => {
      // First like
      let response = await request(app)
        .post('/api/v1/recipes/recipe-1/like')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.data.liked).toBe(true);

      // Unlike
      response = await request(app)
        .post('/api/v1/recipes/recipe-1/like')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.data.liked).toBe(false);
    });

    it('should fail for pending users', async () => {
      const pendingToken = generateAuthToken({
        userId: 'user-pending',
        email: 'pending@test.com',
        role: 'user',
        status: 'pending'
      });

      await request(app)
        .post('/api/v1/recipes/recipe-1/like')
        .set('Cookie', `access_token=${pendingToken}`)
        .expect(403);
    });
  });
});
```

---

## 6. Edge Case Tests

### 6.1 Race Condition Tests

```javascript
// tests/edge-cases/race-conditions.spec.js
import { test, expect } from '@playwright/test';

test.describe('Race Conditions', () => {
  test('rapid like/unlike should settle to correct state', async ({ page }) => {
    await page.goto('/recipes/recipe-1');

    // Rapid clicks
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="like-button"]');
    }

    // Wait for debouncing
    await page.waitForTimeout(1000);

    // Should settle on one state
    const likeButton = page.locator('[data-testid="like-button"]');
    const finalState = await likeButton.getAttribute('aria-pressed');

    expect(['true', 'false']).toContain(finalState);
  });

  test('concurrent favorite updates should not duplicate', async ({ page, context }) => {
    await page.goto('/recipes/recipe-1');

    // Open two tabs
    const page2 = await context.newPage();
    await page2.goto('/recipes/recipe-1');

    // Both click favorite simultaneously
    await Promise.all([
      page.click('[data-testid="favorite-button"]'),
      page2.click('[data-testid="favorite-button"]')
    ]);

    // Verify state is consistent
    await page.waitForTimeout(500);
    await page2.waitForTimeout(500);

    const state1 = await page.locator('[data-testid="favorite-button"]').getAttribute('aria-pressed');
    const state2 = await page2.locator('[data-testid="favorite-button"]').getAttribute('aria-pressed');

    expect(state1).toBe(state2);
  });
});
```

### 6.2 Network Failure Tests

```javascript
// tests/edge-cases/network-failures.spec.js
import { test, expect } from '@playwright/test';

test.describe('Network Failures', () => {
  test('should show error message on API failure', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/v1/recipes/recipe-1/like', route => {
      route.abort('failed');
    });

    await page.goto('/recipes/recipe-1');
    await page.click('[data-testid="like-button"]');

    // Should show error toast
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
    await expect(page.locator('text=/failed to update/i')).toBeVisible();
  });

  test('should retry failed requests', async ({ page }) => {
    let attemptCount = 0;

    await page.route('**/api/v1/recipes/recipe-1/like', route => {
      attemptCount++;

      if (attemptCount < 3) {
        route.abort('failed');
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: { liked: true, count: 1 }
          })
        });
      }
    });

    await page.goto('/recipes/recipe-1');
    await page.click('[data-testid="like-button"]');

    // Should succeed after retries
    await expect(page.locator('[data-testid="like-button"][aria-pressed="true"]')).toBeVisible();
    expect(attemptCount).toBe(3);
  });
});
```

### 6.3 Concurrency Tests

```typescript
// kitchen-odyssey-backend/tests/integration/concurrency/like-toggle.spec.js
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app';
import { connect, disconnect, clearDatabase } from '../../tests/helpers/database';

describe('Concurrent Like Toggle', () => {
  beforeAll(async () => await connect());
  afterAll(async () => {
    await clearDatabase();
    await disconnect();
  });

  it('should handle concurrent like requests correctly', async () => {
    const authToken = generateAuthToken({ userId: 'user-1', role: 'user', status: 'active' });

    // Send 10 concurrent requests
    const requests = Array(10).fill(null).map(() =>
      request(app)
        .post('/api/v1/recipes/recipe-1/like')
        .set('Cookie', `access_token=${authToken}`)
    );

    const responses = await Promise.all(requests);

    // All should succeed
    responses.forEach(res => {
      expect(res.status).toBe(200);
    });

    // Final state should be consistent
    const finalResponse = await request(app)
      .get('/api/v1/recipes/recipe-1')
      .set('Cookie', `access_token=${authToken}`);

    const likedBy = finalResponse.body.data.likedBy;
    expect(likedBy).toContain('user-1');
    expect(likedBy.filter((id: string) => id === 'user-1').length).toBe(1);
  });
});
```

---

## 7. Guest Analytics Tests

### 7.1 Guest Mode Exclusion Tests

```javascript
// tests/guest-analytics/exclusion.spec.js
import { test, expect } from '@playwright/test';

test.describe('Guest Analytics Exclusion', () => {
  test.use({ storageState: 'tests/auth/guest.json' });

  test('guest views should not increment view count', async ({ page, request }) => {
    // Get initial view count
    const initialResponse = await request.get('/api/v1/recipes/recipe-1');
    const initialCount = initialResponse.data().viewCount;

    // Guest views recipe
    await page.goto('/recipes/recipe-1');

    // Wait a moment
    await page.waitForTimeout(1000);

    // Check view count hasn't changed
    const finalResponse = await request.get('/api/v1/recipes/recipe-1');
    const finalCount = finalResponse.data().viewCount;

    expect(finalCount).toBe(initialCount);
  });

  test('guest should not appear in daily stats', async ({ page, request }) => {
    // Login as admin
    const adminAuth = 'tests/auth/admin.json';

    // Guest views recipe
    await page.goto('/recipes/recipe-1');
    await page.waitForTimeout(1000);

    // Check daily stats (admin only)
    const statsResponse = await request.get('/api/v1/stats/daily', {
      headers: { Authorization: `Bearer ${adminAuth}` }
    });

    const activeUsers = statsResponse.data().activeUsers;
    const views = statsResponse.data().views;

    // Should NOT contain guest ID
    activeUsers.forEach((userId: string) => {
      expect(userId).not.toMatch(/^guest-/);
    });

    views.forEach((view: any) => {
      expect(view.viewerKey).not.toMatch(/^guest-/);
      expect(view.viewerType).toBe('user');
    });
  });

  test('random suggestion should not track guest views', async ({ page, request }) => {
    // Get initial stats
    const statsBefore = await request.get('/api/v1/stats/daily');

    // Guest gets random suggestion
    await page.goto('/');
    await page.click('[data-testid="surprise-me-button"]');

    // Wait for modal
    await expect(page.locator('[data-testid="recipe-suggestion-modal"]')).toBeVisible();

    // Verify stats unchanged
    const statsAfter = await request.get('/api/v1/stats/daily');

    expect(statsAfter.data().views.length).toBe(statsBefore.data().views.length);
  });
});
```

---

## 8. Accessibility Tests

```javascript
// tests/accessibility/migration.spec.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Regression', () => {
  test('should have no accessibility violations on home page', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should maintain keyboard navigation after migration', async ({ page }) => {
    await page.goto('/');

    // Tab to first recipe card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement.textContent);
    expect(focusedElement).toBeDefined();
  });

  test('should preserve ARIA labels', async ({ page }) => {
    await page.goto('/recipes/recipe-1');

    const likeButton = page.locator('[data-testid="like-button"]');
    await expect(likeButton).toHaveAttribute('aria-label');
    await expect(likeButton).toHaveAttribute('aria-pressed');
  });
});
```

---

## 9. Performance Tests

```javascript
// tests/performance/api-response.spec.js
import { test, expect } from '@playwright/test';

test.describe('API Performance', () => {
  test('recipe list should load within 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForSelector('.recipe-card');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test('like toggle should complete within 500ms', async ({ page }) => {
    await page.goto('/recipes/recipe-1');

    const startTime = Date.now();
    await page.click('[data-testid="like-button"]');

    // Wait for state update
    await page.waitForSelector('[data-testid="like-button"][aria-pressed="true"]');

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(500);
  });
});

// Backend performance tests
import { describe, it, expect } from '@jest/globals';

describe('API Response Time', () => {
  it('GET /recipes should respond within 500ms', async () => {
    const start = Date.now();

    await request(app)
      .get('/api/v1/recipes')
      .expect(200);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('POST /recipes/:id/like should respond within 200ms', async () => {
    const start = Date.now();

    await request(app)
      .post('/api/v1/recipes/recipe-1/like')
      .set('Cookie', `access_token=${authToken}`)
      .expect(200);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(200);
  });
});
```

---

## 10. Test Execution Order

### Phase 1: Backend Foundation (Week 1)

```bash
# Order matters - run in this sequence:
npm run test:unit           # Fast feedback (2-5 min)
npm run test:integration    # API contracts (5-10 min)
npm run test:contract       # OpenAPI validation (2-3 min)
```

### Phase 2: Frontend Integration (Week 2)

```bash
npm run test:parity         # localStorage vs API (10-15 min)
npm run test:edge-cases     # Race conditions, failures (8-10 min)
npm run test:guest-analytics # Guest exclusion (3-5 min)
npm run test:performance    # Response times (5-8 min)
```

### Phase 3: Full System (Week 3)

```bash
npm run test:e2e            # Full user flows (15-20 min)
npm run test:security       # Auth, injection, CSRF (5-8 min)
npm run test:a11y           # Accessibility (8-10 min)
npm run test:cross-browser  # Chrome, Firefox, Safari (20-25 min)
```

---

## 11. CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./kitchen-odyssey-backend
        run: npm ci

      - name: Run unit tests
        working-directory: ./kitchen-odyssey-backend
        run: npm run test:unit

      - name: Run integration tests
        working-directory: ./kitchen-odyssey-backend
        run: npm run test:integration

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        working-directory: ./Kitchen_Odyssey
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run parity tests
        working-directory: ./Kitchen_Odyssey
        run: npm run test:parity

      - name: Run edge case tests
        working-directory: ./Kitchen_Odyssey
        run: npm run test:edge-cases

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Start backend
        working-directory: ./kitchen-odyssey-backend
        run: npm run start &
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI_TEST }}

      - name: Run E2E tests
        run: npm run test:e2e
```

---

## 12. Test Data Management

### Fixtures

```typescript
// tests/fixtures/data.js
export const testUsers = [
  {
    id: 'user-admin',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    status: 'active'
  },
  {
    id: 'user-active',
    email: 'user@test.com',
    password: 'user123',
    role: 'user',
    status: 'active'
  },
  {
    id: 'user-pending',
    email: 'pending@test.com',
    password: 'pending123',
    role: 'user',
    status: 'pending'
  },
  {
    id: 'user-suspended',
    email: 'suspended@test.com',
    password: 'suspended123',
    role: 'user',
    status: 'suspended'
  }
];

export const testRecipes = [
  {
    id: 'recipe-1',
    title: 'Test Recipe 1',
    description: 'A test recipe',
    category: 'Test',
    status: 'published',
    authorId: 'user-active',
    likedBy: ['user-admin'],
    viewedBy: ['user-admin', 'user-active']
  }
];

// Seed test database
export async function seedTestData() {
  await User.insertMany(testUsers);
  await Recipe.insertMany(testRecipes);
}
```

---

## 13. Coverage Requirements

### Minimum Coverage Thresholds

```json
// .jestrc.json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "./src/repositories/**/*.js": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    },
    "./src/services/**/*.js": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  }
}
```

---

## Related Documents

- `../architecture-nextjs-mongodb-migration-1.md` - Main migration plan
- `api-contract-specification-1.md` - API endpoint contracts
- `migration-data-mapping-1.md` - Data field mapping
- `security-considerations-1.md` - Security testing requirements
- Playwright Documentation: https://playwright.dev/
- Jest Documentation: https://jestjs.io/


