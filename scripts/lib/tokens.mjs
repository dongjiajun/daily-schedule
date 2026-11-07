/**
 * 设计 token 共享解析模块（ui-check 门禁与前端契约测试共用，避免双份实现）。
 *
 * 职责：
 * - 解析 themes.css / holiday-themes.css 的主题块与继承层级
 * - 解析 token 引用（var(--color-x) 链）为可计算 hex；派生值返回 null
 * - WCAG 对比度计算
 * - 几何/动效裸值判定（允许集合来自 design-tokens.json 契约）
 */
import fs from 'node:fs'
import path from 'node:path'

export function parseDeclarations(block) {
  const map = new Map()
  const regex = /(--color-[a-z-]+)\s*:\s*([^;]+);/g
  let match
  while ((match = regex.exec(block)) !== null) {
    map.set(match[1].replace('--color-', ''), match[2].trim())
  }
  return map
}

export function collectBlocks(css, selectorSource) {
  const result = new Map()
  const regex = new RegExp(selectorSource + '\\s*\\{([^}]*)\\}', 'g')
  let match
  while ((match = regex.exec(css)) !== null) {
    result.set(match[1], parseDeclarations(match[2]))
  }
  return result
}

function readFile(rel, root) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

/** 读取契约声明的两个 CSS 文件并构建 5 基础 + 18 节日主题的 token 映射 */
export function readThemes(root, contract) {
  const themesCss = readFile(contract.themeSourceFile, root)
  const holidayCss = readFile(contract.holidaySourceFile, root)
  const rootMatch = /:root\s*\{([^}]*)\}/.exec(themesCss)
  const sharedMatch = /\[data-theme\^="holiday-"\]\s*\{([^}]*)\}/.exec(holidayCss)
  return {
    rootDefaults: rootMatch ? parseDeclarations(rootMatch[1]) : new Map(),
    sharedHoliday: sharedMatch ? parseDeclarations(sharedMatch[1]) : new Map(),
    baseThemes: collectBlocks(themesCss, ':root\\[data-theme="([a-z-]+)"\\]'),
    holidayThemes: collectBlocks(holidayCss, '\\[data-theme="(holiday-[a-z-]+)"\\]'),
  }
}

/** 按级联顺序查找 token 原始声明值：root → 节日共享层 → 主题块 */
export function lookup(theme, token, themes) {
  const layers = [themes.rootDefaults]
  if (theme.startsWith('holiday-')) layers.push(themes.sharedHoliday)
  const block = themes.baseThemes.get(theme) ?? themes.holidayThemes.get(theme)
  if (block) layers.push(block)
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    const value = layers[i].get(token)
    if (value !== undefined) return value
  }
  return undefined
}

/** 解析为可计算 hex；派生值（color-mix/rgba）返回 null */
export function resolveColor(theme, token, themes, depth = 0) {
  if (depth > 6) return null
  const raw = lookup(theme, token, themes)
  if (raw === undefined) return null
  const varMatch = /^var\(--color-([a-z-]+)\)$/.exec(raw)
  if (varMatch) return resolveColor(theme, varMatch[1], themes, depth + 1)
  if (/^#[0-9a-fA-F]{3,8}$/.test(raw)) return raw
  return null
}

const linearize = (channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)

export function luminance(hex) {
  const value = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => linearize(parseInt(value.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a, b) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/**
 * 几何/动效裸值判定器：允许档位来自契约；返回 { geometryViolation }。
 * 入参为去掉变体前缀与透明度后缀的单个 class。
 */
export function createGeometryGuard(contract) {
  const radiusAllowed = new Set([...Object.keys(contract.geometry.radius), 'none'])
  const shadowAllowed = new Set([...Object.keys(contract.geometry.shadow), 'none', 'inner'])
  const durationAllowed = new Set([...Object.keys(contract.motion.duration), '0'])
  const easeAllowed = new Set([...Object.keys(contract.motion.ease), 'linear', 'in', 'out', 'in-out'])

  function geometryViolation(token) {
    const radius = /^rounded(?:-(?:t|r|b|l|tl|tr|bl|br))?-([a-z0-9[\]%().-]+)$/.exec(token)
    if (radius) {
      if (/^[[]/.test(radius[1])) return `圆角使用了契约外的任意值（${radius[1]}）`
      if (!radiusAllowed.has(radius[1])) return `圆角档位 ${radius[1]} 不在契约内`
      return null
    }
    const shadow = /^shadow-([a-z0-9[\]%().-]+)$/.exec(token)
    if (shadow) {
      if (/^[[]/.test(shadow[1])) return `阴影使用了契约外的任意值（${shadow[1]}）`
      if (!shadowAllowed.has(shadow[1])) return `阴影档位 ${shadow[1]} 不在契约内`
      return null
    }
    const duration = /^duration-([a-z0-9[\]%().-]+)$/.exec(token)
    if (duration) {
      if (!durationAllowed.has(duration[1])) return `动效时长 ${duration[1]} 不在契约内`
      return null
    }
    const ease = /^ease-([a-z-]+)$/.exec(token)
    if (ease && !easeAllowed.has(ease[1])) return `动效曲线 ${ease[1]} 不在契约内`
    return null
  }

  return { radiusAllowed, shadowAllowed, durationAllowed, easeAllowed, geometryViolation }
}
