import { expect, test } from '@playwright/test';

const routes = [
  '/movies/sharp-corner-2025',
  '/series/digimon-beatbreak',
  '/series/digimon-beatbreak/ep/24',
  '/comics/oukoku-e-tsuzuku-michi-dorei-kenshi-no-nariagari-harem-life',
  '/comics/oukoku-e-tsuzuku-michi-dorei-kenshi-no-nariagari-harem-life/chapters/oukoku-e-tsuzuku-michi-dorei-kenshi-no-nariagari-harem-life-chapter-89',
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

  await expect(page.locator('body')).toContainText('Talk about Movie');
  await expect(page.locator('body')).toContainText('Like this unit');
  await expect(page.locator('body')).toContainText('Comment');
});

test('series and comic title pages expose aggregate community panels', async ({ page }) => {
  await page.goto('/series/digimon-beatbreak', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('Community around');
  await expect(page.locator('body')).toContainText('Active units');

  await page.goto('/comics/oukoku-e-tsuzuku-michi-dorei-kenshi-no-nariagari-harem-life', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('Community around');
  await expect(page.locator('body')).toContainText('Active units');
});

test('series episode and comic chapter pages expose unit community panels', async ({ page }) => {
  await page.goto('/series/digimon-beatbreak/ep/24', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('Like this unit');
  await expect(page.locator('body')).toContainText('Talk about Episode');

  await page.goto('/comics/oukoku-e-tsuzuku-michi-dorei-kenshi-no-nariagari-harem-life/chapters/oukoku-e-tsuzuku-michi-dorei-kenshi-no-nariagari-harem-life-chapter-89', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('Like this unit');
  await expect(page.locator('body')).toContainText('Talk about');
});
