# Proposal: backfill-archive-task-completion

## Why
`openspec validate --archived` 目前 10/59 红（backfill-auth-spec 9/10、calendar-module-extraction 51/63、todo-kanban 47/54、polish-task-board-ui 37/45、spec-format-repair 0/17、task-template-smoke-guide 0/7、leaf-heart-fall-effects 25/26、rhythm-e2e-stability 22/23、miniprogram-todo 29/30、miniprogram-pet 27/33）：历史归档 tasks.md 勾选不完整（61 项未勾），均为**已落地而未勾**——早于 tasks 勾选纪律（这些功能/修复/验证在 v3.5.1 均已生效，仅勾选状态未补）。修复后 `--archived` 全绿，即为把 `openspec validate --archived` 纳入 CI 门禁铺平前置。

## What Changes
- 10 个归档 `tasks.md`：61 个 `- [ ]` 行（含嵌套 smoke 子行，匹配 `^\s*- \[ \]`）补正为 `- [x]`；每文件标题下加一行 backfill 记录注释（日期 + 变更名 + 依据：任务已落地 / 验证步骤已有效执行 / 观感项移交用户）
- 2 个**用户跟进观感项**（`leaf-heart-fall-effects` 1 项：真实节日视觉观感；`rhythm-e2e-stability` 1 项：回窝动画时长主观观感）：勾选补正，但原文"实际节日/时段目测确认"说明保留——语义为**已移交用户跟进**，非代理人声称完成
- `.openspec.yaml` 设 `skip_specs: true`（无行为变化：仅改归档勾选状态与记录注释，不提供 delta specs）
- 不在本 change 内：把 `openspec validate --archived` 补进 `scripts/openspec-check.mjs`（前置即本 change 完成后的 `--archived` 全绿；另开小变更纳入）

## Capabilities

### New Capabilities
<!-- skip_specs: true——无行为变化（纯流程留痕补正），本小节留空 -->

### Modified Capabilities
<!-- 仅列需求级变更（非实现细节）——无 -->

## API Contract Impact
无。`specs/openapi.yaml` 零变更。

## DDD Layer Impact
无。后端零变更。

## Database Impact
无需。无 Flyway 迁移。

## Impact
- `openspec/changes/archive/<date>-<name>/tasks.md` × 10（勾选补正 + 头部 backfill 记录注释）
- 无代码/前端/小程序/契约/基准文档变更
- 验证：`openspec validate --archived` → 59/59（exit 0，10 红全消）；`--specs --strict` 67/67 基线保持；docs-check 全绿
