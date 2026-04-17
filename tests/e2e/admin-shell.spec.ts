import { expect, test } from '@playwright/test';

test('admin titles and units routes render a shell', async ({ page }) => {
  await page.goto('/admin/titles', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText(/Titles/i);

  await page.goto('/admin/units', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText(/Units/i);
});
