import { test, expect } from '@playwright/test'

const USER = { username: `smoke_${Date.now()}`, email: `smoke_${Date.now()}@test.com`, password: 'test123456' }

async function ensureLoggedIn(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('onboarding_done', '1'))
  const regResp = await page.request.post('/api/v1/auth/register', { data: { username: USER.username, email: USER.email, password: USER.password } })
  if (regResp.status() === 201) {
    const data = await regResp.json()
    await page.request.post('/api/v1/pets/me', {
      data: { species: 'ORANGE_CAT', name: '大橘' },
      headers: { Authorization: `Bearer ${data.accessToken}` },
    })
  }
  await page.fill('input[placeholder="输入用户名或邮箱"]', USER.username)
  await page.fill('input[placeholder="输入密码"]', USER.password)
  await page.click('text=登录')
  await page.waitForURL('**/')
  await page.waitForTimeout(2000)
}

/** 安装假时钟后 reload：页面重载后所有 timer（游走 tick/小动作）都在假时钟下调度 */
async function installClockAt(page: Parameters<Parameters<typeof test>[1]>[0]['page'], time: Date) {
  await page.clock.install({ time })
  await page.reload()
  await expect(page.locator('svg[data-action]').first()).toBeVisible({ timeout: 10_000 })
}

test.describe('节律 smoke（page.clock 注入）', () => {
  // 假时钟 + 动画真实完成（resume）流程较长：登录注册 + reload + fastForward + 等待动画/真实 tick，
  // 并行负载下累计可超默认 30s（pet.spec 同款处理）
  test.describe.configure({ timeout: 120_000 })
  test('夜间 23:30 → 自动走向小窝进窝睡觉（sleep 动作出现）', async ({ page }) => {
    await ensureLoggedIn(page)
    await installClockAt(page, new Date('2026-08-09T23:30:00'))
    // 推进 180s：覆盖多个游走 tick（10-30s 随机）。首个 tick 可能打哈欠（10%，冷却 10min）
    // → 下一 tick 必回窝（走向小窝 → 动画完成 → sleep）
    await page.clock.fastForward(180_000)
    // 恢复真实时钟：走路动画由真实 rAF 驱动。假时钟下若 React 渲染提交落在 fastForward
    // 窗口外，动画帧永不触发 → 动画冻结 → sleep 永远不出现（与 timeout 大小无关）
    await page.clock.resume()
    await expect(page.locator('svg[data-action="sleep"]').first()).toBeVisible({ timeout: 20_000 })
  })

  test('早晨 8:00 睡眠中 → 唤醒 + "早上好~ ☀️"气泡', async ({ page }) => {
    await ensureLoggedIn(page)
    await installClockAt(page, new Date('2026-08-09T23:30:00'))
    await page.clock.fastForward(180_000)
    // 同测试 1：resume 让回窝走路动画真实完成
    await page.clock.resume()
    await expect(page.locator('svg[data-action="sleep"]').first()).toBeVisible({ timeout: 20_000 })

    // 固定 Date 到早晨 8:00（setFixedTime 不影响 timers；resume 后 tick 由真实时间驱动）
    // → 下一真实 tick（10-30s 随机）触发唤醒 + 气泡
    await page.clock.setFixedTime(new Date('2026-08-09T08:00:00'))
    await expect(page.getByText('早上好~ ☀️')).toBeVisible({ timeout: 40_000 })
    await expect(page.locator('svg[data-action="sleep"]').first()).not.toBeVisible()
  })

  test('午后 13:00 → 小憩（rest 动作）或正常游走（低概率不触发时放行）', async ({ page }) => {
    await ensureLoggedIn(page)
    await installClockAt(page, new Date('2026-08-09T13:00:00'))
    await page.clock.fastForward(90_000)
    // 5%/tick 低概率：不强制断言触发，仅验证不崩溃且动作集合合法
    const action = await page.locator('svg[data-action]').first().getAttribute('data-action')
    expect(['idle', 'walk', 'rest', 'eat', 'stretch', 'yawn', 'scratch', 'look', 'sleep', 'pace', 'jump']).toContain(action)
  })

  test('深夜未睡 23:30 → 打哈欠或回窝（不崩溃）', async ({ page }) => {
    await ensureLoggedIn(page)
    await installClockAt(page, new Date('2026-08-09T23:30:00'))
    await page.clock.fastForward(90_000)
    const action = await page.locator('svg[data-action]').first().getAttribute('data-action')
    expect(['yawn', 'sleep', 'walk', 'idle']).toContain(action)
  })
})
