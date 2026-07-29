import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('Главная', () => {
  test('первый экран говорит про визу и ведёт в каталог', async ({ page }) => {
    await page.goto(BASE)

    await expect(page.locator('h1')).toContainText('визой')
    await page.getByRole('link', { name: 'Смотреть все туры' }).click()
    await page.waitForURL(`${BASE}/tury`)
  })

  test('фильтр с главной уводит в каталог с параметрами', async ({ page }) => {
    await page.goto(BASE)

    // Форма фильтра одна и та же с каталогом и отправляет GET на /tury
    const filters = page.getByLabel('Фильтры каталога')
    await expect(filters).toBeVisible()

    await filters.getByRole('button', { name: 'Показать' }).click()
    await page.waitForURL(/\/tury/)
  })

  test('показывает ближайшие поездки карточками', async ({ page }) => {
    await page.goto(BASE)

    const section = page.locator('section', { hasText: 'Ближайшие поездки' }).first()
    await expect(section.locator('.card')).not.toHaveCount(0)
  })

  test('на месте блоки доверия, шаги и FAQ', async ({ page }) => {
    await page.goto(BASE)

    await expect(page.getByText('Визу оформляем мы')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Как это работает' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Частые вопросы' })).toBeVisible()
  })

  test('вопрос в FAQ раскрывается', async ({ page }) => {
    await page.goto(BASE)

    const answer = page.getByText('возвращаем стоимость поездки', { exact: false })
    await expect(answer).toBeHidden()

    await page.getByRole('button', { name: 'А если визу не дадут?' }).click()
    await expect(answer).toBeVisible()
  })

  test('главная в карте сайта и открыта для индексации', async ({ page }) => {
    const res = await page.goto(`${BASE}/sitemap.xml`)
    const xml = (await res?.text()) ?? ''

    expect(xml).toContain('<loc>http://localhost:3000/</loc>')
  })
})
