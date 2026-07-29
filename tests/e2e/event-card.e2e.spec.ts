import { test, expect } from '@playwright/test'

const CARD = 'http://localhost:3000/sobytiya/sobytie-rubli-demo'

// Демо-событие: билет 15 000 ₽, допки — трансфер 1 000 ₽ и страховка 500 ₽
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

    await expect(page.locator('h1')).toHaveText('Демо-событие: рублёвая цена')
    await expect(page.getByText('Италия, Милан')).toBeVisible()
    await expect(page.getByText('12 сент 2026')).toBeVisible()
  })

  test('несуществующий слаг отдаёт 404', async ({ page }) => {
    const res = await page.goto('http://localhost:3000/sobytiya/net-takogo-tura')

    expect(res?.status()).toBe(404)
  })

  test('допка увеличивает итог и попадает в состав', async ({ page }) => {
    await page.goto(CARD)
    await expect(total(page)).toHaveText('15 000 ₽')

    await addon(page, 'Трансфер').click()

    await expect(total(page)).toHaveText('16 000 ₽')
    await expect(page.getByTestId('order-items')).toContainText('Трансфер')
  })

  test('снятая допка возвращает прежний итог', async ({ page }) => {
    await page.goto(CARD)
    const transfer = addon(page, 'Трансфер')

    await transfer.click()
    await expect(total(page)).toHaveText('16 000 ₽')

    await transfer.click()
    await expect(total(page)).toHaveText('15 000 ₽')
    await expect(page.getByTestId('order-items')).not.toContainText('Трансфер')
  })

  test('несколько допок складываются', async ({ page }) => {
    await page.goto(CARD)

    await addon(page, 'Трансфер').click()
    await addon(page, 'Страховка').click()

    await expect(total(page)).toHaveText('16 500 ₽')
  })

  test('заявка уходит вместе с собранным составом', async ({ page }) => {
    await page.goto(CARD)
    await addon(page, 'Трансфер').click()

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
    expect(body.orderTotal).toBe(16000)
    expect(body.orderItems).toHaveLength(2)
    expect(body.orderItems[1]).toMatchObject({ label: 'Трансфер', price: 1000 })

    await expect(page.getByText('Заявка принята')).toBeVisible()
  })
})
