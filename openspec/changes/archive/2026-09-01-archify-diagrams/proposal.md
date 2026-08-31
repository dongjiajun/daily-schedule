# Proposal: Archify 交互式架构图

## Why
项目文档中的架构/领域模型/时序/状态图目前均为 ASCII 草图（`docs/architecture.md`、`docs/uml/README.md`），信息密度高但不可缩放、不可聚焦、无导出；新成员理解 DDD 四层、宠物经济闭环、SSE 提醒链路等关键结构需要逐段拼装。现以 Archify（archify skill）生成 8 张自包含交互式 HTML 图（暗/亮主题、缩放、聚焦、PNG/SVG/WebM 导出），沉淀为可复用、可演进的文档资产。

## What Changes
- **新增** `docs/diagrams/`（8 张自包含 HTML 图 + `_drafts/` 候选规格 JSON）：
  - `architecture-overview.html`（整体系统架构：Web/小程序 → DDD 四层 → MySQL）
  - `frontend-module-platform.html`（core + modules 插件式平台与 EventBus 边界）
  - `domain-model-er.html`（领域模型 ER：User/Event/Category/Tag/Task/Pet/关联表）
  - `pet-economy.html`（宠物经济闭环：行为 → RewardSource → 幂等闸门 → 发放 → 落库）
  - `contract-pipeline.html`（契约驱动 API 管道：openapi.yaml → 前后端生成 → 门禁）
  - `sse-reminder-sequence.html`（提醒推送 SSE 全链路时序）
  - `event-status-lifecycle.html`（EventStatus 状态生命周期）
  - `pet-emotion-lifecycle.html`（宠物情绪状态机）
- **挂链**：`docs/uml/README.md` 顶部新增"交互式图（Archify）"导航；`docs/architecture.md` 设计文档段新增交互式图索引
- **清理策略**：图与候选规格入库；`docs/diagrams/*.visual-check.*`（浏览器截图/contact sheet/收据，可重跑 `archify visual-check` 再生）加入 `.gitignore`
- 不改任何代码/API/数据库/测试；无版本号变化

## Capabilities

### New Capabilities
<!-- skip_specs: 纯文档资产变更，无行为变化，不生成 delta specs -->

### Modified Capabilities
<!-- 无 -->

## API Contract Impact
无影响。不涉及 `specs/openapi.yaml` 端点、schema 或版本号变更（v3.5.1 保持不变）。

## DDD Layer Impact
无影响。纯文档层变更，不触碰后端任何层级。

## Database Impact
无需 Flyway 迁移。

## Impact
| 范围 | 详情 |
|------|------|
| **新增** | `docs/diagrams/*.html` × 8（各 ~630KB，自包含查看器）、`docs/diagrams/_drafts/*.json` × 8（候选规格，交付快照已冻结）|
| **更新** | `docs/uml/README.md`（交互式图导航）、`docs/architecture.md`（设计文档段索引）|
| **忽略** | `.gitignore` 追加 `docs/diagrams/*.visual-check.*`（可再生成证据包）|
| **测试** | 无 — 不涉及代码；`pnpm run docs:check` 已确认 `docs/diagrams/`（非 .md）不在扫描范围 |
| **风险评估** | 低 — 唯一注意点：docs-check 只扫描 `docs/**/*.md` 的版本声明/端点/DOCS-CHECK marker，新增 HTML/JSON 无影响 |
