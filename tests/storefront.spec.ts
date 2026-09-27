import {test,expect} from '@playwright/test';
test('all key pages render without overflow or runtime errors',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const path of ['/','/catalog','/product/cylinder-head','/cart','/account','/favorites','/delivery','/guarantee','/about','/contacts','/privacy','/admin']){
  await page.goto(path);await expect(page.locator('main h1').first()).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  if(path==='/'){await page.evaluate(()=>document.fonts.ready);await page.locator('.hero').evaluate(el=>Promise.all(el.getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished)));await page.screenshot({path:`docs/home-${testInfo.project.name}.png`,fullPage:true});}
 }
 expect(errors).toEqual([]);
});
test('search matches normalized OEM and empty filters can recover',async({page})=>{
 await page.goto('/catalog?q=0%20445%20120%20153');await expect(page.locator('.product-card')).toHaveCount(1);await expect(page.locator('.product-name')).toContainText('Форсунка');
 await page.goto('/catalog?q=does-not-exist');await expect(page.getByText('Пока ничего не нашли')).toBeVisible();await page.getByRole('button',{name:'Сбросить фильтры',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(12);
 await page.getByRole('button',{name:'Показать ещё'}).click();await expect(page.locator('.product-card')).toHaveCount(15);
});
test('favorites and quantity persist, checkout order can be managed',async({page})=>{
 await page.goto('/product/turbo-tkr');await page.getByRole('button',{name:'Добавить товар в избранное'}).click();await page.getByRole('button',{name:'Увеличить количество'}).click();await page.getByRole('button',{name:'В корзину',exact:true}).click();
 await page.goto('/cart');await expect(page.getByRole('spinbutton',{name:'Количество'})).toHaveValue('2');await expect(page.locator('.summary-total')).toContainText('37');await page.reload();await expect(page.getByRole('spinbutton',{name:'Количество'})).toHaveValue('2');
 await page.getByRole('link',{name:'Перейти к оформлению'}).click();await page.getByLabel('Контактное лицо').fill('Тестовый покупатель');await page.getByLabel('Телефон',{exact:true}).fill('+79990000000');await page.getByLabel('Электронная почта для документов').fill('demo@example.test');await page.getByLabel('Наименование организации').fill('Тестовая компания');await page.getByLabel('ИНН',{exact:true}).fill('1234567890');await page.getByLabel('Желаемый пункт выдачи / район').fill('Центральный район');await page.getByRole('button',{name:'Посмотреть пример расчёта'}).click();await expect(page.getByText('Тестовый тариф:',{exact:false})).toBeVisible();await page.locator('.consent input').check();await page.getByRole('button',{name:'Оформить демо-заказ'}).click();await expect(page.locator('.order-success-header h1')).toContainText('Заказ КД-');
 await page.goto('/account');await expect(page.locator('.order-card')).toHaveCount(1);await page.goto('/admin');await page.getByRole('button',{name:'Заказы',exact:true}).click();await page.locator('tbody select').selectOption('Подтверждён');await page.goto('/account');await expect(page.locator('.status-pill')).toHaveText('Подтверждён');await page.goto('/cart');await expect(page.getByText('Здесь будут ваши запчасти')).toBeVisible();await page.goto('/favorites');await expect(page.locator('.product-card')).toHaveCount(1);
});
test('CSV import validates duplicates and updates storefront prices',async({page})=>{
 await page.goto('/admin');await page.getByRole('button',{name:'Импорт прайса'}).click();
 const header='Артикул;Название;Цена;Остаток;Производитель;Категория\n';const row='740.21-1118010;Турбокомпрессор тест;19500;7;Турботехника;Двигатель\n';
 await page.getByLabel('Загрузить прайс').setInputFiles({name:'invalid.csv',mimeType:'text/csv',buffer:Buffer.from(header+row+row)});await expect(page.getByText('Дубликат артикула и производителя')).toBeVisible();await expect(page.getByRole('button',{name:'Применить импорт'})).toBeDisabled();
 await page.getByLabel('Загрузить прайс').setInputFiles({name:'valid.csv',mimeType:'text/csv',buffer:Buffer.from(header+row)});await page.getByRole('button',{name:'Применить импорт'}).click();await expect(page.getByText('Обновлено: 1.',{exact:false})).toBeVisible();await page.goto('/product/turbo-tkr');await expect(page.locator('main h1')).toHaveText('Турбокомпрессор тест');await expect(page.locator('.detail-buy>strong')).toContainText('19');await expect(page.locator('.detail-info>.stock')).toContainText('7 шт.');
});
test('content edits and one-click request work in local demo',async({page})=>{
 await page.goto('/admin');await page.getByRole('button',{name:'Главная и баннеры'}).click();await page.getByRole('textbox',{name:'Заголовок главного экрана',exact:true}).fill('Детали для вашего дела');await page.getByRole('button',{name:'Сохранить изменения'}).click();await page.goto('/');await expect(page.locator('.hero h1')).toHaveText('Детали для вашего дела');await page.goto('/product/turbo-tkr');await page.getByRole('button',{name:'Купить в один клик',exact:true}).click();await page.getByLabel('Ваше имя').fill('Демо');await page.getByLabel('Телефон',{exact:true}).fill('+79990000000');await page.locator('dialog input[type=checkbox]').check();await page.getByRole('button',{name:'Сохранить заказ в 1 клик'}).click();await expect(page.getByText('Заявка сохранена в демо')).toBeVisible();
});
test('Excel file is read and imported through preview',async({page})=>{
 await page.goto('/admin');await page.getByRole('button',{name:'Импорт прайса'}).click();await page.getByLabel('Загрузить прайс').setInputFiles('tests/fixtures/price.xlsx');await expect(page.getByText('Турбокомпрессор из Excel')).toBeVisible();await page.getByRole('button',{name:'Применить импорт'}).click();await expect(page.getByText('Обновлено: 1.',{exact:false})).toBeVisible();await page.goto('/product/turbo-tkr');await expect(page.locator('main h1')).toHaveText('Турбокомпрессор из Excel');await expect(page.locator('.detail-buy>strong')).toContainText('20');
});
