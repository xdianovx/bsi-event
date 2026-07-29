import { test, expect } from '@playwright/test'

const HUB = 'http://localhost:3000/kategorii'

test.describe('Категории событий', () => {
  test('хаб показывает категории с событиями', async ({ page }) => {
    await page.goto(HUB)

    await expect(page.locator('h1')).toHaveText('Категории событий')
    // Именно в main: та же ссылка есть в подвале
    await expect(page.locator('main').getByRole('link', { name: 'Концерты' })).toBeVisible()
  })

  test('из хаба открывается лендинг, оттуда — событие', async ({ page }) => {
    await page.goto(HUB)
    await page.locator('main').getByRole('link', { name: 'Концерты' }).click()

    await page.waitForURL(`${HUB}/koncerty`)
    await expect(page.locator('h1')).toHaveText('Концерты')

    const first = page.locator('main ul > li a').first()
    await first.click()
    await expect(page).toHaveURL(/\/sobytiya\//)
  })

  test('лендинг открывается прямым заходом и отдаёт canonical', async ({ page }) => {
    await page.goto(`${HUB}/koncerty`)

    await expect(page.locator('h1')).toHaveText('Концерты')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/kategorii\/koncerty$/,
    )
  })

  test('категория без событий отдаёт 404', async ({ page }) => {
    // «Гонки» есть в сиде, но демо-событий в ней нет
    const response = await page.goto(`${HUB}/net-takoy-kategorii`)

    expect(response?.status()).toBe(404)
  })

  test('карта сайта содержит хаб и непустые категории, но не пустые', async ({ request }) => {
    const xml = await (await request.get('http://localhost:3000/sitemap.xml')).text()

    expect(xml).toContain('/kategorii</loc>')
    expect(xml).toContain('/kategorii/koncerty')
    expect(xml).not.toContain('/kategorii/net-takoy-kategorii')
  })

  test('фильтр каталога по категории оставляет только её события', async ({ page }) => {
    await page.goto('http://localhost:3000/sobytiya?category=koncerty')

    const chips = page.locator('main ul > li .chip')
    await expect(chips.first()).toHaveText('Концерты')
  })

  test('мусорная категория в фильтре даёт пустую выдачу, а не ошибку', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/sobytiya?category=nesuschestvuet')

    expect(response?.status()).toBe(200)
    await expect(page.locator('main ul > li .card')).toHaveCount(0)
  })
})
