import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  const uniqueUser = `e2e_${Date.now()}`
  const email = `${uniqueUser}@test.com`
  const password = 'test123456'

  test('注册新用户并登录', async ({ page }) => {
    await page.goto('/')

    // 切换到注册模式
    await page.click('text=去注册')

    // 填写注册表单
    await page.fill('input[placeholder="3-50 位字母/数字/下划线"]', uniqueUser)
    await page.fill('input[placeholder="your@email.com"]', email)
    // 密码输入框
    const passwordInputs = page.locator('input[placeholder="至少 8 位"]')
    await passwordInputs.fill(password)

    // 点击注册
    await page.click('text=创建账号')

    // 等待跳转到日历首页
    await expect(page.locator('text=欢迎回来')).not.toBeVisible({ timeout: 15_000 })
  })

  test('已注册用户登录', async ({ page }) => {
    await page.goto('/')

    // 填写登录表单
    await page.fill('input[placeholder="输入用户名或邮箱"]', uniqueUser)
    await page.fill('input[placeholder="输入密码"]', password)

    // 点击登录
    await page.click('text=登录')

    // 等待跳转
    await expect(page.locator('text=欢迎回来')).not.toBeVisible({ timeout: 15_000 })
  })
})
