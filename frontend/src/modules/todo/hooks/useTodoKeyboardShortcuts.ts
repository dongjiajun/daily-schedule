import { useEffect } from 'react'
import { isShortcutBlocked } from '@/core/hooks/useGlobalShortcuts'
import { useTodoStore } from '../store/todoStore'

interface UseTodoKeyboardShortcutsOptions {
  onNewTask: () => void
}

/**
 * 任务看板快捷键（全局 ? 由 AppShell 托管）：
 * N 新建任务 · 1 看板视图 · 2 列表视图。
 */
export function useTodoKeyboardShortcuts({ onNewTask }: UseTodoKeyboardShortcutsOptions) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isShortcutBlocked(e)) return

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault()
          onNewTask()
          break
        case '1':
          e.preventDefault()
          useTodoStore.getState().setViewMode('board')
          break
        case '2':
          e.preventDefault()
          useTodoStore.getState().setViewMode('list')
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onNewTask])
}
