export interface TDataShape {
  body?: unknown
  headers?: unknown
  path?: unknown
  query?: unknown
}

export interface Client {
  get: (opts: Options) => Promise<{ data?: unknown; error?: Error }>
  post: (opts: Options) => Promise<{ data?: unknown; error?: Error }>
  put: (opts: Options) => Promise<{ data?: unknown; error?: Error }>
  delete: (opts: Options) => Promise<{ data?: unknown; error?: Error }>
}

export interface Config {
  baseUrl: string
}

export interface Options<TData extends TDataShape = TDataShape> {
  url: string
  method?: string
  body?: TData['body']
  headers?: Record<string, string>
  path?: TData['path']
  query?: TData['query']
  client?: Client
  meta?: Record<string, unknown>
}
