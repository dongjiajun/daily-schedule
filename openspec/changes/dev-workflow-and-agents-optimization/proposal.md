# Proposal: dev-workflow-and-agents-optimization

## Why
基于会话日志与配置分析，当前单次完整开发周期主动耗时高达 40–60 分钟、上下文迅速膨胀至 400K+ tokens，主要源于三点：`turbo.json` 中 `verify` 任务依赖与子包串行 `verify` 脚本造成**前端与小程序双重执行**；测试与构建输出未启用静默参数且本地 Playwright 默认 4-worker 并发易超时重跑；`AGENTS.md` 体积达 20.3 KB（逼近 24 KB 规则截断阈值），且未固化“按影响面分级验证”与“子代理隔离 + 自然切会话”规则。

## What Changes
- 修复 [turbo.json](file:///d:/Project/daily-schedule/turbo.json) 任务编排，消除 `verify` 双重执行；补充 `typecheck` 任务并对齐 `^build` 依赖。
- 优化根 [package.json](file:///d:/Project/daily-schedule/package.json)、[frontend/package.json](file:///d:/Project/daily-schedule/frontend/package.json)、[apps/miniprogram/package.json](file:///d:/Project/daily-schedule/apps/miniprogram/package.json)、[packages/shared/package.json](file:///d:/Project/daily-schedule/packages/shared/package.json) 验证脚本与 `--output-logs=errors-only` 输出策略，新增 `verify:frontend` 与 `verify:miniprogram` 分级快捷命令。
- 在 [frontend/vitest.config.ts](file:///d:/Project/daily-schedule/frontend/vitest.config.ts) 与 [apps/miniprogram/vitest.config.ts](file:///d:/Project/daily-schedule/apps/miniprogram/vitest.config.ts) 中为本地非 CI 环境启用 `dot` reporter；在 [playwright.config.ts](file:///d:/Project/daily-schedule/playwright.config.ts) 中将本地默认收敛为 `workers: 2` + `reporter: 'line'`（保留 CI 行为不变）。
- 依据 `/writing-for-agents`（渐进式披露、上下文指针、去重与正交化）将小程序页面实现细节从 `AGENTS.md` 披露至 [docs/architecture.md](file:///d:/Project/daily-schedule/docs/architecture.md)，并重构精简 [AGENTS.md](file:///d:/Project/daily-schedule/AGENTS.md)（压缩至 10 KB 以内，同时保留全部 `openspec-check` / `docs-check` 守卫锚点，新增上下文纪律、分级验证矩阵与 PowerShell 约定）。
- **Schema 选择**：选用 `spec-driven-custom-lite` 并设 `skip_specs: true`。本变更为纯工具链、构建配置与开发文档优化，不改变任何产品业务行为或 API/数据库契约。

## Capabilities

### New Capabilities
<!-- skip_specs: true — 纯工具链/构建配置/文档优化，无新增产品能力 -->

### Modified Capabilities
<!-- skip_specs: true — 无现有产品规格行为变更 -->

## API Contract Impact
无影响：不修改 `specs/openapi.yaml` 及前后端生成代码。

## DDD Layer Impact
无影响：不修改 `backend/` 业务源码及配置。

## Database Impact
无需：不涉及数据库表结构或 Flyway 迁移。

## Impact
- **工具链与配置**：`turbo.json`、`package.json`、`frontend/package.json`、`apps/miniprogram/package.json`、`packages/shared/package.json`、`frontend/vitest.config.ts`、`apps/miniprogram/vitest.config.ts`、`playwright.config.ts`
- **文档**：`AGENTS.md`、`docs/architecture.md`
- **门禁兼容**：保持 CI `.github/workflows/ci.yml` 各 job 命令兼容，保持 `openspec-check`（十检）与 `docs-check` 全绿。
