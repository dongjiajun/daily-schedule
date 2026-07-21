import { useEffect, useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { holidayEngine } from '@daily-schedule/shared/holiday'

/**
 * 将 settingsStore 中的主题同步到 <html data-theme> 属性。
 *
 * 两种模式：
 * - manual: 使用用户手动选择的主题（默认行为）
 * - auto: 每日自动检测节日，应用节日 CSS；无节日时回退到手动主题
 *
 * 每日缓存：同一天内不重复调用 holidayEngine。
 */
export function useTheme() {
  const theme = useSettingsStore((s) => s.theme)
  const themeMode = useSettingsStore((s) => s.themeMode)
  const locale = useSettingsStore((s) => s.locale)
  const holidayCheckDate = useSettingsStore((s) => s.holidayCheckDate)
  const activeHolidayId = useSettingsStore((s) => s.activeHolidayId)
  const setHolidayCheckResult = useSettingsStore((s) => s.setHolidayCheckResult)

  const checkHoliday = useCallback(() => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // 今天已检测 → 使用缓存
    if (holidayCheckDate === todayStr) return

    // 调用引擎
    const activeTheme = holidayEngine.getActiveTheme(today, { locale })
    if (activeTheme) {
      // 找到活跃节日的 id（取最高优先级）
      const holidays = holidayEngine.getHolidays(today, { locale })
      const topHoliday = holidays[0]
      setHolidayCheckResult(todayStr, topHoliday?.id ?? null)
    } else {
      setHolidayCheckResult(todayStr, null)
    }
  }, [holidayCheckDate, locale, setHolidayCheckResult])

  useEffect(() => {
    if (themeMode === 'auto') {
      checkHoliday()
    }
  }, [themeMode, checkHoliday])

  useEffect(() => {
    if (themeMode === 'auto' && activeHolidayId) {
      document.documentElement.dataset.theme = `holiday-${activeHolidayId}`
    } else if (themeMode === 'auto' && holidayCheckDate !== null && !activeHolidayId) {
      // 已检测但无节日 → 回退到手动主题
      document.documentElement.dataset.theme = theme
    } else if (themeMode === 'manual') {
      document.documentElement.dataset.theme = theme
    }
  }, [themeMode, activeHolidayId, holidayCheckDate, theme])
}
