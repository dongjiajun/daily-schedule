export interface TDataShape {
  body?: unknown
  headers?: unknown
  path?: unknown
  query?: unknown
}

export interface Client {
  get: <TData extends TDataShape = TDataShape, TError = unknown, ThrowOnError extends boolean = false>(opts: Options<TData, ThrowOnError>) => Promise<{ data?: any; error?: any }>
  post: <TData extends TDataShape = TDataShape, TError = unknown, ThrowOnError extends boolean = false>(opts: Options<TData, ThrowOnError>) => Promise<{ data?: any; error?: any }>
  put: <TData extends TDataShape = TDataShape, TError = unknown, ThrowOnError extends boolean = false>(opts: Options<TData, ThrowOnError>) => Promise<{ data?: any; error?: any }>
  delete: <TData extends TDataShape = TDataShape, TError = unknown, ThrowOnError extends boolean = false>(opts: Options<TData, ThrowOnError>) => Promise<{ data?: any; error?: any }>
}

export interface Config {
  baseUrl: string
}

export interface Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> {
  url: string
  method?: string
  body?: TData['body']
  headers?: Record<string, string>
  path?: TData['path']
  query?: TData['query']
  throwOnError?: ThrowOnError
  client?: Client
  meta?: Record<string, unknown>
}
