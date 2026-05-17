export const mergeHeaders = (...sources: (Record<string, string> | undefined)[]) => {
  const result: Record<string, string> = {}
  for (const source of sources) {
    if (source) Object.assign(result, source)
  }
  return result
}
