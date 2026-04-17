import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/watch',
  '/watch/movies',
  '/watch/series',
  '/watch/shorts',
  '/read',
  '/read/comics',
  '/search?q=naruto&type=all',
];

for (const route of routes) {
  test(`route ${route} renders without app error`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
  });
}
