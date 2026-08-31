# Proposal: test-plan-ledger

## Why
测试边界目前缺少"场景 → 命名测试"的可追踪契约：Scenario 是验收容器、tasks 全量验证组是执行动作、spec 尾部 Test Coverage 表是事后审计，三者互不衔接——社区 anvil 方案的 test-plan.md 工件把边界显式化为活账本（每场景映射命名测试、初始 🔴、apply 翻绿），并使边界可被机械门禁，与本项目"门禁 > 劝告"的既有实践（validate --archived 勾选检查、归档前验证门禁）一致。

## What Changes
- custom schema（`openspec/schemas/spec-driven-custom/`）工件链扩展为 `proposal → specs → design → test-plan → tasks`：新增 `test-plan.md` 工件（模板 + instruction：场景映射 6 列表、初始 🔴、apply 翻绿、spec 漂移即停改 spec 重审再继续）；`tasks` 依赖增加 test-plan；`apply.requires=[tasks]` 不变
- `scripts/openspec-check.mjs` 增加第 6 检（test-plan 内容门禁）：活动变更 delta 场景 ↔ test-plan 行引用一致；归档变更存在 test-plan.md 时不得残留 `🔴`
- `spec-driven-custom-lite` 不变（小变更无独立测试面，不设该工件）
- 文档同步：CLAUDE.md（artifact 序列 + CI 门禁检查数）、docs/architecture.md（CI 行与 specs-count 68→69）、README.md（如提及 CI 检查清单）
- 新增主 capability spec：`spec-driven-custom`（项目主工作流）
- 非 BREAKING（纯工作流工具链/模板/文档变更，无源码行为变化）

## Capabilities

### New Capabilities
- `spec-driven-custom`: 项目主工作流 schema 的工件链与测试映射纪律——custom 链含 test-plan 工件（场景→命名测试活账本 + 红绿翻转 + 机械门禁）

### Modified Capabilities
- `openspec-conventions`: **CI 门禁执行 OpenSpec 一致性验证** 需求从 5 检查扩展为 6 检查（新增 test-plan 内容门禁）

## API Contract Impact
无——不涉及 `specs/openapi.yaml`，无端点/契约变化。

## DDD Layer Impact
无——纯 OpenSpec 工作流/CI 工具链/模板/文档变更，不触碰 backend/、frontend/、apps/、packages/ 源码。

## Database Impact
无需 Flyway 迁移；不涉及任何表/列。

## Impact
- `openspec/schemas/spec-driven-custom/schema.yaml` + `templates/test-plan.md`（新增）
- `scripts/openspec-check.mjs`（第 6 检 + header 注释 + --self-test）
- `CLAUDE.md`（工件序列、CI 门禁检查清单、主 spec 数）、`docs/architecture.md`（CI 行 + specs-count marker）、`README.md`（如提及 CI 检查数）
- 归档后主 specs：`openspec/specs/spec-driven-custom/spec.md`（新增）+ `openspec/specs/openspec-conventions/spec.md`（R5 替换）
- 未来 custom 变更自动继承 5 工件链；已有 64 个归档变更不回填 test-plan
