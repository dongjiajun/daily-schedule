# Proposal: spec-format-repair-v2

## Why
`openspec validate --specs` 有 2 项失败：`ci-actions-maintenance` 主 spec 保留了 delta 的 `## ADDED Requirements` 节标题（缺规范的 `## Requirements` 结构）；`pet-roaming-system` 有 2 条需求的 SHALL/MUST 仅存在于标题行、正文无 SHALL 首句，违反 spec 格式规范。另有归档联动：phase2-execution-planning 归档后 `specs-count` 实际 53 vs 声明 52，docs-check 已失败。

## What Changes
- 修复 `openspec/specs/ci-actions-maintenance/spec.md`：`## ADDED Requirements` → `## Requirements`（内容不变）
- 修复 `openspec/specs/pet-roaming-system/spec.md`：需求 8/9 改为短标题 + 正文首行 SHALL 句（场景全部保留）
- 更新 `docs/architecture.md`：`specs-count` 52 → 53

## Capabilities

### New Capabilities
- （无）

### Modified Capabilities
- `ci-actions-maintenance`: 主 spec 结构修复（ADDED 节标题 → Requirements 节）
- `pet-roaming-system`: 需求 8/9 格式修复（SHALL 移入正文首行）

## API Contract Impact
无影响（不涉及 specs/openapi.yaml）。

## DDD Layer Impact
无（纯主 specs 文档修复）。

## Database Impact
无需。

## Impact
- `openspec/specs/ci-actions-maintenance/spec.md`（修改）
- `openspec/specs/pet-roaming-system/spec.md`（修改）
- `docs/architecture.md`（specs-count marker 更新）
- 验证：`openspec validate --specs` 全绿 + `pnpm run docs:check` 全绿
