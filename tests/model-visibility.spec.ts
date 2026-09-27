import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const manifest: Record<string, {published?: boolean}> = JSON.parse(readFileSync('src/model-manifest.json', 'utf8'));

test('unpublished models keep the photo gallery without advertising or loading 3D', async ({page}) => {
  const hidden = Object.entries(manifest).filter(([, model]) => !model.published).map(([id]) => id);
  test.skip(!hidden.length, 'All catalog models have been published.');
  const modelRequests: string[] = [];
  page.on('request', request => {
    if (/\.glb(?:\?|$)/.test(request.url())) modelRequests.push(request.url());
  });
  await page.goto('/catalog');
  for (const id of hidden) {
    const card = page.locator('.product-card').filter({has: page.locator(`a[href="/product/${id}"]`)});
    await expect(card.locator('.product-3d-badge')).toHaveCount(0);
  }
  for (const id of hidden) {
    await page.goto(`/product/${id}`);
    const photo = page.locator('.detail-main-image>img');
    await expect(photo).toBeVisible();
    await expect.poll(() => photo.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.getByRole('button', {name: 'Смотреть товар в 3D'})).toHaveCount(0);
    await expect(page.locator('.product-3d-dialog')).toHaveCount(0);
    await expect(page.getByRole('button', {name: 'В корзину', exact: true})).toBeVisible();
  }
  expect(modelRequests).toEqual([]);
});
