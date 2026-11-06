import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 设计 token 契约一致性测试（对应 change: ui-token-contract）。
 *
 * 断言三件事：
 * 1. 5 套基础主题 + 18 套节日主题在级联上覆盖契约清单的全部 token
 * 2. `@theme` 注册覆盖契约清单（组件才有 utility 可用）
 * 3. 契约声明的对比度配对全部达标（派生值 color-mix/rgba 记为跳过）
 */

interface TokenEntry {
  name: string
  group: string
}

interface ContrastRule {
  fg: string
  bg: string
  min: number
  kind?: string
}

interface Contract {
  tokens: TokenEntry[]
  contrastRules: ContrastRule[]
}

const STYLES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.resolve(STYLES_DIR, '../..')

const contract: Contract = JSON.parse(
  fs.readFileSync(path.join(STYLES_DIR, 'design-tokens.json'), 'utf8')
) as Contract

const themesCss = fs.readFileSync(path.join(STYLES_DIR, 'themes.css'), 'utf8')
const holidayCss = fs.readFileSync(path.join(STYLES_DIR, 'holiday-themes.css'), 'utf8')
const indexCss = fs.readFileSync(path.join(SRC_DIR, 'index.css'), 'utf8')

type TokenMap = Map<string, string>

function parseDeclarations(block: string): TokenMap {
  const map: TokenMap = new Map()
  const regex = /(--color-[a-z-]+)\s*:\s*([^;]+);/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(block)) !== null) {
    map.set(match[1].replace('--color-', ''), match[2].trim())
  }
  return map
}

function collectBlocks(css: string, selectorPattern: RegExp): Map<string, TokenMap> {
  const result = new Map<string, TokenMap>()
  const regex = new RegExp(selectorPattern.source + '\\s*\\{([^}]*)\\}', 'g')
  let match: RegExpExecArray | null
  while ((match = regex.exec(css)) !== null) {
    result.set(match[1], parseDeclarations(match[2]))
  }
  return result
}

const rootBlockMatch = /:root\s*\{([^}]*)\}/.exec(themesCss)
const rootDefaults = rootBlockMatch ? parseDeclarations(rootBlockMatch[1]) : new Map<string, string>()

const sharedHolidayMatch = /\[data-theme\^="holiday-"\]\s*\{([^}]*)\}/.exec(holidayCss)
const sharedHoliday = sharedHolidayMatch ? parseDeclarations(sharedHolidayMatch[1]) : new Map<string, string>()

const baseThemes = collectBlocks(themesCss, /:root\[data-theme="([a-z-]+)"\]/)
const holidayThemes = collectBlocks(holidayCss, /\[data-theme="(holiday-[a-z-]+)"\]/)
const allThemes = new Map<string, TokenMap>([...baseThemes, ...holidayThemes])

function lookup(theme: string, token: string): string | undefined {
  const layers: TokenMap[] = [rootDefaults]
  if (theme.startsWith('holiday-')) layers.push(sharedHoliday)
  const block = allThemes.get(theme)
  if (block) layers.push(block)
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    const value = layers[i].get(token)
    if (value !== undefined) return value
  }
  return undefined
}

/** 解析为可计算色值；`color-mix()`/`rgba()` 等派生值返回 null */
function resolveColor(theme: string, token: string, depth = 0): string | null {
  if (depth > 6) return null
  const raw = lookup(theme, token)
  if (raw === undefined) return null
  const varMatch = /^var\(--color-([a-z-]+)\)$/.exec(raw)
  if (varMatch) return resolveColor(theme, varMatch[1], depth + 1)
  if (/^#[0-9a-fA-F]{3,8}$/.test(raw)) return raw
  return null
}

function linearize(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const value = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => linearize(parseInt(value.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

describe('design token 契约', () => {
  it('契约清单无重复 token 且数量与分组约定一致', () => {
    const names = contract.tokens.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
    expect(names.length).toBe(40)
  })

  it('5 套基础主题 + 18 套节日主题均覆盖契约清单', () => {
    const expected = contract.tokens.map((t) => t.name)
    expect([...baseThemes.keys()].sort()).toEqual(['dark', 'default', 'lavender', 'nature', 'warm'])
    expect(holidayThemes.size).toBe(18)

    const missing: string[] = []
    for (const theme of allThemes.keys()) {
      for (const token of expected) {
        if (lookup(theme, token) === undefined) missing.push(`${theme}: ${token}`)
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
        const fg = resolveColor(theme, rule.fg)
        const bg = resolveColor(theme, rule.bg)
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
})
