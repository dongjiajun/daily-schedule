export const serializePath = (path: Record<string, unknown>): string =>
  Object.entries(path).reduce((acc, [key, value]) => acc.replace(`{${key}}`, String(value)), '' as string)
