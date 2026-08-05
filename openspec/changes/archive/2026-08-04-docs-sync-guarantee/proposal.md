# Proposal: docs-sync-guarantee

## Why
`docs/` 下 6 份文档与代码全面漂移（版本号滞后 4 个小版本、前端测试数 43→45 未同步、SSE 鉴权仍描述已废弃的 `?token=` 方案、ER 图缺 5 张表、UML 的 Pet 方法签名虚构、18 套节日主题未收录）。根因不是执行疏忽，而是现有 doc-sync-workflow 三层机制（tasks 模板阶段 / config rules / CLAUDE.md 清单）全部只覆盖"新增"场景、且无任何自动化验证——最近 8 个变更中 6 个是纯前端"修改"类，全部落在规则盲区。需要把机制从"新增触发、靠自觉"改为"修改也触发、机器兜底"。

## What Changes
- 修订 `openspec/config.yaml` 的 `rules.tasks`：文档同步规则从"涉及**新**组件/实体/端点"扩展为"涉及**新增或修改**"，并补充 architecture.md / CLAUDE.md 版本声明 / 测试数变更规则
- 修订 tasks 模板"文档同步"阶段语义：8.x 条目从"无新增 → N/A"改为"逐项评估现有文档描述是否仍准确"
- 新增文档一致性检查（版本号声明 / 端点清单 / 测试数 / 结构计数），接入 CI 成为门禁
- 存量修复 `docs/` 6 份文档至与代码一致（含 `holiday-themes.css`、`modules/pet|todo` 遗漏项、`uml/README.md` 关系补全）
- 同步 CLAUDE.md 文档检查清单与版本声明

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `doc-sync-workflow`: 三层保障机制从"新增触发"升级为"新增+修改全触发 + 自动化验证门禁"；新增文档一致性检查要求

## API Contract Impact
无。`specs/openapi.yaml` 契约不变（本次为流程与文档变更，不涉及端点/字段）；docs 内版本声明同步至当前 3.3.4 属文档修复，不升契约版本。

## DDD Layer Impact
无后端代码变更（API / 应用 / 领域 / 基础设施 均不触碰）。

## Database Impact
无（不需要新 Flyway 迁移）。

## Impact
- 文档：`docs/api/overview.md`、`docs/database/schema.md`、`docs/uml/README.md`、`docs/architecture.md`、`docs/frontend/component-catalog.md`、`docs/planning/execution-plan.md`（存量修复，差异矩阵见本次探索排查记录）
- 流程：`openspec/config.yaml`（rules.tasks 扩展）、`openspec/schemas/spec-driven-custom/templates/tasks.md`（8.x 语义）、`openspec/specs/doc-sync-workflow/spec.md`（需求修订）
- 自动化：新增文档一致性检查脚本/测试、`.github/workflows/ci.yml`（接入门禁）
- 项目文档：`CLAUDE.md`、`README.md`（如涉及版本/测试数声明）
