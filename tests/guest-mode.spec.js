// @ts-check
import { test, expect } from '@playwright/test';

const BASE = '/recipe-sharing-system-deploy/';

/** Enter guest mode from login page */
async function enterGuestMode(page) {
  await page.goto(`${BASE}#/login`);
  await page.getByRole('button', { name: 'Continue as Guest' }).click();
  await page.waitForURL(`**${BASE}#/`);
}

test.describe('Guest Mode Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear guest state
    await page.goto(`${BASE}#/login`);
    await page.evaluate(() => localStorage.removeItem('cookhub_guest_id'));
  });

  test('GuestEntryFromLogin — Continue as Guest works from Login page', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue as Guest' }).click();
    await page.waitForURL(`**${BASE}#/`);
    // Guest badge visible in navbar
    await expect(page.getByText('Guest')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible();
  });

  test('GuestEntryFromSignup — Continue as Guest works from Signup page', async ({ page }) => {
    await page.goto(`${BASE}#/signup`);
    await page.getByRole('button', { name: 'Continue as Guest' }).click();
    await page.waitForURL(`**${BASE}#/`);
    await expect(page.getByText('Guest')).toBeVisible();
  });

  test('GuestBrowsing — can view Home page and recipe cards', async ({ page }) => {
    await enterGuestMode(page);
    // Home page heading
    await expect(page.getByRole('heading', { name: 'Share Your Culinary Masterpiece' })).toBeVisible();
    // Recipe cards visible
    await expect(page.getByRole('heading', { name: 'Fresh from the Kitchen' })).toBeVisible();
    // At least one recipe link
    const recipeLinks = page.locator('a[href*="#/recipes/recipe-"]');
    await expect(recipeLinks.first()).toBeVisible();
  });

  test('GuestSearch — can search recipes', async ({ page }) => {
    await enterGuestMode(page);
    const searchBox = page.getByPlaceholder('Search for recipes, ingredients, or chefs...');
    await expect(searchBox).toBeVisible();
    await searchBox.fill('pasta');
    await searchBox.press('Enter');
    // Should navigate to search results
    await expect(page).toHaveURL(/.*#\/search/);
  });

  test('GuestRecipeDetail — can view recipe details', async ({ page }) => {
    await enterGuestMode(page);
    // Click first recipe card
    const firstRecipe = page.locator('a[href*="#/recipes/recipe-"]').first();
    await firstRecipe.click();
    await expect(page).toHaveURL(/.*#\/recipes\/recipe-\d+/);
    // Recipe detail elements visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Instructions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible();
  });
});

test.describe('Guest Mode Blocking', () => {
  test.beforeEach(async ({ page }) => {
    await enterGuestMode(page);
  });

  test('LikeBlocking — like buttons are disabled for guests', async ({ page }) => {
    const firstRecipe = page.locator('a[href*="#/recipes/recipe-"]').first();
    await firstRecipe.click();
    await expect(page).toHaveURL(/.*#\/recipes\/recipe-\d+/);
    // Like button should be disabled
    const likeBtn = page.getByRole('button', { name: /like/i }).first();
    await expect(likeBtn).toBeDisabled();
  });

  test('FavoriteBlocking — save buttons are disabled for guests', async ({ page }) => {
    const firstRecipe = page.locator('a[href*="#/recipes/recipe-"]').first();
    await firstRecipe.click();
    await expect(page).toHaveURL(/.*#\/recipes\/recipe-\d+/);
    const saveBtn = page.getByRole('button', { name: /save/i }).first();
    await expect(saveBtn).toBeDisabled();
  });

  test('ReviewBlocking — review form is disabled for guests', async ({ page }) => {
    const firstRecipe = page.locator('a[href*="#/recipes/recipe-"]').first();
    await firstRecipe.click();
    await expect(page).toHaveURL(/.*#\/recipes\/recipe-\d+/);
    // Review textarea should be disabled
    const reviewInput = page.getByPlaceholder('Write a review...');
    await expect(reviewInput).toBeDisabled();
    // Rating buttons disabled
    const rateBtn = page.getByRole('button', { name: /rate 1 star/i });
    await expect(rateBtn).toBeDisabled();
    // Guest message visible
    await expect(page.getByText(/browsing as a guest/i)).toBeVisible();
  });

  test('RecipeCreationBlocking — CreateRecipe shows login prompt', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/create`);
    await expect(page.getByRole('heading', { name: /login required/i })).toBeVisible();
    await expect(page.locator('#main-content').getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.locator('#main-content').getByRole('button', { name: 'Sign Up' })).toBeVisible();
  });

  test('ProfileRedirect — profile page shows login prompt for guests', async ({ page }) => {
    await page.goto(`${BASE}#/profile`);
    await expect(page.getByRole('heading', { name: /login.*profile/i })).toBeVisible();
    await expect(page.locator('#main-content').getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('AdminBlocked — admin page redirects guests to login', async ({ page }) => {
    await page.goto(`${BASE}#/admin`);
    await expect(page).toHaveURL(/.*#\/login/);
  });

  test('NavbarHidesProtectedLinks — My Recipes and Create hidden for guests', async ({ page }) => {
    // My Recipes link should not exist
    await expect(page.getByRole('link', { name: 'My Recipes' })).not.toBeVisible();
    // Create link should not exist
    await expect(page.getByRole('link', { name: 'Create' })).not.toBeVisible();
  });
});
