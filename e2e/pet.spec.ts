import { test, expect } from '@playwright/test'

const USER = { username: `pet_${Date.now()}`, email: `pet_${Date.now()}@test.com`, password: 'test123456' }

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

test.describe('Pet', () => {
  test('宠物页面加载', async ({ page }) => {
    await page.goto('/pet')
    await expect(page).toHaveURL(/\/pet/)
  })

  test('宠物页面有内容', async ({ page }) => {
    await page.goto('/pet')
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
  })

  test('宠物 SVG 具备 data-action 动画层属性', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/pet')
    await expect(page.locator('svg[data-action]').first()).toBeVisible()
    const action = await page.locator('svg[data-action]').first().getAttribute('data-action')
    expect(['idle', 'walk', 'sleep', 'jump']).toContain(action)
  })

  test('月视图渲染时宠物正常（calendar-cell Zones 共存不崩溃）', async ({ page }) => {
    await ensureLoggedIn(page)
    // 创建日程让月视图有内容（calendar-cell Zones 批量注册）
    await page.keyboard.press('n')
    await page.waitForTimeout(300)
    await page.fill('input[placeholder="日程标题"]', '格内共存测试')
    await page.getByRole('button', { name: /创建日程|保存/ }).click()
    await page.waitForTimeout(1500)
    // 宠物 SVG 正常渲染（格内物理状态机为视觉行为，vitest 覆盖；此处验证共存不崩溃）
    await expect(page.locator('svg[data-action]').first()).toBeVisible()
  })

  test('PetPage 喂食闭环：专注币扣除 + 反馈 toast', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/pet')
    await expect(page.getByText(/🪙\s*100/)).toBeVisible()

    // 喂食小鱼干（10 金币）→ 专注币 100 → 90
    await page.getByRole('button', { name: '喂食-小鱼干' }).click()
    await expect(page.getByText(/心情 \+5/)).toBeVisible()
    await expect(page.getByText(/🪙\s*90/)).toBeVisible()
  })

  test('金币不足时喂食按钮禁用', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/pet')
    // 连续喂食 10 次（小鱼干 10 金币，100 → 0）后按钮禁用
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: '喂食-小鱼干' }).click()
      await page.waitForTimeout(600)
    }
    await expect(page.getByRole('button', { name: '喂食-小鱼干' })).toBeDisabled()
  })
})
