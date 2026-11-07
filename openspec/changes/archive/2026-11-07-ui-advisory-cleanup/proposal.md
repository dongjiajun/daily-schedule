# Proposal: UI 遗留 advisory 清理（ui-advisory-cleanup）

## Why

前两阶段 UI 改造（ui-token-contract、design-system-foundation）归档时留下若干 advisory：E2E 主题断言硬编码 token 清单、门禁与单测各写一份 CSS 解析逻辑、组件级配色缺断言、密度设置缺浏览器侧持久化验证。它们不影响产品行为，但会累积测试漂移风险，集中清理成本最低。

## What Changes

- `e2e/ui-theme.spec.ts` 的主题 token 断言改为从 `design-tokens.json` 读取清单，删除硬编码 `CRITICAL_TOKENS`
- 新增 `scripts/lib/tokens.mjs`：把 CSS 主题块解析、token 解析、对比度计算抽为共享模块；`scripts/ui-check.mjs` 与前端契约测试均改为引用它，消除双份实现
- 补组件级配色断言：TaskCard 优先级徽标（error / warning / info）、EventModal 完成徽标（success）
- 补密度持久化 E2E：ManagePanel 切换 compact → 刷新页面 → `data-density` 与控件高度保持
- 明确记录未行动 advisory 的结论（视觉基线跨 OS 差异、失败路径模拟、原语单测是否拆分），避免反复挂账
- `.openspec.yaml` 标记 `skip_specs: true`：本变更无行为变化（纯测试/工具链/文档），不产生 delta specs
- **BREAKING** 无

## Capabilities

### New Capabilities

（无：本变更不改变任何系统行为，`skip_specs: true`）

### Modified Capabilities

（无）

## API Contract Impact

无影响：不修改 `specs/openapi.yaml`，不新增/修改端点，不重新生成前端 SDK。

## DDD Layer Impact

无后端影响：API / 应用 / 领域 / 基础设施均不触碰。

## Database Impact

无 Flyway 迁移，不涉及任何表/列。

## Impact

- **测试**：`e2e/ui-theme.spec.ts`、`e2e/ui-primitives.spec.ts`、`frontend/src/core/styles/__tests__/design-tokens.test.ts`、`frontend/src/modules/todo/components/__tests__/TaskCard.test.tsx`、`frontend/src/modules/calendar/components/__tests__/EventModal.test.tsx`
- **工具链**：新增 `scripts/lib/tokens.mjs`；`scripts/ui-check.mjs` 改为消费共享模块
- **文档**：`docs/architecture.md` + `AGENTS.md`（若测试文件/用例数变化）
- **Schema 档位**：`spec-driven-custom-lite`（proposal → specs → tasks）。理由：纯测试与工具链整理，无设计决策，且 `skip_specs: true` 声明无行为变化；不升 standard
