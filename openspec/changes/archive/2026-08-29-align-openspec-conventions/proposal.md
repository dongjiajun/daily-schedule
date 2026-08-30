# Proposal: align-openspec-conventions

## Why
OpenSpec 已升级至 1.11.0（CLI + `.dsh` skills/commands 已同步），但项目自定义工作流 `spec-driven-custom` 仍沿用 1.7.0 时代约定，与官方最新规范存在三处关键差异：(1) 新能力 delta 缺少官方要求的 `## Purpose`（≥50 字符），归档时主 spec 会留 `TBD` 占位或靠手补；(2) 无行为变化的小变更被 config 规则引导"**不走 OpenSpec 流程**"，而非走官方内置的 `skip_specs: true`；(3) 注入每次 artifact 生成的项目 `context` 停在 v3.3.0（实际 v3.5.1 + 多端/多模块），导致 AI 生成 artifacts 时被喂旧事实。本次将自定义模板/schema/配置与官方 1.11.0 约定对齐。

## What Changes
- 自定义 spec 模板新增 `## Purpose` 段（仅新能力使用，≥50 字符；已有能力 delta 不得携带；改已有 Purpose 直接编辑 `openspec/specs/<cap>/spec.md`）
- 自定义 schema 的 `specs.instruction` / `proposal.instruction` 补齐官方规范：Purpose 要求、`skip_specs: true` 用法（无行为变化时用，而非绕过系统）、capability 退休（`retire_capabilities`）说明
- 刷新 `openspec/config.yaml` 的 `context` 到当前事实（v3.5.1：DDD 四层、契约驱动管道、frontend modules、apps/miniprogram、版本同步、docs-check、测试规模）；规则单源化——删除与 schema instruction/模板重复的格式规则
- 修正 `CLAUDE.md` 中 OpenSpec 工作流描述：artifact 顺序笔误（`proposal → design → spec → tasks` → `proposal → specs → design → tasks`）、补充 skip_specs 与版本说明
- **不在此 change 内**：17 个既有主 spec 的短 Purpose 补写（独立 `fix-spec-purpose-length` change）；`spec-driven-custom-lite` 轻量 schema（独立评估）

## Capabilities

### New Capabilities
- `openspec-conventions`: 项目 OpenSpec 工作流约定——新能力 delta 必须携带 Purpose（≥50 字符，仅新能力）、无行为变化变更用 `skip_specs: true`、项目 context 反映当前事实、规范单源化（模板/schema instruction 为权威）

### Modified Capabilities
<!-- 仅列需求级变更（非实现细节），用 openspec/specs/ 下的已有名称 -->

## API Contract Impact
无。`specs/openapi.yaml` 零变更，后端/前端契约不受影响。

## DDD Layer Impact
无。后端零变更（仅 OpenSpec 元工作流的模板/schema/config/文档）。

## Database Impact
无需。无 Flyway 迁移。

## Impact
- `openspec/schemas/spec-driven-custom/templates/proposal.md`、`spec.md`、`design.md`、`tasks.md`
- `openspec/schemas/spec-driven-custom/schema.yaml`
- `openspec/config.yaml`
- `CLAUDE.md`（OpenSpec 工作流小节）
- 影响面：后续所有 `/opsx:*` artifact 生成行为（context/模板/instruction 将更新为 1.11.0 约定）
