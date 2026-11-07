import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  contrastRatio,
  createGeometryGuard,
  lookup,
  readThemes,
  resolveColor,
} from '../../../../../scripts/lib/tokens.mjs'

/**
 * 设计 token 契约一致性测试（对应 change: ui-token-contract / design-system-foundation）。
 *
 * 解析与对比度逻辑与 `scripts/ui-check.mjs` 共用 `scripts/lib/tokens.mjs`，避免双份实现漂移。
 */

interface ContrastRule {
  fg: string
  bg: string
  min: number
  kind?: string
}

interface Contract {
  tokens: Array<{ name: string; group: string }>
  contrastRules: ContrastRule[]
  geometry: { radius: Record<string, string>; shadow: Record<string, string> }
  motion: { duration: Record<string, string>; ease: Record<string, string> }
  themeSourceFile: string
  holidaySourceFile: string
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..')
const contract: Contract = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'frontend/src/core/styles/design-tokens.json'), 'utf8')
) as Contract

const themes = readThemes(ROOT, contract)
const allThemes = new Map([...themes.baseThemes, ...themes.holidayThemes])
const indexCss = fs.readFileSync(path.join(ROOT, 'frontend/src/index.css'), 'utf8')

describe('design token 契约', () => {
  it('契约清单无重复 token 且颜色 token 数量与分组约定一致', () => {
    const names = contract.tokens.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
    expect(names.length).toBe(40)
  })

  it('5 套基础主题 + 18 套节日主题均覆盖颜色契约清单', () => {
    const expected = contract.tokens.map((t) => t.name)
    expect([...themes.baseThemes.keys()].sort()).toEqual(['dark', 'default', 'lavender', 'nature', 'warm'])
    expect(themes.holidayThemes.size).toBe(18)

    const missing: string[] = []
    for (const theme of allThemes.keys()) {
      for (const token of expected) {
        if (lookup(theme, token, themes) === undefined) missing.push(`${theme}: ${token}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('@theme 注册覆盖契约清单', () => {
    const registered = new Set(
      [...indexCss.matchAll(/--color-([a-z-]+)\s*:\s*var\(--color-[a-z-]+\)/g)].map((m) => m[1])
    )
    const missing = contract.tokens.map((t) => t.name).filter((name) => !registered.has(name))
    expect(missing).toEqual([])
  })

  it('契约声明的对比度配对在全部主题中达标', () => {
    const failures: string[] = []
    let skipped = 0
    for (const theme of allThemes.keys()) {
      for (const rule of contract.contrastRules) {
        const fg = resolveColor(theme, rule.fg, themes)
        const bg = resolveColor(theme, rule.bg, themes)
        if (!fg || !bg) {
          skipped += 1
          continue
        }
        const ratio = contrastRatio(fg, bg)
        if (ratio < rule.min) {
          failures.push(`${theme} ${rule.fg}/${rule.bg} = ${ratio.toFixed(2)} < ${rule.min}`)
        }
      }
    }
    expect(failures).toEqual([])
    // 派生值（color-mix/rgba）无法在 Node 侧精确计算，只允许少数边界项跳过
    expect(skipped).toBeLessThan(40)
  })

  it('契约声明的几何/动效档位均合法，且契约外档位被判定器拒绝', () => {
    const guard = createGeometryGuard(contract)
    expect(Object.keys(contract.geometry.radius).every((key) => guard.geometryViolation(`rounded-${key}`) === null)).toBe(true)
    expect(Object.keys(contract.geometry.shadow).every((key) => guard.geometryViolation(`shadow-${key}`) === null)).toBe(true)
    expect(Object.keys(contract.motion.duration).every((key) => guard.geometryViolation(`duration-${key}`) === null)).toBe(true)
    expect(Object.keys(contract.motion.ease).every((key) => guard.geometryViolation(`ease-${key}`) === null)).toBe(true)

    expect(guard.geometryViolation('rounded-3xl')).not.toBeNull()
    expect(guard.geometryViolation('duration-150')).not.toBeNull()
  })
})
