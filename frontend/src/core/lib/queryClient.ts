import { QueryClient } from '@tanstack/react-query'

/**
 * React Query 客户端单例。
 * 提取到 core/lib 供非组件上下文（如 petEventBridge 事件桥接）安全使用；
 * App.tsx 的 QueryClientProvider 引用同一实例。
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})
