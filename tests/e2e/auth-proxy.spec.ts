import { expect, test } from '@playwright/test';

test('proxy returns scanner-style 404 for /nsfw and child path', async ({ request }) => {
  const nsfwRoot = await request.get('/nsfw');
  expect(nsfwRoot.status()).toBe(404);

  const nsfwChild = await request.get('/nsfw/gallery');
  expect(nsfwChild.status()).toBe(404);
});

test('signed-out /collection redirects to /login with next parameter', async ({ page }) => {
  await page.goto('/collection', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/login\?next=%2Fcollection(?:$|&)/);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
});
