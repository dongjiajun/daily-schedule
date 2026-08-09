#!/usr/bin/env node
/**
 * 文档一致性检查 — 从契约与代码树独立重算事实，与文档声明比对。
 * 用法: node scripts/docs-check.mjs [--self-test]
 *
 * 三类检查:
 *   1. checkVersion    — openapi.yaml version ↔ docs 4 处版本声明
 *   2. checkEndpoints  — openapi 全部端点 ↔ docs/api/overview.md 出现性
 *   3. checkCounts     — 文档 `<!-- DOCS-CHECK: key=value -->` marker ↔ 代码树现场重算
 *
 * 任一失败 → 非零退出 + 修复指引。CI: version-check job 内执行。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FAILURES = []
const WARNINGS = []

// ── helpers ──────────────────────────────────────────────────────────────

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel))
}

/** 递归收集 rel 目录下满足 predicate 的相对路径（'/' 分隔，排除 node_modules/.git） */
function walk(rel, predicate) {
  const out = []
  const dir = path.join(ROOT, rel)
  if (!fs.existsSync(dir)) return out
  const stack = [dir]
  while (stack.length) {
    const cur = stack.pop()
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const abs = path.join(cur, entry.name)
      const relPath = path.relative(ROOT, abs).split(path.sep).join('/')
      if (entry.isDirectory()) stack.push(abs)
      else if (predicate(relPath)) out.push(relPath)
    }
  }
  return out
}

function detectMismatch(label, actual, expected, fixHint) {
  if (actual !== expected) {
    FAILURES.push(`[${label}] 实际=${actual}，声明=${expected}${fixHint ? `。${fixHint}` : ''}`)
  }
}

/** 从 yaml 提取顶层路径（行首两空格 + / 开头），{id} 归一化 */
function extractOpenApiPaths(yaml) {
  return [...yaml.matchAll(/^  \/([^\s:{}]+(?:\{[^\s:{}]+\})?):/gm)]
    .map((m) => m[1])
    .map((p) => p.replace(/\{[^}]+\}/g, '{id}'))
}

// ── 1. 版本声明 ──────────────────────────────────────────────────────────

function checkVersion() {
  const yaml = read('specs/openapi.yaml')
  const m = yaml.match(/^\s+version:\s*['"]?([\w.-]+)/m)
  if (!m) {
    FAILURES.push('[VERSION] 无法从 specs/openapi.yaml 提取 version')
    return
  }
  const version = m[1]

  const targets = [
    ['docs/api/overview.md', /当前 API 版本\*\*: ([\w.-]+)/],
    ['docs/database/schema.md', /当前状态: v([\w.-]+)/],
    ['docs/planning/execution-plan.md', /当前实际版本: \*\*v([\w.-]+)\*\*/],
    ['CLAUDE.md', /当前版本：v([\w.-]+)/],
  ]
  for (const [file, re] of targets) {
    if (!exists(file)) {
      WARNINGS.push(`[VERSION] 文件缺失（跳过）: ${file}`)
      continue
    }
    const content = read(file)
    const dm = content.match(re)
    if (!dm) {
      WARNINGS.push(`[VERSION] ${file} 中未找到版本声明（可能格式已变，请人工核对）`)
      continue
    }
    detectMismatch(`VERSION ${file}`, dm[1], version, `请更新为 ${version}`)
  }
}

// ── 2. 端点覆盖 ──────────────────────────────────────────────────────────

const ENDPOINT_WHITELIST = new Set([
  // 反向检查白名单：overview 正文中的路径 token，非独立端点（须注明理由）
  'openapi', // specs/openapi.yaml 文件名
  'CHANGELOG', // specs/CHANGELOG.md 文件名
  'Token', // 中文叙述"未认证/Token 失效"中的英文词
])

function checkEndpoints() {
  const yaml = read('specs/openapi.yaml')
  const paths = extractOpenApiPaths(yaml)
  if (!paths.length) {
    FAILURES.push('[ENDPOINTS] 未能从 specs/openapi.yaml 提取任何端点路径')
    return
  }
  const overview = read('docs/api/overview.md')

  // 正向：openapi 每个端点都必须出现在 overview
  for (const p of paths) {
    if (!overview.includes(`/${p}`)) {
      FAILURES.push(`[ENDPOINTS] ${p} 未出现在 docs/api/overview.md — 新增端点后必须补文档`)
    }
  }

  // 反向：overview 中的完整路径链（如 /api/v1/sse/notifications、/auth/register）
  // 去 /api/v1 前缀后必须命中 openapi 路径或其前缀，否则告警
  const known = new Set(paths)
  const seen = new Set()
  const chainRe = /\/([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*)/gi
  for (const m of overview.matchAll(chainRe)) {
    // 跳过 {id} 模板参数后的残留段（如 /tasks/{id}/move 中的 /move）
    if ('{}'.includes(overview[m.index - 1])) continue
    const chain = m[1]
    if (seen.has(chain) || ENDPOINT_WHITELIST.has(chain)) continue
    seen.add(chain)
    const normalized = chain.replace(/\{[^}]+\}/g, '{id}')
    if (normalized === 'api/v1' || normalized === 'api') continue // 纯 Base URL 前缀，非端点
    const matchable = normalized.replace(/^api\/v1(\/|$)/, '')
    if (!matchable) continue // 去 /api/v1 前缀后为空（Base URL 声明），非端点
    const isKnown = known.has(matchable)
    const isPrefix = [...known].some((p) => p.startsWith(matchable + '/'))
    if (!isKnown && !isPrefix) {
      WARNINGS.push(`[ENDPOINTS] overview.md 中出现 openapi 不存在的路径 "/${chain}" — 若为叙述碎片可加入 ENDPOINT_WHITELIST（注明理由）`)
    }
  }
}

// ── 3. 结构计数（DOCS-CHECK marker）───────────────────────────────────────

const COUNTERS = {
  'frontend-test-files': () =>
    walk('frontend/src', (f) => /\.(test|spec)\.[jt]sx?$/.test(f)).length,
  'backend-test-classes': () =>
    walk('backend/src/test', (f) => f.endsWith('Test.java')).length,
  'domain-files': () =>
    walk('backend/src/main/java', (f) => f.includes('/domain/') && f.endsWith('.java')).length,
  'specs-count': () =>
    fs.readdirSync(path.join(ROOT, 'openspec/specs'), { withFileTypes: true })
      .filter((d) => d.isDirectory()).length,
  'e2e-files': () => walk('e2e', (f) => f.endsWith('.spec.ts')).length,
  // 占位符形如 data-theme="..." / data-theme="holiday-<id>"，用合法 id 正则排除
  'theme-sets': () => {
    const css = read('frontend/src/core/styles/themes.css')
    return new Set([...css.matchAll(/data-theme="([a-z0-9][a-z0-9-]*)"/g)].map((m) => m[1])).size
  },
  'holiday-themes': () => {
    const css = read('frontend/src/core/styles/holiday-themes.css')
    return new Set([...css.matchAll(/data-theme="(holiday-[a-z0-9][a-z0-9-]*)"/g)].map((m) => m[1])).size
  },
  'ui-components': () =>
    walk('frontend/src/core/components/ui', (f) => f.endsWith('.tsx') && !f.includes('/__tests__/')).length,
  // Phase 2 执行规划进度：解析文档任务行（`- [ ] <kebab-name>`），与 archive 目录名（去日期前缀）求交集
  // 文档移除后 marker 随之消失，此 counter 不会被触发（"全部执行完可移除"）
  'phase2-changes': () => {
    const plan = read('docs/planning/phase2-execution-plan.md')
    const tasks = [...plan.matchAll(/^\- \[[ x]\] ([a-z][a-z0-9-]*)/gm)].map((m) => m[1])
    const archived = fs
      .readdirSync(path.join(ROOT, 'openspec/changes/archive'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name.replace(/^\d{4}-\d{2}-\d{2}-/, ''))
    const archSet = new Set(archived)
    return tasks.filter((t) => archSet.has(t)).length
  },
}

// key 以字母开头，可含数字与连字符（如 phase2-changes）
const MARKER_RE = /<!--\s*DOCS-CHECK:\s*([a-z][a-z0-9-]*)=([\w.-]+)\s*-->/g

function checkCounts() {
  const docFiles = [
    ...walk('docs', (f) => f.endsWith('.md')),
    ...['CLAUDE.md', 'README.md'].filter((f) => exists(f)),
  ]
  const seen = new Set()
  let markerTotal = 0
  for (const file of docFiles) {
    const content = read(file)
    for (const m of content.matchAll(MARKER_RE)) {
      markerTotal++
      const key = m[1]
      const declared = m[2]
      if (seen.has(`${file}#${key}`)) {
        WARNINGS.push(`[COUNTS] ${file} 中 "${key}" marker 重复出现`)
        continue
      }
      seen.add(`${file}#${key}`)
      const counter = COUNTERS[key]
      if (!counter) {
        WARNINGS.push(`[COUNTS] ${file} 含未知 marker "${key}"（检查脚本未实现，或拼写错误）`)
        continue
      }
      detectMismatch(`COUNTS ${key} (${file})`, String(counter()), declared, `请同步更新文档声明`)
    }
  }
  if (markerTotal === 0) {
    WARNINGS.push('[COUNTS] 未在任何文档中找到 DOCS-CHECK marker')
  }
}

// ── 自检 ─────────────────────────────────────────────────────────────────

function selfTest() {
  const before = FAILURES.length
  detectMismatch('SELF-TEST', 'actual', 'declared')
  if (FAILURES.length === before) {
    console.error('✗ self-test failed: 检测器自身不可用')
    process.exit(1)
  }
  FAILURES.length = before
  console.log('✓ self-test OK（检测器工作正常）')
}

// ── 主流程 ───────────────────────────────────────────────────────────────

const isSelfTest = process.argv.includes('--self-test')
if (isSelfTest) selfTest()

checkVersion()
checkEndpoints()
checkCounts()

console.log('docs-check: 检查完成')
for (const w of WARNINGS) console.log(`  ⚠ ${w}`)

if (FAILURES.length) {
  console.error(`\n✗ docs-check 失败（${FAILURES.length} 项不一致）：`)
  for (const f of FAILURES) console.error(`  ✗ ${f}`)
  console.error('\n修复后重跑: node scripts/docs-check.mjs')
  process.exit(1)
}

console.log('✓ docs-check 全部通过')
