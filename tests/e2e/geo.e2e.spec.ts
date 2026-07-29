import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000/napravleniya'

test.describe('География', () => {
  test('список направлений показывает регионы', async ({ page }) => {
    await page.goto(BASE)

    await expect(page.locator('h1')).toHaveText('Направления')
    await expect(page.getByRole('link', { name: 'Европа' })).toBeVisible()
  })

  test('регион ведёт к странам', async ({ page }) => {
    await page.goto(BASE)
    await page.getByRole('link', { name: 'Европа' }).click()

    await page.waitForURL(`${BASE}/evropa`)
    await expect(page.locator('h1')).toHaveText('Европа')
    await expect(page.getByRole('link', { name: /Италия/ })).toBeVisible()
  })

  test('страна показывает города и туры', async ({ page }) => {
    await page.goto(`${BASE}/evropa/italiya`)

    await expect(page.locator('h1')).toContainText('Италия')
    await expect(page.getByRole('link', { name: 'Милан' })).toBeVisible()
    await expect(page.locator('main ul > li .card')).not.toHaveCount(0)
  })

  test('флаг страны подставляется по коду ISO', async ({ page }) => {
    await page.goto(`${BASE}/evropa/italiya`)

    await expect(page.locator('h1 img')).toHaveAttribute('src', '/flags/4x3/it.svg')
  })

  test('город показывает только свои туры', async ({ page }) => {
    await page.goto(`${BASE}/evropa/italiya/milan`)

    await expect(page.locator('h1')).toHaveText('Милан')
    await expect(page.locator('main ul > li .card')).toHaveCount(1)
    await expect(page.locator('main ul > li .card').first()).toContainText('Милан')
  })

  test('хлебные крошки ведут вверх по цепочке', async ({ page }) => {
    await page.goto(`${BASE}/evropa/italiya/milan`)
    const crumbs = page.getByLabel('Хлебные крошки')

    await expect(crumbs.getByRole('link', { name: 'Направления' })).toBeVisible()
    await expect(crumbs.getByRole('link', { name: 'Европа' })).toBeVisible()
    await expect(crumbs.getByRole('link', { name: 'Италия' })).toBeVisible()

    await crumbs.getByRole('link', { name: 'Италия' }).click()
    await page.waitForURL(`${BASE}/evropa/italiya`)
  })

  test('несходящаяся цепочка отдаёт 404, а не чужую страницу', async ({ page }) => {
    // Италия существует, но не в этом регионе — адрес не должен открываться
    const wrongRegion = await page.goto(`${BASE}/net-takogo-regiona/italiya`)
    expect(wrongRegion?.status()).toBe(404)

    const wrongCountry = await page.goto(`${BASE}/evropa/net-takoy-strany/milan`)
    expect(wrongCountry?.status()).toBe(404)
  })

  test('страна и город без туров не открываются', async ({ page }) => {
    // Справочник заполнен целиком, но туров во Францию нет — страницы быть не должно
    const country = await page.goto(`${BASE}/evropa/frantsiya`)
    expect(country?.status()).toBe(404)

    const city = await page.goto(`${BASE}/evropa/frantsiya/parizh`)
    expect(city?.status()).toBe(404)
  })

  test('в списке направлений нет стран без туров', async ({ page }) => {
    await page.goto(`${BASE}/evropa`)

    await expect(page.getByRole('link', { name: /Италия/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Франция/ })).toHaveCount(0)
  })

  test('карта сайта содержит вложенные адреса и не содержит обрывочных', async ({ page }) => {
    const res = await page.goto('http://localhost:3000/sitemap.xml')
    const xml = (await res?.text()) ?? ''
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])

    expect(urls).toContain('http://localhost:3000/napravleniya/evropa/italiya/milan')

    // Страна без региона недостижима по адресу — в карте ей не место
    const napravleniya = urls.filter((u) => u.includes('/napravleniya/'))
    expect(napravleniya.every((u) => u.split('/napravleniya/')[1].length > 0)).toBe(true)

    // Как и страна без туров: её страница отдаёт 404
    expect(urls).not.toContain('http://localhost:3000/napravleniya/evropa/frantsiya')
  })
})
