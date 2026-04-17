import { expect, test } from '@playwright/test';

const routes = [
  '/movies/sharp-corner-2025',
  '/series/digimon-beatbreak',
  '/series/one-piece/episodes/one-piece-episode-1155',
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
