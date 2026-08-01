# Proposal: tasks 模板 smoke test 示例占位符改进

## Why
`openspec/schemas/spec-driven-custom/templates/tasks.md` §9.4 的 smoke test 子项以 HTML 注释形式提供示例（`<!-- 如：登录 → 创建日程 → 日历视图显示 -->`），设计意图是 AI 生成具体变更的 tasks 时替换为真实场景。但实际使用中注释与 checkbox 混排，容易原样保留成"空白框"，让用户困惑"该验证什么"。模板应把"示例"与"替换指令"的语义显式化。

## What Changes
- 将 `templates/tasks.md` §9.4 的四个注释示例框改为：明确标注"删除示例、替换为实际场景"的引导行 + 示例项（保留示例内容但作为可替换占位）
- 同步更新 `openspec/schemas/spec-driven-custom/schema.yaml` 中内嵌的同一模板（两处需保持一致，上次 E2E 门禁更新即双处同步）
- 不影响 OpenSpec 流程、不改动任何已生成 tasks.md

## Capabilities

### New Capabilities
<!-- 无新增 capability -->

### Modified Capabilities
- `doc-sync-workflow`: 模板维护约定——tasks 模板修改 SHALL 同步 templates/tasks.md 与 schema.yaml 两处

## API Contract Impact
无影响。

## DDD Layer Impact
无影响。

## Database Impact
无需 Flyway 迁移。

## Impact
| 范围 | 详情 |
|------|------|
| **修改** | `openspec/schemas/spec-driven-custom/templates/tasks.md`、`openspec/schemas/spec-driven-custom/schema.yaml`（内嵌模板） |
| **测试** | 无 — 不涉及代码 |
| **风险评估** | 极低 — 仅模板示例文案调整；验证方式：`/opsx:ff` 生成新变更后检查 §9.4 渲染 |
