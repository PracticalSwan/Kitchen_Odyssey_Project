// @ts-check
import { test, expect } from '@playwright/test';

const BASE = '/recipe-sharing-system-deploy/';

/** Expected localStorage keys after initialization (keys created on app load) */
const INIT_KEYS = [
  'kitchen_odyssey_users',
  'kitchen_odyssey_recipes'
];

/** All possible keys (created on various actions) */
const ALL_KEYS = [
  'kitchen_odyssey_users',
  'kitchen_odyssey_recipes',
  'kitchen_odyssey_current_user',
  'kitchen_odyssey_guest_id',
  'kitchen_odyssey_reviews',
  'kitchen_odyssey_search_history',
  'kitchen_odyssey_daily_stats',
  'kitchen_odyssey_activity'
];

/** Old keys that should NOT exist */
const OLD_KEYS = [
  'cookhub_users',
  'cookhub_recipes',
  'cookhub_current_user',
  'cookhub_guest_id',
  'cookhub_reviews',
  'cookhub_search_history',
  'cookhub_daily_stats',
  'cookhub_activity'
];

test.describe('localStorage Key Migration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all localStorage BEFORE navigating to prevent stale data
    await page.goto(`${BASE}#/login`);
    await page.evaluate(() => {
      // Clear both old and new keys to ensure clean state
      Object.keys(localStorage).forEach(key => localStorage.removeItem(key));
    });
    // Reload to trigger fresh initialization
    await page.reload();
  });

  test('InitializationUsesNewKeys — app initializes with kitchen_odyssey_* prefix', async ({ page }) => {
    // Reload the page to trigger initialization
    await page.reload();
    await page.waitForTimeout(500);

    // Get all localStorage keys
    const keys = await page.evaluate(() => Object.keys(localStorage));

    // Check that new keys are present
    expect(keys).toContain('kitchen_odyssey_users');
    expect(keys).toContain('kitchen_odyssey_recipes');

    // Check that old keys are NOT present
    expect(keys).not.toContain('cookhub_users');
    expect(keys).not.toContain('cookhub_recipes');
  });

  test('NoOldKeysCreated — no cookhub_* keys exist after initialization', async ({ page }) => {
    await page.reload();
    await page.waitForTimeout(500);

    const keys = await page.evaluate(() => Object.keys(localStorage));

    // Verify none of the old keys exist
    OLD_KEYS.forEach(oldKey => {
      expect(keys).not.toContain(oldKey);
    });
  });

  test('InitKeysPresent — initialization creates kitchen_odyssey_users and kitchen_odyssey_recipes', async ({ page }) => {
    await page.reload();
    await page.waitForTimeout(500);

    const keys = await page.evaluate(() => Object.keys(localStorage));

    // Only check for keys created on initialization
    INIT_KEYS.forEach(expectedKey => {
      expect(keys).toContain(expectedKey);
    });
  });

  test('UsersDataStructure — seed data has correct email domains', async ({ page }) => {
    await page.reload();
    await page.waitForTimeout(500);

    const users = await page.evaluate(() => {
      const raw = localStorage.getItem('kitchen_odyssey_users');
      return raw ? JSON.parse(raw) : null;
    });

    expect(users).toBeTruthy();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);

    // Check admin emails use new domain
    const adminUsers = users.filter(u => u.role === 'admin');
    expect(adminUsers.length).toBeGreaterThan(0);

    adminUsers.forEach(admin => {
      expect(admin.email).toMatch(/@kitchenodyssey\.com$/);
    });

    // Verify no old @cookhub.com emails
    const oldEmails = users.filter(u => u.email.includes('@cookhub.com'));
    expect(oldEmails.length).toBe(0);
  });

  test('StorageKeyConstants — storage.js uses correct key names', async ({ page }) => {
    await page.reload();
    await page.waitForTimeout(500);

    // If we can't access the constant directly, verify by checking operations
    // Test that setting/getting uses new keys
    const testKey = 'kitchen_odyssey_users';
    const testData = await page.evaluate((key) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }, testKey);

    expect(testData).toBeTruthy();
    expect(Array.isArray(testData)).toBe(true);
  });
});

test.describe('Authentication with New Credentials', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each auth test - just clear, don't reload
    await page.goto(`${BASE}#/login`);
    await page.evaluate(() => {
      Object.keys(localStorage).forEach(key => localStorage.removeItem(key));
    });
    // Navigate again to trigger fresh initialization
    await page.goto(`${BASE}#/login`);
  });

  test('AdminLoginNewDomain — admin can login with @kitchenodyssey.com', async ({ page }) => {
    // Fill in new admin credentials
    await page.getByPlaceholder('admin@kitchenodyssey.com').fill('admin@kitchenodyssey.com');
    await page.getByPlaceholder('••••••').fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait for navigation to home (with timeout)
    await page.waitForURL(`**${BASE}#/`, { timeout: 5000 });

    // Verify logged in state
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    await expect(page.getByText('Guest')).not.toBeVisible();

    // Verify user is stored with new key
    const currentUser = await page.evaluate(() => {
      const raw = localStorage.getItem('kitchen_odyssey_current_user');
      return raw ? JSON.parse(raw) : null;
    });

    expect(currentUser).toBeTruthy();
    expect(currentUser.email).toBe('admin@kitchenodyssey.com');
    expect(currentUser.role).toBe('admin');
  });

  test('UserLoginNewDomain — regular user can login with @kitchenodyssey.com', async ({ page }) => {
    // Fill in new user credentials
    await page.getByPlaceholder('admin@kitchenodyssey.com').fill('user@kitchenodyssey.com');
    await page.getByPlaceholder('••••••').fill('user');
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait for navigation
    await page.waitForURL(`**${BASE}#/`, { timeout: 5000 });

    // Verify logged in state
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    const currentUser = await page.evaluate(() => {
      const raw = localStorage.getItem('kitchen_odyssey_current_user');
      return raw ? JSON.parse(raw) : null;
    });

    expect(currentUser).toBeTruthy();
    expect(currentUser.email).toBe('user@kitchenodyssey.com');
    expect(currentUser.role).toBe('user');
  });

  test('MultipleAdminAccounts — all three admin accounts work', async ({ page }) => {
    const adminAccounts = [
      { email: 'admin@kitchenodyssey.com', name: 'Admin User' },
      { email: 'olivia@kitchenodyssey.com', name: 'Olivia Admin' },
      { email: 'marcus@kitchenodyssey.com', name: 'Marcus Admin' }
    ];

    for (const admin of adminAccounts) {
      // Logout first if logged in
      const logoutBtn = page.getByRole('button', { name: 'Logout' });
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForURL(/.*#\/login/);
      }

      // Login with this admin
      await page.getByPlaceholder('admin@kitchenodyssey.com').fill(admin.email);
      await page.getByPlaceholder('••••••').fill('admin');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL(`**${BASE}#/`);

      // Verify
      await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

      const currentUser = await page.evaluate(() => {
        const raw = localStorage.getItem('kitchen_odyssey_current_user');
        return raw ? JSON.parse(raw) : null;
      });

      expect(currentUser?.email).toBe(admin.email);
      expect(currentUser?.username).toBe(admin.name);
    }
  });

  test('OldCredentialsRejected — old @cookhub.com credentials no longer work', async ({ page }) => {
    // Try to login with old credentials
    await page.getByPlaceholder('admin@kitchenodyssey.com').fill('admin@cookhub.com');
    await page.getByPlaceholder('••••••').fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(500);

    // Should still be on login page (login failed)
    await expect(page).toHaveURL(/.*#\/login/);
    await expect(page.getByRole('button', { name: 'Logout' })).not.toBeVisible();

    // Verify no user is stored
    const currentUser = await page.evaluate(() => {
      const raw = localStorage.getItem('kitchen_odyssey_current_user');
      return raw ? JSON.parse(raw) : null;
    });

    expect(currentUser).toBeNull();
  });
});

test.describe('Guest Mode with New Keys', () => {
  test('GuestIdUsesNewKey — guest mode uses kitchen_odyssey_guest_id', async ({ page }) => {
    await page.goto(`${BASE}#/login`);
    await page.getByRole('button', { name: 'Continue as Guest' }).click();
    await page.waitForURL(`**${BASE}#/`);

    // Check guest ID exists with new key
    const guestId = await page.evaluate(() => localStorage.getItem('kitchen_odyssey_guest_id'));
    expect(guestId).toBeTruthy();
    expect(guestId).toMatch(/^guest-/);

    // Verify old key doesn't exist
    const oldGuestId = await page.evaluate(() => localStorage.getItem('cookhub_guest_id'));
    expect(oldGuestId).toBeNull();
  });

  test('GuestAnalyticsNewKeys — guest analytics use kitchen_odyssey_* keys', async ({ page }) => {
    await page.goto(`${BASE}#/login`);
    await page.getByRole('button', { name: 'Continue as Guest' }).click();
    await page.waitForURL(`**${BASE}#/`);

    // Navigate to a recipe
    const firstRecipe = page.locator('a[href*="#/recipes/recipe-"]').first();
    await firstRecipe.click();
    await page.waitForTimeout(500);

    // Check guest ID exists with new key
    const guestId = await page.evaluate(() => localStorage.getItem('kitchen_odyssey_guest_id'));
    expect(guestId).toBeTruthy();

    // Check that recipes and users exist with new keys
    const recipes = await page.evaluate(() => localStorage.getItem('kitchen_odyssey_recipes'));
    expect(recipes).toBeTruthy();

    const users = await page.evaluate(() => localStorage.getItem('kitchen_odyssey_users'));
    expect(users).toBeTruthy();

    // Verify old keys don't exist
    const oldGuestId = await page.evaluate(() => localStorage.getItem('cookhub_guest_id'));
    expect(oldGuestId).toBeNull();
  });
});

test.describe('Recipe Operations with New Keys', () => {
  test.beforeEach(async ({ page }) => {
    // Clear and login as user
    await page.goto(`${BASE}#/login`);
    await page.evaluate(() => {
      Object.keys(localStorage).forEach(key => localStorage.removeItem(key));
    });
    await page.goto(`${BASE}#/login`);

    await page.getByPlaceholder('admin@kitchenodyssey.com').fill('user@kitchenodyssey.com');
    await page.getByPlaceholder('••••••').fill('user');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(`**${BASE}#/`, { timeout: 5000 });
  });

  test('RecipesStoredWithNewKey — recipes use kitchen_odyssey_recipes', async ({ page }) => {
    const recipes = await page.evaluate(() => {
      const raw = localStorage.getItem('kitchen_odyssey_recipes');
      return raw ? JSON.parse(raw) : null;
    });

    expect(recipes).toBeTruthy();
    expect(Array.isArray(recipes)).toBe(true);
    expect(recipes.length).toBeGreaterThan(0);

    // Verify old key doesn't exist
    const oldRecipes = await page.evaluate(() => {
      const raw = localStorage.getItem('cookhub_recipes');
      return raw ? JSON.parse(raw) : null;
    });
    expect(oldRecipes).toBeNull();
  });

  test('ReviewsStoredWithNewKey — reviews use kitchen_odyssey_reviews', async ({ page }) => {
    const reviews = await page.evaluate(() => {
      const raw = localStorage.getItem('kitchen_odyssey_reviews');
      return raw ? JSON.parse(raw) : null;
    });

    expect(reviews).toBeTruthy();
    expect(Array.isArray(reviews)).toBe(true);

    // Verify old key doesn't exist
    const oldReviews = await page.evaluate(() => {
      const raw = localStorage.getItem('cookhub_reviews');
      return raw ? JSON.parse(raw) : null;
    });
    expect(oldReviews).toBeNull();
  });

  test('SearchHistoryStoredWithNewKey — search history uses kitchen_odyssey_search_history', async ({ page }) => {
    const searchBox = page.getByPlaceholder('Search for recipes, ingredients, or chefs...');
    await searchBox.fill('pasta');
    await searchBox.press('Enter');
    await page.waitForTimeout(500);

    const searchHistory = await page.evaluate(() => {
      const raw = localStorage.getItem('kitchen_odyssey_search_history');
      return raw ? JSON.parse(raw) : null;
    });

    expect(searchHistory).toBeTruthy();
    expect(Array.isArray(searchHistory)).toBe(true);

    // Verify search was recorded
    const pastaSearch = searchHistory.find(s => s.query === 'pasta');
    expect(pastaSearch).toBeTruthy();
  });
});
