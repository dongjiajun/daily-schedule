import { useEffect } from 'react'
import { useShellStore } from '../store/shellStore'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/** 统一键盘快捷键屏蔽条件：修饰键、输入框聚焦、或任意模态 Dialog 打开 */
export function isShortcutBlocked(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return true
  if (isTypingTarget(e.target)) return true
  if (typeof document !== 'undefined' && document.querySelector('[role="dialog"]')) return true
  return false
}

/**
 * 全站壳层快捷键（挂载于 AppShell）：
 * ? 打开快捷键帮助弹窗。
 */
export function useGlobalShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isShortcutBlocked(e)) return
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        useShellStore.getState().setShowShortcuts(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
