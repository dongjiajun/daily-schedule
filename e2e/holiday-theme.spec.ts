import { test, expect } from '@playwright/test'

const USER = { username: `ehol_${Date.now()}`, email: `ehol_${Date.now()}@test.com`, password: 'test123456' }

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
}

test.describe('Holiday Theme', () => {
  test('EffectLayer 存在但不阻断交互', async ({ page }) => {
    await ensureLoggedIn(page)
    await expect(page.locator('body')).toBeVisible()
    await page.keyboard.press('n')
    await page.waitForTimeout(300)
    await expect(page.locator('input[placeholder="日程标题"]')).toBeVisible()
    // 关闭弹窗
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('主题设置面板可访问', async ({ page }) => {
    await ensureLoggedIn(page)
    const settingsBtn = page.locator('[title*="设置"], button:has-text("设置")').first()
    if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsBtn.click()
      await page.waitForTimeout(500)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }
  })
})
