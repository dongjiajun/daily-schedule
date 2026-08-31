#!/usr/bin/env node
/**
 * OpenSpec 一致性检查 — CI 门禁（openspec-validation job）+ 本地复跑。
 * 用法: node scripts/openspec-check.mjs [--self-test]
 *
 * 六类检查（依次执行，任一失败 → 非零退出）:
 *   1. validateAll      — openspec validate --all --strict --no-interactive（主 specs + 活动变更）
 *   2. doctor           — openspec doctor（OpenSpec 根与引用关系健康）
 *   3. guardDelta       — 主 spec 不得含 delta 标记行（openspec/specs/ 下所有 spec.md）
 *   4. checkVersion     — openspec --version ↔ CLAUDE.md "OpenSpec CLI <version>" 声明
 *   5. validateArchived — openspec validate --archived --no-interactive（归档变更 tasks 完整性）
 *   6. checkTestPlan    — test-plan 内容门禁（活动变更场景↔test-plan 行映射一致；归档含 test-plan.md 时无残留 🔴）
 *
 * 本地: pnpm run openspec:check（需全局 openspec CLI；未安装时给出安装指引）。
 * CI:   .github/workflows/ci.yml 的 openspec-validation job 内执行。
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FAILURES = []
const WARNINGS = []
let cliMissing = false
let cliMissingReported = false

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

/** 运行 openspec CLI；ENOENT（未安装）时上报一次并跳过后续 CLI 检查 */
function runOpenSpec(args, label) {
  if (cliMissing) return null
  try {
    const out = execSync(['openspec', ...args].join(' '), {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    console.log(`✓ ${label}`)
    return out
  } catch (err) {
    if (err.code === 'ENOENT') {
      cliMissing = true
      if (!cliMissingReported) {
        cliMissingReported = true
        FAILURES.push(
          '[CLI] 未找到 openspec 命令 — 请先安装: npm install -g @fission-ai/openspec@<version>（见 CLAUDE.md 声明的版本）'
        )
      }
      return null
    }
    FAILURES.push(`[${label}] 失败（exit ${err.status ?? '?'}）`)
    const detail = `${err.stdout ?? ''}${err.stderr ?? ''}`.trim()
    if (detail) console.log(detail)
    return null
  }
}

// ── 1. validate --all --strict ───────────────────────────────────────────

function validateAll() {
  const out = runOpenSpec(
    ['validate', '--all', '--strict', '--no-interactive'],
    'openspec validate --all --strict'
  )
  if (out === null && !cliMissing) {
    // runOpenSpec 已记录失败明细；此处仅补充语义
  }
}

// ── 2. doctor ────────────────────────────────────────────────────────────

function doctorCheck() {
  const out = runOpenSpec(['doctor'], 'openspec doctor')
  if (out !== null) {
    const m = out.match(/OpenSpec root:\s*(\S+)/)
    if (m && m[1] !== 'ok') {
      FAILURES.push(`[DOCTOR] OpenSpec root 状态异常: ${m[1]}`)
    }
  }
}

// ── 3. 主 spec delta 头守卫 ──────────────────────────────────────────────

const SECTION_RE = /^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements\s*$/
const REQ_RE = /^### (Modified|Removed|Renamed) Requirement:/

/** 单行命中 delta 专用标记？（锚定行首——正文内提及（如代码跨/叙述）不误报） */
function guardLine(line) {
  return SECTION_RE.test(line) || REQ_RE.test(line)
}

function guardDelta() {
  const files = walk('openspec/specs', (f) => f.endsWith('.md'))
  let hits = 0
  for (const file of files) {
    const lines = read(file).split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      if (guardLine(lines[i])) {
        hits++
        FAILURES.push(`[DELTA-GUARD] ${file}:${i + 1} 含 delta 专用标记 "${lines[i].trim()}" — delta 仅允许存在于 openspec/changes/<change>/specs/`)
      }
    }
  }
  if (!hits) {
    console.log(`✓ 主 spec delta 头守卫（扫描 ${files.length} 个主 spec 文件，0 命中）`)
  }
}

// ── 4. CLI 版本守卫 ──────────────────────────────────────────────────────

/** 从文本提取 "OpenSpec CLI <version>" 声明（纯函数，供 --self-test 验证解析器） */
function parseDeclaredVersion(text) {
  const m = text.match(/OpenSpec CLI\s+v?(\d+\.\d+\.\d+)/)
  return m ? m[1] : null
}

function checkCliVersion() {
  if (cliMissing) return
  const out = runOpenSpec(['--version'], 'openspec --version')
  if (out === null) return
  const installed = out.trim()
  const declared = parseDeclaredVersion(exists('CLAUDE.md') ? read('CLAUDE.md') : '')
  if (!declared) {
    FAILURES.push('[VERSION] CLAUDE.md 未声明 "OpenSpec CLI <version>" — 请补声明（升级时同步 ci.yml 钉版安装行）')
    return
  }
  if (installed !== declared) {
    FAILURES.push(`[VERSION] 已安装 openspec ${installed}，CLAUDE.md 声明 ${declared} — 请同步：npm install -g @fission-ai/openspec@${declared} 或更新声明`)
  } else {
    console.log(`✓ CLI 版本守卫（installed=${installed} = declared=${declared}）`)
  }
}

// ── 5. validate --archived ──────────────────────────────────────────────

function validateArchived() {
  const out = runOpenSpec(
    ['validate', '--archived', '--no-interactive'],
    'openspec validate --archived'
  )
  if (out === null && !cliMissing) {
    // runOpenSpec 已记录失败明细（残留 `- [ ]` 的归档变更会在输出中列出）
  }
}

// ── 6. test-plan 内容门禁 ────────────────────────────────────────────────

/** 从 delta spec 文本提取 Requirement → Set(Scenario)（纯函数，供 --self-test） */
function parseScenarios(text) {
  const out = new Map()
  let current = null
  for (const line of text.split(/\r?\n/)) {
    const r = line.match(/^### Requirement:\s*(.+)$/)
    if (r) {
      current = r[1].trim()
      out.set(current, new Set())
      continue
    }
    const s = line.match(/^#### Scenario:\s*(.+)$/)
    if (s && current) out.get(current).add(s[1].trim())
  }
  return out
}

/** 从 test-plan.md 提取行映射 Requirement → Set(Scenario)（纯函数；跳过表头/分隔/注释占位行） */
function parseTestPlanRows(text) {
  const out = new Map()
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue
    if (line.includes('<!--')) continue
    const cells = line.split('|').map((c) => c.trim()).slice(1, -1)
    if (cells.length < 2) continue
    const req = cells[0]
    if (req === 'Requirement' || /^-+$/.test(req)) continue
    const scenario = cells[1]
    if (!out.has(req)) out.set(req, new Set())
    out.get(req).add(scenario)
  }
  return out
}

function checkTestPlan() {
  const changesRoot = path.join(ROOT, 'openspec', 'changes')
  if (!fs.existsSync(changesRoot)) return
  const changes = fs.readdirSync(changesRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'archive')
    .map((e) => e.name)

  for (const change of changes) {
    const tpRel = `openspec/changes/${change}/test-plan.md`
    if (!exists(tpRel)) continue // lite / skip_specs 变更无 test-plan，跳过
    const expected = new Map()
    const specFiles = walk(`openspec/changes/${change}/specs`, (f) => f.endsWith('.md'))
    for (const specFile of specFiles) {
      const m = parseScenarios(read(specFile))
      for (const [req, scen] of m) {
        if (!expected.has(req)) expected.set(req, new Set())
        for (const s of scen) expected.get(req).add(s)
      }
    }
    const actual = parseTestPlanRows(read(tpRel))
    let miss = 0
    for (const [req, scen] of expected) {
      const rowScen = actual.get(req)
      for (const s of scen) {
        if (!rowScen || !rowScen.has(s)) {
          miss++
          FAILURES.push(`[TEST-PLAN] ${change}: 场景 "${s}"（Requirement: ${req}）未在 test-plan.md 映射`)
        }
      }
    }
    for (const [req, scen] of actual) {
      for (const s of scen) {
        if (!expected.has(req) || !expected.get(req).has(s)) {
          WARNINGS.push(`[TEST-PLAN] ${change}: 行 "${req} / ${s}" 在 delta specs 中无对应场景（请核对是否漂移）`)
        }
      }
    }
    const total = [...expected.values()].reduce((n, set) => n + set.size, 0)
    console.log(`✓ test-plan 内容门禁（${change}: delta 场景 ${total} 项，${miss ? '存在缺失' : '全部映射'}）`)
  }

  // 归档变更：存在 test-plan.md 时不得残留 🔴
  const archiveRoot = path.join(ROOT, 'openspec', 'changes', 'archive')
  if (!fs.existsSync(archiveRoot)) return
  const archived = fs.readdirSync(archiveRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
  let redHits = 0
  let archivedChecked = 0
  for (const change of archived) {
    const tpRel = `openspec/changes/archive/${change}/test-plan.md`
    if (!exists(tpRel)) continue
    archivedChecked++
    const lines = read(tpRel).split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('🔴')) {
        redHits++
        FAILURES.push(`[TEST-PLAN] 归档变更 ${change}: test-plan.md 第 ${i + 1} 行残留 🔴（应全绿）`)
      }
    }
  }
  console.log(`✓ test-plan 归档检查（${archivedChecked}/${archived.length} 个归档变更含 test-plan，${redHits ? redHits + ' 处残留 🔴' : '无残留 🔴'}）`)
}

// ── 自检 ─────────────────────────────────────────────────────────────────

function selfTest() {
  const issues = []

  // 守卫正例：delta 专用标记必须命中
  for (const line of [
    '## ADDED Requirements',
    '## MODIFIED Requirements',
    '## REMOVED Requirements',
    '## RENAMED Requirements',
    '### Modified Requirement: 旧需求',
    '### Removed Requirement: 旧需求',
    '### Renamed Requirement: 旧需求',
  ]) {
    if (!guardLine(line)) issues.push(`守卫漏检: "${line}"`)
  }

  // 守卫负例：主 spec 合法格式与正文提及（含缩进/代码跨）不得误报
  for (const line of [
    '## Purpose',
    '## Requirements',
    '### Requirement: 需求',
    '#### Scenario: 场景',
    '主 spec SHALL NOT 包含 `## ADDED Requirements` 或 `### Modified Requirement:` 行',
    '  ## ADDED Requirements（缩进的正文提及，非标题）',
  ]) {
    if (guardLine(line)) issues.push(`守卫误报: "${line}"`)
  }

  // 版本解析器：正/负例
  if (parseDeclaredVersion('OpenSpec CLI 1.11.0，skills/commands 同步于 .dsh/') !== '1.11.0') {
    issues.push('版本解析器未提取 "OpenSpec CLI 1.11.0"')
  }
  if (parseDeclaredVersion('OpenSpec CLI 无版本声明') !== null) {
    issues.push('版本解析器对无声明文本误报')
  }
  if (parseDeclaredVersion('OpenSpec CLI v1.11.0') !== '1.11.0') {
    issues.push('版本解析器未兼容 "OpenSpec CLI v1.11.0"')
  }

  // test-plan 解析器：正/负例
  const sc = parseScenarios(
    '### Requirement: R1\n#### Scenario: S1\n#### Scenario: S2\n### Requirement: R2\n#### Scenario: S3'
  )
  if (sc.get('R1')?.size !== 2 || !sc.get('R1')?.has('S2') || !sc.get('R2')?.has('S3')) {
    issues.push('parseScenarios 未正确提取 Requirement/Scenario 映射')
  }
  const tr = parseTestPlanRows(
    [
      '| Requirement | Scenario | Test File | Test Name | Initial State | Coverage Notes |',
      '|-------------|----------|-----------|-----------|---------------|----------------|',
      '| R1 | S1 | A | B | 🔴 | 手工验证 |',
    ].join('\n')
  )
  if (tr.get('R1')?.has('S1') !== true || tr.size !== 1) {
    issues.push('parseTestPlanRows 未正确解析表头/分隔行/数据行')
  }
  if (parseTestPlanRows('| <!-- R1 --> | <!-- S1 --> | x | x | x | x |').size !== 0) {
    issues.push('parseTestPlanRows 未跳过注释占位行')
  }

  if (issues.length) {
    console.error('✗ self-test failed（检测器自身不可用）：')
    for (const issue of issues) console.error(`  ✗ ${issue}`)
    process.exit(1)
  }
  console.log('✓ self-test OK（守卫/版本检测器正负例通过）')
}

// ── 主流程 ───────────────────────────────────────────────────────────────

const isSelfTest = process.argv.includes('--self-test')
if (isSelfTest) selfTest()

validateAll()
doctorCheck()
guardDelta()
checkCliVersion()
validateArchived()
checkTestPlan()

console.log('openspec-check: 检查完成')
for (const w of WARNINGS) console.log(`  ⚠ ${w}`)

if (FAILURES.length) {
  console.error(`\n✗ openspec-check 失败（${FAILURES.length} 项不一致）：`)
  for (const f of FAILURES) console.error(`  ✗ ${f}`)
  console.error('\n修复后重跑: pnpm run openspec:check')
  process.exit(1)
}

console.log('✓ openspec-check 全部通过')
