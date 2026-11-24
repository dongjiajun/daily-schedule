import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const SRC_ROOT = path.resolve(__dirname, '../../../')

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__' || entry.name === 'node_modules' || entry.name === 'api') continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) walkTsFiles(abs, out)
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(abs)
  }
  return out
}

function extractImports(content: string): string[] {
  const specs: string[] = []
  const re = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    specs.push(m[1] ?? m[2])
  }
  return specs
}

function resolveImportPath(fromFile: string, specifier: string): string | null {
  if (specifier.startsWith('@/')) {
    return path.join(SRC_ROOT, specifier.slice(2)).replace(/\\/g, '/')
  }
  if (specifier.startsWith('.')) {
    return path.resolve(path.dirname(fromFile), specifier).replace(/\\/g, '/')
  }
  return null
}

describe('moduleBoundary', () => {
  const files = walkTsFiles(SRC_ROOT)
  const srcPrefix = SRC_ROOT.replace(/\\/g, '/') + '/'

  it('core/、components/layout/、pages/ 与 App.tsx 不得直接导入任何 modules/', () => {
    const violations: string[] = []
    for (const file of files) {
      const rel = file.replace(/\\/g, '/').slice(srcPrefix.length)
      if (rel === 'main.tsx') continue // 组合根负责注册模块
      const isCoreOrShell =
        rel.startsWith('core/') ||
        rel.startsWith('components/layout/') ||
        rel.startsWith('pages/') ||
        rel === 'App.tsx'
      if (!isCoreOrShell) continue

      const imports = extractImports(fs.readFileSync(file, 'utf8'))
      for (const spec of imports) {
        const resolved = resolveImportPath(file, spec)
        if (!resolved) continue
        const targetRel = resolved.startsWith(srcPrefix) ? resolved.slice(srcPrefix.length) : ''
        if (targetRel.startsWith('modules/')) {
          violations.push(`${rel} -> ${spec}`)
        }
      }
    }
    expect(violations).toEqual([])
  })

  it('各功能模块间不得直接相互导入（须通过 core/eventBus 或 core/lib 解耦）', () => {
    const violations: string[] = []
    for (const file of files) {
      const rel = file.replace(/\\/g, '/').slice(srcPrefix.length)
      const modMatch = rel.match(/^modules\/([^/]+)\//)
      if (!modMatch) continue
      const currentModule = modMatch[1]

      const imports = extractImports(fs.readFileSync(file, 'utf8'))
      for (const spec of imports) {
        const resolved = resolveImportPath(file, spec)
        if (!resolved) continue
        const targetRel = resolved.startsWith(srcPrefix) ? resolved.slice(srcPrefix.length) : ''
        const targetMatch = targetRel.match(/^modules\/([^/]+)(?:\/|$)/)
        if (targetMatch && targetMatch[1] !== currentModule) {
          violations.push(`${rel} -> ${spec}`)
        }
      }
    }
    expect(violations).toEqual([])
  })
})
