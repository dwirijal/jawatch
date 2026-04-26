import { expect, test } from '@playwright/test';
import { findComicFixture } from './comic-fixture';

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

test('comic chapters index route falls back to the title chapters tab when catalog data exists', async ({ page, request }) => {
  const fixture = await findComicFixture(request);
  if (!fixture) {
    test.skip(true, 'Comic catalog API returned no fixture data.');
    return;
  }

  const response = await page.goto(`/comics/${fixture.slug}/chapters`, {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`/comics/${fixture.slug}\\?tab=chapters$`));
});
