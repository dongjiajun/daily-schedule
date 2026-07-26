import { test, expect } from '@playwright/test'

test.describe('Task Board', () => {
  test('导航到任务看板', async ({ page }) => {
    await page.goto('/todo')
    await expect(page).toHaveURL(/\/todo/)
  })

  test('任务看板页面加载', async ({ page }) => {
    await page.goto('/todo')
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
  })
})
