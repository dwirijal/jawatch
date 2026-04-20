import { expect, test } from '@playwright/test';

const routes = [
  '/watch',
  '/watch/movies',
  '/watch/series',
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

test('watch shorts hub falls back to watch while the source is paused', async ({ page }) => {
  await page.goto('/watch/shorts', { waitUntil: 'domcontentloaded' });

  await page.waitForURL('**/watch');
  await expect(page).toHaveURL(/\/watch$/);
  await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
});

test('top navigation exposes the new IA labels on the home page', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const nav = page.locator('nav').first();

  await expect(nav).toContainText('Home');
  await expect(nav).toContainText('Watch');
  await expect(nav).toContainText('Read');
  await expect(nav).toContainText('Vault');
  await expect(nav.getByRole('button', { name: /open search/i })).toBeVisible();
  await expect(nav).not.toContainText(/Collection|Novel|Short Series/i);
});

test('public chrome footer uses the new Vault vocabulary only', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const footerLinks = await page.locator('footer a').evaluateAll((nodes) =>
    nodes.map((node) => ({
      text: (node.textContent || '').trim(),
      href: node.getAttribute('href') || '',
    }))
  );

  expect(footerLinks.some((item) => item.text === 'Vault' && item.href === '/vault')).toBe(true);
  expect(footerLinks.some((item) => item.href.includes('/collection') || item.text.includes('Stories'))).toBe(false);
  expect(footerLinks.some((item) => item.href.includes('/novel'))).toBe(false);
});

test('watch landing exposes primary watch segments without paused shorts', async ({ page }) => {
  await page.goto('/watch', { waitUntil: 'domcontentloaded' });

  const segmentNav = page.getByRole('navigation', { name: /watch segments/i });

  await expect(segmentNav).toContainText('Series');
  await expect(segmentNav).toContainText('Movies');
  await expect(segmentNav).not.toContainText('Shorts');
});

test('watch series keeps series subtype filters nested under the series segment', async ({ page }) => {
  await page.goto('/watch/series?type=donghua', { waitUntil: 'domcontentloaded' });

  const primaryNav = page.getByRole('navigation', { name: /watch segments/i });
  const subtypeNav = page.getByRole('navigation', { name: /series filters/i });

  await expect(primaryNav.getByRole('link', { name: 'Series' })).toHaveAttribute('aria-current', 'page');
  await expect(primaryNav).toContainText('Movies');
  await expect(subtypeNav).toContainText('All');
  await expect(subtypeNav).toContainText('Anime');
  await expect(subtypeNav).toContainText('Donghua');
  await expect(subtypeNav).toContainText('Drama');
  await expect(subtypeNav.getByRole('link', { name: 'Donghua' })).toHaveAttribute('aria-current', 'page');
});

test('read comics exposes the comic subtype segmented filters', async ({ page }) => {
  await page.goto('/read/comics?type=manhwa', { waitUntil: 'domcontentloaded' });

  const subtypeNav = page.getByRole('navigation', { name: /comic filters/i });

  await expect(subtypeNav).toContainText('All');
  await expect(subtypeNav).toContainText('Manga');
  await expect(subtypeNav).toContainText('Manhwa');
  await expect(subtypeNav).toContainText('Manhua');
  await expect(subtypeNav.getByRole('link', { name: 'Manhwa' })).toHaveAttribute('aria-current', 'page');
});

test('home shelves use the IA vocabulary instead of source-shaped labels', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const body = page.locator('body');

  await expect(body).toContainText('Fresh Release');
  await expect(body).toContainText('Trending Now');
  await expect(body).toContainText('Popular');
  await expect(body).toContainText('Recommended Picks');
  await expect(body).toContainText('Top Rated');
  await expect(body).toContainText('Because You Watched/Read');
  await expect(body).not.toContainText(/Series Update Terbaru|Movie Update Terbaru|Lovers by Community/i);
});
