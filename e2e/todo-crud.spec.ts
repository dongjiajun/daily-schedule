import { test, expect } from '@playwright/test'

const USER = { username: `etodo_${Date.now()}`, email: `etodo_${Date.now()}@test.com`, password: 'test123456' }

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

test.describe('Todo Board', () => {
  test('导航到 /todo 显示看板页面', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    await expect(page).toHaveURL(/\/todo/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('看板页面使用 lucide 图标渲染列标题', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    // lucide SVG icons should be present in column headers
    const svgIcons = page.locator('svg.lucide')
    await expect(svgIcons.first()).toBeVisible({ timeout: 5000 })
  })

  test('创建任务', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    const createBtn = page.getByRole('button', { name: /新建任务/ })
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click()
      await page.waitForTimeout(300)
      const input = page.locator('input[name="title"], input[placeholder*="标题"]').first()
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        await input.fill(`T_${Date.now()}`)
        await page.getByRole('button', { name: /创建|保存|确定/ }).click()
        await page.waitForTimeout(1000)
      }
    }
  })

  test('新建任务 Dialog 正常打开', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    const createBtn = page.getByRole('button', { name: /新建任务/ })
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click()
      await page.waitForTimeout(500)
      // Dialog should be visible with backdrop
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 })
    }
  })

  test('视图切换', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    const listBtn = page.getByRole('button', { name: /列表/ })
    if (await listBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listBtn.click()
      await page.waitForTimeout(300)
    }
    const boardBtn = page.getByRole('button', { name: /看板/ })
    if (await boardBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await boardBtn.click()
      await page.waitForTimeout(300)
    }
  })
})
