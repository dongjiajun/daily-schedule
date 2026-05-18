import type { Client, Config, Options, TDataShape } from './types.gen'

let _config: Config

export const createConfig = (overrides?: Partial<Config>): Config => ({
  baseUrl: '/api/v1',
  ...overrides,
})

export const createClient = (config: Config = createConfig()): Client => {
  _config = config

  const request = async <TData extends TDataShape = TDataShape>(
    opts: Options<TData>
  ): Promise<{ data?: unknown; error?: Error }> => {
    let url = `${config.baseUrl}${opts.url}`
    if (opts.path) {
      for (const [key, value] of Object.entries(opts.path as Record<string, unknown>)) {
        url = url.replace(`{${key}}`, String(value))
      }
    }
    const query = opts.query
    const queryString = query ? '?' + new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)])
    ).toString() : ''

    const res = await fetch(`${url}${queryString}`, {
      method: opts.method?.toUpperCase() || 'GET',
      headers: opts.headers as HeadersInit,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error')
      const err = new Error(errorText || `Request failed with status ${res.status}`)
      return { error: err }
    }

    if (res.status === 204) return { data: undefined }
    const data = await res.json()
    return { data }
  }

  const client: Client = {
    get: (opts) => request({ ...opts, method: 'get' }),
    post: (opts) => request({ ...opts, method: 'post' }),
    put: (opts) => request({ ...opts, method: 'put' }),
    delete: (opts) => request({ ...opts, method: 'delete' }),
  }

  Object.defineProperty(client, 'getConfig', { value: () => _config })
  return client
}

export const client = createClient()
export const { get, post, put, delete: del } = client
