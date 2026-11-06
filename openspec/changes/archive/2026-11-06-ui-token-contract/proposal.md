# Proposal: UI 系统层地基修复（ui-token-contract）

## Why

前端视觉层已经积累了三处互相打架的主题契约（文档说 21 个 token、5 套基础主题各写 27 个、18 套节日主题只写 7 个），外加 62 处绕过 token 的业务裸色值。结果是 `themeMode=auto` 命中节日时，前景色/边框/悬停/日历专用变量全部无定义；小字对比度最低 2.35:1；`autoDarkMode` 是从未被消费的死配置。在设计语言或布局动手术之前必须先把这层地基补平，否则新设计会把同一批漂移再复制一遍。

## What Changes

- 建立设计 token 的**单一真相源**（代码内 token 清单模块），基础主题与节日主题共用同一份契约；文档中「21 个 token」这类 prose 数字改由脚本校验
- 补全 18 套节日主题缺失的语义 token（前景/前景次级/muted、边框、hover、sidebar、surface-elevated、日历专用、渐变等），消除 `data-theme="holiday-*"` 下的未定义变量
- 语义色（success / error / warning 及其 `-bg` / `-fg`）注册进 Tailwind `@theme`，让 `text-error`、`bg-success` 等语义 utility 可用（现状全站不可用，是裸色值泛滥的根因）
- 新增 `--color-border-strong`（可交互控件边界），并调整不达标的 token 取值：`foreground-muted`（default 2.54:1 → ≥4.5:1、dark 3.07:1 → ≥4.5:1）、dark `foreground-secondary` 拉开层级、error 语义色改为白字达标的取值
- 业务 UI 裸色值收敛为语义 utility；白名单仅保留插画（Onboarding）、宠物 SVG、特效粒子、登录页光斑
- 修 4 类静默失效：`transition` 作用于未 `@property` 注册的自定义属性、`color + '22'` 非法透明度拼接、日历周末写死的暖色硬编码、auto 模式首屏主题闪动（首帧脚本不识别 `activeHolidayId`）
- 新增 UI 门禁：`scripts/ui-check.mjs`（token 完整性 / 对比度 / 裸色值 / 未知 token / CSS 死 token 五项）+ vitest 主题快照 + E2E 主题计算色断言，接入 CI frontend job
- 移除死配置 `autoDarkMode`（「跟随系统深色」另开变更实现，本期不引入行为）
- **BREAKING** 无：不改 API 契约、不删用户数据；`autoDarkMode` 是无消费方的死字段，删除后 localStorage 中的残留键由 zustand persist 忽略

## Capabilities

### New Capabilities

- `design-token-contract`: 定义前端设计 token 的单一真相源与可验证门禁（主题完整性、对比度阈值、裸色值白名单、未知 token），使主题与配色变更可被 CI 守住

### Modified Capabilities

- `theme-system`: token 契约从 prose 数字改为可执行清单；新增 `border-strong` 与语义色 utility 注册；要求全部主题（含节日）覆盖完整契约；对比度取值纳入规范
- `holiday-theme-auto`: 节日主题从「只写 7 个变量」改为覆盖完整 token 契约（或由种子色派生），保证 auto 模式下文字/边框/日历可读
- `frontend-experience-baseline`: 把既有「不得静默失效」原则扩展为「不得裸色值、不得引用未注册 token、不得对未注册自定义属性做过渡」

## API Contract Impact

无影响。不修改 `specs/openapi.yaml`，不新增/修改/删除任何端点，不改响应结构，前端 SDK 不重新生成。

## DDD Layer Impact

无后端影响：API 层、应用层、领域层、基础设施层均不触碰。本变更为纯前端样式层 + 前端工具链。

## Database Impact

无需 Flyway 迁移，不涉及任何表/列。

## Impact

- **前端代码**：`frontend/src/core/styles/`（themes.css / holiday-themes.css / 新增 token 清单）、`frontend/src/index.css`、`frontend/src/core/components/ui/`（button 等）、`frontend/src/modules/{calendar,todo,pet}/components/`、`frontend/src/pages/LoginPage.tsx`、`frontend/index.html`（首屏主题脚本）、`frontend/src/core/store/settingsStore.ts`
- **工具链**：新增 `scripts/ui-check.mjs`；`package.json` 增 `ui:check`；`.github/workflows/ci.yml` 的 frontend job 增一步
- **测试**：新增 vitest 主题 token 快照、E2E 主题计算色断言；现有 51 文件 267 前端用例、13 文件 57 E2E 用例须保持通过
- **文档**：`docs/frontend/component-catalog.md`、`docs/architecture.md`、`AGENTS.md`（门禁与版本段）、`openspec/specs/{theme-system,frontend-experience-baseline,holiday-theme-auto}/spec.md`
- **Schema 档位**：`spec-driven-custom-standard`（proposal → specs → design → tasks）。理由：跨 3 个既有 capability 出 delta + 新增 CI 门禁 + 多文件样式重构，超出 lite 范围；但不引入架构决策、外部依赖或红绿测试账本需求，故不升 custom 档
