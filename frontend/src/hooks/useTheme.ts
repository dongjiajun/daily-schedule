import { useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'

/**
 * 将 settingsStore 中的主题同步到 <html data-theme> 属性。
 * 在 App 组件中调用一次即可。
 */
export function useTheme() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
}
