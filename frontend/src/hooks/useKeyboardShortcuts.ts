import { useEffect } from 'react'
import dayjs from 'dayjs'
import { useCalendarStore, type CalendarView } from '../store/calendarStore'

const VIEW_KEYS: Record<string, CalendarView> = {
  '1': 'month',
  '2': 'week',
  '3': 'day',
  '4': 'agenda',
}

const NAV_UNIT: Record<CalendarView, dayjs.ManipulateType> = {
  month: 'month',
  week: 'week',
  day: 'day',
  agenda: 'month',
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/**
 * 全局键盘快捷键：
 * N 新建 · T 今天 · ←/→ 前后翻页 · 1/2/3/4 切换视图 · / 聚焦搜索 · ? 快捷键帮助
 * 输入框聚焦或有弹窗打开时不响应（Esc 关弹窗由 Radix Dialog 处理）。
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      // 任意弹窗（事件编辑、管理、引导等）打开时不响应全局键
      if (document.querySelector('[role="dialog"]')) return

      const store = useCalendarStore.getState()

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        store.setShowShortcuts(true)
        return
      }

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault()
          store.openCreateModal()
          break
        case 't':
        case 'T':
          e.preventDefault()
          store.setCurrentDate(dayjs())
          break
        case 'ArrowLeft':
          e.preventDefault()
          store.setCurrentDate(store.currentDate.subtract(1, NAV_UNIT[store.view]))
          break
        case 'ArrowRight':
          e.preventDefault()
          store.setCurrentDate(store.currentDate.add(1, NAV_UNIT[store.view]))
          break
        case '/':
          e.preventDefault()
          document.getElementById('sidebar-search')?.focus()
          break
        default: {
          const view = VIEW_KEYS[e.key]
          if (view) {
            e.preventDefault()
            store.setView(view)
          }
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
