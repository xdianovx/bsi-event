import { test, expect } from '@playwright/test'

const CARD = 'http://localhost:3000/sobytiya/coldplay-berlin-2026'

// Демо-событие из сида: цена «от» 1 140 €, докупаются виза 180 € и экскурсии 90 €
const total = (page: import('@playwright/test').Page) => page.getByTestId('order-total')

/**
 * Кликаем по подписи, а не по роли checkbox: HeroUI рисует свой контрол поверх
 * инпута, и он перехватывает указатель. Через label переключение штатное.
 */
const addon = (page: import('@playwright/test').Page, label: string) =>
  page.locator('label').filter({ hasText: label })

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

  test('допка увеличивает итог и попадает в состав', async ({ page }) => {
    await page.goto(CARD)
    await expect(total(page)).toHaveText('1 140 €')

    await addon(page, 'Виза').click()

    await expect(total(page)).toHaveText('1 320 €')
    await expect(page.getByTestId('order-items')).toContainText('Виза')
  })

  test('снятая допка возвращает прежний итог', async ({ page }) => {
    await page.goto(CARD)
    const transfer = addon(page, 'Виза')

    await transfer.click()
    await expect(total(page)).toHaveText('1 320 €')

    await transfer.click()
    await expect(total(page)).toHaveText('1 140 €')
    await expect(page.getByTestId('order-items')).not.toContainText('Виза')
  })

  test('несколько допок складываются', async ({ page }) => {
    await page.goto(CARD)

    await addon(page, 'Виза').click()
    await addon(page, 'Экскурсии').click()

    await expect(total(page)).toHaveText('1 410 €')
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
    expect(body.orderTotal).toBe(1320)
    expect(body.orderItems).toHaveLength(2)
    expect(body.orderItems[1]).toMatchObject({ label: 'Виза', price: 180 })

    await expect(page.getByText('Заявка принята')).toBeVisible()
  })
})
