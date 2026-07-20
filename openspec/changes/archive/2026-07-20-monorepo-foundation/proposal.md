# Proposal: Monorepo Foundation

## Why

当前项目是单体前端（`frontend/`）直连单体后端（`backend/`），无共享代码层。路线图规划了 Web + 微信小程序双端，必须先将项目 Monorepo 化，建立 `packages/shared/` 共享包，为后续的模块注册中心、事件总线、多端代码复用奠定基础。这是 Phase 0 的第一步，所有后续架构演进都依赖于此。

## What Changes

- 根目录新增 `package.json`（pnpm workspace）+ `turbo.json`（Turborepo 任务编排）
- 新增 `packages/shared/` TypeScript 库（类型定义、工具函数、API 端点常量、业务规则）
- 从 `frontend/src/` 提取可共享代码到 shared 包（类型、工具函数，不动 UI 组件和 hooks）
- `frontend/` 通过 workspace 引用 `@daily-schedule/shared`
- Turborepo pipeline: `shared#build` → `frontend#build`
- CI 适配：Monorepo 全量构建验证（`turbo run build`）
- 文档更新：架构文档、CLAUDE.md、开发工作流说明

## Capabilities

### New Capabilities

- `monorepo-workspace`: pnpm workspace + Turborepo 任务编排，支撑多包并行构建
- `shared-package`: TypeScript 共享库，提供跨端复用的类型、工具函数、业务规则常量

### Modified Capabilities

无（纯项目结构变更，不修改业务功能）

## API Contract Impact

无。不涉及 `specs/openapi.yaml` 的任何变更。此变更仅重构前端项目结构，后端 API 契约不变。

## DDD Layer Impact

无。此变更仅涉及前端项目结构和构建系统，不触碰后端 DDD 四层。

## Database Impact

无。不涉及数据库表结构或 Flyway 迁移。

## Impact

### 受影响的文件/目录

| 类别 | 路径 | 操作 |
|------|------|------|
| 根目录 | `package.json` | **新增** — pnpm workspace 定义 |
| 根目录 | `turbo.json` | **新增** — Turborepo pipeline 配置 |
| 根目录 | `pnpm-workspace.yaml` | **新增** — workspace 包声明 |
| 共享包 | `packages/shared/` | **新增** — 类型、工具函数、常量 |
| 前端 | `frontend/package.json` | **修改** — 添加 `@daily-schedule/shared` 依赖 |
| 前端 | `frontend/tsconfig.json` | **修改** — 添加 shared 包路径映射 |
| 前端 | `frontend/vite.config.ts` | **修改** — 确保 shared 包正确解析 |
| 前端 | `frontend/src/` 部分文件 | **修改** — import 路径从相对路径改为 `@daily-schedule/shared` |
| CI | `.github/workflows/` (如有) | **修改** — 适配 Monorepo 构建流程 |
| 文档 | `docs/architecture.md` | **修改** — 补充 Monorepo 结构 |
| 文档 | `CLAUDE.md` | **修改** — 补充 Monorepo 开发命令 |
| 文档 | `docs/execution-plan.md` | **修改** — M0.1 状态更新 |

### 不受影响

- `backend/` — 完全不涉及
- `specs/openapi.yaml` — 不涉及
- 所有业务功能 — 日历、认证、SSE、ICS 导出等均不变
- 数据库 — 不涉及

### 新增依赖

- `turbo` (devDependency, 根目录)
- `typescript` (shared 包)

### 共享包内容范围（明确边界）

`packages/shared/` **包含**：
- TypeScript 类型定义（Event、Category、Tag、User 等实体类型）
- 工具函数（日期格式化、数据验证、常量）
- API 端点路径常量
- 业务规则常量（状态枚举、优先级枚举等）

`packages/shared/` **不包含**：
- React 组件或 hooks
- 样式/CSS
- 路由定义
- Zustand stores
- 任何 UI 相关代码
