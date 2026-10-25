# Proposal: restructure-artifact-schemas

## Why

现有两档 schema 两极分化：`spec-driven-custom-lite`（proposal→specs→tasks）适合小变更，`spec-driven-custom`（五工件）强制 design + test-plan。实测 70 个归档中 63 个走 custom，但 test-plan 自 2026-08-31 引入后真实使用 **0 次**，design 平均 117 行——**中等变更被迫承担全量仪式**，与官方 1.15 "right-size ceremony 与 stakes 匹配" 相悖。同时两 schema 的共享模板靠手工同步（当前 proposal/spec 已分叉），无机械守卫。本变更新增中间档 `standard`（design、无 test-plan），把 test-plan 收敛为 custom 专属的**双模式**活账本，模板共享改由脚本 + CI 第 9 检机械保证，并让 tasks/design 模板对齐 1.15 实践（组内自带测试、`## Workflow follow-up`、设计评审 checklist）。

## What Changes

- 新增 schema `spec-driven-custom-standard`：工件链 `proposal → specs → design → tasks`（无 test-plan），承接"需要 design 级决策但不需要红绿测试账本"的中等变更
- `openspec/config.yaml` 默认 `schema` 改为 `spec-driven-custom-standard`；`spec-driven-custom` 改为复杂/高风险变更显式选用（含 test-plan），`spec-driven-custom-lite` 保持小变更 opt-in；三档选择规则写入 AGENTS.md 与约定 spec
- **test-plan 双模式**（仅 custom 启用）：
  - 模式 A（有测试面）：delta 场景 ↔ 命名测试映射、红绿翻转（现状）
  - 模式 B（无测试面：工具链/文档/配置/CI 脚本）：delta 场景 ↔ **等价机械验证项**（验证命令/CI 检查名），仍逐场景一行、🔴→🟢，不得虚标测试文件
- **模板单源机械化**：新增 `scripts/sync-schema-templates.mjs`（`--check` / `--write`），以 custom 模板为源同步 proposal/spec（→ standard、lite）与 design（→ standard）；`openspec-check` 新增第 9 检机械校验，替代手工同步纪律
- **tasks 模板对齐 1.15**：各层组内自带对应测试（补齐领域层测试任务）、保留"文档同步"阶段（项目规则）与全量验证组，组后新增 `## Workflow follow-up` 纯 bullet（`/opsx:verify`、`/opsx:archive`、归档后门禁复跑，非 checkbox）；custom 保留 1-9 固定组，standard/lite 为 1/2/3 组
- **specs 模板**：移除 delta 的 `## Test Coverage` 段（1.14.2 strict 冲突，仅主 spec 回填历史审计使用）；新增"每条需求至少 1 happy + 1 failure/edge 场景"规则
- **design 模板**：新增 `## Review Checklist`（失败路径 / 回滚降级 / 契约与 DB 兼容性三问）
- AGENTS.md 三档选择规则、CI 九检说明同步；`openspec-check` 帮助文案/自检同步更新
- 非 **BREAKING**（工具链/流程约定，无 API 契约、无运行时代码变化）

## Capabilities

### New Capabilities

- `spec-driven-custom-standard`: 中等变更工作流（proposal→specs→design→tasks）的工件链、适用范围与模板单源纪律

### Modified Capabilities

- `openspec-conventions`: 新增"三档 workflow schema 选择规则"（默认 standard）；CI 门禁由八项增至九项（新增模板单源同步守卫）；归档前验证门禁补 standard 组别引用
- `spec-driven-custom`: test-plan 内容契约改为双模式；红绿纪律覆盖模式 B；范围与模板同步纪律改为三档 + 机械同步（第 9 检）
- `spec-driven-custom-lite`: 默认 schema 改为 standard；适用范围补三档选择；tasks 分组改为 1/2/3 + Workflow follow-up；模板单源由脚本机械同步

## API Contract Impact

无影响——不修改 `specs/openapi.yaml`，不涉及任何端点/字段。

## DDD Layer Impact

无——不触碰后端 API/应用/领域/基础设施任一层；也不触碰前端/小程序代码。

## Database Impact

无需 Flyway 迁移，不涉及表/列。

## Impact

- 文件：`openspec/schemas/spec-driven-custom*/**`（新增 standard schema + 8 个模板更新/新增）、`scripts/sync-schema-templates.mjs`（新）、`scripts/openspec-check.mjs`（第 9 检）、`openspec/config.yaml`（默认 schema）、`AGENTS.md`（选择规则/九检）、4 个主 spec（经 delta，含新增 capability）
- 行为：`openspec new change` 默认走 standard（4 工件）；test-plan 仅在 custom 出现且支持等价机械验证模式；模板漂移由 CI 第 9 检阻断
- 风险：默认 schema 变化会影响后续变更的工件数（属预期，AGENTS.md 已写明选择规则）；test-plan 模式 B 可能弱化"先红后绿"——由 CI 第 6 检仍强制逐场景映射兜底
- 回退：`openspec/config.yaml` 默认 schema 改回 `spec-driven-custom` 即可恢复旧行为；新增 standard schema 不影响既有变更
