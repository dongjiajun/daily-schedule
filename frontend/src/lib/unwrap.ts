import type { ApiResponse } from '../api/types.gen'

interface SdkResult<T> {
  data?: T
  error?: unknown
  response?: Response
}

/**
 * hey-api 客户端默认把错误放在 `result.error` 而不是抛出，
 * React Query 的 onError 因此永远不会触发，失败也会弹"成功"。
 * 统一在这里检查并抛出带后端 message 的 Error。
 *
 * 放在 src/lib/ 而非 src/api/ 目录下，避免被 `npm run generate:api` 清空。
 */
export function unwrap<T>(result: SdkResult<T>): T {
  if (result.error !== undefined || (result.response && !result.response.ok)) {
    const err = result.error as ApiResponse | undefined
    throw new Error(err?.message ?? `请求失败（HTTP ${result.response?.status ?? '未知'}）`)
  }
  return result.data as T
}
