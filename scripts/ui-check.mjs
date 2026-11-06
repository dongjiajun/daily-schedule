#!/usr/bin/env node
/**
 * UI 设计 token 门禁 — 与 docs-check / openspec-check 同风格：从代码树独立重算事实，不信任文档声明。
 *
 * 六项检查：
 *   1. token 完整性  每套主题（5 基础 + 18 节日）必须覆盖 design-tokens.json 契约
 *   2. 对比度        文本配对 >= 4.5:1，控件边界 >= 3:1（派生值 color-mix/rgba 记为跳过）
 *   3. 裸色值        白名单之外禁止十六进制色值与 Tailwind 调色板类
 *   4. 未知 token    禁止引用 @theme 未注册的 token utility（如 bg-muted）
 *   5. CSS 死 token  CSS 声明了契约外的 --color-* 自定义属性
 *   6. 几何/动效     圆角/阴影/时长/曲线必须来自契约 token
 *
 * 用法: node scripts/ui-check.mjs [--self-test]
 * 退出码: 0 全部通过 / 1 存在失败
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTRACT_PATH = path.join(ROOT, 'frontend/src/core/styles/design-tokens.json')
const CONTRACT = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'))

const SOURCE_DIRS = ['frontend/src']
const SCAN_EXTS = new Set(['.ts', '.tsx', '.css', '.html'])
const SKIP_DIRS = new Set(['node_modules', '__tests__', '.git', 'dist'])

const SUMMARY = []
const fail = (msg) => {
  SUMMARY.push(`  x ${msg}`)
}
const pass = (msg) => {
  SUMMARY.push(`  ok ${msg}`)
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

function walk(rel, out = []) {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) return out
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const child = path.join(abs, entry.name)
    const childRel = path.relative(ROOT, child).split(path.sep).join('/')
    if (entry.isDirectory()) walk(childRel, out)
    else if (SCAN_EXTS.has(path.extname(entry.name))) out.push(childRel)
  }
  return out
}

function globToRegex(glob) {
  const escaped = glob
    .split('**')
    .map((part) => part.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*'))
    .join('.*')
  return new RegExp(`^${escaped}$`)
}

const WHITELIST = CONTRACT.whitelist.map((entry) => ({ ...entry, regex: globToRegex(entry.pattern) }))
const isWhitelisted = (rel) => WHITELIST.find((entry) => entry.regex.test(rel))

// ── CSS 解析 ────────────────────────────────────────────────────────────────
function parseDeclarations(block) {
  const map = new Map()
  const regex = /(--color-[a-z-]+)\s*:\s*([^;]+);/g
  let match
  while ((match = regex.exec(block)) !== null) {
    map.set(match[1].replace('--color-', ''), match[2].trim())
  }
  return map
}

function collectBlocks(css, selectorSource) {
  const result = new Map()
  const regex = new RegExp(selectorSource + '\\s*\\{([^}]*)\\}', 'g')
  let match
  while ((match = regex.exec(css)) !== null) {
    result.set(match[1], parseDeclarations(match[2]))
  }
  return result
}

function readThemes() {
  const themesCss = read(CONTRACT.themeSourceFile)
  const holidayCss = read(CONTRACT.holidaySourceFile)
  const rootMatch = /:root\s*\{([^}]*)\}/.exec(themesCss)
  const sharedMatch = /\[data-theme\^="holiday-"\]\s*\{([^}]*)\}/.exec(holidayCss)
  return {
    rootDefaults: rootMatch ? parseDeclarations(rootMatch[1]) : new Map(),
    sharedHoliday: sharedMatch ? parseDeclarations(sharedMatch[1]) : new Map(),
    baseThemes: collectBlocks(themesCss, ':root\\[data-theme="([a-z-]+)"\\]'),
    holidayThemes: collectBlocks(holidayCss, '\\[data-theme="(holiday-[a-z-]+)"\\]'),
  }
}

function lookup(theme, token, themes) {
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

/** @returns {string|null} 可计算 hex；空/派生值返回 null */
function resolveColor(theme, token, themes, depth = 0) {
  if (depth > 6) return null
  const raw = lookup(theme, token, themes)
  if (raw === undefined) return null
  const varMatch = /^var\(--color-([a-z-]+)\)$/.exec(raw)
  if (varMatch) return resolveColor(theme, varMatch[1], themes, depth + 1)
  if (/^#[0-9a-fA-F]{3,8}$/.test(raw)) return raw
  return null
}

// ── 对比度 ──────────────────────────────────────────────────────────────────
const linearize = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

function luminance(hex) {
  const value = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => linearize(parseInt(value.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a, b) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

// ── 检查 1：token 完整性 ────────────────────────────────────────────────────
function checkCompleteness(themes, failures) {
  const expected = CONTRACT.tokens.map((t) => t.name)
  const themeNames = [...themes.baseThemes.keys(), ...themes.holidayThemes.keys()]
  const missing = []
  for (const theme of themeNames) {
    for (const token of expected) {
      if (lookup(theme, token, themes) === undefined) missing.push(`${theme}: --color-${token}`)
    }
  }
  if (missing.length) {
    failures.push(`token 完整性失败（${missing.length} 项缺失）：\n${missing.map((m) => `      ${m}`).join('\n')}`)
  } else {
    pass(`token 完整性：${themeNames.length} 套主题 × ${expected.length} token 全覆盖`)
  }
  return themeNames
}

// ── 检查 2：对比度 ──────────────────────────────────────────────────────────
function checkContrast(themeNames, themes, failures) {
  const fails = []
  let checked = 0
  let skipped = 0
  for (const theme of themeNames) {
    for (const rule of CONTRACT.contrastRules) {
      const fg = resolveColor(theme, rule.fg, themes)
      const bg = resolveColor(theme, rule.bg, themes)
      if (!fg || !bg) {
        skipped += 1
        continue
      }
      checked += 1
      const ratio = contrastRatio(fg, bg)
      if (ratio + 1e-9 < rule.min) {
        fails.push(`${theme} ${rule.fg}/${rule.bg} = ${ratio.toFixed(2)} < ${rule.min}`)
      }
    }
  }
  if (fails.length) {
    failures.push(`对比度失败（${fails.length} 项）：\n${fails.map((f) => `      ${f}`).join('\n')}`)
  } else {
    pass(`对比度：${checked} 项通过，${skipped} 项派生值跳过`)
  }
}

// ── 检查 3：裸色值 ──────────────────────────────────────────────────────────
const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/g
const PALETTE_CLASS =
  /(?:^|[\s"'`:])(?:text|bg|border|ring|outline|fill|stroke|from|via|to|divide|decoration|shadow|placeholder)-(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d{1,3})?/g

/** 纯函数：扫描一段源码中的十六进制色值与调色板类，返回命中描述 */
function scanRawColors(content) {
  const hits = []
  const lines = content.split(/\r?\n/)
  lines.forEach((line, index) => {
    for (const match of line.matchAll(HEX_COLOR)) {
      if (match.index > 0 && /[&?=]/.test(line[match.index - 1] || '')) continue // url(#id) 等
      hits.push(`:${index + 1} 十六进制色值 ${match[0]}`)
    }
    for (const match of line.matchAll(PALETTE_CLASS)) {
      hits.push(`:${index + 1} 调色板类 ${match[0].trim()}`)
    }
  })
  return hits
}

function checkRawColors(failures) {
  const hits = []
  let whitelistedFiles = 0
  for (const dir of SOURCE_DIRS) {
    for (const rel of walk(dir)) {
      if (rel.endsWith('design-tokens.json')) continue
      if (isWhitelisted(rel)) {
        whitelistedFiles += 1
        continue
      }
      if (rel.startsWith('frontend/src/core/styles/') && rel.endsWith('.css')) continue // token 定义文件
      for (const hit of scanRawColors(read(rel))) hits.push(`${rel}${hit}`)
    }
  }
  if (hits.length) {
    failures.push(`裸色值失败（${hits.length} 处，白名单 ${whitelistedFiles} 个文件已豁免）：\n${hits.slice(0, 30).map((h) => `      ${h}`).join('\n')}${hits.length > 30 ? `\n      ... 其余 ${hits.length - 30} 处` : ''}`)
  } else {
    pass(`裸色值：0 处越界（白名单 ${whitelistedFiles} 个文件）`)
  }
}

// ── 检查 4：未知 token 引用 ─────────────────────────────────────────────────
const TOKEN_NAMES = new Set(CONTRACT.tokens.map((t) => t.name))
const COLOR_PREFIXES = ['text', 'bg', 'border', 'ring', 'outline', 'fill', 'stroke', 'from', 'via', 'to', 'divide', 'decoration', 'shadow', 'placeholder', 'accent']
const KEYWORDS = new Set(['white', 'black', 'transparent', 'current', 'inherit', 'none'])
const NON_COLOR = new Set([
  // 尺寸 / 对齐 / 换行
  'xs', 'sm', 'md', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl',
  'left', 'center', 'right', 'justify', 'start', 'end', 'wrap', 'nowrap', 'balance', 'pretty', 'ellipsis', 'clip',
  // 边框 / 分割线
  'solid', 'dashed', 'dotted', 'double', 'hidden', 'collapse', 'separate', 'reverse',
  // 背景
  'cover', 'contain', 'fixed', 'local', 'scroll', 'repeat', 'auto', 'opaque', 'clip-text',
  'gradient-to-r', 'gradient-to-l', 'gradient-to-t', 'gradient-to-b', 'gradient-to-tr', 'gradient-to-tl', 'gradient-to-br', 'gradient-to-bl',
  // 阴影 / 轮廓
  'inner', 'inset', 'offset-0', 'offset-1', 'offset-2', 'offset-4', 'offset-8',
])
const NUMERIC = /^(?:\[.*\]|\d[\w%./[\]-]*|[trblxy](?:-\[?\d.*)?|gradient-.*)$/

function isKnownUtility(cls, unknown) {
  const prefix = COLOR_PREFIXES.find((p) => cls === p || cls.startsWith(`${p}-`))
  if (!prefix) return true
  let rest = cls.slice(prefix.length + 1)
  if (rest.startsWith('[')) return true
  rest = rest.split('/')[0]
  if (!rest) return true
  if (prefix === 'shadow' && Object.hasOwn(CONTRACT.geometry.shadow, rest)) return true
  if (TOKEN_NAMES.has(rest) || KEYWORDS.has(rest) || NON_COLOR.has(rest)) return true
  if (NUMERIC.test(rest)) return true
  unknown.push(cls)
  return false
}

function splitTokens(content) {
  // 只扫描字符串字面量 / 模板字符串里的 class 片段，避开代码标识符
  const tokens = []
  const regex = /(?:className\s*=\s*["'{`]|["'`])([^"'`\n]*)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    for (const raw of match[1].split(/\s+/)) {
      const token = raw.split(':').pop()
      if (!token) continue
      tokens.push({ raw, token })
    }
  }
  return tokens
}

function checkUnknownTokens(failures) {
  const hits = []
  for (const dir of SOURCE_DIRS) {
    for (const rel of walk(dir)) {
      if (!rel.endsWith('.tsx')) continue
      const lines = read(rel).split(/\r?\n/)
      lines.forEach((line, index) => {
        for (const { raw, token } of splitTokens(line)) {
          const unknown = []
          if (!isKnownUtility(token, unknown)) {
            hits.push(`${rel}:${index + 1} 未注册 token utility ${raw}`)
          }
        }
      })
    }
  }
  if (hits.length) {
    failures.push(`未知 token 引用失败（${hits.length} 处）：\n${hits.slice(0, 30).map((h) => `      ${h}`).join('\n')}`)
  } else {
    pass('未知 token：0 处引用未注册 utility')
  }
}

// ── 检查 5：CSS 中未注册的 token 声明（死 token） ───────────────────────────
function findUnregisteredDeclarations(themes) {
  const unregistered = new Map()
  const blocks = [
    [':root', themes.rootDefaults],
    ['holiday-shared', themes.sharedHoliday],
    ...themes.baseThemes,
    ...themes.holidayThemes,
  ]
  for (const [blockName, map] of blocks) {
    for (const token of map.keys()) {
      if (TOKEN_NAMES.has(token)) continue
      if (!unregistered.has(token)) unregistered.set(token, [])
      unregistered.get(token).push(blockName)
    }
  }
  return unregistered
}

function checkDeclaredTokens(themes, failures) {
  const unregistered = findUnregisteredDeclarations(themes)
  if (unregistered.size) {
    const detail = [...unregistered.entries()].map(([token, blocks]) => `      --color-${token}（${blocks.join(', ')}）`)
    failures.push(`CSS 未注册 token 声明（${unregistered.size} 个死 token，契约清单中不存在）：\n${detail.join('\n')}`)
  } else {
    pass('CSS 声明：全部自定义属性均在契约清单内（无死 token）')
  }
}

// ── 检查 6：几何 / 动效裸值 ─────────────────────────────────────────────────
const RADIUS_ALLOWED = new Set([...Object.keys(CONTRACT.geometry.radius), 'none'])
const SHADOW_ALLOWED = new Set([...Object.keys(CONTRACT.geometry.shadow), 'none', 'inner'])
const DURATION_ALLOWED = new Set([...Object.keys(CONTRACT.motion.duration), '0'])
const EASE_ALLOWED = new Set([...Object.keys(CONTRACT.motion.ease), 'linear', 'in', 'out', 'in-out'])

/** 返回违规描述；合法返回 null（token 已去掉变体前缀与透明度后缀） */
function geometryViolation(token) {
  const radius = /^rounded(?:-(?:t|r|b|l|tl|tr|bl|br))?-([a-z0-9[\]%().-]+)$/.exec(token)
  if (radius) {
    if (/^[\[]/.test(radius[1])) return `圆角使用了契约外的任意值（${radius[1]}）`
    if (!RADIUS_ALLOWED.has(radius[1])) return `圆角档位 ${radius[1]} 不在契约内`
    return null
  }
  const shadow = /^shadow-([a-z0-9[\]%().-]+)$/.exec(token)
  if (shadow) {
    if (/^[\[]/.test(shadow[1])) return `阴影使用了契约外的任意值（${shadow[1]}）`
    if (!SHADOW_ALLOWED.has(shadow[1])) return `阴影档位 ${shadow[1]} 不在契约内`
    return null
  }
  const duration = /^duration-([a-z0-9[\]%().-]+)$/.exec(token)
  if (duration) {
    if (!DURATION_ALLOWED.has(duration[1])) return `动效时长 ${duration[1]} 不在契约内`
    return null
  }
  const ease = /^ease-([a-z-]+)$/.exec(token)
  if (ease && !EASE_ALLOWED.has(ease[1])) return `动效曲线 ${ease[1]} 不在契约内`
  return null
}

function checkGeometryAndMotion(failures) {
  const hits = []
  for (const dir of SOURCE_DIRS) {
    for (const rel of walk(dir)) {
      if (!rel.endsWith('.tsx')) continue
      const lines = read(rel).split(/\r?\n/)
      lines.forEach((line, index) => {
        for (const { raw, token } of splitTokens(line)) {
          const violation = geometryViolation(token)
          if (violation) hits.push(`${rel}:${index + 1} ${violation}（${raw}）`)
        }
      })
    }
  }
  if (hits.length) {
    failures.push(`几何/动效裸值失败（${hits.length} 处）：\n${hits.slice(0, 30).map((h) => `      ${h}`).join('\n')}`)
  } else {
    pass('几何/动效：圆角/阴影/时长/曲线全部来自契约 token')
  }
}

// ── 自检：核心算法的内联样例 ────────────────────────────────────────────────
function selfTest() {
  const assert = (cond, msg) => {
    if (!cond) {
      console.error(`self-test FAILED: ${msg}`)
      process.exit(1)
    }
  }
  assert(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.01, 'black/white 应为 21:1')
  assert(contrastRatio('#777777', '#ffffff') > 4.4 && contrastRatio('#777777', '#ffffff') < 4.6, 'gray 对比度近似 4.48')
  const themes = readThemes()
  assert(themes.baseThemes.size === 5, '应解析到 5 套基础主题')
  assert(themes.holidayThemes.size === 18, '应解析到 18 套节日主题')
  assert(lookup('default', 'bg', themes) === '#f5f6f8', 'default 主题 bg 应可解析')
  assert(lookup('holiday-christmas', 'foreground', themes) === '#f5f7fa', '节日主题应继承共享前景色')
  assert(resolveColor('default', 'cal-today-ring', themes) === '#3b82f6', 'var() 引用应可解析为 hex')
  assert(resolveColor('default', 'overlay', themes) === null, 'rgba 应视为派生值')
  const unknown = []
  assert(isKnownUtility('bg-surface', unknown) === true && unknown.length === 0, 'bg-surface 应为已知 token')
  assert(isKnownUtility('text-xs', unknown) === true && unknown.length === 0, 'text-xs 应为排版工具类')
  assert(isKnownUtility('bg-muted', unknown) === false && unknown.length === 1, 'bg-muted 应报未知 token')
  assert(isKnownUtility('hover:bg-red-50', unknown) === true, '变体前缀不影响判定')

  // 失败路径 1：缺 token 必须触发 completeness 失败
  const fullFixture = new Map(CONTRACT.tokens.map((t) => [t.name, '#777777']))
  const fullThemes = {
    rootDefaults: new Map(),
    sharedHoliday: new Map(),
    baseThemes: new Map([['fixture', fullFixture]]),
    holidayThemes: new Map(),
  }
  const completeFailures = []
  checkCompleteness(fullThemes, completeFailures)
  assert(completeFailures.length === 0, '完整 fixture 不应报缺 token')
  const partialFailures = []
  checkCompleteness({ ...fullThemes, baseThemes: new Map([['fixture', new Map([['bg', '#000000']])]]) }, partialFailures)
  assert(partialFailures.length === 1 && partialFailures[0].includes('token 完整性失败'), '缺 token fixture 应报完整性失败')

  // 失败路径 2：对比度不足必须报错
  const contrastFailures = []
  checkContrast(['fixture'], fullThemes, contrastFailures)
  assert(contrastFailures.length === 1 && contrastFailures[0].includes('对比度失败'), '全同色 fixture 应报对比度失败')

  // 失败路径 3：裸色值必须被命中，语义 utility 不得误报
  assert(scanRawColors('className="text-red-500"').length === 1, 'text-red-500 应被裸色值检查命中')
  assert(scanRawColors('className="hover:bg-red-50"').length === 1, 'hover:bg-red-50 应被命中')
  assert(scanRawColors('className="w-[#FFFFFF]"').length === 1, '十六进制色值应被命中')
  assert(scanRawColors('className="text-error-fg bg-success"').length === 0, '语义 utility 不应被误报')

  // 失败路径 4：CSS 中未注册的自定义属性必须被判为死 token
  const deadThemes = readThemes()
  deadThemes.rootDefaults.set('primary', '#E63946')
  assert(findUnregisteredDeclarations(deadThemes).has('primary'), '未注册的自定义属性应被判为死 token')

  // 失败路径 5：几何/动效裸值
  assert(geometryViolation('rounded-3xl') !== null, 'rounded-3xl 应报违规')
  assert(geometryViolation('rounded-lg') === null, 'rounded-lg 应合法')
  assert(geometryViolation('shadow-md') !== null, 'shadow-md 应报违规')
  assert(geometryViolation('shadow-card') === null, 'shadow-card 应合法')
  assert(geometryViolation('duration-150') !== null, 'duration-150 应报违规')
  assert(geometryViolation('duration-fast') === null, 'duration-fast 应合法')

  console.log('ui-check self-test: 通过')
}

// ── 主流程 ──────────────────────────────────────────────────────────────────
function main() {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }
  const failures = []
  const themes = readThemes()
  const themeNames = checkCompleteness(themes, failures)
  checkContrast(themeNames, themes, failures)
  checkRawColors(failures)
  checkUnknownTokens(failures)
  checkDeclaredTokens(themes, failures)
  checkGeometryAndMotion(failures)

  console.log('ui-check: 设计 token 门禁')
  console.log(`  契约：${CONTRACT.tokens.length} token × ${themeNames.length} 套主题`)
  for (const line of SUMMARY) console.log(line)
  if (failures.length) {
    console.error('\nui-check: 检查未通过')
    for (const failure of failures) console.error(`\n  ${failure}`)
    process.exit(1)
  }
  console.log('\nui-check: 全部通过')
}

main()
