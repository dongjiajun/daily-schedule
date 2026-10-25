# Proposal: dsh-skills-only

## Why
DeepSeek Harness 的机制层只消费技能（skills）：本机 harness 实测技能根为 `<project>/.dsh/skills`（rank 100）与 `<project>/.agents/skills`（rank 200），不存在命令目录的加载逻辑（`app.asar` 内 `.dsh/commands` 零命中）。同时 OpenSpec 自 1.14.0 起官方支持 `dsh` 且为 **skills-only**（无 command adapter，`openspec update` 只生成 `.dsh/skills`）。项目此前为保持 `.claude`/`.dsh` 双份对称，人工镜像了 `.dsh/commands/opsx/`（12 个文件），该目录无任何消费方，属于机制层冗余与永久人工同步面——每次 OpenSpec 升级都必须手工重同步，且与「机制层禁止手改」原则相冲突。

## What Changes
- **删除** `.dsh/commands/opsx/` 人工镜像（12 个 Markdown，及空的 `.dsh/commands/` 目录）；`.dsh/skills/` 与 `.claude/` 机制层产物保持不变（仍由 CLI 生成）
- **收窄机制层定义**：`openspec-conventions` 主 spec「指令体系分层与收敛」明确机制层 = `.claude/commands/opsx/` + `.claude/skills/` + `.dsh/skills/`；新增场景记录「dsh 机制层仅保留 skills」
- **文档同步**：`CLAUDE.md` 机制层描述去掉 `.dsh/commands` 人工镜像；`docs/architecture.md` 指令体系分层描述同步
- 非 **BREAKING**：无 API 契约、无代码行为变更；仅机制层/文档收敛

## Capabilities

### New Capabilities
（无——本变更不引入新能力）

### Modified Capabilities
- `openspec-conventions`: 「指令体系分层与收敛」需求更新机制层产物范围（dsh skills-only，移除 `.dsh/commands` 人工镜像），并新增「dsh 机制层仅保留 skills」场景

## API Contract Impact
无。`specs/openapi.yaml` 零变更。

## DDD Layer Impact
无。后端 API/应用/领域/基础设施四层零变更；前端、小程序源码零变更。

## Database Impact
无需。

## Impact
- 删除：`.dsh/commands/opsx/*.md`（12）
- 修改：`CLAUDE.md`（机制层描述）、`docs/architecture.md`（指令体系分层描述）、`openspec/specs/openspec-conventions/spec.md`（经 delta 归档同步）
- 验证：`openspec update --dry-run` 仍应无变更（机制层由官方管理的部分不受影响）；`openspec validate --all --strict`、`openspec validate --archived`、`pnpm run openspec:check`、`pnpm run docs:check` 全绿
