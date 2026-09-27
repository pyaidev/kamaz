import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const manifest = JSON.parse(readFileSync('src/model-manifest.json', 'utf8'));

test.use({launchOptions: {args: ['--enable-unsafe-swiftshader']}});

test.beforeEach(() => {
  test.skip(manifest['turbo-tkr']?.published !== true, 'The reconstructed turbo model is unpublished because of poor visual quality.');
});

test('product model loads on demand and supports rotation, zoom and keyboard dismissal', async ({page}, testInfo) => {
  const errors: string[] = [];
  const modelRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {if (request.url().endsWith('.glb')) modelRequests.push(request.url());});
  await page.goto('/product/turbo-tkr');
  const opener = page.getByRole('button', {name: 'Смотреть товар в 3D'});
  await expect(opener).toBeVisible();
  expect(modelRequests).toHaveLength(0);
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const stage = dialog.getByRole('group', {name: '3D-модель товара'});
  await expect(stage).toHaveAttribute('data-status', 'ready', {timeout: 20000});
  await expect(dialog.getByText('AI-реконструкция по фото.', {exact: false})).toBeVisible();
  expect(modelRequests.length).toBeGreaterThan(0);
  await expect(dialog.getByRole('button', {name: 'Автоматическое вращение'})).toHaveAttribute('aria-pressed', 'false');
  const initial = await stage.screenshot();
  await dialog.getByRole('button', {name: 'Приблизить модель'}).click();
  await expect.poll(async () => (await stage.screenshot()).equals(initial)).toBe(false);
  await dialog.getByRole('button', {name: 'Сбросить ракурс'}).click();
  await stage.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  await dialog.getByRole('button', {name: 'Автоматическое вращение'}).click();
  await expect(dialog.getByRole('button', {name: 'Остановить вращение'})).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', {name: 'Сбросить ракурс'}).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({path: `docs/product-3d-${testInfo.project.name}.png`});
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(page.locator('.product-3d-stage')).toHaveAttribute('data-status', 'ready', {timeout: 20000});
  await page.getByRole('button', {name: 'Закрыть 3D-просмотр'}).click();
  await page.getByRole('button', {name: 'В корзину', exact: true}).click();
  await page.goto('/cart');
  await expect(page.getByRole('spinbutton', {name: 'Количество'})).toHaveValue('1');
  expect(errors).toEqual([]);
});

test('failed model download offers retry and photos remain available', async ({page}) => {
  await page.route('**/models/*.glb', route => route.fulfill({status: 503, body: 'unavailable'}));
  await page.goto('/product/turbo-tkr');
  await page.getByRole('button', {name: 'Смотреть товар в 3D'}).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось открыть 3D');
  await page.unroute('**/models/*.glb');
  await page.getByRole('button', {name: 'Попробовать снова'}).click();
  await expect(page.locator('.product-3d-stage')).toHaveAttribute('data-status', 'ready', {timeout: 20000});
  await page.getByRole('button', {name: 'Закрыть 3D-просмотр'}).click();
  await expect(page.locator('.detail-main-image>img')).toBeVisible();
});

test('unsupported WebGL provides a usable fallback instead of a broken canvas', async ({page}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto('/product/turbo-tkr');
  await page.getByRole('button', {name: 'Смотреть товар в 3D'}).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось открыть 3D');
  await page.getByRole('button', {name: 'Вернуться к фотографиям'}).click();
  await expect(page.locator('.detail-main-image>img')).toBeVisible();
});
