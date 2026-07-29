import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('Шапка и подвал', () => {
  test('шапка есть на страницах и ведёт в каталог и направления', async ({ page }) => {
    await page.goto(`${BASE}/sobytiya`)
    const header = page.getByRole('banner')

    await expect(header.getByRole('link', { name: 'BSI Events' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'События' })).toBeVisible()

    await header.getByRole('link', { name: 'Направления' }).click()
    await page.waitForURL(`${BASE}/napravleniya`)
  })

  test('разделы, которых ещё нет, показаны, но не ссылки', async ({ page }) => {
    await page.goto(`${BASE}/napravleniya`)
    const header = page.getByRole('banner')

    // Раздел виден в навигации, но кликнуть нельзя: страницы нет, вести на 404 незачем
    await expect(header.getByText('О компании')).toBeVisible()
    await expect(header.getByRole('link', { name: 'О компании' })).toHaveCount(0)
  })

  test('подвал есть и содержит юридические разделы', async ({ page }) => {
    await page.goto(`${BASE}/napravleniya`)
    const footer = page.getByRole('contentinfo')

    await expect(footer.getByText('Политика конфиденциальности')).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Все события' })).toBeVisible()
  })
})

test.describe('Страница направлений', () => {
  test('показывает блок с событиями и число событий у страны', async ({ page }) => {
    await page.goto(`${BASE}/napravleniya`)

    const block = page.getByRole('heading', { name: 'Куда летим сейчас' })
    await expect(block).toBeVisible()

    const italy = page.getByRole('link', { name: /Италия/ }).first()
    await expect(italy).toContainText(/событи/)
  })

  test('страна без событий показана, но не ссылка', async ({ page }) => {
    await page.goto(`${BASE}/napravleniya`)

    await expect(page.getByRole('heading', { name: 'Все страны' })).toBeVisible()
    await expect(page.getByText('Франция', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Франция', exact: true })).toHaveCount(0)
  })
})
