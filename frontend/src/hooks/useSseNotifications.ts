import { useEffect, useRef } from 'react'
import type { ReminderEvent } from '../api/types.gen'
import { useNotification } from './useNotification'
import { useAuthStore } from '../store/authStore'

/**
 * 订阅 /api/v1/sse/notifications。
 *
 * v3.0 起鉴权通过登录时下发的 `dsa_sse_session` HttpOnly Cookie 完成；
 * `EventSource` 自动携带 same-origin cookie，因此 URL 不再带 token。
 *
 * 跨域开发场景：vite proxy 已把请求转发到后端同 origin，cookie 同样生效。
 */
export function useSseNotifications() {
  const { notify } = useNotification()
  const accessToken = useAuthStore((s) => s.accessToken)
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const retryCountRef = useRef(0)

  useEffect(() => {
    if (!accessToken) return

    function connect(): EventSource {
      const es = new EventSource('/api/v1/sse/notifications', {
        withCredentials: true,
      })

      es.addEventListener('reminder', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data) as ReminderEvent
          if (!payload.title || !payload.startTime) return
          notify(
            `日程提醒: ${payload.title}`,
            `即将在 ${new Date(payload.startTime).toLocaleTimeString('zh-CN')} 开始`
          )
        } catch {
          // ignore parse failure
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
  }, [notify, accessToken])
}
