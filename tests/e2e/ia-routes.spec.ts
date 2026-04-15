import { expect, test } from '@playwright/test';

const routes = [
  '/watch',
  '/watch/movies',
  '/watch/series',
  '/watch/shorts',
  '/read',
  '/read/comics',
];

for (const route of routes) {
  test(`route ${route} renders without app error`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
  });
}

test('top navigation exposes the new IA labels on the home page', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const nav = page.locator('nav').first();

  await expect(nav).toContainText('Home');
  await expect(nav).toContainText('Watch');
  await expect(nav).toContainText('Read');
  await expect(nav).toContainText('Vault');
  await expect(nav).toContainText('Search');
  await expect(nav).not.toContainText(/Collection|Comics|Novel|Short Series/i);
});
