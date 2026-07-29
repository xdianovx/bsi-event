import { test, expect } from '@playwright/test'

const CARD = 'http://localhost:3000/sobytiya/coldplay-berlin-2026'

// Демо-событие из сида. Цены на странице — рублёвые, посчитанные по курсу ЦБ,
// поэтому в ожиданиях не фиксируем конкретные суммы: курс меняется каждый день.
const total = (page: import('@playwright/test').Page) => page.getByTestId('order-total')

/**
 * Кликаем по подписи, а не по роли checkbox: HeroUI рисует свой контрол поверх
 * инпута, и он перехватывает указатель. Через label переключение штатное.
 */
const addon = (page: import('@playwright/test').Page, label: string) =>
  page.locator('label').filter({ hasText: label })

/** «104 221 ₽» → 104221: сравниваем числа, а не строки с неразрывными пробелами. */
const amount = async (locator: ReturnType<typeof total>) =>
  Number(((await locator.textContent()) ?? '').replace(/[^\d]/g, ''))

test.describe('Карточка события', () => {
  test('показывает название, место и дату', async ({ page }) => {
    await page.goto(CARD)

    await expect(page.locator('h1')).toHaveText('Coldplay в Берлине')
    await expect(page.getByText('Германия, Берлин')).toBeVisible()
    await expect(page.getByText('12 сент 2026')).toBeVisible()
  })

  test('несуществующий слаг отдаёт 404', async ({ page }) => {
    const res = await page.goto('http://localhost:3000/sobytiya/net-takogo-tura')

    expect(res?.status()).toBe(404)
  })

  test('цены на странице — рублёвые', async ({ page }) => {
    await page.goto(CARD)

    await expect(total(page)).toContainText('₽')
    await expect(page.getByRole('main')).not.toContainText('€')
  })

  test('допка увеличивает итог и попадает в состав', async ({ page }) => {
    await page.goto(CARD)
    const before = await amount(total(page))

    await addon(page, 'Виза').click()

    expect(await amount(total(page))).toBeGreaterThan(before)
    await expect(page.getByTestId('order-items')).toContainText('Виза')
  })

  test('снятая допка возвращает прежний итог', async ({ page }) => {
    await page.goto(CARD)
    const visa = addon(page, 'Виза')
    const before = await amount(total(page))

    await visa.click()
    expect(await amount(total(page))).toBeGreaterThan(before)

    await visa.click()
    expect(await amount(total(page))).toBe(before)
    await expect(page.getByTestId('order-items')).not.toContainText('Виза')
  })

  test('несколько допок складываются', async ({ page }) => {
    await page.goto(CARD)
    const before = await amount(total(page))

    await addon(page, 'Виза').click()
    const withVisa = await amount(total(page))

    await addon(page, 'Экскурсии').click()
    const withBoth = await amount(total(page))

    expect(withVisa).toBeGreaterThan(before)
    expect(withBoth).toBeGreaterThan(withVisa)
  })

  test('заявка уходит вместе с собранным составом', async ({ page }) => {
    await page.goto(CARD)
    await addon(page, 'Виза').click()

    // Ловим тело запроса: состав должен уехать копией, а не ссылкой на событие
    const request = page.waitForRequest(
      (r) => r.url().includes('/api/leads') && r.method() === 'POST',
    )

    // Именно кнопка на карточке: такая же есть в шапке сайта
    await page.getByRole('main').getByRole('button', { name: 'Оставить заявку' }).click()
    await page.getByLabel('Имя').fill('Тестовый Иван')
    await page.getByLabel('Телефон').fill('+7 900 000-00-00')
    await page.getByRole('button', { name: 'Отправить' }).click()

    const body = JSON.parse((await request).postData() ?? '{}')

    expect(body.name).toBe('Тестовый Иван')
    expect(body.orderCurrency).toBe('rub')
    expect(body.orderItems).toHaveLength(2)
    expect(body.orderItems[1].label).toBe('Виза')
    // Сумма — рублёвая и равна сумме позиций, а не цене в валюте события
    expect(body.orderTotal).toBe(body.orderItems[0].price + body.orderItems[1].price)

    await expect(page.getByText('Заявка принята')).toBeVisible()
  })
})
