# Proposal: 设计系统基建（design-system-foundation）

## Why

颜色层已经闭环（40 个 token、23 套主题、`ui:check` 门禁、对比度达标），但**几何 / 排版 / 层级 / 动效没有任何 token**：圆角 6 种混用（full 30 / lg 29 / xl 23 / md 14 / 2xl 7 / 3xl 1）、阴影 5 种混用、任意字号 28 处（11px×14、13px×9、15px×2、12px×2、10px×1）、字体栈无显式 CJK；组件只有 9 个原子，手写卡片组合 12 处、15 处 `title=` 充当 tooltip、无 Badge/Segmented/EmptyState/Skeleton。颜色一致已经解决，形状与排版一致却没有系统、也没有视觉回归网——现在补成本最低。

## What Changes

- 设计 token 扩展为三层：primitive（圆角 / 阴影 / 动效时长与曲线 / 字阶与字重 / 密度尺寸）→ semantic → component，继续以 `design-tokens.json` 为唯一真相源
- 新增 8 个组件原语：**Card / Badge / Segmented / EmptyState / Skeleton / Tooltip / Kbd / Progress**，并替换现有手写实现（卡片组合、`title=` tooltip、loading 文案、空状态、视图切换、快捷键键帽、进度条）
- 中文排版基线：`--font-sans` 显式 CJK 栈（系统字体，不引 webfont）+ 字阶收敛到 11/12/14/16/20/24 + 数字 `tabular-nums` + 清理中文上无效的 `uppercase`/宽字距
- 双密度：`settingsStore.density: comfortable | compact`，`<html data-density>` 驱动控件高度 / 卡片与列表内边距 / 日历行高，默认 `comfortable`
- `ui:check` 扩展：新增「裸几何 / 动效值」检查（`rounded-*`/`shadow-*`/`duration-*`/`ease-*` 必须来自 token 集合）
- 视觉回归基线：Playwright `toHaveScreenshot` 覆盖 5 主题 × 6 截面（登录 / 日历月 / 日历周 / 看板 / 列表 / 宠物），基线入库；视觉用例打 `@visual` tag 由 `pnpm run test:visual` 触发（跨 OS 字体渲染差异，CI 默认排除）
- **BREAKING** 无：不改 API / DB / 路由；组件类名与目录调整属内部重构

## Capabilities

### New Capabilities

- `component-primitives`: 组件原语层的语义、可访问性、状态与密度适配契约（8 个原语及其替换关系）

### Modified Capabilities

- `design-token-contract`: 契约从「颜色」扩展到「几何 / 排版 / 动效 / 密度」；新增裸几何值门禁与视觉回归基线要求
- `frontend-experience-baseline`: 新增中文排版与密度基线要求

## API Contract Impact

无影响：不修改 `specs/openapi.yaml`，不新增/修改端点，不重新生成前端 SDK。

## DDD Layer Impact

无后端影响：API 层、应用层、领域层、基础设施层均不触碰。

## Database Impact

无 Flyway 迁移，不涉及任何表/列。

## Impact

- **前端代码**：`core/styles/`（primitive token + CJK 字体 + density 变量）、`core/components/ui/`（8 个原语）、`modules/{calendar,todo,pet}/components/`（替换手写卡片 / tooltip / loading / empty / 进度条 / 视图切换）、`core/store/settingsStore.ts`、`ManagePanel`（密度偏好项）、`index.css`
- **工具链**：`scripts/ui-check.mjs`（新增几何/动效检查）、`package.json`（`test:visual`）、`playwright.config.ts`（visual 配置与 snapshot 路径）、`.github/workflows/ci.yml`（e2e 软性 job 排除 `@visual`）
- **测试**：新增 8 原语 vitest、密度/排版单测、视觉基线截图；现有 52 文件 269 用例与 14 文件 65 E2E 须保持通过
- **文档**：`docs/frontend/component-catalog.md`、`docs/architecture.md`、`AGENTS.md`（组件数 / 测试计数 / 门禁）、`README.md`（核对）
- **Schema 档位**：`spec-driven-custom-standard`（proposal → specs → design → tasks）。跨模块 UI 重构 + 组件层新增，但无后端契约、架构模式或外部依赖变化，故不升 custom
