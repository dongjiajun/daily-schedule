# Proposal: fix-mechanism-check-global-config

## Why

CI 的 `OpenSpec Validation` job 自 `adopt-agents-md-and-portable-skills`（`cad03df`）起持续失败：第 8 检「机制层完整性」把 `openspec update --dry-run --json` 的**任何** change 都判为漂移，而 **全新环境**（CI runner、新同事机器）首次运行时会计划创建**机器级全局配置** `~/.config/openspec/config.json`（Windows 为 `%APPDATA%\openspec\config.json`），该变更不属于仓库机制层。本地因已有全局配置无法复现，导致连续 3 个提交（C/B1/B2）CI 红。已用临时 CI annotation 捕获到确凿证据：`changes: [{"path":"~/AppData/Roaming/openspec/config.json","action":"add"}]`。

## What Changes

- `scripts/openspec-check.mjs` 第 8 检：只统计**项目内**（非 `~/` 前缀、非绝对路径）的 `update --dry-run` 变更；项目外全局配置初始化/全局技能不判漂移（保留信息提示）。新增纯函数 `repoMechanismChanges()` 与 `--self-test` 正负例
- 主 spec delta（`openspec-conventions`）：第 8 检口径改为"项目内 changes 为空"，新增场景「项目外全局配置初始化不误报」
- 事件响应：回退临时 CI 调试步骤（`.github/workflows/ci.yml` 恢复 `run: pnpm run openspec:check`）；`AGENTS.md` CI 门禁说明同步"项目内"
- 验证补强：本地用 **fresh HOME/USERPROFILE** 模拟全新环境运行 `pnpm run openspec:check`，确保第 8 检不误报
- 非 **BREAKING**（CI 门禁脚本修复 + 约定澄清，无 API/运行时代码变化）

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `openspec-conventions`: 第 8 检「机制层完整性」校验范围收敛为项目内变更（项目外全局配置/全局技能不计漂移），并新增对应不误报场景

## API Contract Impact

无影响——不修改 `specs/openapi.yaml`。

## DDD Layer Impact

无——仅 `scripts/openspec-check.mjs`、CI workflow、AGENTS.md 与 spec。

## Database Impact

无需 Flyway 迁移。

## Impact

- 文件：`scripts/openspec-check.mjs`（第 8 检过滤 + self-test）、`.github/workflows/ci.yml`（回退临时调试）、`AGENTS.md`（CI 门禁措辞）、`openspec/specs/openspec-conventions/spec.md`（经 delta）
- 行为：全新环境（CI/新机器）`pnpm run openspec:check` 恢复全绿；真正的手改/未重生成机制层仍被拦截
- 回退：`git revert` 本变更（临时 CI 调试步骤已在同一提交回退）
