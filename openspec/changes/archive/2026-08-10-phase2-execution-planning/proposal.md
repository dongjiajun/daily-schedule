# Proposal: phase2-execution-planning

## Why
Phase 2（代号 v5.0：小程序 + 习惯/专注 + 宠物 v2）在 `docs/planning/execution-plan.md` 只有里程碑级定义，缺少按顺序、可逐项跟踪的执行级计划；里程碑大项与 OpenSpec 单变更的颗粒度差距导致开工时无清单可依。需要一份**活的执行计划**：任务清单 + docs-check 联动防呆（归档了但清单未更新 → CI 失败），全部执行完成后移除。

## What Changes
- 新增 `docs/planning/phase2-execution-plan.md`：演进顺序与依赖分析 + 16 项任务清单（每项 = 一个 OpenSpec 变更）+ 完成/移除条件
- `scripts/docs-check.mjs` 新增 `phase2-changes` counter：现场重算"文档任务清单 ∩ openspec/changes/archive 归档"数，与文档 marker 声明比对（不一致 → 非零退出）
- 文档移除后 marker 消失、检查自然跳过 → 满足"全部执行完可移除"
- `docs/planning/execution-plan.md` Phase 2 小节补充新文档引用

## Capabilities

### New Capabilities
- `phase2-execution-planning`: Phase 2 执行级规划文档 + docs-check 结构计数联动（任务清单进度可验证）

### Modified Capabilities
- （无需求级变更）

## API Contract Impact
无影响（不涉及 specs/openapi.yaml）。

## DDD Layer Impact
无（纯文档 + 检查脚本）。

## Database Impact
无需。

## Impact
- `docs/planning/phase2-execution-plan.md`（新增）
- `scripts/docs-check.mjs`（新增 counter）
- `docs/planning/execution-plan.md`（Phase 2 小节加引用）
- 文档检查（docs-sync-guarantee）：提交前 `pnpm run docs:check` 必须通过
