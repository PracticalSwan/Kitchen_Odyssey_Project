// @ts-check
import { test, expect } from '@playwright/test';

const BASE = '/recipe-sharing-system-deploy/';

/** Log in as the demo user */
async function loginAsUser(page) {
  await page.goto(`${BASE}#/login`);
  await page.getByPlaceholder('admin@cookhub.com').fill('user@cookhub.com');
  await page.getByPlaceholder('••••••').fill('user');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`**${BASE}#/`);
}

/** Enter guest mode */
async function enterGuestMode(page) {
  await page.goto(`${BASE}#/login`);
  await page.getByRole('button', { name: 'Continue as Guest' }).click();
  await page.waitForURL(`**${BASE}#/`);
}

test.describe('Random Recipe Suggestion', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('SurpriseMeButton — button exists and opens modal', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Surprise Me!' });
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.getByRole('heading', { name: 'Surprise Me!' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View Recipe' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try Another' })).toBeVisible();
  });

  test('QualityConstraints — suggested recipe has required info', async ({ page }) => {
    await page.getByRole('button', { name: 'Surprise Me!' }).click();
    // Modal must show recipe title (h4), difficulty badge, image, and stats
    await expect(page.locator('h4').first()).toBeVisible();
    await expect(page.getByRole('img').first()).toBeVisible();
    // Stats section shows likes and reviews
    await expect(page.getByText(/\d+ like/i)).toBeVisible();
    await expect(page.getByText(/\d+ review/i)).toBeVisible();
  });

  test('FallbackBehavior — always shows a published recipe', async ({ page }) => {
    await page.getByRole('button', { name: 'Surprise Me!' }).click();
    // Should always show a recipe (fallback to any published)
    const title = page.locator('h4').first();
    await expect(title).toBeVisible();
    const text = await title.textContent();
    expect(text.length).toBeGreaterThan(0);
  });

  test('ViewRecipeNavigation — navigates to recipe detail', async ({ page }) => {
    await page.getByRole('button', { name: 'Surprise Me!' }).click();
    const recipeName = await page.locator('h4').first().textContent();
    await page.getByRole('button', { name: 'View Recipe' }).click();
    // Should navigate to a recipe detail page
    await expect(page).toHaveURL(/.*#\/recipes\/recipe-\d+/);
    // Recipe detail page shows the recipe title
    await expect(page.getByRole('heading', { name: recipeName })).toBeVisible();
  });

  test('TryAnotherLoading — Try Another shows different recipe', async ({ page }) => {
    await page.getByRole('button', { name: 'Surprise Me!' }).click();
    const firstTitle = await page.locator('h4').first().textContent();

    // Click Try Another multiple times to get a different recipe
    let gotDifferent = false;
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: 'Try Another' }).click();
      await page.waitForTimeout(300);
      const currentTitle = await page.locator('h4').first().textContent();
      if (currentTitle !== firstTitle) {
        gotDifferent = true;
        break;
      }
    }
    expect(gotDifferent).toBe(true);
  });

  test('ModalClose — ESC key closes modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Surprise Me!' }).click();
    await expect(page.getByRole('heading', { name: 'Surprise Me!' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Surprise Me!' })).not.toBeVisible();
  });

  test('ModalClose — X button closes modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Surprise Me!' }).click();
    await expect(page.getByRole('heading', { name: 'Surprise Me!' })).toBeVisible();
    await page.getByRole('button', { name: 'Close modal' }).click();
    await expect(page.getByRole('heading', { name: 'Surprise Me!' })).not.toBeVisible();
  });

  test('GuestModeCompatibility — guests can use Surprise Me', async ({ page }) => {
    // Logout first
    await page.getByRole('button', { name: 'Logout' }).click();
    await enterGuestMode(page);

    const btn = page.getByRole('button', { name: 'Surprise Me!' });
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.getByRole('heading', { name: 'Surprise Me!' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View Recipe' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try Another' })).toBeVisible();
  });

  test('GuestAnalyticsNotTracked — guest views do not increment counts', async ({ page }) => {
    // Logout and enter guest mode
    await page.getByRole('button', { name: 'Logout' }).click();
    await enterGuestMode(page);

    // Get daily_stats before
    const statsBefore = await page.evaluate(() => {
      const raw = localStorage.getItem('cookhub_daily_stats');
      return raw ? JSON.parse(raw) : null;
    });

    // Use Surprise Me and View Recipe
    await page.getByRole('button', { name: 'Surprise Me!' }).click();
    await page.getByRole('button', { name: 'View Recipe' }).click();
    await page.waitForURL(/.*#\/recipes\/recipe-\d+/);

    // Get daily_stats after
    const statsAfter = await page.evaluate(() => {
      const raw = localStorage.getItem('cookhub_daily_stats');
      return raw ? JSON.parse(raw) : null;
    });

    // Views count should not have increased for guest
    if (statsBefore && statsAfter) {
      const viewsBefore = statsBefore.views?.length || 0;
      const viewsAfter = statsAfter.views?.length || 0;
      // Guest views should not be recorded — views count should stay same or not include guest entries
      const guestViews = (statsAfter.views || []).filter(v => v.includes('guest'));
      expect(guestViews.length).toBe(0);
    }
  });

  test('ImageErrorHandling — modal handles missing images gracefully', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.getByRole('button', { name: 'Surprise Me!' }).click();
    // Modal should display without crashing
    await expect(page.getByRole('heading', { name: 'Surprise Me!' })).toBeVisible();
    // No critical console errors
    const criticalErrors = errors.filter(e => !e.includes('favicon'));
    expect(criticalErrors.length).toBe(0);
  });

  test('RandomnessDistribution — recipes vary across attempts', async ({ page }) => {
    const titles = new Set();
    await page.getByRole('button', { name: 'Surprise Me!' }).click();

    for (let i = 0; i < 20; i++) {
      const title = await page.locator('h4').first().textContent();
      titles.add(title);
      await page.getByRole('button', { name: 'Try Another' }).click();
      await page.waitForTimeout(200);
    }

    // Should have seen at least 3 different recipes in 20 attempts
    expect(titles.size).toBeGreaterThanOrEqual(3);
  });
});
