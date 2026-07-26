import { test, expect } from '@playwright/test'

const uid = Date.now()
test.describe.serial('Authentication', () => {
  const username = `e2e_${uid}`
  const email = `e2e_${uid}@test.com`
  const password = 'test123456'

  test('注册新用户并登录', async ({ page }) => {
    await page.goto('/')

    // 切换到注册模式
    await page.click('text=去注册')

    // 填写注册表单
    await page.fill('input[placeholder="3-50 位字母/数字/下划线"]', username)
    await page.fill('input[placeholder="you@example.com"]', email)
    await page.fill('input[placeholder="至少 8 位"]', password)

    // 点击注册
    await page.click('text=创建账号')

    // 等待侧边栏显示用户名，确认登录成功（AuthGuard 切换为 AppShell）
    await expect(page.getByText(username)).toBeVisible({ timeout: 15_000 })
  })

  test('已注册用户登录', async ({ page }) => {
    await page.goto('/')

    // 填写登录表单
    await page.fill('input[placeholder="输入用户名或邮箱"]', username)
    await page.fill('input[placeholder="输入密码"]', password)

    // 点击登录
    await page.click('text=登录')

    // 等待侧边栏显示用户名，确认登录成功
    await expect(page.getByText(username)).toBeVisible({ timeout: 15_000 })
  })
})
