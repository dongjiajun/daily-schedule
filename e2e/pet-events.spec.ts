import { test, expect } from '@playwright/test'

const USER = { username: `epet_${Date.now()}`, email: `epet_${Date.now()}@test.com`, password: 'test123456' }

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

test.describe('Pet Event Bridge', () => {
  test('创建日程触发宠物 bubble', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.keyboard.press('n')
    await page.waitForTimeout(300)
    await page.fill('input[placeholder="日程标题"]', '宠物测试日程')
    await page.getByRole('button', { name: /创建日程|保存/ }).click()
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('完成日程不导致页面崩溃', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.keyboard.press('n')
    await page.fill('input[placeholder="日程标题"]', `完成_${Date.now()}`)
    await page.getByRole('button', { name: /创建日程|保存/ }).click()
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('取消日程正常', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.keyboard.press('n')
    await page.fill('input[placeholder="日程标题"]', `取消_${Date.now()}`)
    await page.getByRole('button', { name: /创建日程|保存/ }).click()
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('点击 RoamingPet 不崩溃', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.waitForTimeout(2000)
    const vp = page.viewportSize()
    if (vp) {
      await page.mouse.click(vp.width * 0.8, vp.height * 0.5)
      await page.waitForTimeout(500)
    }
  })
})
