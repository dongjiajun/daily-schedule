import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../settingsStore'

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      themeMode: 'manual',
      effectIntensity: 'low',
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

  it('节日检测结果参与持久化（首帧主题脚本依赖）', () => {
    useSettingsStore.getState().setHolidayCheckResult('2026-02-17', 'spring-festival')
    useSettingsStore.getState().setThemeMode('auto')
    const raw = window.localStorage.getItem('settings.v1')
    expect(raw).toBeTruthy()
    expect(raw).toContain('"holidayCheckDate":"2026-02-17"')
    expect(raw).toContain('"activeHolidayId":"spring-festival"')
    expect(raw).toContain('"themeMode":"auto"')
  })
})
