# Shared Package

跨平台（Web + 微信小程序）复用的 TypeScript 共享库 `@daily-schedule/shared`，提供类型定义、业务常量和纯函数工具。

## ADDED Requirements

### Requirement: Package Structure

`packages/shared/` SHALL 是一个独立的 TypeScript 包，通过 `tsc` 编译为 JavaScript + 类型声明文件。

- `package.json` MUST 声明 `"name": "@daily-schedule/shared"`、`"type": "module"`、`"private": true`
- `main` MUST 指向 `./dist/index.js`，`types` MUST 指向 `./dist/index.d.ts`
- `exports` MUST 配置 ESM 入口（`import` + `types`），不提供 CJS 入口
- `scripts.build` MUST 为 `tsc`（纯 TypeScript 编译，无需 bundler）
- `typescript` MUST 为 `devDependencies`，版本与 `frontend` 一致（`~6.0.2`）
- 包 SHALL 零运行时依赖（或有且仅有 `dayjs` 等跨平台无 DOM 依赖的库）

#### Scenario: shared 包独立构建

- **WHEN** 在 `packages/shared/` 目录执行 `pnpm run build`
- **THEN** `tsc` SHALL 根据 `tsconfig.json` 编译 `src/` 下所有 `.ts` 文件
- **THEN** 输出 `.js` + `.d.ts` + `.d.ts.map` 到 `dist/` 目录
- **THEN** `dist/index.js` 和 `dist/index.d.ts` MUST 存在且为有效模块

#### Scenario: frontend 引用 shared 包

- **WHEN** `frontend/package.json` 声明 `"@daily-schedule/shared": "workspace:*"`
- **THEN** pnpm SHALL 将 `packages/shared/` 符号链接到 `frontend/node_modules/@daily-schedule/shared/`
- **THEN** frontend 代码中 `import { ... } from '@daily-schedule/shared'` MUST 正确解析

### Requirement: Core Type Definitions

shared 包 SHALL 提供核心业务类型定义，供 Web 和小程序端共用。

- MUST 定义 `EventStatus` 类型（`'PLANNED' | 'COMPLETED' | 'CANCELLED'`）
- SHOULD 定义核心实体类型接口（与 `types.gen.ts` 中结构一致，但独立维护）
- 所有类型 MUST 通过 `src/types/index.ts` barrel 统一导出

#### Scenario: 多端共享 EventStatus 类型

- **WHEN** Web 端组件使用 `import type { EventStatus } from '@daily-schedule/shared'`
- **THEN** TypeScript SHALL 正确解析类型，编译通过
- **THEN** EventStatus 的值与后端 OpenAPI schema 定义一致（`PLANNED | COMPLETED | CANCELLED`）

#### Scenario: 类型与自动生成的 types.gen.ts 共存

- **WHEN** 执行 `npm run generate:api` 重新生成 `frontend/src/api/types.gen.ts`
- **THEN** shared 包中的类型定义 SHALL 不受影响（独立维护）
- **THEN** 存在类型重复（shared 与 types.gen.ts），但编译不冲突

### Requirement: Business Constants

shared 包 SHALL 提供跨平台共享的业务常量。

- MUST 提供 `PRESET_COLORS` 数组（日程/分类/标签色板预设）
- SHOULD 提供 API 端点路径常量（如 `API_BASE`、`AUTH_ENDPOINTS` 等）
- SHOULD 提供业务规则常量（状态枚举值、默认分页大小等）
- 常量 MUST 从 `src/constants/index.ts` barrel 统一导出

#### Scenario: 前端组件使用共享色板

- **WHEN** `EventForm.tsx` 中 `import { PRESET_COLORS } from '@daily-schedule/shared'`
- **THEN** PRESET_COLORS SHALL 为包含 9 个十六进制颜色字符串的数组
- **THEN** 颜色选择器 UI SHALL 正常渲染所有预设色块

#### Scenario: 后续新增模块引用 API 端点常量

- **WHEN** 新模块（如 `modules/todo/`）需要调用后端 API
- **THEN** 可通过 `import { API_ENDPOINTS } from '@daily-schedule/shared'` 获取端点路径
- **THEN** 避免各模块硬编码 `/api/v1/events` 等字符串

### Requirement: Framework-Agnostic Utilities

shared 包 SHALL 仅包含不依赖 React、DOM 或浏览器 API 的纯函数工具。

- 包 SHALL 不 `import` React、ReactDOM 或任何 React 生态库
- 包 SHALL 不访问 `document`、`window`、`localStorage` 等浏览器全局对象
- 可包含的典型工具：日期格式化、数据验证、字符串处理、数学计算
- 可依赖 `dayjs`（同构日期库，无 DOM 依赖）

#### Scenario: shared 包在小程序环境中可用

- **WHEN** 微信小程序项目（Taro）引用 `@daily-schedule/shared`
- **THEN** TypeScript 编译 SHALL 通过，无运行时错误
- **THEN** 导入的纯函数 SHALL 在小程序 JS 引擎中正常执行

#### Scenario: 开发者尝试在 shared 中引用 React

- **WHEN** shared 包中 `import React from 'react'`
- **THEN** TypeScript 编译 SHALL 报错（shared 的 `tsconfig.json` 不包含 JSX 配置）
- **THEN** 代码审查 SHALL 拦截此类不合规的依赖引入

### Requirement: Frontend Import Migration via Re-export

被提取到 shared 的原 `frontend/src/` 文件 SHALL 保留为 re-export 兼容层，而非直接删除。

- 迁移后的原文件 SHALL 内容为 `export { X } from '@daily-schedule/shared'`
- 现有 `@/lib/colors` 等 import 路径 SHALL 仍然有效（向后兼容）
- 后续可逐步将消费方 import 改为直接引用 shared，最终删除兼容层

#### Scenario: 渐进迁移期间现有 import 不中断

- **WHEN** `lib/colors.ts` 改为 re-export 后，其他文件仍 `import { PRESET_COLORS } from '@/lib/colors'`
- **THEN** TypeScript SHALL 正确解析，编译通过
- **THEN** 运行时 PRESET_COLORS SHALL 与 shared 中的值相同

#### Scenario: 新代码直接使用 shared

- **WHEN** 开发者在新组件中 `import { PRESET_COLORS } from '@daily-schedule/shared'`
- **THEN** TypeScript SHALL 正确解析，不再依赖 `@/lib/colors` 兼容层路径

## Test Coverage

| Scenario | 测试方式 | 状态 |
|----------|---------|------|
| shared 包独立构建 | `cd packages/shared && pnpm run build` | ➕ |
| frontend 引用 shared 包 | `cd frontend && pnpm run build` | ➕ |
| 多端共享 EventStatus 类型 | TypeScript 编译时类型检查 | ➕ |
| 类型与自动生成的 types.gen.ts 共存 | `tsc -b` 通过 | ➕ |
| 前端组件使用共享色板 | 现有 vitest + 手动冒烟 | ➕ |
| shared 包在小程序环境中可用 | 后续 Phase 2 验证 | ➕ |
| 渐进迁移期间现有 import 不中断 | `npm run verify` 全量通过 | ➕ |
| 新代码直接使用 shared | TypeScript 编译 + ESLint | ➕ |
