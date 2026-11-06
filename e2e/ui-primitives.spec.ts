import { test, expect, type Page } from '@playwright/test'

/**
 * 设计系统原语的浏览器侧行为验证（design-system-foundation）：
 * - Tooltip 键盘聚焦可见性（组件单测无法计算 CSS opacity）
 * - 中文排版基线（CJK 字体栈 + 契约字阶）
 * - 双密度：data-density 驱动的控件高度变化
 */

const USER = { username: 'visual_spec_user', email: 'visual_spec_user@test.com', password: 'test123456' }

interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: unknown
}

async function obtainSession(page: Page): Promise<Session> {
  const loginBody = { usernameOrEmail: USER.username, password: USER.password }
  const login = await page.request.post('/api/v1/auth/login', { data: loginBody })
  if (login.ok()) {
    const data = await login.json()
    return { accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt: Date.now() + 3_600_000, user: data.user }
  }
  const register = await page.request.post('/api/v1/auth/register', {
    data: { username: USER.username, email: USER.email, password: USER.password },
  })
  if (register.ok()) {
    const data = await register.json()
    return { accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt: Date.now() + 3_600_000, user: data.user }
  }
  const retry = await page.request.post('/api/v1/auth/login', { data: loginBody })
  if (!retry.ok()) throw new Error(`原语测试用户初始化失败: ${retry.status()}`)
  const data = await retry.json()
  return { accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt: Date.now() + 3_600_000, user: data.user }
}

/** 确保宠物已创建，避免首次访问弹出「选择你的伙伴」模态遮挡交互 */
async function ensurePet(page: Page, session: Session) {
  const headers = { Authorization: `Bearer ${session.accessToken}` }
  const current = await page.request.get('/api/v1/pets/me', { headers })
  if (current.status() !== 404) return
  await page.request.post('/api/v1/pets/me', { headers, data: { species: 'ORANGE_CAT', name: '大橘' } })
}

async function seedAndOpen(page: Page, settings: Record<string, unknown>) {
  const session = await obtainSession(page)
  await ensurePet(page, session)
  await page.addInitScript(
    ({ sessionValue, config }) => {
      localStorage.setItem('auth.v3', JSON.stringify(sessionValue))
      localStorage.setItem('settings.v1', JSON.stringify({ state: config, version: 0 }))
      localStorage.setItem('onboarding_done', '1')
    },
    { sessionValue: session, config: { theme: 'default', themeMode: 'manual', density: 'comfortable', ...settings } }
  )
  await page.goto('/')
  await expect(page.locator('.rbc-calendar')).toBeVisible()
}

test.describe('设计系统原语行为', () => {
  test('Tooltip 在键盘聚焦时可见', async ({ page }) => {
    await seedAndOpen(page, {})
    const trigger = page.getByRole('button', { name: '上一页' })
    await trigger.focus()

    const tooltip = page.locator('[role="tooltip"]').filter({ hasText: '上一页（←）' })
    await expect(tooltip).toHaveCount(1)
    await expect
      .poll(() => tooltip.evaluate((element) => getComputedStyle(element).opacity))
      .toBe('1')
  })

  test('中文排版基线：侧栏分组标签使用契约字阶与 CJK 栈', async ({ page }) => {
    await seedAndOpen(page, {})
    const label = page.getByText('分类', { exact: true }).first()
    const styles = await label.evaluate((element) => {
      const style = getComputedStyle(element)
      return { fontSize: style.fontSize, fontFamily: style.fontFamily }
    })
    expect(styles.fontSize).toBe('11px')
    expect(styles.fontFamily).toMatch(/PingFang SC|Microsoft YaHei|Noto Sans SC|HarmonyOS Sans SC/)
  })

  /** Segmented 控件高度 = --density-control-h - 4px（comfortable 36 → 32，compact 32 → 28） */
  const segmentedHeight = (page: Page) =>
    page.getByRole('radio', { name: '月' }).evaluate((element) => getComputedStyle(element).height)

  test('默认密度 comfortable：分段控件高度 32px', async ({ page }) => {
    await seedAndOpen(page, { density: 'comfortable' })
    await expect(page.locator('html')).toHaveAttribute('data-density', 'comfortable')
    expect(await segmentedHeight(page)).toBe('32px')
  })

  test('紧凑密度 compact：分段控件高度收窄到 28px', async ({ page }) => {
    await seedAndOpen(page, { density: 'compact' })
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')
    expect(await segmentedHeight(page)).toBe('28px')
  })
})
