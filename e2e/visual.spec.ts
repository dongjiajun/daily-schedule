import { test, expect, type Page } from '@playwright/test'

/**
 * 视觉回归基线（design-system-foundation）。
 *
 * - 5 套主题 × 6 个截面 = 30 张截图，基线随仓库提交。
 * - 用固定日期（2026-11-06）覆盖 Date，避免月历标题随真实日期漂移。
 * - 固定测试用户，避免侧栏用户名随机导致像素差异。
 * - 隐藏游走宠物（JS 驱动、位置随机）；其视觉由 pet E2E 与人工评审覆盖。
 * - 跨 OS 字体渲染不同：本组用例打 @visual，CI 默认排除（`pnpm run test:e2e`），
 *   仅在本地用 `pnpm run test:visual` 执行；更新基线用 `--update-snapshots`。
 */

const THEMES = ['default', 'warm', 'nature', 'dark', 'lavender'] as const
const FIXED_NOW = Date.parse('2026-11-06T10:30:00+08:00')
const USER = { username: 'visual_spec_user', email: 'visual_spec_user@test.com', password: 'test123456' }

test.use({ reducedMotion: 'reduce' })

interface PersistedSession {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: unknown
}

function toSession(data: {
  accessToken: string
  refreshToken: string
  user: unknown
}): PersistedSession {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + 3_600_000,
    user: data.user,
  }
}

async function ensurePet(page: Page, session: PersistedSession) {
  const headers = { Authorization: `Bearer ${session.accessToken}` }
  const current = await page.request.get('/api/v1/pets/me', { headers })
  if (current.status() !== 404) return
  await page.request.post('/api/v1/pets/me', {
    headers,
    data: { species: 'ORANGE_CAT', name: '大橘' },
  })
}

async function obtainSession(page: Page): Promise<PersistedSession> {
  const loginBody = { usernameOrEmail: USER.username, password: USER.password }
  const login = await page.request.post('/api/v1/auth/login', { data: loginBody })
  if (login.ok()) return toSession(await login.json())

  const register = await page.request.post('/api/v1/auth/register', {
    data: { username: USER.username, email: USER.email, password: USER.password },
  })
  if (register.ok()) return toSession(await register.json())

  // 409 = 并发下用户已被创建，重试登录一次
  const retry = await page.request.post('/api/v1/auth/login', { data: loginBody })
  if (!retry.ok()) throw new Error(`视觉基线测试用户初始化失败: ${retry.status()}`)
  return toSession(await retry.json())
}

/** 固定系统时间（只覆盖 Date，保留真实定时器与 rAF，避免动画卡在半程） */
async function freezeDate(page: Page) {
  await page.addInitScript((fixed: number) => {
    const RealDate = Date
    class FrozenDate extends RealDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) super(fixed)
        else super(...(args as [number]))
      }
      static now() {
        return fixed
      }
    }
    window.Date = FrozenDate as DateConstructor
  }, FIXED_NOW)
}

test.describe('@visual 视觉基线', () => {
  // 串行执行：避免并发注册竞态，同时让截图资源占用稳定
  test.describe.configure({ mode: 'serial' })

  for (const theme of THEMES) {
    test(`主题 ${theme} 的 6 个截面`, async ({ page }) => {
      await freezeDate(page)
      await page.goto('/')
      await expect(page.getByRole('button', { name: '登录' })).toBeVisible()
      await expect(page).toHaveScreenshot(`${theme}-01-login.png`)

      const session = await obtainSession(page)
      // 首次访问会弹「选择你的伙伴」模态，会遮挡截图与点击：先确保宠物已存在
      await ensurePet(page, session)
      await page.addInitScript(
        ({ sessionValue, themeValue }) => {
          localStorage.setItem('auth.v3', JSON.stringify(sessionValue))
          localStorage.setItem(
            'settings.v1',
            JSON.stringify({
              state: { theme: themeValue, themeMode: 'manual', density: 'comfortable' },
              version: 0,
            })
          )
          localStorage.setItem('onboarding_done', '1')
        },
        { sessionValue: session, themeValue: theme }
      )
      await page.addInitScript(() => {
        // 每次导航都注入：隐藏 JS 驱动、位置随机的游走宠物，保证截图确定性
        const inject = () => {
          const style = document.createElement('style')
          style.textContent = '[data-testid="roaming-pet"]{display:none!important}'
          document.documentElement.appendChild(style)
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject)
        else inject()
      })

      await page.goto('/')
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expect(page.locator('.rbc-calendar')).toBeVisible()
      await expect(page).toHaveScreenshot(`${theme}-02-calendar-month.png`)

      await page.getByRole('radio', { name: '周' }).click()
      await expect(page.locator('.rbc-time-view')).toBeVisible()
      await expect(page).toHaveScreenshot(`${theme}-03-calendar-week.png`)

      await page.goto('/todo')
      await expect(page.getByRole('radio', { name: '看板' })).toBeVisible()
      await expect(page).toHaveScreenshot(`${theme}-04-todo-board.png`)

      await page.getByRole('radio', { name: '列表' }).click()
      await expect(page).toHaveScreenshot(`${theme}-05-todo-list.png`)

      await page.goto('/pet')
      await expect(page).toHaveScreenshot(`${theme}-06-pet.png`)
    })
  }
})
