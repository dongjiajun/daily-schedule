#!/usr/bin/env node
/**
 * OpenSpec 一致性检查 — CI 门禁（openspec-validation job）+ 本地复跑。
 * 用法: node scripts/openspec-check.mjs [--self-test]
 *
 * 十类检查（依次执行，任一失败 → 非零退出）:
 *   1. validateAll      — openspec validate --all --strict --no-interactive（主 specs + 活动变更）
 *   2. doctor           — openspec doctor（OpenSpec 根与引用关系健康）
 *   3. guardDelta       — 主 spec 不得含 delta 标记行（openspec/specs/ 下所有 spec.md）
 *   4. checkVersion     — 版本单源：安装版本 = 根 package.json 锁定版本 = AGENTS.md 声明
 *   5. validateArchived — openspec validate --archived --no-interactive（归档变更 tasks 完整性）
 *   6. checkTestPlan    — test-plan 内容门禁（活动变更场景↔test-plan 行映射一致；归档含 test-plan.md 时无残留 🔴）
 *   7. checkDocSequence — AGENTS.md 工件序列声明 ↔ schema.yaml artifacts 链（指令层收敛守卫）
 *   8. checkMechanismLayer — 机制层完整性（.agents/skills generatedBy = 锁定版本；项目内 update --dry-run 无待变更；.dsh 不被跟踪）
 *   9. checkSchemaTemplates — 模板单源同步（node scripts/sync-schema-templates.mjs --check；custom 为源）
 *   10. checkInstructionBudget — 指令配置预算（context ≤20 行/≤1200 字符；rules ≤8；operations guidance 非空）
 *
 * 本地: pnpm run openspec:check（优先使用仓库 node_modules 内锁定 CLI，缺失时回退全局安装；
 *       依赖未安装时给出 `pnpm install` 指引）。
 * CI:   .github/workflows/ci.yml 的 openspec-validation job 内执行（pnpm install 后调用）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, execSync } from 'node:child_process'
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

/** 仓库内 CLI 入口（根 package.json 锁定的 @fission-ai/openspec）；未安装时返回 null */
function resolveLocalCli() {
  const pkgPath = path.join(ROOT, 'node_modules', '@fission-ai', 'openspec', 'package.json')
  if (!fs.existsSync(pkgPath)) return null
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.openspec
    if (!bin) return null
    const abs = path.join(path.dirname(pkgPath), bin)
    return fs.existsSync(abs) ? abs : null
  } catch {
    return null
  }
}

const LOCAL_CLI = resolveLocalCli()

/** 运行 openspec CLI（优先仓库内锁定版本，缺失回退全局）；ENOENT 时上报一次并跳过后续 CLI 检查 */
function runOpenSpec(args, label) {
  if (cliMissing) return null
  try {
    const out = LOCAL_CLI
      ? execFileSync(process.execPath, [LOCAL_CLI, ...args], {
          cwd: ROOT,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      : execSync(['openspec', ...args].join(' '), {
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
          '[CLI] 未找到 openspec CLI — 请在仓库根执行 `pnpm install` 安装 package.json 锁定的 @fission-ai/openspec（不再依赖全局安装）'
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

/** 从根 package.json 文本提取锁定的 @fission-ai/openspec 版本（纯函数，供 --self-test） */
function parsePinnedVersion(text) {
  try {
    const pkg = JSON.parse(text)
    const v = pkg.devDependencies?.['@fission-ai/openspec']
    return typeof v === 'string' ? v : null
  } catch {
    return null
  }
}

function checkCliVersion() {
  if (cliMissing) return
  const out = runOpenSpec(['--version'], 'openspec --version')
  if (out === null) return
  const installed = out.trim()
  const pinned = exists('package.json') ? parsePinnedVersion(read('package.json')) : null
  const declared = parseDeclaredVersion(exists('AGENTS.md') ? read('AGENTS.md') : '')
  if (!pinned) {
    FAILURES.push(
      '[VERSION] 根 package.json 未锁定 devDependencies["@fission-ai/openspec"] — 请执行 pnpm add -D -w @fission-ai/openspec@<version> --save-exact'
    )
    return
  }
  if (!declared) {
    FAILURES.push('[VERSION] AGENTS.md 未声明 "OpenSpec CLI <version>" — 请补声明（须等于根 package.json 锁定版本）')
    return
  }
  const drift = []
  if (installed !== pinned) drift.push(`实际安装 ${installed} ≠ package.json 锁定 ${pinned}（请 pnpm install）`)
  if (declared !== pinned) drift.push(`AGENTS.md 声明 ${declared} ≠ package.json 锁定 ${pinned}（请同步声明）`)
  if (drift.length) {
    FAILURES.push(`[VERSION] OpenSpec CLI 版本不一致：${drift.join('；')} — 升级 SOP：改根 package.json 版本 + pnpm install + 同步 AGENTS.md 声明`)
  } else {
    console.log(`✓ CLI 版本守卫（安装=${installed} = package.json=${pinned} = AGENTS.md=${declared}）`)
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

// ── 7. AGENTS.md 工件序列一致性守卫 ───────────────────────────────────────

/** 从 AGENTS.md 文本提取 Artifact 序列声明（纯函数，供 --self-test） */
function parseDocSequence(text) {
  const m = text.match(/\/opsx:new <name>\s*→\s*(.+?)\s*→\s*\/opsx:apply/)
  if (!m) return null
  return m[1].split('→').map((s) => s.trim()).filter(Boolean)
}

/** 从 schema.yaml 文本提取 artifacts 链（纯函数，供 --self-test；`- id:` 仅出现在 artifacts 列表） */
function parseSchemaArtifacts(text) {
  const out = []
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s+-\s+id:\s*(\S+)\s*$/)
    if (m) out.push(m[1])
  }
  return out
}

function checkDocSequence() {
  if (!exists('AGENTS.md') || !exists('openspec/schemas/spec-driven-custom/schema.yaml')) return
  const declared = parseDocSequence(read('AGENTS.md'))
  const schemaChain = parseSchemaArtifacts(read('openspec/schemas/spec-driven-custom/schema.yaml'))
  if (!declared) {
    FAILURES.push('[SEQUENCE] AGENTS.md 未找到 Artifact 序列声明（/opsx:new <name> → … → /opsx:apply）— 请补声明或修正格式')
    return
  }
  const decl = declared.join(' → ')
  const chain = schemaChain.join(' → ')
  if (decl !== chain) {
    FAILURES.push(
      `[SEQUENCE] AGENTS.md 工件序列声明 "${decl}" 与 schema 链 "${chain}" 不一致（缺/多/乱序即漂移）— 修正 AGENTS.md 或 schema.yaml`
    )
    return
  }
  console.log(`✓ AGENTS.md 序列一致性守卫（AGENTS.md=${decl} = schema=${chain}）`)
}

// ── 8. 机制层完整性守卫 ──────────────────────────────────────────────────

/** 从 SKILL.md 文本提取 generatedBy 版本（纯函数，供 --self-test） */
function parseGeneratedBy(text) {
  const m = text.match(/^\s*generatedBy:\s*"([^"]+)"\s*$/m)
  return m ? m[1] : null
}

/** 过滤出项目内的机制层待变更项（排除 ~/ 全局配置与绝对路径的项目外变更），供 --self-test */
function repoMechanismChanges(changes) {
  const list = Array.isArray(changes) ? changes : []
  return list.filter(
    (change) => typeof change?.path === 'string' && !change.path.startsWith('~') && !path.isAbsolute(change.path)
  )
}

function checkMechanismLayer() {
  if (cliMissing) return
  const pinned = exists('package.json') ? parsePinnedVersion(read('package.json')) : null
  const skillsRoot = '.agents/skills'
  const markerRel = `${skillsRoot}/.openspec-target`

  if (!exists(markerRel)) {
    FAILURES.push('[MECHANISM] 缺少 .agents/skills/.openspec-target — 请运行 pnpm exec openspec init --tools agents 生成机制层并提交')
    return
  }
  const marker = read(markerRel).trim()
  if (marker !== 'agents') {
    FAILURES.push(`[MECHANISM] .agents/skills/.openspec-target = "${marker}"（应为 agents）`)
  }

  const skillFiles = walk(skillsRoot, (f) => f.endsWith('/SKILL.md') && f.includes('/openspec-'))
  if (skillFiles.length === 0) {
    FAILURES.push('[MECHANISM] .agents/skills 下未找到 openspec-* 技能 — 机制层未生成')
  }
  for (const file of skillFiles) {
    const generatedBy = parseGeneratedBy(read(file))
    if (!pinned) {
      FAILURES.push('[MECHANISM] 无法从 package.json 读取锁定版本，无法校验 generatedBy')
      break
    }
    if (generatedBy !== pinned) {
      FAILURES.push(`[MECHANISM] ${file} 的 generatedBy=${generatedBy ?? '缺失'} ≠ 仓库锁定 ${pinned} — 请运行 pnpm exec openspec update 并提交`)
    }
  }

  // 机制层内容应与 CLI 生成结果一致：仅校验项目内待变更项。
  // 全新环境（CI runner/新机器）首次运行会计划创建 ~/.config/openspec/config.json 等
  // 机器级全局配置/全局技能，不属于仓库机制层，不得判为漂移。
  const out = runOpenSpec(['update', '--dry-run', '--json'], 'openspec update --dry-run')
  if (out !== null) {
    try {
      const planned = JSON.parse(out)
      const allChanges = Array.isArray(planned.changes) ? planned.changes : []
      const repoChanges = repoMechanismChanges(allChanges)
      const externalCount = allChanges.length - repoChanges.length
      if (repoChanges.length > 0) {
        FAILURES.push(
          `[MECHANISM] openspec update --dry-run 检测到 ${repoChanges.length} 项项目内机制层待变更：${repoChanges
            .slice(0, 3)
            .map((change) => change.path)
            .join(', ')} — 请运行 pnpm exec openspec update 并提交`
        )
      } else if (externalCount > 0) {
        console.log(`  （忽略 ${externalCount} 项项目外变更：全局配置初始化/全局技能，不属仓库机制层）`)
      }
    } catch {
      WARNINGS.push('[MECHANISM] 无法解析 openspec update --dry-run --json 输出，跳过一致性校验')
    }
  }

  // .dsh/ 仅本机个人技能，不得被 git 跟踪
  try {
    const tracked = execSync('git ls-files -- .dsh', { cwd: ROOT, encoding: 'utf8' }).trim()
    if (tracked) {
      FAILURES.push(`[MECHANISM] .dsh/ 下存在已跟踪文件（应仅本机使用）：${tracked.split(/\r?\n/).slice(0, 3).join(', ')}`)
    }
  } catch {
    WARNINGS.push('[MECHANISM] 无法执行 git ls-files，跳过 .dsh 跟踪检查')
  }

  console.log(`✓ 机制层完整性守卫（${skillFiles.length} 个 openspec-* skills，generatedBy=${pinned}）`)
}

// ── 9. 模板单源同步守卫 ──────────────────────────────────────────────────

function checkSchemaTemplates() {
  const script = path.join(ROOT, 'scripts', 'sync-schema-templates.mjs')
  if (!fs.existsSync(script)) {
    FAILURES.push('[TEMPLATES] 缺少 scripts/sync-schema-templates.mjs — 无法校验三档 schema 共享模板单源')
    return
  }
  try {
    execFileSync(process.execPath, [script, '--check'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    console.log('✓ 模板单源同步守卫（proposal/spec → 三档，design → standard）')
  } catch (err) {
    FAILURES.push(
      '[TEMPLATES] 共享模板不一致 — 请运行 node scripts/sync-schema-templates.mjs --write 后提交（openspec-check 第 9 检）'
    )
    const detail = `${err.stdout ?? ''}${err.stderr ?? ''}`.trim()
    if (detail) console.log(detail)
  }
}

// ── 10. 指令配置预算守卫 ─────────────────────────────────────────────────

/**
 * 从 config.yaml 文本提取配置预算（纯函数，供 --self-test）。
 * 只解析受控的块状结构：context 块内容行、rules 列表项、operations 两段的 guidance 列表项。
 */
function parseConfigBudget(text) {
  let mode = null
  let operation = null
  const budget = { contextLines: 0, contextChars: 0, rulesCount: 0, operations: { apply: 0, archive: 0 } }
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '')
    if (/^context:\s*\|/.test(line)) { mode = 'context'; continue }
    if (/^rules:\s*$/.test(line)) { mode = 'rules'; continue }
    if (/^operations:\s*$/.test(line)) { mode = 'operations'; operation = null; continue }
    if (/^[A-Za-z_][\w-]*:\s*/.test(line)) { mode = null; operation = null; continue }
    if (mode === 'context') {
      if (line.trim() !== '') {
        budget.contextLines += 1
        budget.contextChars += line.trim().length
      }
    } else if (mode === 'rules') {
      if (/^\s{2,}-\s+\S/.test(line)) budget.rulesCount += 1
    } else if (mode === 'operations') {
      const section = line.match(/^\s{2}(apply|archive):\s*$/)
      if (section) { operation = section[1]; continue }
      if (operation && /^\s{4,}-\s+\S/.test(line)) budget.operations[operation] += 1
    }
  }
  return budget
}

const CONTEXT_MAX_LINES = 20
const CONTEXT_MAX_CHARS = 1200
const RULES_MAX = 8

function checkInstructionBudget() {
  if (!exists('openspec/config.yaml')) {
    FAILURES.push('[CONFIG-BUDGET] 缺少 openspec/config.yaml — 无法校验指令配置预算')
    return
  }
  const before = FAILURES.length
  const budget = parseConfigBudget(read('openspec/config.yaml'))
  if (budget.contextLines > CONTEXT_MAX_LINES || budget.contextChars > CONTEXT_MAX_CHARS) {
    FAILURES.push(
      `[CONFIG-BUDGET] context 超预算（${budget.contextLines} 行 / ${budget.contextChars} 字符；上限 ${CONTEXT_MAX_LINES} 行 / ${CONTEXT_MAX_CHARS} 字符）— 细节移入 AGENTS.md / docs/，只保留项目级事实与指针`
    )
  }
  if (budget.rulesCount > RULES_MAX) {
    FAILURES.push(
      `[CONFIG-BUDGET] config rules 超预算（${budget.rulesCount} 条；上限 ${RULES_MAX}）— 格式/编排规则归 schema instruction 与模板，rules 只留未覆盖约束`
    )
  }
  if (budget.operations.apply === 0 || budget.operations.archive === 0) {
    FAILURES.push(
      `[CONFIG-BUDGET] operations guidance 缺失（apply=${budget.operations.apply} 条，archive=${budget.operations.archive} 条）— apply/archive 纪律写入 config.yaml operations 段`
    )
  }
  if (FAILURES.length === before) {
    console.log(
      `✓ 指令配置预算守卫（context ${budget.contextLines} 行/${budget.contextChars} 字符，rules ${budget.rulesCount} 条，apply/archive guidance ${budget.operations.apply}/${budget.operations.archive} 条）`
    )
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
  if (parsePinnedVersion('{"devDependencies":{"@fission-ai/openspec":"1.15.0"}}') !== '1.15.0') {
    issues.push('parsePinnedVersion 未提取 package.json 锁定版本')
  }
  if (parsePinnedVersion('{"dependencies":{}}') !== null) {
    issues.push('parsePinnedVersion 对无锁定依赖文本误报')
  }
  if (parsePinnedVersion('not-json') !== null) {
    issues.push('parsePinnedVersion 对非法 JSON 误报')
  }
  if (parseDeclaredVersion('OpenSpec CLI 1.15.0，skills/commands 同步于 .dsh/') !== '1.15.0') {
    issues.push('版本解析器未提取 "OpenSpec CLI 1.15.0"')
  }
  if (parseDeclaredVersion('OpenSpec CLI 无版本声明') !== null) {
    issues.push('版本解析器对无声明文本误报')
  }
  if (parseDeclaredVersion('OpenSpec CLI v1.15.0') !== '1.15.0') {
    issues.push('版本解析器未兼容 "OpenSpec CLI v1.15.0"')
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

  // AGENTS.md 序列解析器：正/负例
  const seq = parseDocSequence(
    '/opsx:new <name> → proposal → specs → design → test-plan → tasks → /opsx:apply → /opsx:verify → /opsx:archive'
  )
  if (seq?.join('|') !== 'proposal|specs|design|test-plan|tasks') {
    issues.push('parseDocSequence 未正确提取工件序列')
  }
  if (parseDocSequence('# 无序列声明的文本') !== null) {
    issues.push('parseDocSequence 对无声明文本误报')
  }

  // schema 工件链解析器：正/负例
  const artifactChain = parseSchemaArtifacts(
    'artifacts:\n  - id: proposal\n  - id: specs\n    requires:\n      - proposal\n  - id: tasks\n'
  )
  if (artifactChain.join('|') !== 'proposal|specs|tasks') {
    issues.push('parseSchemaArtifacts 未正确提取 schema 工件链')
  }
  if (parseSchemaArtifacts('name: spec-driven-custom\nversion: 1').length !== 0) {
    issues.push('parseSchemaArtifacts 对无工件链文本误报')
  }

  // 机制层 generatedBy 解析器：正/负例
  if (parseGeneratedBy('metadata:\n  author: openspec\n  generatedBy: "1.15.0"') !== '1.15.0') {
    issues.push('parseGeneratedBy 未提取 generatedBy 版本')
  }
  if (parseGeneratedBy('metadata:\n  author: openspec') !== null) {
    issues.push('parseGeneratedBy 对缺失 generatedBy 文本误报')
  }

  // 机制层变更过滤：项目外（~/ 全局、绝对路径）不计，项目内保留
  const repoChangeList = repoMechanismChanges([
    { path: '~/AppData/Roaming/openspec/config.json' },
    { path: '/home/runner/.config/openspec/config.json' },
    { path: '.agents/skills/openspec-apply-change/SKILL.md' },
    { path: 'openspec/config.yaml' },
  ])
  if (repoChangeList.length !== 2) {
    issues.push('repoMechanismChanges 未正确过滤项目外变更')
  }
  if (repoChangeList[0]?.path !== '.agents/skills/openspec-apply-change/SKILL.md') {
    issues.push('repoMechanismChanges 保留顺序/内容不正确')
  }

  // 指令配置预算解析器：正/负例
  const budget = parseConfigBudget(
    'context: |\n  第一行\n  第二行\n\nrules:\n  proposal:\n    - 规则一\n    - 规则二\noperations:\n  apply:\n    guidance:\n      - 纪律一\n  archive:\n    guidance:\n      - 纪律二\n'
  )
  if (budget.contextLines !== 2 || budget.contextChars !== 6 || budget.rulesCount !== 2) {
    issues.push('parseConfigBudget 未正确统计 context/rules')
  }
  if (budget.operations.apply !== 1 || budget.operations.archive !== 1) {
    issues.push('parseConfigBudget 未正确统计 operations guidance')
  }
  const emptyBudget = parseConfigBudget('schema: spec-driven-custom\n')
  if (emptyBudget.contextLines !== 0 || emptyBudget.rulesCount !== 0 || emptyBudget.operations.apply !== 0) {
    issues.push('parseConfigBudget 对空配置误报')
  }

  if (issues.length) {
    console.error('✗ self-test failed（检测器自身不可用）：')
    for (const issue of issues) console.error(`  ✗ ${issue}`)
    process.exit(1)
  }
  console.log('✓ self-test OK（守卫/版本/序列检测器正负例通过）')
}

// ── 主流程 ───────────────────────────────────────────────────────────────

const isSelfTest = process.argv.includes('--self-test')
if (isSelfTest) selfTest()

console.log(`✓ CLI 来源（${LOCAL_CLI ? '仓库 node_modules 锁定版本' : '全局安装（回退）'}）`)
validateAll()
doctorCheck()
guardDelta()
checkCliVersion()
validateArchived()
checkTestPlan()
checkDocSequence()
checkMechanismLayer()
checkSchemaTemplates()
checkInstructionBudget()

console.log('openspec-check: 检查完成')
for (const w of WARNINGS) console.log(`  ⚠ ${w}`)

if (FAILURES.length) {
  console.error(`\n✗ openspec-check 失败（${FAILURES.length} 项不一致）：`)
  for (const f of FAILURES) console.error(`  ✗ ${f}`)
  console.error('\n修复后重跑: pnpm run openspec:check')
  process.exit(1)
}

console.log('✓ openspec-check 全部通过')
