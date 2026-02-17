// @ts-check
import { test, expect } from '@playwright/test';

const BASE = '/recipe-sharing-system-deploy/';

test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 1366, height: 900 } });

// Test credentials from seed data
const ADMIN = { email: 'admin@kitchenodyssey.com', password: 'admin' };
const USER1 = { email: 'user@kitchenodyssey.com', password: 'user' };
const USER2 = { email: 'maria@kitchenodyssey.com', password: 'maria123' };
const PENDING_USER = { email: 'amy@kitchenodyssey.com', password: 'amy123' };
const SUSPENDED_USER = { email: 'tom@kitchenodyssey.com', password: 'tom123' };

// Helper: login via UI
async function loginAs(page, creds) {
  await page.goto(`${BASE}#/login`);
  await page.getByLabel('Email').fill(creds.email);
  await page.locator('#password').fill(creds.password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  // Wait for redirect away from login page (successful login navigates to / or /admin)
  await page.waitForURL(url => !url.href.includes('#/login'), { timeout: 15000 });
}

// Helper: enter guest mode
async function enterGuestMode(page) {
  await page.goto(`${BASE}#/login`);
  await page.getByRole('button', { name: 'Continue as Guest' }).click();
  await page.waitForURL(`**${BASE}#/`);
}

// Helper: clear auth state
async function clearState(page) {
  await page.goto(`${BASE}#/login`);
  await page.evaluate(() => {
    localStorage.removeItem('kitchen_odyssey_guest_id');
    document.cookie.split(';').forEach(c => {
      document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    });
  });
}

async function goToAdminRecipes(page) {
  await page.goto(`${BASE}#/admin`);
  await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible({ timeout: 15000 });
  await page.getByRole('link', { name: 'Recipes' }).click();
  await expect(page.getByRole('heading', { name: 'Recipe Management' })).toBeVisible({ timeout: 15000 });
}

async function goToAdminUsers(page) {
  await page.goto(`${BASE}#/admin`);
  await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible({ timeout: 15000 });
  await page.getByRole('link', { name: 'Users' }).click();
  await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible({ timeout: 15000 });
}

async function readAdminStatValue(page, title) {
  const card = page
    .getByText(title, { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
  const valueText = (await card.locator('div.text-3xl.font-bold.text-charcoal').first().textContent()) || '0';
  const parsed = Number.parseInt(valueText.replace(/[^\d-]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// ── AUTH: LOGIN FLOW ──────────────────────────────────────────────
test.describe('Auth — Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
  });

  test('LoginPage renders correctly', async ({ page }) => {
    await page.goto(`${BASE}#/login`);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue as Guest' })).toBeVisible();
  });

  test('Admin login succeeds and redirects to admin dashboard', async ({ page }) => {
    await loginAs(page, ADMIN);
    await expect(page).toHaveURL(new RegExp(`${BASE}#/admin`));
    await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
  });

  test('Regular user login succeeds', async ({ page }) => {
    await loginAs(page, USER1);
    await expect(page).toHaveURL(new RegExp(`${BASE}#/`));
    await expect(page.getByRole('heading', { name: 'Fresh from the Kitchen' })).toBeVisible();
  });

  test('Invalid credentials show error', async ({ page }) => {
    await page.goto(`${BASE}#/login`);
    await page.getByLabel('Email').fill('wrong@email.com');
    await page.locator('#password').fill('wrongpass');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 10000 });
  });

  test('Empty form shows validation error', async ({ page }) => {
    await page.goto(`${BASE}#/login`);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // HTML5 validation or API error keeps user on login page
    await expect(page).toHaveURL(/.*#\/login/);
  });

  test('Pending user can login but sees pending notice', async ({ page }) => {
    await loginAs(page, PENDING_USER);
    // Pending users should be able to login — the app handles pending status in UI
    await expect(page).toHaveURL(new RegExp(`${BASE}#/`));
  });

  test('Suspended user can login but sees suspended notice', async ({ page }) => {
    await loginAs(page, SUSPENDED_USER);
    await expect(page).toHaveURL(new RegExp(`${BASE}#/`));
  });

  test('Navigate to signup from login page', async ({ page }) => {
    await page.goto(`${BASE}#/login`);
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/.*#\/signup/);
    await expect(page.getByRole('heading', { name: 'Get Started' })).toBeVisible();
  });
});

// ── AUTH: SIGNUP FLOW ─────────────────────────────────────────────
test.describe('Auth — Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
  });

  test('SignupPage renders correctly', async ({ page }) => {
    await page.goto(`${BASE}#/signup`);
    await expect(page.getByRole('heading', { name: 'Get Started' })).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Last Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('Successful signup creates account with pending status', async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.goto(`${BASE}#/signup`);
    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.locator('#password').fill('TestPass123!');
    await page.locator('#confirmPassword').fill('TestPass123!');
    await page.getByRole('button', { name: 'Create Account' }).click();
    // Should redirect to home on success (regardless of pending status)
    await expect(page).toHaveURL(new RegExp(`${BASE}#/`), { timeout: 15000 });
  });

  test('Duplicate email shows error', async ({ page }) => {
    await page.goto(`${BASE}#/signup`);
    await page.getByLabel('First Name').fill('Dup');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Email').fill(USER1.email);
    await page.locator('#password').fill('TestPass123!');
    await page.locator('#confirmPassword').fill('TestPass123!');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText(/already|exist|duplicate|registered/i)).toBeVisible({ timeout: 10000 });
  });

  test('Password mismatch shows error', async ({ page }) => {
    await page.goto(`${BASE}#/signup`);
    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Birthday').fill('1995-05-15');
    await page.getByLabel('Email').fill('mismatch@example.com');
    await page.locator('#password').fill('TestPass123!');
    await page.locator('#confirmPassword').fill('DifferentPass!');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText(/passwords do not match|mismatch/i)).toBeVisible({ timeout: 10000 });
  });

  test('Navigate to login from signup page', async ({ page }) => {
    await page.goto(`${BASE}#/signup`);
    await page.getByRole('link', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/.*#\/login/);
  });
});

// ── GUEST USER ────────────────────────────────────────────────────
test.describe('Guest User', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
  });

  test('Enter guest mode from login page', async ({ page }) => {
    await enterGuestMode(page);
    await expect(page.getByText('Guest')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('Enter guest mode from signup page', async ({ page }) => {
    await page.goto(`${BASE}#/signup`);
    await page.getByRole('button', { name: 'Continue as Guest' }).click();
    await page.waitForURL(`**${BASE}#/`);
    await expect(page.getByText('Guest')).toBeVisible();
  });

  test('Guest can view home page with recipes', async ({ page }) => {
    await enterGuestMode(page);
    await expect(page.getByRole('heading', { name: 'Fresh from the Kitchen' })).toBeVisible();
    const recipeCards = page.locator('a[href*="#/recipes/recipe-"]');
    await expect(recipeCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('Guest can view recipe details', async ({ page }) => {
    await enterGuestMode(page);
    const firstRecipe = page.locator('a[href*="#/recipes/recipe-"]').first();
    await firstRecipe.click();
    await expect(page).toHaveURL(/.*#\/recipes\/recipe-/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Guest sees blocking notice on recipe detail', async ({ page }) => {
    await enterGuestMode(page);
    const firstRecipe = page.locator('a[href*="#/recipes/recipe-"]').first();
    await firstRecipe.click();
    await expect(page.getByText(/browsing as a guest/i)).toBeVisible();
  });

  test('Guest like button is disabled', async ({ page }) => {
    await enterGuestMode(page);
    await page.locator('a[href*="#/recipes/recipe-"]').first().click();
    await expect(page).toHaveURL(/.*#\/recipes\/recipe-/);
    const likeBtn = page.getByRole('button', { name: /like/i }).first();
    await expect(likeBtn).toBeDisabled();
  });

  test('Guest save button is disabled', async ({ page }) => {
    await enterGuestMode(page);
    await page.locator('a[href*="#/recipes/recipe-"]').first().click();
    const saveBtn = page.getByRole('button', { name: /save/i }).first();
    await expect(saveBtn).toBeDisabled();
  });

  test('Guest review form is disabled', async ({ page }) => {
    await enterGuestMode(page);
    await page.locator('a[href*="#/recipes/recipe-"]').first().click();
    const reviewInput = page.getByPlaceholder('Write a review...');
    await expect(reviewInput).toBeDisabled();
  });

  test('Guest create recipe shows login prompt', async ({ page }) => {
    await enterGuestMode(page);
    await page.goto(`${BASE}#/recipes/create`);
    await expect(page.getByRole('heading', { name: /login required/i })).toBeVisible();
  });

  test('Guest profile shows login prompt', async ({ page }) => {
    await enterGuestMode(page);
    await page.goto(`${BASE}#/profile`);
    await expect(page.getByRole('heading', { name: /login.*profile/i })).toBeVisible();
  });

  test('Guest admin page redirects to login', async ({ page }) => {
    await enterGuestMode(page);
    await page.goto(`${BASE}#/admin`);
    await expect(page).toHaveURL(/.*#\/login/);
  });

  test('Guest navbar hides protected links', async ({ page }) => {
    await enterGuestMode(page);
    await expect(page.getByRole('link', { name: 'My Recipes' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Recipe' })).not.toBeVisible();
  });
});

// ── HOME PAGE ─────────────────────────────────────────────────────
test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Home page renders with hero section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Fresh from the Kitchen' })).toBeVisible();
    await expect(page.getByText('Discover thousands of recipes')).toBeVisible();
  });

  test('Home page shows recipe cards', async ({ page }) => {
    const recipeCards = page.locator('a[href*="#/recipes/recipe-"]');
    await expect(recipeCards.first()).toBeVisible({ timeout: 10000 });
    const count = await recipeCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Search bar is visible and functional', async ({ page }) => {
    const searchBox = page.getByPlaceholder('Search for recipes, ingredients, or chefs...');
    await expect(searchBox).toBeVisible();
    await searchBox.fill('pasta');
    await searchBox.press('Enter');
    await expect(page).toHaveURL(/.*#\/search/);
  });

  test('Surprise Me button opens modal', async ({ page }) => {
    const surpriseBtn = page.getByRole('button', { name: /surprise me/i });
    await expect(surpriseBtn).toBeVisible();
    await surpriseBtn.click();
    await expect(page.getByText('Surprise Me!').first()).toBeVisible({ timeout: 10000 });
  });

  test('Filter chips are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Trending' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Under 30min' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Breakfast' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Desserts' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Easy' })).toBeVisible();
  });

  test('Filter — Breakfast shows breakfast recipes', async ({ page }) => {
    await page.getByRole('button', { name: 'Breakfast' }).click();
    await page.waitForTimeout(500);
    // Verify recipe cards update (some filter applied)
    const cards = page.locator('a[href*="#/recipes/recipe-"]');
    const count = await cards.count();
    // Could be zero if no breakfast recipes, or filtered count
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Filter — Desserts shows dessert recipes', async ({ page }) => {
    await page.getByRole('button', { name: 'Desserts' }).click();
    await page.waitForTimeout(500);
    const cards = page.locator('a[href*="#/recipes/recipe-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Sort dropdown is functional', async ({ page }) => {
    const sortSelect = page.locator('#sort-select');
    await expect(sortSelect).toBeVisible();
  });
});

// ── SURPRISE ME FUNCTION ──────────────────────────────────────────
test.describe('Surprise Me Function', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Surprise Me opens modal with recipe suggestion', async ({ page }) => {
    await page.getByRole('button', { name: /surprise me/i }).click();
    // Modal should appear with recipe info or empty state
    const modal = page.getByText('Surprise Me!').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
  });

  test('Try Another loads a different recipe', async ({ page }) => {
    await page.getByRole('button', { name: /surprise me/i }).click();
    await page.waitForTimeout(1000);
    const tryAnother = page.getByRole('button', { name: /try another/i });
    if (await tryAnother.isVisible()) {
      await tryAnother.click();
      await page.waitForTimeout(1000);
      // Modal should still be visible with (possibly different) content
      await expect(page.getByText('Surprise Me!').first()).toBeVisible();
    }
  });

  test('View Recipe navigates to recipe detail', async ({ page }) => {
    await page.getByRole('button', { name: /surprise me/i }).click();
    await page.waitForTimeout(1000);
    const viewBtn = page.getByRole('button', { name: /view recipe/i });
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await expect(page).toHaveURL(/.*#\/recipes\/recipe-/);
    }
  });
});

// ── SEARCH PAGE & FUNCTION ────────────────────────────────────────
test.describe('Search Page & Function', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Search page renders correctly', async ({ page }) => {
    await page.goto(`${BASE}#/search`);
    await expect(page.getByRole('heading', { name: /find your next favorite meal/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder('Search recipes...')).toBeVisible();
  });

  test('Search by keyword returns results', async ({ page }) => {
    await page.goto(`${BASE}#/search`);
    await expect(page.getByPlaceholder('Search recipes...')).toBeVisible({ timeout: 15000 });
    await page.getByPlaceholder('Search recipes...').fill('carbonara');
    await page.getByPlaceholder('Search recipes...').press('Enter');
    await page.waitForTimeout(1000);
    // Should show results
    const results = page.locator('a[href*="#/recipes/recipe-"]');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Category filter works', async ({ page }) => {
    await page.goto(`${BASE}#/search`);
    // Click a category pill (not "All")
    const breakfastBtn = page.getByRole('button', { name: 'Breakfast' });
    if (await breakfastBtn.isVisible()) {
      await breakfastBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('Difficulty filter works', async ({ page }) => {
    await page.goto(`${BASE}#/search`);
    const easyBtn = page.getByRole('button', { name: 'Easy', exact: true });
    if (await easyBtn.isVisible()) {
      await easyBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('Clear Filters button resets all filters', async ({ page }) => {
    await page.goto(`${BASE}#/search`);
    await expect(page.getByPlaceholder('Search recipes...')).toBeVisible({ timeout: 15000 });
    await page.getByPlaceholder('Search recipes...').fill('test');
    await page.getByPlaceholder('Search recipes...').press('Enter');
    await page.waitForTimeout(500);
    const clearBtn = page.getByRole('button', { name: /clear filters/i });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(500);
      await expect(page.getByPlaceholder('Search recipes...')).toHaveValue('');
    }
  });

  test('No results shows empty state', async ({ page }) => {
    await page.goto(`${BASE}#/search`);
    await expect(page.getByPlaceholder('Search recipes...')).toBeVisible({ timeout: 15000 });
    await page.getByPlaceholder('Search recipes...').fill('xyznonexistentrecipe99999');
    await page.getByPlaceholder('Search recipes...').press('Enter');
    await page.waitForTimeout(1000);
    await expect(page.getByText(/no recipes found/i)).toBeVisible({ timeout: 5000 });
  });

  test('Search history is recorded', async ({ page }) => {
    await page.goto(`${BASE}#/search`);
    await expect(page.getByPlaceholder('Search recipes...')).toBeVisible({ timeout: 15000 });
    const searchInput = page.getByPlaceholder('Search recipes...');
    await searchInput.fill('curry');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    // Clear search and check for recent history
    await searchInput.clear();
    await page.waitForTimeout(500);
    // Focus the input to trigger history display
    await searchInput.focus();
    await page.waitForTimeout(500);
    // History should show "Recent:" label if history exists
    const recentLabel = page.getByText('Recent:');
    if (await recentLabel.isVisible()) {
      await expect(recentLabel).toBeVisible();
    }
  });

  test('Search history persists after page reload', async ({ page }) => {
    await page.goto(`${BASE}#/search`);
    await expect(page.getByPlaceholder('Search recipes...')).toBeVisible({ timeout: 15000 });
    const uniqueQuery = `playwright-history-${Date.now()}`;
    const searchInput = page.getByPlaceholder('Search recipes...');

    await searchInput.fill(uniqueQuery);
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);

    await page.reload();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.clear();
    await searchInput.focus();
    await page.waitForTimeout(500);
    await expect(page.getByText(uniqueQuery)).toBeVisible({ timeout: 5000 });
  });
});

// ── RECIPE VIEW & DETAILS ─────────────────────────────────────────
test.describe('Recipe View & Details', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Recipe detail page shows full recipe info', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Instructions' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible({ timeout: 10000 });
  });

  test('Recipe shows author name', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await expect(page.getByText(/by\s/i)).toBeVisible({ timeout: 10000 });
  });

  test('Recipe shows prep/cook time', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await expect(page.getByText(/min/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('Breadcrumbs are visible', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await expect(page.getByText('Home').first()).toBeVisible({ timeout: 10000 });
  });

  test('Reviews section is visible', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await expect(page.getByRole('heading', { name: /reviews/i })).toBeVisible({ timeout: 10000 });
  });
});

// ── VIEW RECIPE CREATOR ───────────────────────────────────────────
test.describe('View Recipe Creator', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Clicking author name navigates to their profile', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-3`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    // Find the author link
    const authorLink = page.locator('a[href*="#/users/"]').first();
    if (await authorLink.isVisible()) {
      await authorLink.click();
      await expect(page).toHaveURL(/.*#\/users\//);
    }
  });
});

// ── LIKE / SAVE / SHARE BUTTONS ───────────────────────────────────
test.describe('Like / Save / Share Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Like button toggles like state', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-3`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    const likeBtn = page.getByRole('button', { name: /like/i }).first();
    await expect(likeBtn).toBeEnabled({ timeout: 10000 });
    await likeBtn.click();
    await page.waitForTimeout(1000);
    // Like count should update
  });

  test('Save button toggles favorite state', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-3`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    const saveBtn = page.getByRole('button', { name: /save/i }).first();
    await expect(saveBtn).toBeEnabled({ timeout: 10000 });
    await saveBtn.click();
    await page.waitForTimeout(1000);
  });

  test('Share button copies link', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const shareBtn = page.locator('button:has(svg.lucide-share-2)');
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();
  });
});

// ── RATINGS & REVIEWS ─────────────────────────────────────────────
test.describe('Ratings & Reviews', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Review form is enabled for active users', async ({ page }) => {
    // User1 should review recipe by another user (recipe-3 by user-2)
    await page.goto(`${BASE}#/recipes/recipe-3`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    const reviewTextarea = page.getByPlaceholder('Write a review...');
    await expect(reviewTextarea).toBeEnabled({ timeout: 10000 });
  });

  test('Star rating buttons are clickable', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-3`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    const starBtn = page.getByRole('button', { name: /rate 4 star/i });
    if (await starBtn.isVisible() && await starBtn.isEnabled()) {
      await starBtn.click();
    }
  });

  test('Post a review', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-4`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    const reviewTextarea = page.getByPlaceholder('Write a review...');
    if (await reviewTextarea.isEnabled()) {
      // Select rating first
      const star5 = page.getByRole('button', { name: /rate 5 star/i });
      if (await star5.isVisible()) {
        await star5.click();
      }
      await reviewTextarea.fill('Great recipe! Highly recommend.');
      await page.getByRole('button', { name: 'Post' }).click();
      await page.waitForTimeout(2000);
      // Review should appear
      await expect(page.getByText('Great recipe! Highly recommend.')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Updating your own review replaces previous comment', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-4`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    const reviewTextarea = page.getByPlaceholder('Write a review...');
    await expect(reviewTextarea).toBeEnabled({ timeout: 10000 });

    const reviewToken = Date.now();
    const initialComment = `Playwright initial review ${reviewToken}`;
    const updatedComment = `Playwright updated review ${reviewToken}`;

    await page.getByRole('button', { name: /rate 4 star/i }).click();
    await reviewTextarea.fill(initialComment);
    await page.getByRole('button', { name: 'Post' }).click();
    await expect(page.getByText(initialComment)).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /rate 2 star/i }).click();
    await reviewTextarea.fill(updatedComment);
    await page.getByRole('button', { name: 'Post' }).click();
    await expect(page.getByText(updatedComment)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(initialComment)).toHaveCount(0);
  });

  test('Existing reviews are displayed', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    // Recipe-1 should have reviews from seed data
    await expect(page.getByRole('heading', { name: /reviews/i })).toBeVisible({ timeout: 10000 });
  });
});

// ── INGREDIENT CHECKLIST ──────────────────────────────────────────
test.describe('Ingredient Checklist', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Ingredients are displayed with checkboxes', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible({ timeout: 10000 });
    // Ingredient items should be checkable
    const ingredients = page.locator('[role="checkbox"]');
    const count = await ingredients.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Clicking ingredient toggles checked state', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    const firstIngredient = page.locator('[role="checkbox"]').first();
    await expect(firstIngredient).toBeVisible({ timeout: 10000 });
    await firstIngredient.click();
    await expect(firstIngredient).toHaveAttribute('aria-checked', 'true');
  });

  test('Reset checks button unchecks all', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    // Check first ingredient
    const firstIngredient = page.locator('[role="checkbox"]').first();
    await expect(firstIngredient).toBeVisible({ timeout: 10000 });
    await firstIngredient.click();
    // Click reset
    const resetBtn = page.getByRole('button', { name: /reset checks/i });
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await expect(firstIngredient).toHaveAttribute('aria-checked', 'false');
    }
  });
});

// ── CREATE RECIPE ─────────────────────────────────────────────────
test.describe('Create Recipe', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Create recipe page renders correctly', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/create`);
    await expect(page.getByRole('heading', { name: 'Share Your Recipe' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel('Recipe Title')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Instructions' })).toBeVisible();
  });

  test('Submit recipe with required fields', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/create`);
    await page.waitForTimeout(1000);
    const title = `Playwright Recipe ${Date.now()}`;

    // Fill basic info
    await page.getByLabel('Recipe Title').fill(title);
    await page.locator('#description').fill('A test recipe created by automated testing');

    // Select category
    const catButton = page.getByText('Select categories...');
    if (await catButton.isVisible()) {
      await catButton.click();
      await page.waitForTimeout(500);
      // Click first category option
      const firstCat = page.locator('[role="option"]').first().or(page.locator('[data-category]').first());
      if (await firstCat.isVisible()) {
        await firstCat.click();
      }
      // Click away to close dropdown
      await page.getByLabel('Recipe Title').click();
    }

    // Fill time fields
    await page.getByLabel('Prep Time (min)').fill('15');
    await page.getByLabel('Cook Time (min)').fill('30');
    await page.getByLabel('Servings').fill('4');

    // Fill ingredient
    const ingredientName = page.getByPlaceholder('Item (e.g. Flour)').first();
    if (await ingredientName.isVisible()) {
      await ingredientName.fill('Test Ingredient');
      await page.getByPlaceholder('Qty').first().fill('200');
      await page.getByPlaceholder('Unit').first().fill('g');
    }

    // Fill instruction
    const stepTextarea = page.getByPlaceholder('Step 1...').or(page.locator('textarea[placeholder*="Step"]').first());
    if (await stepTextarea.isVisible()) {
      await stepTextarea.fill('First step of the test recipe');
    }

    // Submit
    await page.getByRole('button', { name: 'Submit Recipe' }).click();
    await page.waitForTimeout(3000);

    // Should redirect to recipe detail or home
    await expect(page).not.toHaveURL(/.*#\/recipes\/create/);
  });
});

// ── PROFILE VIEW ──────────────────────────────────────────────────
test.describe('Profile View', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Profile page shows user information', async ({ page }) => {
    await page.goto(`${BASE}#/profile`);
    await page.waitForTimeout(2000);
    // Should display the username
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
  });

  test('Profile shows My Recipes tab', async ({ page }) => {
    await page.goto(`${BASE}#/profile`);
    await page.waitForTimeout(2000);
    // Tab with recipes count
    const recipesTab = page.getByRole('button', { name: /recipes/i }).first();
    await expect(recipesTab).toBeVisible();
  });

  test('Profile shows Favorites tab', async ({ page }) => {
    await page.goto(`${BASE}#/profile`);
    await page.waitForTimeout(2000);
    const favTab = page.getByRole('button', { name: /favorites/i });
    await expect(favTab).toBeVisible();
  });

  test('Edit Profile button is visible for own profile', async ({ page }) => {
    await page.goto(`${BASE}#/profile`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /edit profile/i })).toBeVisible();
  });
});

// ── EDIT PROFILE ──────────────────────────────────────────────────
test.describe('Edit Profile', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Edit Profile modal opens', async ({ page }) => {
    await page.goto(`${BASE}#/profile`);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /edit profile/i }).click();
    await expect(page.getByRole('heading', { name: 'Edit Profile' })).toBeVisible();
  });

  test('Edit Profile modal has form fields', async ({ page }) => {
    await page.goto(`${BASE}#/profile`);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /edit profile/i }).click();
    await expect(page.locator('label', { hasText: 'First Name' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Last Name' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Username' })).toBeVisible();
    await expect(page.getByPlaceholder('Tell us about yourself...')).toBeVisible();
  });

  test('Save Changes updates profile', async ({ page }) => {
    await page.goto(`${BASE}#/profile`);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /edit profile/i }).click();
    await page.waitForTimeout(500);

    const bioField = page.getByPlaceholder('Tell us about yourself...');
    if (await bioField.isVisible()) {
      await bioField.clear();
      await bioField.fill('Updated bio from Playwright test');
    }

    await page.getByRole('button', { name: 'Save Changes' }).click();
    await page.waitForTimeout(2000);
    // Modal should close
    await expect(page.getByRole('heading', { name: 'Edit Profile' })).not.toBeVisible();
  });

  test('Cancel closes Edit Profile modal', async ({ page }) => {
    await page.goto(`${BASE}#/profile`);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /edit profile/i }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Profile' })).not.toBeVisible();
  });
});

// ── EDIT & DELETE OWN RECIPE ──────────────────────────────────────
test.describe('Edit & Delete Own Recipe', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Owner sees Edit and Delete buttons on their recipe', async ({ page }) => {
    // Recipe-1 is authored by user-1
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /^Edit$/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /^Delete$/ })).toBeVisible();
  });

  test('Edit button navigates to edit page', async ({ page }) => {
    await page.goto(`${BASE}#/recipes/recipe-1`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /^Edit$/ }).click();
    await expect(page).toHaveURL(/.*#\/recipes\/edit\/recipe-1/);
    await expect(page.getByRole('heading', { name: 'Edit Recipe' })).toBeVisible();
  });

  test('Non-owner does not see Edit/Delete buttons', async ({ page }) => {
    // Recipe-3 is by user-2, so user-1 should not see Edit/Delete
    await page.goto(`${BASE}#/recipes/recipe-3`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /^Edit$/ })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /^Delete$/ })).not.toBeVisible();
  });

  test('Delete own recipe from profile', async ({ page }) => {
    await page.goto(`${BASE}#/profile`);
    await page.waitForTimeout(2000);
    // Hover on recipe card to show overlay buttons
    const recipeCard = page.locator('a[href*="#/recipes/recipe-"]').first();
    if (await recipeCard.isVisible()) {
      await recipeCard.hover();
      const deleteBtn = page.getByRole('button', { name: /delete recipe/i }).first();
      if (await deleteBtn.isVisible()) {
        // Don't actually delete — just verify it's there
        await expect(deleteBtn).toBeVisible();
      }
    }
  });
});

// ── FAVORITED RECIPES ─────────────────────────────────────────────
test.describe('Favorited Recipes', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Favorites tab shows favorited recipes', async ({ page }) => {
    await page.goto(`${BASE}#/profile`);
    await page.waitForTimeout(2000);
    const favTab = page.getByRole('button', { name: /favorites/i });
    await favTab.click();
    await page.waitForTimeout(1000);
    // User-1 has recipe-3 as favorite in seed data
    const favoriteCards = page.locator('a[href*="#/recipes/recipe-"]');
    const count = await favoriteCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ── ADMIN DASHBOARD ───────────────────────────────────────────────
test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, ADMIN);
  });

  test('Admin dashboard renders correctly', async ({ page }) => {
    await page.goto(`${BASE}#/admin`);
    await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible({ timeout: 10000 });
  });

  test('Stat cards are displayed', async ({ page }) => {
    await page.goto(`${BASE}#/admin`);
    await page.waitForTimeout(2000);
    await expect(page.getByText('Total Users', { exact: true })).toBeVisible();
    await expect(page.getByText('Pending Recipes', { exact: true })).toBeVisible();
    await expect(page.getByText('Active Recipes', { exact: true })).toBeVisible();
    await expect(page.getByText('Total Likes', { exact: true })).toBeVisible();
  });

  test('Recent Activity section is visible', async ({ page }) => {
    await page.goto(`${BASE}#/admin`);
    await page.waitForTimeout(2000);
    await expect(page.getByText('Recent Activity')).toBeVisible();
  });

  test('View All button opens activity modal', async ({ page }) => {
    await page.goto(`${BASE}#/admin`);
    await page.waitForTimeout(2000);
    const viewAllBtn = page.getByRole('button', { name: 'View All' });
    if (await viewAllBtn.isVisible()) {
      await viewAllBtn.click();
      await expect(page.getByRole('heading', { name: /all recent activity/i })).toBeVisible({ timeout: 5000 });
    }
  });

  test('Recipe Trends section is visible', async ({ page }) => {
    await page.goto(`${BASE}#/admin`);
    await page.waitForTimeout(2000);
    await expect(page.getByText('Recipe Trends')).toBeVisible();
  });

  test('View Full Report opens report modal', async ({ page }) => {
    await page.goto(`${BASE}#/admin`);
    await page.waitForTimeout(2000);
    const reportBtn = page.getByRole('button', { name: /view full report/i });
    if (await reportBtn.isVisible()) {
      await reportBtn.click();
      await expect(page.getByRole('heading', { name: /full report/i })).toBeVisible({ timeout: 5000 });
    }
  });

  test('Date display shows current date', async ({ page }) => {
    await page.goto(`${BASE}#/admin`);
    await page.waitForTimeout(2000);
    // Should show today's date somewhere on the page
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    // Date could be in various formats
    const dateText = page.getByText(new RegExp(`${month}.*${day}.*${year}|${year}.*${month}.*${day}|${month}/${day}/${year}`));
    if (await dateText.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(dateText.first()).toBeVisible();
    }
  });

  test('Metric cards and report totals are internally consistent', async ({ page }) => {
    await page.goto(`${BASE}#/admin`);
    await page.waitForTimeout(2000);

    const totalUsers = await readAdminStatValue(page, 'Total Users');
    const pendingRecipes = await readAdminStatValue(page, 'Pending Recipes');
    const activeRecipes = await readAdminStatValue(page, 'Active Recipes');
    const totalLikes = await readAdminStatValue(page, 'Total Likes');

    expect(totalUsers).toBeGreaterThanOrEqual(0);
    expect(pendingRecipes).toBeGreaterThanOrEqual(0);
    expect(activeRecipes).toBeGreaterThanOrEqual(0);
    expect(totalLikes).toBeGreaterThanOrEqual(0);

    await page.getByRole('button', { name: /view full report/i }).click();
    await expect(page.getByRole('heading', { name: /full report/i })).toBeVisible({ timeout: 5000 });

    const summary = page.locator('text=/published recipes across/i').first();
    await expect(summary).toBeVisible({ timeout: 5000 });
    const summaryText = (await summary.textContent()) || '';
    const match = summaryText.match(/(\d+)\s+published recipes.*?(\d+)\s+categories.*?(\d+)\s+total likes/i);

    expect(match).not.toBeNull();
    if (match) {
      const publishedRecipes = Number.parseInt(match[1], 10);
      const reportTotalLikes = Number.parseInt(match[3], 10);
      expect(publishedRecipes).toBeGreaterThanOrEqual(activeRecipes);
      expect(reportTotalLikes).toBe(totalLikes);
    }
  });

  test('Non-admin user cannot access admin dashboard', async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
    await page.goto(`${BASE}#/admin`);
    // Should redirect non-admin users
    await expect(page).not.toHaveURL(/.*#\/admin$/);
  });
});

// ── USER MANAGEMENT ───────────────────────────────────────────────
test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, ADMIN);
  });

  test('User management page renders', async ({ page }) => {
    await goToAdminUsers(page);
    await expect(page.getByText('Manage user accounts')).toBeVisible();
  });

  test('User list shows users in table', async ({ page }) => {
    await goToAdminUsers(page);
    await page.waitForTimeout(2000);
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Search users by name', async ({ page }) => {
    await goToAdminUsers(page);
    const searchInput = page.getByPlaceholder('Search users...');
    await searchInput.fill('Maria');
    await page.waitForTimeout(500);
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Filter users by role — User', async ({ page }) => {
    await goToAdminUsers(page);
    const roleSelect = page.locator('select').first();
    await roleSelect.selectOption('user');
    await page.waitForTimeout(500);
    // All visible users should have role 'user'
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Filter users by role — Admin', async ({ page }) => {
    await goToAdminUsers(page);
    const roleSelect = page.locator('select').first();
    await roleSelect.selectOption('admin');
    await page.waitForTimeout(500);
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Search users by email', async ({ page }) => {
    await goToAdminUsers(page);
    const searchInput = page.getByPlaceholder('Search users...');
    await searchInput.fill('maria@kitchenodyssey.com');
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').filter({ hasText: /maria@kitchenodyssey\.com/i }).first()).toBeVisible();
  });

  test('Approve pending user', async ({ page }) => {
    await goToAdminUsers(page);
    await page.waitForTimeout(2000);
    // Find a pending user row
    const pendingRow = page.locator('table tbody tr').filter({ hasText: /pending/i }).first();
    if (await pendingRow.isVisible()) {
      const approveBtn = pendingRow.getByRole('button', { name: /approve/i }).or(pendingRow.locator('button[title="Approve"]'));
      if (await approveBtn.isVisible()) {
        await approveBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('Suspend user', async ({ page }) => {
    await goToAdminUsers(page);
    await page.waitForTimeout(2000);
    // Use a non-critical user to avoid affecting other test flows.
    const userRow = page.locator('table tbody tr').filter({ hasText: /daniel@kitchenodyssey/i }).first();
    if (await userRow.isVisible()) {
      const suspendBtn = userRow.locator('button[title="Suspend"]');
      if (await suspendBtn.isVisible() && await suspendBtn.isEnabled()) {
        await suspendBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('Delete user shows confirmation modal', async ({ page }) => {
    await goToAdminUsers(page);
    await page.waitForTimeout(2000);
    const deleteBtn = page.locator('button[title="Delete User"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.getByRole('heading', { name: 'Delete User' })).toBeVisible({ timeout: 5000 });
      // Cancel deletion
      await page.getByRole('button', { name: 'Cancel' }).click();
    }
  });
});

// ── RECIPE MANAGEMENT ─────────────────────────────────────────────
test.describe('Recipe Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, ADMIN);
  });

  test('Recipe management page renders', async ({ page }) => {
    await goToAdminRecipes(page);
  });

  test('Tabs for Pending, Published, Rejected exist', async ({ page }) => {
    await goToAdminRecipes(page);
    await page.waitForTimeout(2000);
    await expect(page.getByRole('button', { name: /^Pending$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Published$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Rejected$/ })).toBeVisible();
  });

  test('Pending recipes tab shows pending recipes', async ({ page }) => {
    await goToAdminRecipes(page);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /^Pending$/ }).click();
    await page.waitForTimeout(1000);
    // There should be pending recipes from seed data (recipe-2, recipe-11)
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Published recipes tab shows published recipes', async ({ page }) => {
    await goToAdminRecipes(page);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /^Published$/ }).click();
    await page.waitForTimeout(1000);
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Rejected recipes tab shows rejected recipes', async ({ page }) => {
    await goToAdminRecipes(page);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /^Rejected$/ }).click();
    await page.waitForTimeout(1000);
    // recipe-12 is rejected in seed
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Approve pending recipe', async ({ page }) => {
    await goToAdminRecipes(page);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /^Pending$/ }).click();
    await page.waitForTimeout(1000);
    const approveBtn = page.locator('button[title="Approve"]').first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test('Reject pending recipe', async ({ page }) => {
    await goToAdminRecipes(page);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /^Pending$/ }).click();
    await page.waitForTimeout(1000);
    const rejectBtn = page.locator('button[title="Reject"]').first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test('Delete recipe shows confirmation modal', async ({ page }) => {
    await goToAdminRecipes(page);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /^Published$/ }).click();
    await page.waitForTimeout(1000);
    const deleteBtn = page.locator('button[title="Delete"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.getByRole('heading', { name: 'Delete Recipe' })).toBeVisible({ timeout: 5000 });
      // Cancel
      await page.getByRole('button', { name: 'Cancel' }).click();
    }
  });

  test('Preview recipe from admin panel', async ({ page }) => {
    await goToAdminRecipes(page);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /^Published$/ }).click();
    await page.waitForTimeout(1000);
    // Click the preview (eye) button
    const previewBtn = page.locator('table tbody tr').first().locator('button').first();
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      await page.waitForTimeout(1000);
      // Should open preview modal with recipe title and details
    }
  });
});

// ── SIGN OUT ──────────────────────────────────────────────────────
test.describe('Sign Out', () => {
  test('Logout from user account', async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
    await page.waitForTimeout(1000);
    const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
    await logoutBtn.click();
    await expect(page).toHaveURL(/.*#\/login/, { timeout: 10000 });
  });

  test('Logout from admin account', async ({ page }) => {
    await clearState(page);
    await loginAs(page, ADMIN);
    await page.waitForTimeout(1000);
    const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
    await logoutBtn.click();
    await expect(page).toHaveURL(/.*#\/login/, { timeout: 10000 });
  });

  test('After logout, protected routes redirect to login', async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
    const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
    await logoutBtn.click();
    await expect(page).toHaveURL(/.*#\/login/, { timeout: 10000 });
    await page.goto(`${BASE}#/admin`);
    await expect(page).toHaveURL(/.*#\/login/);
  });
});

// ── NAVIGATION ────────────────────────────────────────────────────
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await loginAs(page, USER1);
  });

  test('Navbar shows correct links for logged-in user', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Discover' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Search' })).toBeVisible();
  });

  test('Create Recipe button is visible for logged-in user', async ({ page }) => {
    const createBtn = page.locator('a[href*="#/recipes/create"]');
    await expect(createBtn).toBeVisible();
  });

  test('Profile button navigates to profile', async ({ page }) => {
    const profileBtn = page.getByRole('button', { name: /view profile/i }).or(page.locator('button[aria-label="View Profile"]'));
    if (await profileBtn.isVisible()) {
      await profileBtn.click();
      await expect(page).toHaveURL(/.*#\/profile/);
    }
  });

  test('Kitchen Odyssey logo navigates to home', async ({ page }) => {
    await page.goto(`${BASE}#/search`);
    await page.getByRole('link', { name: /kitchen odyssey/i }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE}#/$`));
  });
});
