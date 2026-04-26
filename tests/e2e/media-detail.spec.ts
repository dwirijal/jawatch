import { expect, test } from '@playwright/test';
import { findComicFixture } from './comic-fixture';

const routes = [
  '/movies/sharp-corner-2025',
  '/series/digimon-beatbreak',
  '/series/digimon-beatbreak/ep/24',
];

for (const route of routes) {
  test(`detail route ${route} renders without app error`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
  });
}

test('movie detail page exposes a unit community panel', async ({ page }) => {
  await page.goto('/movies/sharp-corner-2025', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('body')).toContainText('Bahas Movie');
  await expect(page.locator('body')).toContainText('Suka');
  await expect(page.locator('body')).toContainText('Komentar');
});

test('comic title and chapter routes render without app error when catalog data exists', async ({ page, request }) => {
  const fixture = await findComicFixture(request);
  if (!fixture) {
    test.skip(true, 'Comic catalog API returned no fixture data.');
    return;
  }

  const titleResponse = await page.goto(`/comics/${fixture.slug}`, { waitUntil: 'domcontentloaded' });

  expect(titleResponse?.status()).toBe(200);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);

  if (!fixture.chapterHref) {
    test.skip(true, 'Comic catalog fixture has no readable chapter link.');
    return;
  }

  const chapterResponse = await page.goto(fixture.chapterHref, { waitUntil: 'domcontentloaded' });

  expect(chapterResponse?.status()).toBe(200);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error|Chapter tidak ditemukan/i);
});

test('series title page exposes aggregate community panel', async ({ page }) => {
  await page.goto('/series/digimon-beatbreak', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('Obrolan seputar');
  await expect(page.locator('body')).toContainText('Unit aktif');
});

test('comic title page exposes aggregate community panel when catalog data exists', async ({ page, request }) => {
  const fixture = await findComicFixture(request);
  if (!fixture) {
    test.skip(true, 'Comic catalog API returned no fixture data.');
    return;
  }

  await page.goto(`/comics/${fixture.slug}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('Obrolan seputar');
  await expect(page.locator('body')).toContainText('Unit aktif');
});

test('series episode page exposes unit community panel', async ({ page }) => {
  await page.goto('/series/digimon-beatbreak/ep/24', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('Suka');
  await expect(page.locator('body')).toContainText('Bahas Episode');
});

test('series episode desktop layout keeps watch body before the footer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const response = await page.goto('/series/digimon-beatbreak/ep/24', { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  await expect(page.locator('body')).toContainText('Bahas Episode');
  await page.waitForFunction(() => {
    const footer = document.querySelector('footer');
    const community = Array.from(document.querySelectorAll('section[data-theme]')).some((section) => {
      const rect = section.getBoundingClientRect();

      return rect.width > 0 && rect.height > 0 && section.textContent?.includes('Bahas Episode');
    });

    return Boolean(footer && community);
  });

  const layout = await page.evaluate(() => {
    const footer = document.querySelector('footer');
    const community = Array.from(document.querySelectorAll('section[data-theme]'))
      .map((section) => ({ rect: section.getBoundingClientRect(), section }))
      .filter(({ rect, section }) => rect.width > 0 && rect.height > 0 && section.textContent?.includes('Bahas Episode'))
      .sort((a, b) => b.rect.bottom - a.rect.bottom)[0]?.section;

    if (!footer || !community) {
      return null;
    }

    const toDocumentRect = (element: Element) => {
      const rect = element.getBoundingClientRect();

      return {
        bottom: rect.bottom + window.scrollY,
        top: rect.top + window.scrollY,
      };
    };

    return {
      clientWidth: document.documentElement.clientWidth,
      community: toDocumentRect(community),
      footer: toDocumentRect(footer),
      scrollWidth: document.documentElement.scrollWidth,
    };
  });

  expect(layout).not.toBeNull();
  if (!layout) {
    return;
  }

  expect(layout.community.bottom).toBeLessThanOrEqual(layout.footer.top);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
});

test('comic chapter page exposes unit community panel when catalog data exists', async ({ page, request }) => {
  const fixture = await findComicFixture(request);
  if (!fixture?.chapterHref) {
    test.skip(true, 'Comic catalog API returned no fixture chapter data.');
    return;
  }

  await page.goto(fixture.chapterHref, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('Suka');
  await expect(page.locator('body')).toContainText('Bahas');
});
