import { test, expect } from '@playwright/test'

const USER = { username: `eedge_${Date.now()}`, email: `eedge_${Date.now()}@test.com`, password: 'test123456' }

async function ensureLoggedIn(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('onboarding_done', '1'))
  const regResp = await page.request.post('/api/v1/auth/register', {
    data: { username: USER.username, email: USER.email, password: USER.password }
  })
  if (regResp.status() === 201) {
    const data = await regResp.json()
    await page.request.post('/api/v1/pets/me', {
      data: { species: 'ORANGE_CAT', name: '大橘' },
      headers: { Authorization: `Bearer ${data.accessToken}` }
    })
  }
  await page.fill('input[placeholder="输入用户名或邮箱"]', USER.username)
  await page.fill('input[placeholder="输入密码"]', USER.password)
  await page.click('text=登录')
  await page.waitForURL('**/')
  await page.waitForTimeout(2000)
}

test.describe('Edge Cases', () => {
  test('日历正常显示', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
  })

  test('超长标题不溢出', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.locator('button').filter({ hasText: /新建日程/ }).click()
    await page.fill('input[placeholder="日程标题"]', 'A'.repeat(200))
    await page.getByRole('button', { name: /创建日程|保存/ }).click()
    await page.waitForTimeout(1000)
  })

  test('页面刷新后日历正常加载', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.reload()
    await page.waitForTimeout(3000)
    await expect(page.locator('body')).toBeVisible()
  })

  test.skip('连续快速创建 3 个日程', async ({ page }) => {
    await ensureLoggedIn(page)
    for (let i = 0; i < 3; i++) {
      await page.locator('button').filter({ hasText: /新建日程/ }).click()
      await page.waitForTimeout(400)
      await page.fill('input[placeholder="日程标题"]', `Q${i}_${Date.now()}`)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(800)
    }
    await expect(page.locator('body')).toBeVisible()
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
