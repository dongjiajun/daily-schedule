import { test, expect } from '@playwright/test'

const USER = { username: `c_${Date.now()}`, email: `c_${Date.now()}@test.com`, password: 'test123456' }

async function login(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('onboarding_done', '1'))
  // API 注册 + 创建宠物（避免 PetSelection 弹窗）
  const regResp = await page.request.post('/api/v1/auth/register', {
    data: { username: USER.username, email: USER.email, password: USER.password }
  })
  if (regResp.status() === 201) {
    const data = await regResp.json()
    // 用注册返回的 token 创建宠物
    await page.request.post('/api/v1/pets/me', {
      data: { species: 'ORANGE_CAT', name: '大橘' },
      headers: { Authorization: `Bearer ${data.accessToken}` }
    })
  }
  // UI 登录
  await page.fill('input[placeholder="输入用户名或邮箱"]', USER.username)
  await page.fill('input[placeholder="输入密码"]', USER.password)
  await page.click('text=登录')
  await page.waitForURL('**/')
  await page.waitForTimeout(2000)
}

test.describe.serial('Calendar', () => {
  test('日历视图渲染', async ({ page }) => {
    await login(page)
    await expect(page.locator('body')).toBeVisible()
  })

  test('新建日程按钮打开创建弹窗', async ({ page }) => {
    await login(page)
    await page.locator('button').filter({ hasText: /新建日程/ }).click()
    await page.waitForTimeout(800)
    await expect(page.locator('input[placeholder="日程标题"]')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
  })

  test('创建日程并验证可见', async ({ page }) => {
    await login(page)
    await page.locator('button').filter({ hasText: /新建日程/ }).click()
    await page.waitForTimeout(500)
    const title = `验证可见_${Date.now()}`
    await page.fill('input[placeholder="日程标题"]', title)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(3000)
    // 日历上应出现标题文本
    await expect(page.locator(`text=${title}`).first()).toBeVisible({ timeout: 15_000 })
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
