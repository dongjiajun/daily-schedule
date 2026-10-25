# Proposal: localize-mechanism-layer

## Why
后续开发不再使用 Claude Code，而 OpenSpec 机制层产物（`.claude/`、`.dsh/`）本质是「按本机 CLI 版本生成的本地指令文件」：`.claude/` 是 Claude Code 专用产物；`.dsh/skills` 是 DSH 的 skills-only 产物，`generatedBy` 随 CLI 版本变化、每台机器都可重生成，且机制层的原则是「禁止手改、由 CLI 重生成」。把 53 个 `.claude` 文件与 41 个 `.dsh` 文件纳入版本库，只会带来每次升级数十文件的 churn，且没有运行时/CI 收益（CI 不读取它们，DSH 只读本机 `.dsh/skills`）。

## What Changes
- **删除 `.claude/` 目录**（53 个 tracked 文件：12 commands + 12 skills + 3 个项目技能）——不再使用 Claude Code
- **`.dsh/` 移出版本控制**：`git rm -r --cached .dsh`（本地文件保留），并在 `.gitignore` 排除 `.dsh/`（含 `.claude/` 兜底）；机制层改为本地生成——新环境执行 `openspec init --tools dsh`（或 `openspec update`）生成 12 个 skills
- **机制层定义收窄**为 `.dsh/skills/`（本地生成、不入库）；`openspec-conventions` 主 spec「指令体系分层与收敛」更新，并新增「机制层本地生成不入库」场景
- **文档同步**：`CLAUDE.md`、`docs/architecture.md`
- 非 **BREAKING**：无 API 契约、无代码/运行时行为变更

## Capabilities

### New Capabilities
（无——本变更不引入新能力）

### Modified Capabilities
- `openspec-conventions`: 机制层产物改为 `.dsh/skills` 本地生成且不入库；移除 `.claude/` 文档目录与 `.dsh` 入库约定

## API Contract Impact
无。`specs/openapi.yaml` 零变更。

## DDD Layer Impact
无。后端 API/应用/领域/基础设施四层零变更；前端、小程序源码零变更。

## Database Impact
无需。

## Impact
- 删除：`.claude/`（53 个文件：`commands/opsx/*` 12 + `skills/**` 41）
- 取消跟踪：`.dsh/`（41 个文件，本地保留）
- 修改：`.gitignore`、`CLAUDE.md`、`docs/architecture.md`、`openspec/specs/openspec-conventions/spec.md`（经 delta 同步）
- 验证：`git ls-files .dsh .claude` 为空；干净副本中 `openspec init --tools dsh` 可重建 `.dsh/skills` 且不改 `openspec/config.yaml`；`openspec validate --all --strict`、`openspec validate --archived`、`pnpm run openspec:check`、`pnpm run docs:check` 全绿
