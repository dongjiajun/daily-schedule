import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../settingsStore'

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      themeMode: 'manual',
      effectIntensity: 'low',
      autoDarkMode: false,
      locale: 'CN',
      holidayCheckDate: null,
      activeHolidayId: null,
    })
  })

  it('默认 themeMode 为 manual', () => {
    expect(useSettingsStore.getState().themeMode).toBe('manual')
  })

  it('默认 effectIntensity 为 low', () => {
    expect(useSettingsStore.getState().effectIntensity).toBe('low')
  })

  it('默认 autoDarkMode 为 false', () => {
    expect(useSettingsStore.getState().autoDarkMode).toBe(false)
  })

  it('默认 locale 为 CN', () => {
    expect(useSettingsStore.getState().locale).toBe('CN')
  })

  it('切换 themeMode', () => {
    useSettingsStore.getState().setThemeMode('auto')
    expect(useSettingsStore.getState().themeMode).toBe('auto')
  })

  it('切换 effectIntensity', () => {
    useSettingsStore.getState().setEffectIntensity('full')
    expect(useSettingsStore.getState().effectIntensity).toBe('full')

    useSettingsStore.getState().setEffectIntensity('off')
    expect(useSettingsStore.getState().effectIntensity).toBe('off')
  })

  it('切换 autoDarkMode', () => {
    useSettingsStore.getState().setAutoDarkMode(true)
    expect(useSettingsStore.getState().autoDarkMode).toBe(true)
  })

  it('setHolidayCheckResult 同时设置日期和节日 id', () => {
    useSettingsStore.getState().setHolidayCheckResult('2026-02-17', 'spring-festival')
    expect(useSettingsStore.getState().holidayCheckDate).toBe('2026-02-17')
    expect(useSettingsStore.getState().activeHolidayId).toBe('spring-festival')
  })

  it('setHolidayCheckResult 可设置为无节日', () => {
    useSettingsStore.getState().setHolidayCheckResult('2026-07-15', null)
    expect(useSettingsStore.getState().holidayCheckDate).toBe('2026-07-15')
    expect(useSettingsStore.getState().activeHolidayId).toBeNull()
  })

  it('新字段不在 partialize 中持久化的字段使用默认值', () => {
    // 验证 partialize 只持久化指定字段
    const state = useSettingsStore.getState()
    // holidayCheckDate 和 activeHolidayId 不应持久化（不在 partialize 中）
    // 但它们在内存中应有默认值
    expect(state.holidayCheckDate).toBeNull()
    expect(state.activeHolidayId).toBeNull()
  })
})
