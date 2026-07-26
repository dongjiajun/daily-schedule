import { test, expect } from '@playwright/test'

test.describe('Pet', () => {
  test('宠物页面加载', async ({ page }) => {
    await page.goto('/pet')
    await expect(page).toHaveURL(/\/pet/)
  })

  test('宠物页面有内容', async ({ page }) => {
    await page.goto('/pet')
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
  })
})
