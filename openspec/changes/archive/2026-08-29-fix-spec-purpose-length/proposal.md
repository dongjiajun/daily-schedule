# Proposal: fix-spec-purpose-length

## Why
OpenSpec 1.11.0 的 `--strict` 校验暴露 17 个主 spec 的 `## Purpose` 段不合格：4 个是归档时留下的 `TBD` 占位（`authentication` / `event-lifecycle` / `multi-user-isolation` / `reminder-scheduler`，strict 识别为 placeholder），13 个是单一短句（strict 识别为 "too brief, less than 50 characters"）。这导致 `openspec validate --specs --strict` 无法通过，CI 无法接入 strict 门禁；TBD 占位也让主 spec 缺乏"这个能力是干什么的"描述。本次补齐全部 17 个 Purpose，为 `wire-openspec-validation-into-ci`（CI 接 `--strict`）铺路。

## What Changes
- 为 17 个主 spec **重写** `## Purpose` 段为真实描述（≥50 字符、无 TBD/占位、概述能力用途）——按官方规范**直接编辑** `openspec/specs/<cap>/spec.md`（已有能力的 Purpose 修改不走 delta）
- 范围严格限定：仅 `## Purpose` 段落文本；不触碰该文件的 Requirements / Scenarios / 其余任何内容
- 无新增/移除能力 → `specs-count` 维持 67，docs 计数不动
- **BREAKING**：无

## Capabilities

### New Capabilities
（无——本变更无 spec 级行为变化，`.openspec.yaml` 已设 `skip_specs: true`，不创建 delta）

### Modified Capabilities
（无——按官方规范，已有能力的 Purpose 修改直接编辑主 spec，不写 delta）

## API Contract Impact
无。`specs/openapi.yaml` 零变更。

## DDD Layer Impact
无。仅 `openspec/specs/*/spec.md` 文档编辑，无代码层变更。

## Database Impact
无需。

## Impact
- 17 个文件：`openspec/specs/{authentication,event-lifecycle,frontend-unit-test-coverage,multi-user-isolation,pet-emotion-state-machine,pet-event-bridge,pet-interaction-particle,pet-interaction-ui,pet-panel-theming,pet-roaming-system,pet-selection,pet-sidebar-presence,pet-status-panel,pwa,reminder-scheduler,sidebar-navigation,task-list-view}/spec.md`
- 验证：`openspec validate --specs --strict`（17 失败 → 0 失败）+ `openspec validate --specs`（67/67）+ `node scripts/docs-check.mjs` 全绿
- 后续：打开 CI 的 strict 门禁（独立 change）
