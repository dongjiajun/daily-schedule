import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { useTheme } from '../useTheme'
import { useSettingsStore } from '@/core/store/settingsStore'

// Mock holidayEngine to avoid loading lunar-typescript in tests
vi.mock('@daily-schedule/shared/holiday', () => ({
  holidayEngine: {
    getActiveTheme: vi.fn(),
    getHolidays: vi.fn(),
  },
}))

/** Test component that calls useTheme and reports the current data-theme */
function ThemeTest() {
  useTheme()
  return null
}

describe('useTheme (via component render)', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: 'default',
      themeMode: 'manual',
      locale: 'CN',
      holidayCheckDate: null,
      activeHolidayId: null,
    })
    document.documentElement.dataset.theme = 'default'
  })

  it('manual 模式使用用户选择的主题', () => {
    useSettingsStore.setState({ theme: 'dark', themeMode: 'manual' })
    render(<ThemeTest />)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('manual 模式下主题变化时更新 data-theme', () => {
    const { rerender } = render(<ThemeTest />)
    expect(document.documentElement.dataset.theme).toBe('default')

    useSettingsStore.setState({ theme: 'warm' })
    rerender(<ThemeTest />)
    expect(document.documentElement.dataset.theme).toBe('warm')
  })

  it('auto 模式且无节日时回退到手动主题', () => {
    useSettingsStore.setState({
      theme: 'nature',
      themeMode: 'auto',
      holidayCheckDate: '2026-07-15',
      activeHolidayId: null,
    })
    render(<ThemeTest />)
    expect(document.documentElement.dataset.theme).toBe('nature')
  })

  it('auto 模式且有节日时设置 holiday-<id>', () => {
    // 使用今天的日期避免 checkHoliday() 重新查询
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    useSettingsStore.setState({
      theme: 'default',
      themeMode: 'auto',
      holidayCheckDate: todayStr, // ← 今天已缓存，skip checkHoliday
      activeHolidayId: 'spring-festival',
    })
    render(<ThemeTest />)
    expect(document.documentElement.dataset.theme).toBe('holiday-spring-festival')
  })
})
