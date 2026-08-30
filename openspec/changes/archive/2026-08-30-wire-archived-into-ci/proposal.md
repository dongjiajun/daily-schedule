# Proposal: wire-archived-into-ci

## Why
`wire-openspec-validation-into-ci` 已将 OpenSpec 一致性接入 CI（validate --all --strict + doctor + 主 spec 无 delta 头 + CLI 版本守卫），但归档完整性（`openspec validate --archived`）未纳入：此前 10 个历史归档 tasks 未全勾，CI 一接必红。`backfill-archive-task-completion` 已修复（`--archived` 61/61 全绿），前置达成——本变更把 `--archived` 补为 `openspec-check.mjs` 第 5 子检查，归档完整性从此亦由 CI 把关（配合 backfill 注释的"移交用户"语义，用户跟进项不再阻断门禁）。

## What Changes
- `scripts/openspec-check.mjs`：新增第 5 子检查 `openspec validate --archived --no-interactive`（归档变更 tasks 完整性：残留 `- [ ]` 即非零退出）+ 头部注释/检查清单更新；`--self-test` 不变（无新检测器，纯 CLI 调用）；ci.yml **零改动**（job 已跑本脚本）
- `openspec/specs/openspec-conventions/spec.md`（归档时 sync）：「CI 门禁执行 OpenSpec 一致性验证」Requirement 的检查项 1-4 后追加 **5. `openspec validate --archived --no-interactive`**，并新增 Scenario「归档变更 tasks 未全勾被拦截」
- 文档同步（与脚本/主 spec 口径一致）：`CLAUDE.md`（工作流 CI 门禁 bullet + 提交前验证门禁描述）、`docs/architecture.md`（`## 测试` CI 行）、`README.md`（129 行门禁序列）各补 `--archived`
- 不在本 change 内：不改 ci.yml 结构/新开 job；不重排既有 4 检查顺序（`--archived` 追加为第 5）

## Capabilities

### New Capabilities
（无）

### Modified Capabilities
- `openspec-conventions`: 修改 Requirement「CI 门禁执行 OpenSpec 一致性验证」——检查清单增加第 5 项 `openspec validate --archived --no-interactive`（归档变更 tasks 完整性），新增对应 Scenario

## API Contract Impact
无。`specs/openapi.yaml` 零变更。

## DDD Layer Impact
无。后端零变更（仅 CI 门禁脚本 + 工作流文档）。

## Database Impact
无需。无 Flyway 迁移。

## Impact
- `scripts/openspec-check.mjs`（第 5 子检查 + 注释）
- `openspec/specs/openspec-conventions/spec.md`（apply/sync 时 MODIFIED Requirement）
- `CLAUDE.md` / `docs/architecture.md` / `README.md`（门禁描述各补 `--archived`）
- 验证：`pnpm run openspec:check` 全绿（含新检查）、`validate --archived` 61/61（基线）、`--specs --strict` 67/67、前后端回归 342/267
