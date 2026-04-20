import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/watch',
  '/watch/movies',
  '/watch/series',
  '/read',
  '/read/comics',
  '/login',
  '/signup',
  '/forgot-password',
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

test('series episodes index route falls back to the title episodes tab', async ({ page }) => {
  const response = await page.goto('/series/digimon-beatbreak/episodes', { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/series\/digimon-beatbreak\?tab=episodes$/);
});

test('comic chapters index route falls back to the title chapters tab', async ({ page }) => {
  const response = await page.goto('/comics/oukoku-e-tsuzuku-michi-dorei-kenshi-no-nariagari-harem-life/chapters', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/comics\/oukoku-e-tsuzuku-michi-dorei-kenshi-no-nariagari-harem-life\?tab=chapters$/);
});
