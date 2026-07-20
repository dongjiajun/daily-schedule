# Proposal: Event Bus + Module Registry

## Why

Phase 0 的核心基础设施。插件式模块架构需要两个基石：(1) 模块间松耦合通信的事件总线，(2) 模块的发现与生命周期管理的注册中心。没有这两个基础设施，后续的 `core-directory-restructure` 和 `calendar-module-extraction` 无法开展。

## What Changes

- `packages/shared/` 新增 `eventBus.ts` — 类型安全的 EventBus + SystemEvent 联合类型定义
- `frontend/src/core/lib/` 新增 `moduleRegistry.ts` — ModuleDefinition 接口 + 模块注册/注销 API
- `frontend/src/core/` 目录骨架搭建（为后续 core 迁移预留结构）
- shared 包重新构建（新增事件类型导出）

## Capabilities

### New Capabilities

- `event-bus`: 类型安全的同步事件总线，SystemEvent 联合类型覆盖所有跨模块事件（日程完成/取消、任务完成、习惯打卡、专注完成、用户登录/签到）
- `module-registry`: 模块注册中心，支持模块的注册、注销、查询，管理模块生命周期（onInit/onDestroy）

### Modified Capabilities

无

## API Contract Impact

无。不涉及 `specs/openapi.yaml`。

## DDD Layer Impact

无。纯前端基础设施变更。

## Database Impact

无。

## Impact

### 新增文件

| 路径 | 说明 |
|------|------|
| `packages/shared/src/eventBus.ts` | EventBus 类 + SystemEvent 联合类型 |
| `frontend/src/core/lib/moduleRegistry.ts` | ModuleDefinition + ModuleRegistry |
| `frontend/src/core/lib/eventBus.ts` | 从 shared 创建 EventBus 单例 |

### 修改文件

| 路径 | 操作 |
|------|------|
| `packages/shared/src/index.ts` | 新增 eventBus 导出 |
| `packages/shared/src/types/index.ts` | 新增 SystemEvent 类型导出 |

### 新增目录

| 路径 | 说明 |
|------|------|
| `frontend/src/core/` | 核心基础设施目录（骨架） |
| `frontend/src/core/lib/` | 核心库（moduleRegistry、eventBus 单例） |
