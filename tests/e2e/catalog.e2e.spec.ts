import { test, expect } from '@playwright/test'

const CATALOG = 'http://localhost:3000/sobytiya'

// Карточка — Card из HeroUI, он рендерит div с классом .card
const cards = (page: import('@playwright/test').Page) => page.locator('main ul > li .card')

test.describe('Каталог событий', () => {
  test('рендерит карточки событий', async ({ page }) => {
    await page.goto(CATALOG)

    await expect(page.locator('h1')).toHaveText('События')
    await expect(cards(page).first()).toBeVisible()
    expect(await cards(page).count()).toBeGreaterThan(0)
  })

  test('фильтр по категории сужает список', async ({ page }) => {
    await page.goto(CATALOG)
    const total = await cards(page).count()

    await page.goto(`${CATALOG}?category=sport`)
    const filtered = await cards(page).count()

    expect(filtered).toBeLessThan(total)
    expect(filtered).toBeGreaterThan(0)
  })

  test('фильтр по региону сужает список', async ({ page }) => {
    await page.goto(`${CATALOG}?region=evropa`)
    expect(await cards(page).count()).toBeGreaterThan(0)

    await page.goto(`${CATALOG}?region=net-takogo-regiona`)
    await expect(cards(page)).toHaveCount(0)
  })

  test('фильтр по городу оставляет события только этого города', async ({ page }) => {
    await page.goto(`${CATALOG}?city=milan`)

    await expect(cards(page)).toHaveCount(1)
    await expect(cards(page).first()).toContainText('Милан')
  })

  test('фильтр по цене отбирает по рублёвому эквиваленту', async ({ page }) => {
    // Демо-данные: 15 000 ₽ и 300 $ (≈ 30 000 ₽). Порог 20 000 оставляет только первое.
    await page.goto(`${CATALOG}?maxPrice=20000`)

    await expect(cards(page)).toHaveCount(1)
    await expect(cards(page).first()).toContainText('15 000')
  })

  test('сортировка по цене ставит дешёвое первым', async ({ page }) => {
    await page.goto(`${CATALOG}?sort=price`)

    await expect(cards(page).first()).toContainText('15 000')
  })

  test('сброс фильтров возвращает полный список', async ({ page }) => {
    await page.goto(`${CATALOG}?category=sport`)
    const filtered = await cards(page).count()

    await page.getByRole('link', { name: 'Сбросить' }).click()
    await page.waitForURL(CATALOG)

    expect(await cards(page).count()).toBeGreaterThan(filtered)
  })

  test('отфильтрованная выдача закрыта от индексации, чистая — открыта', async ({ page }) => {
    await page.goto(CATALOG)
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)

    await page.goto(`${CATALOG}?category=sport`)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test('пустая выдача объясняет, что делать дальше', async ({ page }) => {
    await page.goto(`${CATALOG}?maxPrice=1`)

    await expect(cards(page)).toHaveCount(0)
    await expect(page.getByText('Под эти условия ничего нет')).toBeVisible()
  })
})

test.describe('Sitemap', () => {
  test('содержит каталог и события, но не фильтры', async ({ page }) => {
    const res = await page.goto('http://localhost:3000/sitemap.xml')
    const xml = (await res?.text()) ?? ''

    expect(xml).toContain('/sobytiya')
    expect(xml).toContain('/sobytiya/sobytie-rubli-demo')

    // Фильтры — дубли каталога, в карту сайта не попадают. Проверяем сами адреса:
    // '?' есть и в XML-декларации, поэтому искать по всему документу нельзя.
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])
    expect(urls.length).toBeGreaterThan(0)
    expect(urls.filter((u) => u.includes('?'))).toEqual([])
  })
})
