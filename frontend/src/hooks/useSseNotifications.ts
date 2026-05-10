import { useEffect, useRef } from 'react'
import { useNotification } from './useNotification'

interface ReminderPayload {
  id: number
  title: string
  startTime: string
  reminderMinutes: number
}

export function useSseNotifications() {
  const { notify } = useNotification()
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource('/api/v1/sse/notifications')
    eventSourceRef.current = es

    es.addEventListener('reminder', (e: MessageEvent) => {
      try {
        const payload: ReminderPayload = JSON.parse(e.data)
        notify(
          `日程提醒: ${payload.title}`,
          `即将在 ${new Date(payload.startTime).toLocaleTimeString('zh-CN')} 开始`
        )
      } catch {
        // 解析失败忽略
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
