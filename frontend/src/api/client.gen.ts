import { createClient, createConfig, type Client } from './client/client.gen'
import type { TDataShape } from './client/types.gen'

let _client: Client

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

function withAuth(opts: any): any {
  const authHeaders = getAuthHeaders()
  return {
    ...opts,
    headers: { ...authHeaders, ...opts.headers },
  }
}

export const client: Client = {
  get: <TData extends TDataShape = TDataShape, ThrowOnError extends boolean = false>(opts: any) =>
    (_client ?? (_client = createClient(createConfig()))).get<TData, unknown, ThrowOnError>(withAuth(opts)),
  post: <TData extends TDataShape = TDataShape, ThrowOnError extends boolean = false>(opts: any) =>
    (_client ?? (_client = createClient(createConfig()))).post<TData, unknown, ThrowOnError>(withAuth(opts)),
  put: <TData extends TDataShape = TDataShape, ThrowOnError extends boolean = false>(opts: any) =>
    (_client ?? (_client = createClient(createConfig()))).put<TData, unknown, ThrowOnError>(withAuth(opts)),
  delete: <TData extends TDataShape = TDataShape, ThrowOnError extends boolean = false>(opts: any) =>
    (_client ?? (_client = createClient(createConfig()))).delete<TData, unknown, ThrowOnError>(withAuth(opts)),
}
