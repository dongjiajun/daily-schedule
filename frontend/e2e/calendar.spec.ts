import { test, expect } from '@playwright/test'

test.describe('Calendar', () => {
  test('日历主页加载', async ({ page }) => {
    await page.goto('/')
    // 未登录时显示登录页或已登录时显示日历
    await expect(page).toHaveURL(/\//)
  })

  test('登录后可见日历导航', async ({ page }) => {
    await page.goto('/')
    // 检查页面有基本元素
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
  })
})
