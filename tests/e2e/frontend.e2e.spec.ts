import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('главная открывается под брендом проекта', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/BSI Events/)
  })

  test('страница направлений отдаёт список стран', async ({ page }) => {
    await page.goto('http://localhost:3000/napravleniya')

    await expect(page.locator('h1')).toHaveText('Направления')
  })
})
