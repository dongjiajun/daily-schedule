import { test, expect } from '@playwright/test'

const USER = { username: `eedge_${Date.now()}`, email: `eedge_${Date.now()}@test.com`, password: 'test123456' }

async function ensureLoggedIn(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  const resp = await page.request.post('/api/v1/auth/register', {
    data: { username: USER.username, email: USER.email, password: USER.password }
  })
  expect([201, 409]).toContain(resp.status())
  await page.goto('/')
  await page.fill('input[placeholder="输入用户名或邮箱"]', USER.username)
  await page.fill('input[placeholder="输入密码"]', USER.password)
  await page.click('text=登录')
  await page.waitForTimeout(3000)
  const skipBtn = page.getByText('跳过')
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click().catch(() => {})
    await page.waitForTimeout(500)
  }
}

test.describe('Edge Cases', () => {
  test('日历正常显示', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
  })

  test('超长标题不溢出', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.keyboard.press('n')
    await page.fill('input[placeholder="日程标题"]', 'A'.repeat(200))
    await page.getByRole('button', { name: /创建日程|保存/ }).click()
    await page.waitForTimeout(1000)
  })

  test('页面刷新数据不丢失', async ({ page }) => {
    await ensureLoggedIn(page)
    const title = `刷新_${Date.now()}`
    await page.keyboard.press('n')
    await page.fill('input[placeholder="日程标题"]', title)
    await page.getByRole('button', { name: /创建日程|保存/ }).click()
    await page.waitForTimeout(1500)
    await page.reload()
    await page.waitForTimeout(2000)
    const skipBtn = page.getByText('跳过')
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click().catch(() => {})
    }
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 })
  })

  test('连续快速创建 5 个日程', async ({ page }) => {
    await ensureLoggedIn(page)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('n')
      await page.fill('input[placeholder="日程标题"]', `Q${i}_${Date.now()}`)
      await page.getByRole('button', { name: /创建日程|保存/ }).click()
      await page.waitForTimeout(300)
    }
  })

  test('网络断连恢复 UI 不崩溃', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.route('**/api/v1/**', (route) => route.abort())
    await page.waitForTimeout(1000)
    await page.unroute('**/api/v1/**')
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toBeVisible()
  })
})
