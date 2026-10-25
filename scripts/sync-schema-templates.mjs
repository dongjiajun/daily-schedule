#!/usr/bin/env node
/**
 * 同步 OpenSpec schema 的共享模板（单源：spec-driven-custom/templates）。
 *
 * 用法:
 *   node scripts/sync-schema-templates.mjs           # 默认等同 --check
 *   node scripts/sync-schema-templates.mjs --check   # 比对，漂移时退出码 1
 *   node scripts/sync-schema-templates.mjs --write   # 以 custom 为源复制到目标
 *   node scripts/sync-schema-templates.mjs --help    # 显示用法
 *
 * 路径以脚本自身位置解析仓库根，不依赖调用时的 cwd。
 * 无第三方依赖，UTF-8。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
// scripts/ 的上一级即仓库根
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..')
const SCHEMAS_DIR = path.join(REPO_ROOT, 'openspec', 'schemas')
const SOURCE_SCHEMA = 'spec-driven-custom'
const SOURCE_DIR = path.join(SCHEMAS_DIR, SOURCE_SCHEMA, 'templates')
const FIX_HINT = '（运行 node scripts/sync-schema-templates.mjs --write 修复）'

/** 共享模板 → 目标 schema（proposal/spec 三档共享，design 仅 standard；lite 无 design 工件） */
const SHARED_TEMPLATES = [
  { name: 'proposal.md', targets: ['spec-driven-custom-standard', 'spec-driven-custom-lite'] },
  { name: 'spec.md', targets: ['spec-driven-custom-standard', 'spec-driven-custom-lite'] },
  { name: 'design.md', targets: ['spec-driven-custom-standard'] },
]

const TARGET_COUNT = SHARED_TEMPLATES.reduce((n, item) => n + item.targets.length, 0)

function toRepoRelative(absPath) {
  return path.relative(REPO_ROOT, absPath).split(path.sep).join('/')
}

/** 换行归一 CRLF→LF，并忽略文件末尾多余空行差异 */
function normalize(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, '')
}

function printHelp() {
  console.log(`用法: node scripts/sync-schema-templates.mjs [--check|--write|--help]

  （无参数）  等同 --check，检查共享模板是否与单源一致
  --check     比对全部共享模板（换行归一 CRLF→LF，忽略文件末尾多余空行差异）；不一致逐条打印并以退出码 1 结束
  --write     以 ${SOURCE_SCHEMA}/templates 为源复制到目标 schema 并打印写入清单
  --help      显示本帮助

共享模板（3 个源 → ${TARGET_COUNT} 个目标）:
  proposal.md  → spec-driven-custom-standard, spec-driven-custom-lite
  spec.md      → spec-driven-custom-standard, spec-driven-custom-lite
  design.md    → spec-driven-custom-standard
`)
}

function check() {
  let mismatches = 0

  for (const { name, targets } of SHARED_TEMPLATES) {
    const sourcePath = path.join(SOURCE_DIR, name)
    if (!fs.existsSync(sourcePath)) {
      console.error(`✗ 缺少单源模板 ${toRepoRelative(sourcePath)}`)
      mismatches += 1
      continue
    }
    const source = normalize(fs.readFileSync(sourcePath, 'utf8'))

    for (const schema of targets) {
      const targetPath = path.join(SCHEMAS_DIR, schema, 'templates', name)
      if (!fs.existsSync(targetPath)) {
        console.log(`✗ ${toRepoRelative(sourcePath)} ≠ ${toRepoRelative(targetPath)}${FIX_HINT}`)
        mismatches += 1
        continue
      }
      if (normalize(fs.readFileSync(targetPath, 'utf8')) !== source) {
        console.log(`✗ ${toRepoRelative(sourcePath)} ≠ ${toRepoRelative(targetPath)}${FIX_HINT}`)
        mismatches += 1
      }
    }
  }

  if (mismatches > 0) {
    console.log(`共 ${mismatches} 处共享模板漂移`)
    process.exitCode = 1
    return
  }

  console.log(`✓ 模板单源一致（${SHARED_TEMPLATES.length} 共享模板 → ${TARGET_COUNT} 目标）`)
}

function write() {
  const written = []

  for (const { name, targets } of SHARED_TEMPLATES) {
    const sourcePath = path.join(SOURCE_DIR, name)
    if (!fs.existsSync(sourcePath)) {
      console.error(`✗ 缺少单源模板 ${toRepoRelative(sourcePath)}`)
      process.exitCode = 1
      return
    }
    const content = fs.readFileSync(sourcePath, 'utf8')

    for (const schema of targets) {
      const targetPath = path.join(SCHEMAS_DIR, schema, 'templates', name)
      fs.mkdirSync(path.dirname(targetPath), { recursive: true })
      fs.writeFileSync(targetPath, content, 'utf8')
      written.push({ sourcePath, targetPath })
    }
  }

  for (const { sourcePath, targetPath } of written) {
    console.log(`✓ ${toRepoRelative(sourcePath)} → ${toRepoRelative(targetPath)}`)
  }
  console.log(`✓ 已写入 ${written.length} 个共享模板（${SHARED_TEMPLATES.length} 共享模板 → ${TARGET_COUNT} 目标）`)
}

function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    printHelp()
    return
  }

  const unknown = args.filter((arg) => arg !== '--check' && arg !== '--write')
  if (unknown.length > 0) {
    console.error(`✗ 未知参数: ${unknown.join(' ')}`)
    printHelp()
    process.exitCode = 1
    return
  }
  if (args.includes('--check') && args.includes('--write')) {
    console.error('✗ --check 与 --write 只能二选一')
    process.exitCode = 1
    return
  }

  if (args.includes('--write')) {
    write()
  } else {
    check()
  }
}

main()
