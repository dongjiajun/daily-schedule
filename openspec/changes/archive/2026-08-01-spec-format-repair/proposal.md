# Proposal: 主 specs 结构格式修复

## Why
`openspec validate --specs` 当前 13/50 失败（已修复 doc-sync-workflow 后仍 12 个失败）：11 个主 spec 缺少 `## Purpose` 段（部分历史归档时将 delta 头 `## ADDED Requirements` 原样同步进主目录），1 个 spec 的某个 Requirement 缺少 `#### Scenario:` 块。主 specs 结构无效导致：validate/list/archive 无法解析这些能力的需求，增量同步与归档的正确性失去保障。这是 2026-07 归档期的历史欠账。

## What Changes
- 为 11 个缺 `## Purpose` 的主 spec 补充 Purpose 段：`frontend-unit-test-coverage`、`lottie-animation-engine`、`pet-emotion-state-machine`、`pet-interaction-particle`、`pet-roaming-system`、`pet-sidebar-presence`、`phase1-e2e-verification`、`playwright-e2e-infrastructure`、`precommit-verify`、`theme-system`、`version-sync`
- 为 `lunar-holidays` 的"非农历节日日期空返回"需求补充 `#### Scenario:` 块
- **需求内容零改动** — 仅调整文档结构（头部格式 + 缺失的 Scenario），不增删改任何 Requirement 语义
- 修复后 `openspec validate --specs` 全绿（50/50）

## Capabilities

### New Capabilities
<!-- 无新增 capability -->

### Modified Capabilities
- `doc-sync-workflow`: 新增"主 specs 结构有效性"需求——所有主 spec SHALL 通过 `openspec validate --specs`（含 `## Purpose`、`## Requirements` 段，每个 Requirement 含 Scenario 块）

## API Contract Impact
无影响。不涉及 specs/openapi.yaml。

## DDD Layer Impact
无影响。

## Database Impact
无需 Flyway 迁移。

## Impact
| 范围 | 详情 |
|------|------|
| **修改** | `openspec/specs/` 下 12 个 spec.md（11 个补 Purpose + 1 个补 Scenario） |
| **需求语义** | 零改动 — 仅格式修复 |
| **测试** | 无 — 不涉及代码 |
| **风险评估** | 极低 — 内容不变，仅结构调整；验证标准明确（validate --specs 全绿） |
