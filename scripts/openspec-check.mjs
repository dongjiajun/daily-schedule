#!/usr/bin/env node
/**
 * OpenSpec 一致性检查 — CI 门禁（openspec-validation job）+ 本地复跑。
 * 用法: node scripts/openspec-check.mjs [--self-test]
 *
 * 五类检查（依次执行，任一失败 → 非零退出）:
 *   1. validateAll      — openspec validate --all --strict --no-interactive（主 specs + 活动变更）
 *   2. doctor           — openspec doctor（OpenSpec 根与引用关系健康）
 *   3. guardDelta       — 主 spec 不得含 delta 标记行（openspec/specs/ 下所有 spec.md）
 *   4. checkVersion     — openspec --version ↔ CLAUDE.md "OpenSpec CLI <version>" 声明
 *   5. validateArchived — openspec validate --archived --no-interactive（归档变更 tasks 完整性）
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

console.log('openspec-check: 检查完成')
for (const w of WARNINGS) console.log(`  ⚠ ${w}`)

if (FAILURES.length) {
  console.error(`\n✗ openspec-check 失败（${FAILURES.length} 项不一致）：`)
  for (const f of FAILURES) console.error(`  ✗ ${f}`)
  console.error('\n修复后重跑: pnpm run openspec:check')
  process.exit(1)
}

console.log('✓ openspec-check 全部通过')
