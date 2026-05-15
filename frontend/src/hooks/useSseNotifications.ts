import { useEffect, useRef } from 'react'
import type { ReminderEvent } from '../api/types.gen'
import { useNotification } from './useNotification'

export function useSseNotifications() {
  const { notify } = useNotification()
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource('/api/v1/sse/notifications')
    eventSourceRef.current = es

    es.addEventListener('reminder', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as ReminderEvent
        if (!payload.title || !payload.startTime) return
        notify(
          `日程提醒: ${payload.title}`,
          `即将在 ${new Date(payload.startTime).toLocaleTimeString('zh-CN')} 开始`
        )
      } catch {
        // 忽略解析失败
      }
    })

    es.onerror = () => {
      es.close()
    }

    return () => {
      es.close()
    }
  }, [notify])
}
