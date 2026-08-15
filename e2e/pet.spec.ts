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
    // 全动作集合：昼夜节律（小憩 rest/打哈欠 yawn/早晨 stretch）可能在任何时段出现，断言需时段免疫
    expect(['idle', 'walk', 'pace', 'rest', 'sleep', 'jump', 'eat', 'stretch', 'yawn', 'scratch', 'look']).toContain(action)
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

  test('PetPage 喂食闭环：专注币扣除 + eat 动作 + 反馈 toast', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/pet')
    await expect(page.getByText(/🪙\s*100/)).toBeVisible()

    // 喂食小鱼干（10 金币）→ 专注币 100 → 90
    await page.getByRole('button', { name: '喂食-小鱼干' }).click()
    await expect(page.getByText(/心情 \+5/)).toBeVisible()
    await expect(page.getByText(/🪙\s*90/)).toBeVisible()

    // eat 动作：喂食成功 → 低头张嘴咀嚼（data-action="eat" 即时出现）
    await expect(page.locator('svg[data-action="eat"]').first()).toBeVisible({ timeout: 3000 })
    // 1.5s 后 actionTimer 自动回 idle
    await expect(page.locator('svg[data-action="eat"]').first()).toHaveCount(0, { timeout: 3000 })
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
  test('宠物进入日历格子 → 格内互动（pace 启动 + 贴壁旋转出现）', async ({ page }) => {
    test.setTimeout(120_000) // 悬停吸引 24s + 等待绕行，总时长超默认 30s
    await ensureLoggedIn(page)
    // 时段敏感修复：固定 Date 到白天 daytime 时段（10:00）。本地凌晨/CI 时区差异下
    // hour<5 或 ≥23 会落入 night → 宠物按节律回窝优先（spec: Rest behavior takes precedence），
    // 点击格子的 user-interaction 吸引被忽略 → pace 永不出现（E2E 本地凌晨必失败、CI 白天通过）。
    // setFixedTime 仅固定 Date、不影响 timers，无假时钟动画冻结风险。
    await page.clock.setFixedTime(new Date('2026-08-09T10:00:00'))
    // 定位月视图格子并点击中心（100% 吸引宠物进该格子）
    const cell = page.locator('.rbc-month-view .rbc-day-bg').first()
    await expect(cell).toBeVisible()
    const box = await cell.boundingBox()
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    // rbc slot 点击打开"新建日程" dialog——等其完全打开后 Esc 关闭（不影响已注册的兴趣区）
    await page.waitForTimeout(1500)
    await page.keyboard.press('Escape')

    // 宠物被吸引（点击即 100% 兴趣区；dialog 可能短暂中断一次吸引，游走 tick 会恢复）→ 格内物理启动
    const pace = page.locator('svg[data-action="pace"]').first()
    await expect(pace).toBeVisible({ timeout: 45_000 })

    // 贴壁旋转出现（格内绕行开始：贴边姿态由 CSS rotate 表达）
    await expect(page.locator('[data-pet="roaming"] [style*="rotate"]').first()).toBeVisible({ timeout: 40_000 })
  })

  test('刷新后宠物状态从 localStorage 恢复（持久化不崩溃）', async ({ page }) => {
    await ensureLoggedIn(page)

    // 预置持久化记录（模拟上次会话游走结果：位置 420,300 / 朝左 / 情绪 sleepy）
    await page.evaluate(() => {
      localStorage.setItem('pet-roaming-state', JSON.stringify({
        state: { position: { x: 420, y: 300 }, facing: 'left', isResting: false, emotionState: 'sleepy' },
        version: 1,
      }))
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // rehydrate 不崩溃：宠物渲染存在，无错误 toast
    await expect(page.locator('[aria-label^="宠物状态"]').first()).toBeVisible({ timeout: 5000 })
    const errorToast = page.locator('[data-sonner-toast]').filter({ hasText: /失败|错误|异常/ })
    await expect(errorToast).toHaveCount(0)

    // 持久化记录保留（rehydrate 未清除；后续状态变化会继续覆写同一 key）
    const raw = await page.evaluate(() => localStorage.getItem('pet-roaming-state'))
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.version).toBe(1)
  })

})
