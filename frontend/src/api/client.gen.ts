import { createClient, createConfig } from './client/client.gen'

let _client: ReturnType<typeof createClient> | undefined
let _cachedToken: string | null | undefined

function getToken(): string | null {
  if (_cachedToken !== undefined) return _cachedToken as string | null
  try {
    const stored = localStorage.getItem('auth')
    if (stored) {
      const { token } = JSON.parse(stored)
      _cachedToken = token ?? null
      return _cachedToken as string | null
    }
  } catch {}
  _cachedToken = null
  return null
}

export function clearCachedToken() {
  _cachedToken = undefined
}

const JSON_HEADER: Record<string, string> = { 'Content-Type': 'application/json' }

function request(method: string, opts: Record<string, unknown>) {
  const clientInstance = _client ?? (_client = createClient(createConfig()))
  const token = getToken()
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
  const defaultHeaders = (method === 'post' || method === 'put') ? JSON_HEADER : {}
  const merged = {
    ...opts,
    headers: { ...defaultHeaders, ...authHeaders, ...(opts.headers as Record<string, string> || {}) },
  }
  switch (method) {
    case 'get': return clientInstance.get(merged as any)
    case 'post': return clientInstance.post(merged as any)
    case 'put': return clientInstance.put(merged as any)
    case 'delete': return clientInstance.delete(merged as any)
    default: throw new Error(`Unknown method: ${method}`)
  }
}

export const client = {
  get: (opts: Record<string, unknown>) => request('get', opts),
  post: (opts: Record<string, unknown>) => request('post', opts),
  put: (opts: Record<string, unknown>) => request('put', opts),
  delete: (opts: Record<string, unknown>) => request('delete', opts),
}
