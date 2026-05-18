import { createClient, createConfig } from './client/client.gen'

let _client: ReturnType<typeof createClient> | undefined

function getAuthHeaders(): Record<string, string> {
  try {
    const stored = localStorage.getItem('auth')
    if (stored) {
      const { token } = JSON.parse(stored)
      if (token) return { Authorization: `Bearer ${token}` }
    }
  } catch {}
  return {}
}

function request(method: string, opts: Record<string, unknown>) {
  const authHeaders = getAuthHeaders()
  const clientInstance = _client ?? (_client = createClient(createConfig()))
  const merged = {
    ...opts,
    headers: { ...authHeaders, ...(opts.headers as Record<string, string> || {}) },
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
