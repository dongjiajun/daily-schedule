# Phase2 Execution Planning

## Purpose

Phase 2（代号 v5.0：微信小程序 + 习惯/专注 + 宠物 v2）的执行级规划：`docs/planning/phase2-execution-plan.md` 提供按顺序、可逐项跟踪的任务清单，与 `scripts/docs-check.mjs` 联动防呆。

## Requirements

### Requirement: 执行规划文档
系统 SHALL 提供 `docs/planning/phase2-execution-plan.md`，内容包含：演进顺序与依赖分析（按执行计划关键路径：小程序主链先行，习惯/专注并行支线，宠物 v2 依赖资源经济闭环，稳定性收尾）、里程碑分组、按依赖排序的任务清单。

#### Scenario: 文档存在且结构完整
- **WHEN** 检查 `docs/planning/phase2-execution-plan.md`
- **THEN** 文档 SHALL 存在，包含演进顺序说明、至少 4 个里程碑分组（M2.1-2.2 / M2.3 / M2.4 / M2.5）、任务清单条目格式为 `- [ ] <kebab-name> — <描述>`（未完成）或 `- [x] <kebab-name> — <描述>`（已完成）

### Requirement: 任务与归档一一对应
每项任务 SHALL 对应一个 OpenSpec 变更：任务名（kebab-case）SHALL 等于其归档目录名去掉日期前缀（`YYYY-MM-DD-`）后的部分。任务 SHALL 按依赖顺序执行：主链（miniprogram-foundation → wechat-auth → miniprogram-calendar → miniprogram-todo → miniprogram-pet → subscribe-message → miniprogram-habit）先行，M2.3 支线（habit-crud-backend → habit-crud-frontend → habit-stats → focus-pomodoro → habit-pet-bridge）自 Week 5 起并行，M2.4（pet-evolution → pet-shop → pet-detail-page）依赖 M2.3 资源经济闭环，最后 M2.5（phase2-stability-verification）。

#### Scenario: 归档后任务名匹配
- **WHEN** 某任务完成并归档为 `openspec/changes/archive/2026-08-20-habit-crud-backend/`
- **THEN** 该归档目录名去日期前缀后 SHALL 等于任务名 `habit-crud-backend`，且文档中该任务行 SHALL 标记为 `[x]`

### Requirement: docs-check 进度防呆
`scripts/docs-check.mjs` SHALL 实现 `phase2-changes` counter：现场重算 `docs/planning/phase2-execution-plan.md` 任务清单中已归档的任务数（任务名匹配 `openspec/changes/archive/` 下目录去日期前缀后的名称），与文档 `<!-- DOCS-CHECK: phase2-changes=N -->` 声明值比对，不一致时 SHALL 非零退出。初始声明值 SHALL 为 `0`。

#### Scenario: 归档了但文档未同步
- **WHEN** 一个任务已归档（archive 出现对应目录）但文档 marker 声明仍为旧值
- **THEN** `pnpm run docs:check` SHALL 非零退出，提示实际归档数与声明数不一致

#### Scenario: 文档标记完成但未归档
- **WHEN** 文档任务行标记 `[x]` 且 marker 声明 +1，但 archive 中无对应目录
- **THEN** `pnpm run docs:check` SHALL 非零退出（实际归档数 < 声明数）

### Requirement: 完成后移除
全部任务完成后 SHALL 移除 `docs/planning/phase2-execution-plan.md`，且移除后 `pnpm run docs:check` SHALL 正常通过（不再引用该文档与 marker，`phase2-changes` counter 不被触发）。

#### Scenario: 全部完成并移除文档
- **WHEN** 全部任务 `[x]`、marker 声明 = 任务总数、文档被删除
- **THEN** `pnpm run docs:check` SHALL 全部通过，无 `phase2-changes` 相关失败或告警
