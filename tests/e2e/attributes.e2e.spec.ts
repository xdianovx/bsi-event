import { test, expect } from '@playwright/test'

const URL = 'http://localhost:3000/atributy'

test.describe('Витрина справочника атрибутов', () => {
  test('показывает засиженные записи', async ({ page }) => {
    await page.goto(URL)

    await expect(page.locator('h1')).toHaveText('Атрибуты')
    await expect(page.getByText('Билеты', { exact: true })).toBeVisible()
    await expect(page.getByText('Гид', { exact: true })).toBeVisible()
    await expect(page.locator('main ul > li')).toHaveCount(9)
  })

  test('показывает описание и область применения', async ({ page }) => {
    await page.goto(URL)

    const hotel = page.locator('main ul > li').filter({ hasText: 'Отель' }).first()
    await expect(hotel).toContainText('Проживание на даты тура')
    // Отель осмыслен и как состав тура, и как удобство номера
    await expect(hotel).toContainText('Тур')
    await expect(hotel).toContainText('Номер')
  })

  test('страница служебная: закрыта от индексации', async ({ page }) => {
    await page.goto(URL)

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex.*nofollow/,
    )
  })

  test('атрибут без иконки показывается названием', async ({ page }) => {
    await page.goto(URL)

    // Сид иконок не грузит: карточки есть, а масок ещё нет — и это рабочее состояние
    const tickets = page.locator('main ul > li').filter({ hasText: 'Билеты' }).first()
    await expect(tickets).toBeVisible()
    await expect(tickets).toContainText('Билеты')
  })

  test('витрины нет в sitemap.xml', async ({ request }) => {
    const response = await request.get('http://localhost:3000/sitemap.xml')

    expect(await response.text()).not.toContain('/atributy')
  })
})
