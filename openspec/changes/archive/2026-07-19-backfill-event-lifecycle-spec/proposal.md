# Proposal: 回填 Event Lifecycle Spec

## Why

v3.1 引入了 Event 状态机（PLANNED/COMPLETED/CANCELLED），状态影响冲突检测、提醒触发、查询过滤三个关键路径。状态切换的行为规则（如 COMPLETED 事件不参与冲突检测、PLANNED↔COMPLETED toggle）散布在 Event.isActive()、EventApplicationService.create()、ReminderScheduler SQL 查询和前端 useToggleEventStatus 中，缺少集中定义。当前无 spec 覆盖。

## What Changes

- 新增 `event-lifecycle` capability spec，覆盖状态枚举、isActive 门禁、冲突检测规则、状态切换、查询过滤
- 在 spec 末尾附加 Test Coverage 表
- **无代码变更**（纯 spec 回填）

## Capabilities

### New Capabilities
- `event-lifecycle`: Event 状态机与生命周期 — PLANNED/COMPLETED/CANCELLED 枚举 + isActive 门禁 + 时间冲突检测 + 状态切换 + 查询过滤

### Modified Capabilities
- 无

## API Contract Impact

无。`EventStatus` schema 已存在于 `specs/openapi.yaml` v3.1。

## DDD Layer Impact

无代码变更。spec 覆盖范围：
- 领域层：`EventStatus`、`Event.isActive()`、`Event.isOverlapping()`、`EventDomainService.hasTimeConflict()`
- 应用层：`EventApplicationService.create()`、`EventApplicationService.update()`
- API 层：`GET /events` status/tagId 过滤
- 前端：`useToggleEventStatus`

## Database Impact

无。`V4__event_status.sql` 已执行。

## Impact

- 新增：`openspec/specs/event-lifecycle/spec.md`（归档时）
- 现有测试：EventDomainServiceTest(13) / EventApplicationServiceTest(7) / ReminderSchedulerTest(7)
