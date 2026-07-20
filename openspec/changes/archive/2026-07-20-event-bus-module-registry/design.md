# Design: Event Bus + Module Registry

## Context

当前前端是单体结构：`components/`、`hooks/`、`store/`、`lib/` 平铺，组件间直接 import。路线图要求迁移到插件式架构（`core/` + `modules/`），模块间必须松耦合——这意味着需要两个核心基础设施：

1. **事件总线**：模块不直接 import 彼此的 store/组件，只通过事件通信
2. **模块注册中心**：模块显式声明路由、store、生命周期，由中心统一管理

这是 Phase 0 的第二个变更（M0.2），依赖已完成的 `monorepo-foundation`（shared 包已就绪）。

**关键约束**：
- 事件总线类型必须定义在 `packages/shared/` 中（供 Web + 小程序共用）
- 模块注册中心是 Web 端专属（小程序用 Taro 的路由体系），放在 `frontend/src/core/`
- 本次不迁移任何现有代码到 core/（那是 `core-directory-restructure` 的事）

## Goals / Non-Goals

**Goals:**
- 在 shared 包中实现类型安全的同步事件总线
- 定义 SystemEvent 联合类型，覆盖所有跨模块事件
- 在 frontend 中实现 ModuleRegistry，支持注册/注销/查询
- 定义 ModuleDefinition 接口，含 routes、stores、petActions、onInit/onDestroy

**Non-Goals:**
- 不迁移现有文件到 core/ 目录（那是下一个变更）
- 不修改现有组件使用事件总线（后续变更逐模块接入）
- 不实现实际的模块（calendar/pet/todo 等）
- 不涉及后端

## Decisions

### Decision 1: 事件派发方式 — 同步派发

- **选择**: 同步派发（`listeners.forEach(fn => fn(event))`）
- **理由**:
  - 宠物对日程完成的反应（心情变化、动画）应同步于业务操作，避免状态不一致
  - 简化调试（调用栈完整）
  - 执行计划决策 D3 已明确推荐
- **备选方案**:
  - 异步派发（`Promise.all` / `setTimeout`）：允许慢消费方不阻塞主流程，但引入状态不一致风险

### Decision 2: 事件总线位置 — shared 包

- **选择**: 事件类型 + EventBus 类定义在 `packages/shared/src/eventBus.ts`
- **理由**:
  - 事件类型是跨平台的契约，Web 和小程序共用
  - 小程序端可直接复用 EventBus 实现
  - frontend 中只创建单例实例
- **备选方案**:
  - 放在 frontend 中：小程序无法复用，需重复定义

### Decision 3: 模块注册方式 — 声明式注册

- **选择**: 模块通过 `moduleRegistry.register(definition)` 注册，返回 `unregister` 函数
- **理由**:
  - 简单直接，无框架依赖
  - 启动时在 `main.tsx` 或各模块 `index.ts` 中自注册
  - 注销函数用于测试清理和热更新
- **备选方案**:
  - 文件约定自动扫描（`import.meta.glob`）：增加构建工具耦合，调试不透明

### Decision 4: 模块路由 — 延迟加载

- **选择**: `ModuleDefinition.routes` 使用 React Router 的 `lazy` 加载
- **理由**:
  - 模块代码按需加载，首屏体积可控
  - 与 React Router 7 的 `route.lazy()` 天然兼容
- **备选方案**:
  - 静态 import：首屏加载所有模块，不适合多模块扩展

### Decision 5: ModuleDefinition 中 petActions 字段

- **选择**: 在 ModuleDefinition 中声明 `petActions?: PetActionDefinition[]`，由模块注册中心收集后供宠物系统消费
- **理由**:
  - 宠物系统（后续 Phase 1）需要知道"哪些模块的哪些行为能触发宠物反应"
  - 模块不直接依赖宠物，只声明自己能产生什么行为
  - 宠物系统通过事件总线监听这些行为
- **PetActionDefinition**:
  ```typescript
  interface PetActionDefinition {
    eventType: SystemEvent['type']  // 监听的系统事件类型
    description: string              // "完成了日程" → 可获取 +专注币 +经验
  }
  ```

## Architecture

### EventBus 设计

```typescript
// packages/shared/src/eventBus.ts

type SystemEvent =
  | { type: 'event:completed'; payload: { eventId: string; title: string } }
  | { type: 'event:created'; payload: { eventId: string; title: string } }
  | { type: 'event:cancelled'; payload: { eventId: string; title: string } }
  | { type: 'task:completed'; payload: { taskId: string; title: string } }
  | { type: 'task:created'; payload: { taskId: string } }
  | { type: 'habit:checked'; payload: { habitId: string } }
  | { type: 'habit:streak'; payload: { habitId: string; days: number } }
  | { type: 'focus:completed'; payload: { duration: number } }
  | { type: 'user:login'; payload: { consecutive: number } }
  | { type: 'user:dailyCheckin'; payload: { timestamp: number } }

type Listener = (event: SystemEvent) => void

class EventBus {
  private listeners = new Map<string, Set<Listener>>()

  on(eventType: SystemEvent['type'], listener: Listener): () => void
  emit(event: SystemEvent): void
  off(eventType: SystemEvent['type'], listener: Listener): void
  removeAll(): void  // 测试清理
}
```

### ModuleRegistry 设计

```typescript
// frontend/src/core/lib/moduleRegistry.ts

interface ModuleDefinition {
  id: string
  name: string
  description: string
  icon: React.ComponentType
  order: number
  routes: RouteObject[]
  stores?: Record<string, StateCreator>
  onInit?: () => void | Promise<void>
  onDestroy?: () => void
  petActions?: PetActionDefinition[]
}

class ModuleRegistry {
  private modules = new Map<string, ModuleDefinition>()

  register(def: ModuleDefinition): () => void  // 返回注销函数
  unregister(id: string): void
  get(id: string): ModuleDefinition | undefined
  getAll(): ModuleDefinition[]
  getRoutes(): RouteObject[]                    // 收集所有模块路由
  getPetActions(): PetActionDefinition[]        // 收集所有宠物行为声明
}
```

### Frontend 单例

```typescript
// frontend/src/core/lib/eventBus.ts
import { EventBus } from '@daily-schedule/shared'
export const eventBus = new EventBus()
```

## Frontend Structure

```
frontend/src/core/
├── lib/
│   ├── eventBus.ts          # EventBus 单例实例
│   └── moduleRegistry.ts    # ModuleRegistry + ModuleDefinition 类型
└── (后续变更填充: store/, hooks/, components/ui/, styles/)
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| SystemEvent 类型膨胀 | 按模块分组注释，定期审查未使用事件类型 |
| 同步派发阻塞 UI | 事件消费方禁止重计算（验证规则 + ESLint 规则） |
| 模块未注册导致路由 404 | 注册时校验必填字段，dev 环境打印已注册模块清单 |

## Migration Plan

纯新增代码，零破坏性：
1. 在 shared 包中新增 `eventBus.ts`，更新 barrel exports
2. 重建 shared 包
3. 在 frontend 中创建 `core/lib/`，新增 `moduleRegistry.ts` 和 `eventBus.ts` 单例
4. 编写单元测试
5. 全量验证

## Open Questions

1. **EventBus 是否需要历史回放？** — 否，v1 不需要。模块在 onInit 时查询当前状态，不依赖历史事件。
2. **模块间是否允许直接 import 类型？** — 允许，类型是编译期概念，不影响运行时耦合。仅禁止 import store/组件/hooks。
