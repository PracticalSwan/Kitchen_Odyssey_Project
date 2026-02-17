import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173/recipe-sharing-system-deploy/';

async function captureSnapshots() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Login as user
  await page.goto(`${BASE}#/login`);
  await page.locator('#email').fill('user@kitchenodyssey.com');
  await page.locator('#password').fill('user');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForTimeout(2000);

  // Search page
  await page.goto(`${BASE}#/search`);
  await page.waitForTimeout(2000);
  console.log('=== SEARCH PAGE HEADINGS ===');
  const searchHeadings = await page.locator('h1, h2, h3').allInnerTexts();
  console.log(searchHeadings.join('\n'));
  console.log('=== SEARCH PAGE INPUTS ===');
  const searchInputs = await page.locator('input').evaluateAll(els =>
    els.map(el => `placeholder="${el.placeholder}" id="${el.id}" type="${el.type}"`)
  );
  console.log(searchInputs.join('\n'));

  // Recipe detail
  await page.goto(`${BASE}#/`);
  await page.waitForTimeout(2000);
  const links = await page.locator('a[href*="#/recipes/"]').evaluateAll(els =>
    els.map(el => el.getAttribute('href')).filter(h => h && !h.includes('create'))
  );
  console.log('\n=== RECIPE LINKS ===');
  console.log(links.slice(0, 5).join('\n'));

  if (links.length > 0) {
    await page.goto(`${BASE}${links[0]}`);
    await page.waitForTimeout(2000);
    console.log('\n=== RECIPE DETAIL HEADINGS ===');
    const recipeHeadings = await page.locator('h1, h2, h3, h4').allInnerTexts();
    console.log(recipeHeadings.join('\n'));

    // Check for ingredients, instructions, reviews sections
    console.log('\n=== RECIPE DETAIL BUTTONS ===');
    const btns = await page.locator('button').evaluateAll(els =>
      els.map(el => `"${el.innerText.trim()}" disabled=${el.disabled} aria-label="${el.getAttribute('aria-label')}"`)
    );
    console.log(btns.join('\n'));

    // Check for checkboxes
    console.log('\n=== CHECKBOXES / INGREDIENT LIST ===');
    const checks = await page.locator('[role="checkbox"], input[type="checkbox"], label > input').count();
    console.log(`Checkbox-like elements: ${checks}`);
    const listItems = await page.locator('li').evaluateAll(els =>
      els.map(el => el.innerText.trim()).filter(t => t.length < 100).slice(0, 10)
    );
    console.log('First list items:', listItems.join(' | '));
  }

  // Profile page
  await page.goto(`${BASE}#/profile`);
  await page.waitForTimeout(2000);
  console.log('\n=== PROFILE HEADINGS ===');
  const profHeadings = await page.locator('h1, h2, h3').allInnerTexts();
  console.log(profHeadings.join('\n'));
  console.log('\n=== PROFILE BUTTONS ===');
  const profBtns = await page.locator('button').evaluateAll(els =>
    els.map(el => `"${el.innerText.trim()}" aria-label="${el.getAttribute('aria-label')}"`)
  );
  console.log(profBtns.join('\n'));
  console.log('\n=== PROFILE TABS ===');
  const profTabs = await page.locator('[role="tab"], button').evaluateAll(els =>
    els.filter(el => el.getAttribute('role') === 'tab' || el.innerText.match(/recipes|favorites/i))
      .map(el => `"${el.innerText.trim()}" role="${el.getAttribute('role')}"`)
  );
  console.log(profTabs.join('\n'));

  // Create recipe page
  await page.goto(`${BASE}#/recipes/create`);
  await page.waitForTimeout(2000);
  console.log('\n=== CREATE RECIPE HEADINGS ===');
  const createHeadings = await page.locator('h1, h2, h3').allInnerTexts();
  console.log(createHeadings.join('\n'));
  console.log('\n=== CREATE RECIPE LABELS ===');
  const createLabels = await page.locator('label').allInnerTexts();
  console.log(createLabels.join('\n'));

  // Logout and login as admin
  const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
  if (await logoutBtn.isVisible()) await logoutBtn.click();
  await page.waitForTimeout(1000);

  await page.goto(`${BASE}#/login`);
  await page.locator('#email').fill('admin@kitchenodyssey.com');
  await page.locator('#password').fill('admin');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForTimeout(3000);

  // Admin dashboard
  console.log('\n=== ADMIN DASHBOARD HEADINGS ===');
  const adminHeadings = await page.locator('h1, h2, h3').allInnerTexts();
  console.log(adminHeadings.join('\n'));

  // User management
  await page.goto(`${BASE}#/admin/users`);
  await page.waitForTimeout(2000);
  console.log('\n=== USER MANAGEMENT HEADINGS ===');
  const umHeadings = await page.locator('h1, h2, h3').allInnerTexts();
  console.log(umHeadings.join('\n'));
  console.log('\n=== USER MANAGEMENT TABLE ===');
  const tableRows = await page.locator('table tbody tr, [class*="table"] [class*="row"]').count();
  console.log(`Table rows: ${tableRows}`);
  console.log('\n=== USER MANAGEMENT SELECTS ===');
  const selects = await page.locator('select').evaluateAll(els =>
    els.map(el => `id="${el.id}" options=${Array.from(el.options).map(o => o.value).join(',')}`)
  );
  console.log(selects.join('\n'));

  // Recipe management
  await page.goto(`${BASE}#/admin/recipes`);
  await page.waitForTimeout(2000);
  console.log('\n=== RECIPE MANAGEMENT HEADINGS ===');
  const rmHeadings = await page.locator('h1, h2, h3').allInnerTexts();
  console.log(rmHeadings.join('\n'));
  console.log('\n=== RECIPE MANAGEMENT TABS ===');
  const rmTabs = await page.locator('[role="tab"], button').evaluateAll(els =>
    els.filter(el => el.getAttribute('role') === 'tab')
      .map(el => `"${el.innerText.trim()}" role="${el.getAttribute('role')}"`)
  );
  console.log(rmTabs.join('\n'));

  await browser.close();
}

captureSnapshots().catch(console.error);
