import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  // Админку Payload dev-сервер компилирует при первом обращении, и на холодную
  // это дольше стандартных пяти секунд ожидания. Без запаса тест падает не
  // из-за кода, а из-за того, каким по счёту он оказался в прогоне.
  const VISIBLE = { timeout: 30_000 }

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    // Селектор по локали не завязан: админка русифицирована (i18n ru)
    await expect(page.locator('.dashboard').first()).toBeVisible(VISIBLE)
  })

  test('на главной админки видна витрина заявок', async () => {
    await page.goto('http://localhost:3000/admin')

    const stats = page.locator('section', { hasText: 'Заявки' }).first()
    await expect(stats).toBeVisible(VISIBLE)
    await expect(stats).toContainText('не обработано')
    await expect(stats).toContainText('за неделю')
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    // Payload дописывает к списку ?depth=1&limit=10 — точное сравнение гонится с редиректом
    await expect(page).toHaveURL(/\/admin\/collections\/users/)
    await expect(page.locator('.collection-list').first()).toBeVisible(VISIBLE)
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible(VISIBLE)
  })
})
