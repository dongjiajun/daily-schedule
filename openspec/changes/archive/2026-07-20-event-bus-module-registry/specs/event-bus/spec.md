# Event Bus

类型安全的同步事件总线，定义 SystemEvent 联合类型与 EventBus 类，作为模块间唯一通信通道。

## ADDED Requirements

### Requirement: SystemEvent Type Definition

shared 包 SHALL 定义 `SystemEvent` 联合类型，覆盖所有跨模块事件。

- `SystemEvent` MUST 为 discriminated union，`type` 字段为鉴别器
- MUST 包含以下事件类型：
  - `event:completed` — 日程完成
  - `event:created` — 日程创建
  - `event:cancelled` — 日程取消
  - `task:completed` — 任务完成
  - `task:created` — 任务创建
  - `habit:checked` — 习惯打卡
  - `habit:streak` — 连续打卡
  - `focus:completed` — 专注完成
  - `user:login` — 用户登录
  - `user:dailyCheckin` — 每日签到
- 每个事件类型 MUST 包含类型安全的 `payload` 对象
- 类型 MUST 从 shared 包的 barrel export 导出

#### Scenario: 模块发出日程完成事件

- **WHEN** 日历模块调用 `eventBus.emit({ type: 'event:completed', payload: { eventId: '1', title: '晨会' } })`
- **THEN** TypeScript SHALL 验证 payload 类型正确（`eventId: string`, `title: string`）
- **THEN** 所有监听 `event:completed` 的消费方 SHALL 收到该事件

#### Scenario: 跨平台复用事件类型

- **WHEN** 微信小程序端 `import type { SystemEvent } from '@daily-schedule/shared'`
- **THEN** TypeScript 编译 SHALL 通过
- **THEN** SystemEvent 类型 SHALL 在 Web 和小程序端完全一致

### Requirement: EventBus Class

shared 包 SHALL 提供 `EventBus` 类，支持同步的事件订阅、发布与取消。

- `on(eventType, listener)` MUST 注册监听器并返回注销函数
- `emit(event)` MUST 同步调用所有匹配的监听器
- `off(eventType, listener)` MUST 移除指定监听器
- `removeAll()` MUST 清空所有监听器（测试清理用）
- 同一 `eventType` 允许多个监听器
- 同一 listener 重复注册 SHALL 被忽略（幂等）

#### Scenario: 监听并响应事件

- **WHEN** 宠物模块调用 `eventBus.on('event:completed', handler)`
- **THEN** EventBus SHALL 返回一个注销函数
- **THEN** 当日历模块 emit `event:completed` 事件时，handler SHALL 被同步调用

#### Scenario: 注销监听器

- **WHEN** 模块调用 `on()` 返回的注销函数
- **THEN** 该监听器 SHALL 不再收到后续事件

#### Scenario: 清空所有监听器

- **WHEN** 测试代码调用 `eventBus.removeAll()`
- **THEN** 所有已注册的监听器 SHALL 被移除
- **THEN** 后续 emit 不会触发任何回调

### Requirement: Frontend EventBus Singleton

frontend SHALL 在 `core/lib/eventBus.ts` 中创建并导出 EventBus 的单例实例。

- 单例 SHALL 为 `export const eventBus = new EventBus()`
- 所有模块 SHALL 通过 `import { eventBus } from '@/core/lib/eventBus'` 获取同一实例

#### Scenario: 模块获取事件总线实例

- **WHEN** 日历模块 `import { eventBus } from '@/core/lib/eventBus'`
- **THEN** 获取的实例 SHALL 与宠物模块获取的实例相同
- **THEN** 所有模块共享同一事件总线单例

## Test Coverage

| Scenario | 测试方式 | 状态 |
|----------|---------|------|
| 模块发出日程完成事件 | TypeScript 类型检查 + 单元测试 | ➕ |
| 跨平台复用事件类型 | TypeScript 编译 | ➕ |
| 监听并响应事件 | EventBus 单元测试 | ➕ |
| 注销监听器 | EventBus 单元测试 | ➕ |
| 清空所有监听器 | EventBus 单元测试 | ➕ |
| 模块获取事件总线实例 | 单例引用相等性测试 | ➕ |
