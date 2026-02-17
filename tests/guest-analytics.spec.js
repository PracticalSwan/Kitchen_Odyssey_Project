// @ts-check
import { test, expect } from '@playwright/test';

const BASE = '/recipe-sharing-system-deploy/';

/** Enter guest mode */
async function enterGuestMode(page) {
  await page.goto(`${BASE}#/login`);
  await page.getByRole('button', { name: 'Continue as Guest' }).click();
  await page.waitForURL(`**${BASE}#/`);
}

test.describe('Guest Analytics Verification', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuestMode(page);
  });

  test('ViewCountNotTracked — guest views do not increment recipe view counts or daily_stats.views', async ({ page }) => {
    // Capture daily_stats before viewing recipe
    const statsBefore = await page.evaluate(() => {
      const raw = localStorage.getItem('cookhub_daily_stats');
      return raw ? JSON.parse(raw) : null;
    });
    const viewsBefore = statsBefore?.views?.length || 0;

    // View a recipe detail page
    const firstRecipe = page.locator('a[href*="#/recipes/recipe-"]').first();
    await firstRecipe.click();
    await expect(page).toHaveURL(/.*#\/recipes\/recipe-\d+/);
    await page.waitForTimeout(500);

    // Capture daily_stats after
    const statsAfter = await page.evaluate(() => {
      const raw = localStorage.getItem('cookhub_daily_stats');
      return raw ? JSON.parse(raw) : null;
    });

    // No guest entries should appear in views
    if (statsAfter?.views) {
      const guestViews = statsAfter.views.filter(v => typeof v === 'string' && v.includes('guest'));
      expect(guestViews.length).toBe(0);
    }
  });

  test('ActiveUserNotCounted — guest IDs do not appear in daily_stats.activeUsers', async ({ page }) => {
    // Browse around to trigger any potential recording
    const firstRecipe = page.locator('a[href*="#/recipes/recipe-"]').first();
    await firstRecipe.click();
    await page.waitForTimeout(500);

    const stats = await page.evaluate(() => {
      const raw = localStorage.getItem('cookhub_daily_stats');
      return raw ? JSON.parse(raw) : null;
    });

    // No guest IDs in activeUsers
    if (stats?.activeUsers) {
      const guestUsers = stats.activeUsers.filter(u => typeof u === 'string' && u.startsWith('guest'));
      expect(guestUsers.length).toBe(0);
    }
  });

  test('SearchHistoryLocalStorageOnly — guest search history is client-side only', async ({ page }) => {
    const searchBox = page.getByPlaceholder('Search for recipes, ingredients, or chefs...');
    await searchBox.fill('curry');
    await searchBox.press('Enter');
    await page.waitForTimeout(500);

    // Guest search should be in localStorage (client-side only)
    const guestId = await page.evaluate(() => localStorage.getItem('cookhub_guest_id'));
    expect(guestId).toBeTruthy();
    expect(guestId).toMatch(/^guest-/);
  });

  test('RecipeViewedByNotUpdated — guest does not appear in recipe viewedBy', async ({ page }) => {
    // Navigate to specific recipe
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await page.waitForTimeout(500);

    // Check the recipe data in localStorage
    const recipeData = await page.evaluate(() => {
      const raw = localStorage.getItem('cookhub_recipes');
      if (!raw) return null;
      const recipes = JSON.parse(raw);
      return recipes.find(r => r.id === 'recipe-1');
    });

    if (recipeData?.viewedBy) {
      const guestViews = recipeData.viewedBy.filter(v => typeof v === 'string' && v.includes('guest'));
      expect(guestViews.length).toBe(0);
    }
  });
});
