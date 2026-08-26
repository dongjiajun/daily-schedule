# Proposal: 微信小程序脚手架（Phase 2 主链起点）

## Why
Phase 2 主链（M2.1-2.2 微信小程序）是零 slack 关键路径，周期最长（8 周）、外部风险最高（微信平台），必须先动。第一个变更交付小程序工程骨架：Taro 脚手架接入 monorepo、组件库选型落地、shared 包跨端复用验证——后续 6 个小程序变更（auth/calendar/todo/pet/subscribe-message/habit）全部在此骨架上叠加。

## What Changes
- 新建 `apps/miniprogram/` 包：Taro 4.2 + React 18 脚手架（微信小程序 target，React 18 为 Taro/NutUI peer 共同支持面），接入 pnpm workspace
- 组件库：`@nutui/nutui-react-taro`（规划指定；当前 4.0.0-beta.5，beta 风险评估见 design）
- shared 包复用验证：小程序侧 import `@daily-schedule/shared/holiday`（HolidayEngine 纯函数）与 `@daily-schedule/shared/pet`（roam engine），验证 tsc 编译 + 小程序构建产物可用
- turbo 任务接入：miniprogram 的 build/dev/lint 进入 `turbo run verify` 流水线（或独立 verify 脚本）
- 基础页面：TabBar 骨架（首页占位 + 我的占位），验证路由与构建链路
- 微信开发者工具导入配置（project.config.json / 构建产物说明）

## Capabilities

### New Capabilities
- `miniprogram-foundation`: 小程序工程骨架——Taro 4 + NutUI 脚手架、workspace 接入、shared 跨端复用、构建验证链路

### Modified Capabilities
- `monorepo-workspace`: workspace 新增 apps/ 目录与 miniprogram 包，turbo 任务编排扩展

## API Contract Impact
- 无影响（纯前端工程骨架，不新增/修改端点）

## DDD Layer Impact
- 后端零变更（API / 应用 / 领域 / 基础设施均不触碰）

## Database Impact
- 无需 Flyway 迁移

## Impact
- **新增**：`apps/miniprogram/`（Taro 工程：src/pages、app.config、project.config.json、babel/webpack 配置）
- **workspace**：`pnpm-workspace.yaml` 加 `apps/*`；`turbo.json` 任务扩展
- **shared**：如复用验证发现跨端兼容问题（如 ESM/依赖注入），做最小适配并回写 shared 包
- **文档**：`docs/architecture.md`（monorepo 结构 + 小程序模块）、`docs/frontend/component-catalog.md`（小程序组件/目录）、`CLAUDE.md`（workspace 结构 + 命令）
- **规划同步**：`docs/planning/phase2-execution-plan.md` 任务行 [x] + `phase2-changes` marker +1（归档时）
