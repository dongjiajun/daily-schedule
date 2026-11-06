import { test, expect } from '@playwright/test'

/**
 * 主题 token 契约的浏览器侧验证（change: ui-token-contract）。
 * 只依赖前端：未登录时 AuthGuard 内联渲染 LoginPage，无需后端数据。
 */

const BASE_THEMES = ['default', 'warm', 'nature', 'dark', 'lavender'] as const

const CRITICAL_TOKENS = [
  '--color-bg',
  '--color-surface',
  '--color-foreground',
  '--color-foreground-muted',
  '--color-border-strong',
  '--color-success-fg',
  '--color-error-fg',
  '--color-info-fg',
]

interface PersistedSettings {
  state: Record<string, unknown>
  version: number
}

const seed = (state: Record<string, unknown>): PersistedSettings => ({ state, version: 0 })

function todayString(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

async function readTokens(page: import('@playwright/test').Page): Promise<Array<[string, string]>> {
  return page.evaluate((names: string[]) => {
    const style = getComputedStyle(document.documentElement)
    return names.map((name) => [name, style.getPropertyValue(name).trim()] as [string, string])
  }, CRITICAL_TOKENS)
}

test.describe('UI token 主题契约', () => {
  for (const theme of BASE_THEMES) {
    test(`基础主题 ${theme} 的契约 token 均有计算值`, async ({ page }) => {
      await page.addInitScript((payload: PersistedSettings) => {
        window.localStorage.setItem('settings.v1', JSON.stringify(payload))
      }, seed({ theme, themeMode: 'manual' }))
      await page.goto('/')

      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      const values = await readTokens(page)
      const empty = values.filter(([, value]) => value === '').map(([name]) => name)
      expect(empty).toEqual([])
    })
  }

  test('auto 模式命中节日时应用节日主题且契约 token 完整', async ({ page }) => {
    await page.addInitScript((payload: PersistedSettings) => {
      window.localStorage.setItem('settings.v1', JSON.stringify(payload))
    }, seed({
      theme: 'default',
      themeMode: 'auto',
      activeHolidayId: 'spring-festival',
      holidayCheckDate: todayString(),
    }))
    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'holiday-spring-festival')
    const values = await readTokens(page)
    const empty = values.filter(([, value]) => value === '').map(([name]) => name)
    expect(empty).toEqual([])
  })

  test('手动模式忽略缓存的节日主题', async ({ page }) => {
    await page.addInitScript((payload: PersistedSettings) => {
      window.localStorage.setItem('settings.v1', JSON.stringify(payload))
    }, seed({
      theme: 'nature',
      themeMode: 'manual',
      activeHolidayId: 'spring-festival',
      holidayCheckDate: todayString(),
    }))
    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'nature')
  })

  test('auto 模式当日无节日时回退到手动主题', async ({ page }) => {
    await page.addInitScript((payload: PersistedSettings) => {
      window.localStorage.setItem('settings.v1', JSON.stringify(payload))
    }, seed({
      theme: 'lavender',
      themeMode: 'auto',
      activeHolidayId: null,
      holidayCheckDate: todayString(),
    }))
    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'lavender')
  })
})
