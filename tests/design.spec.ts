import { test, expect } from '@playwright/test';

test('new finder switches between model and VIN workflows', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'По модели', exact: true }).click();
  await page.getByRole('combobox', { name: 'Модель автомобиля', exact: true }).selectOption('КАМАЗ-43118');
  await page.getByRole('combobox', { name: 'Группа запчастей', exact: true }).selectOption('transmission');
  await page.getByRole('button', { name: 'Найти запчасти', exact: true }).click();
  await expect(page).toHaveURL(/model=.*category=transmission/);
  await expect(page.locator('.product-card')).toHaveCount(3);
  await page.goto('/');
  await page.getByRole('tab', { name: 'По VIN', exact: true }).click();
  await page.getByLabel('VIN или номер шасси').fill('TESTVIN12345678901');
  await page.getByRole('button', { name: 'Запросить подбор' }).click();
  await expect(page.getByRole('dialog', { name: 'Подбор по VIN' })).toBeVisible();
  await expect(page.locator('dialog textarea')).toHaveValue('VIN автомобиля: TESTVIN12345678901');
});

test('headlines fit narrow screens and reduced motion is respected', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const lines = await page.locator('.hero-title-line').evaluateAll(nodes => nodes.map(n => ({ visible: n.clientWidth, text: n.scrollWidth })));
    expect(lines.every(n => n.text <= n.visible + 1), `Headline at ${width}px: ${JSON.stringify(lines)}`).toBeTruthy();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await expect(page.locator('.ticker-track')).toHaveCSS('animation-name', 'none');
    if (testInfo.project.name === 'desktop' && [390, 1440].includes(width)) await page.screenshot({ path: `docs/redesign-first-screen-${width}.png` });
  }
});
