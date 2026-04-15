import { expect, test } from '@playwright/test';

test('proxy returns scanner-style 404 for /nsfw and child path', async ({ request }) => {
  const nsfwRoot = await request.get('/nsfw');
  expect(nsfwRoot.status()).toBe(404);

  const nsfwChild = await request.get('/nsfw/gallery');
  expect(nsfwChild.status()).toBe(404);
});

test('signed-out /vault/saved redirects to /login with next parameter', async ({ page }) => {
  await page.goto('/vault/saved', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/login\?next=%2Fvault%2Fsaved(?:$|&)/);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
});

test('signed-out /collection redirects to vault-aware login next parameter', async ({ page }) => {
  await page.goto('/collection', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/login\?next=%2Fvault%2Fsaved(?:$|&)/);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
});
