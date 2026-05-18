import { useEffect, useRef } from 'react'
import type { ReminderEvent } from '../api/types.gen'
import { useNotification } from './useNotification'

export function useSseNotifications() {
  const { notify } = useNotification()
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const retryCountRef = useRef(0)

  useEffect(() => {
    function connect(): EventSource {
      const es = new EventSource('/api/v1/sse/notifications')

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

      es.onopen = () => {
        retryCountRef.current = 0
      }

      es.onerror = () => {
        es.close()
        const delay = Math.min(30000, 1000 * Math.pow(2, retryCountRef.current))
        retryCountRef.current++
        reconnectTimeoutRef.current = window.setTimeout(() => {
          esRef.current = connect()
        }, delay)
      }

      return es
    }

    esRef.current = connect()
    return () => {
      esRef.current?.close()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [notify])
}
