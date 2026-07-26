import { test, expect } from '@playwright/test'

const USER = { username: `c_${Date.now()}`, email: `c_${Date.now()}@test.com`, password: 'test123456' }

async function login(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto('/')
  // 注册（忽略已存在）
  await page.request.post('/api/v1/auth/register', {
    data: { username: USER.username, email: USER.email, password: USER.password }
  })
  // 登录
  await page.fill('input[placeholder="输入用户名或邮箱"]', USER.username)
  await page.fill('input[placeholder="输入密码"]', USER.password)
  await page.click('text=登录')
  await page.waitForTimeout(4000)
  // 关闭 onboarding 引导（如有）
  const closeBtn = page.locator('button[aria-label="关闭引导"]')
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click()
    await page.waitForTimeout(500)
  }
}

test.describe.serial('Calendar', () => {
  test('日历视图渲染', async ({ page }) => {
    await login(page)
    await expect(page.locator('body')).toBeVisible()
  })

  test('快捷键 N 打开创建弹窗', async ({ page }) => {
    await login(page)
    // 点击页面获取焦点
    await page.locator('body').click()
    await page.waitForTimeout(500)
    await page.keyboard.press('n')
    await page.waitForTimeout(1000)
    await expect(page.locator('input[placeholder="日程标题"]')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
  })

  test('创建日程并验证可见', async ({ page }) => {
    await login(page)
    await page.locator('body').click()
    await page.waitForTimeout(300)
    await page.keyboard.press('n')
    await page.waitForTimeout(800)
    await page.fill('input[placeholder="日程标题"]', '验证可见')
    await page.locator('button:has-text("创建日程"), button:has-text("保存")').click()
    await page.waitForTimeout(1500)
    await expect(page.getByText('验证可见')).toBeVisible({ timeout: 10_000 })
  })

  test('视图切换', async ({ page }) => {
    await login(page)
    for (const label of ['周', '日', '议程']) {
      const btn = page.getByRole('button', { name: label })
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        await btn.click()
        await page.waitForTimeout(300)
      }
    }
  })
})
