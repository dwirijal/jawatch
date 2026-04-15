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
  await expect(nav.getByRole('button', { name: /open search/i })).toBeVisible();
  await expect(nav).not.toContainText(/Collection|Comics|Novel|Short Series/i);
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
