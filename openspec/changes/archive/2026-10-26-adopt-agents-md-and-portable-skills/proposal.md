# Proposal: adopt-agents-md-and-portable-skills

## Why

项目已不再使用 Claude Code，但文档层仍是 `CLAUDE.md`；机制层 `.dsh/skills/` 只在本机由 `openspec init --tools dsh` 生成、不入库，新环境/新同事必须手工会籍才能拿到 12 个 OpenSpec 技能，多人协作时极易漏装（漏装即等于没有工作流约束）。DeepSeek Harness 的指令基线先加载 `AGENTS.md`（`instructionFileCandidates` 默认 `['AGENTS.md','CLAUDE.md']`），技能根默认包含 `.agents/skills/`（rank 200）；OpenSpec 1.15.0 内置 `agents` 适配器（"Other / Universal (shared .agents skills)"，生成 12 个 skills、无 command adapter）。本变更把文档层迁到 `AGENTS.md`、机制层迁到**入库**的 `.agents/skills/`，并新增机械完整性校验，为后续 schema 三档化、指令层收敛（B1/B2）提供跨工具可复现地基。

## What Changes

- `CLAUDE.md` → `AGENTS.md`（`git mv`）；全仓引用同步更新（README / docs/architecture.md / config rules / 两个 schema 的 instruction 与模板 / 脚本 / CI / .gitignore）；已归档变更保持历史原样不改
- 机制层：`pnpm exec openspec init --tools agents` 生成 `.agents/skills/`（12 个 `openspec-*/SKILL.md` + `.openspec-target`）并**提交入库**；删除本机 `.dsh/skills/openspec-*`（`.dsh/` 仅存本机个人技能，继续 gitignore）
- `scripts/openspec-check.mjs` 新增第 8 检「机制层完整性」：`.agents/skills/.openspec-target` = `agents`、12 个 skill 的 `generatedBy` = 根 `package.json` 锁定版本、`openspec update --dry-run --json` 无待变更项、`.dsh/` 不被 git 跟踪；`--self-test` 覆盖新解析器
- `.gitignore`：新增 `AGENTS.local.md` / `CLAUDE.local.md` / `docs/diagrams/_preview/`；更新机制层目录注释
- `docs-check.mjs` 文档层文件名引用更新为 `AGENTS.md`
- 主 spec 经 delta 更新：`openspec-conventions`（三层职责重述 + CI 检查七项→八项）、`doc-sync-workflow`（文档层命名）、`precommit-verify`（文档层命名）、`service-caching`（Purpose 引用改为直接编辑主 spec）
- 非 **BREAKING**（工具链/文档层，无 API 契约、无运行时代码变化）

## Capabilities

### New Capabilities

- 无（工具链/文档层变更，不新增能力）

### Modified Capabilities

- `openspec-conventions`: 机制层归属由"本地 `.dsh/skills` 不入库"改为"仓库 `.agents/skills` 入库 + `.dsh` 仅个人技能"，文档层改为 `AGENTS.md`，CI 门禁由七项增至八项（新增机制层完整性守卫）
- `doc-sync-workflow`: 文档层文件名 `CLAUDE.md` → `AGENTS.md`（含需求/场景改名）
- `precommit-verify`: 文档层文件名 `CLAUDE.md` → `AGENTS.md`（需求与场景改名）
- `service-caching`: Purpose 中的架构声明引用 `CLAUDE.md` → `AGENTS.md`

## API Contract Impact

无影响——不修改 `specs/openapi.yaml`，不涉及任何端点/字段。

## DDD Layer Impact

无——不触碰后端 API/应用/领域/基础设施任一层。

## Database Impact

无需 Flyway 迁移，不涉及表/列。

## Impact

- 文件：`AGENTS.md`（原 `CLAUDE.md`）、`.agents/skills/**`（新增 12 skills + marker，约 184KB）、`scripts/openspec-check.mjs`、`scripts/docs-check.mjs`、`.gitignore`、`README.md`、`docs/architecture.md`、`openspec/config.yaml`、`openspec/schemas/*`（含 3 个模板）、4 个主 spec（经 delta）
- 行为：任意 AGENTS.md 兼容工具（DSH / Codex 等）克隆后 `pnpm install` 即可加载机制层，无需 per-machine `openspec init`；CI 新增机制层完整性阻断检查
- 风险：生成文件入库（升级时需提交重生成 diff）；已用第 8 检（`generatedBy` + `update --dry-run`）机械约束，误漂移会被 CI 拦截
- 回退：若某工具不识别 `.agents/skills`，可本机 `pnpm exec openspec init --tools dsh` 生成到 `.dsh/skills`（`.gitignore` 已覆盖，不入库）
