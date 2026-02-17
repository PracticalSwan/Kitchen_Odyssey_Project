// @ts-check
import { test, expect } from '@playwright/test';

const BASE = '/recipe-sharing-system-deploy/';

/** Enter guest mode */
async function enterGuestMode(page) {
  await page.goto(`${BASE}#/login`);
  await page.getByRole('button', { name: 'Continue as Guest' }).click();
  await page.waitForURL(`**${BASE}#/`);
}

/** Log in as the demo user */
async function loginAsUser(page) {
  await page.goto(`${BASE}#/login`);
  // Clear any old localStorage data first
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(key => localStorage.removeItem(key));
  });
  await page.reload();
  // Now fill in credentials
  await page.getByPlaceholder('admin@kitchenodyssey.com').fill('user@kitchenodyssey.com');
  await page.getByPlaceholder('â€¢â€¢â€¢â€¢â€¢â€¢').fill('user');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(`**${BASE}#/`);
}

test.describe('Guest Mode Transitions', () => {
  test('GuestToLogin â€” guest can switch to logged-in user', async ({ page }) => {
    await enterGuestMode(page);
    await expect(page.getByText('Guest')).toBeVisible();

    // Click Login link in navbar
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL(/.*#\/login/);

    // Log in
    await page.getByPlaceholder('admin@kitchenodyssey.com').fill('user@kitchenodyssey.com');
    await page.getByPlaceholder('â€¢â€¢â€¢â€¢â€¢â€¢').fill('user');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(`**${BASE}#/`);

    // Should show logged-in UI
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    await expect(page.getByText('Guest')).not.toBeVisible();
  });

  test('GuestToSignup â€” guest can navigate to signup page', async ({ page }) => {
    await enterGuestMode(page);
    // Click Sign Up link
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/.*#\/signup/);
    // Signup form should be visible
    await expect(page.getByRole('heading', { name: /get started|sign up|create.*account/i })).toBeVisible();
  });

  test('LogoutToGuest â€” logged-in user can logout and re-enter guest mode', async ({ page }) => {
    await loginAsUser(page);
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/.*#\/login/);

    // Enter guest mode
    await page.getByRole('button', { name: 'Continue as Guest' }).click();
    await page.waitForURL(`**${BASE}#/`);
    await expect(page.getByText('Guest')).toBeVisible();
  });

  test('GuestSessionPersistence â€” guest state persists across page navigation', async ({ page }) => {
    await enterGuestMode(page);

    // Navigate to different pages
    const firstRecipe = page.locator('a[href*="#/recipes/recipe-"]').first();
    await firstRecipe.click();
    await expect(page).toHaveURL(/.*#\/recipes\/recipe-\d+/);

    // Guest badge should still be visible
    await expect(page.getByText('Guest', { exact: true })).toBeVisible();

    // Navigate back to home
    await page.getByRole('link', { name: 'Discover' }).click();
    await expect(page.getByText('Guest', { exact: true })).toBeVisible();

    // Guest ID should persist in localStorage
    const guestId = await page.evaluate(() => localStorage.getItem('kitchen_odyssey_guest_id'));
    expect(guestId).toBeTruthy();
    expect(guestId).toMatch(/^guest-/);
  });

  test('GuestIdClearedOnLogin â€” guest ID removed when user logs in', async ({ page }) => {
    await enterGuestMode(page);
    const guestIdBefore = await page.evaluate(() => localStorage.getItem('kitchen_odyssey_guest_id'));
    expect(guestIdBefore).toBeTruthy();

    // Login
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByPlaceholder('admin@kitchenodyssey.com').fill('user@kitchenodyssey.com');
    await page.getByPlaceholder('â€¢â€¢â€¢â€¢â€¢â€¢').fill('user');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(`**${BASE}#/`);

    // Guest ID should be cleared
    const guestIdAfter = await page.evaluate(() => localStorage.getItem('kitchen_odyssey_guest_id'));
    expect(guestIdAfter).toBeFalsy();
  });

  test('TransientRefreshFailureKeepsUserMode — user is not downgraded to guest on temporary refresh failure', async ({ page }) => {
    await loginAsUser(page);
    await page.goto(${BASE}#/recipes/recipe-1);
    await expect(page.getByText('Guest', { exact: true })).toHaveCount(0);

    let injectedLike401 = false;
    await page.route('**/api/v1/recipes/*/like', async (route) => {
      if (route.request().method() === 'POST' && !injectedLike401) {
        injectedLike401 = true;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/v1/auth/refresh', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Auth service temporarily unavailable',
            },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.getByRole('button', { name: /like/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    await expect(page.getByText('Guest', { exact: true })).toHaveCount(0);
    const guestId = await page.evaluate(() => localStorage.getItem('kitchen_odyssey_guest_id'));
    expect(guestId).toBeFalsy();
  });
});
