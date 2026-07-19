# Proposal: 回填 Reminder Scheduler Spec

## Why

提醒调度是系统的核心实时功能——30s 定时轮询、±30s 触发窗口、`last_reminded_at` 幂等标记、多通道分发容错。这套逻辑精细且跨越 3 个基础设施层组件（ReminderScheduler / BrowserNotificationService / SseEmitterManager），任何修改都可能引入漏提醒或重复提醒的严重缺陷。当前无 spec 覆盖。

## What Changes

- 新增 `reminder-scheduler` capability spec，覆盖定时轮询、触发窗口、幂等跳过、多通道分发、SSE 推送、Browser Notification 全流程
- 在 spec 末尾附加 Test Coverage 表
- **无代码变更**（纯 spec 回填）

## Capabilities

### New Capabilities
- `reminder-scheduler`: 提醒调度系统 — 30s 定时轮询 + ±30s 触发窗口 + last_reminded_at 幂等 + 多通道分发 + SSE 推送

### Modified Capabilities
- 无

## API Contract Impact

无。不修改 `specs/openapi.yaml`。

## DDD Layer Impact

无代码变更。spec 覆盖范围：
- 基础设施层：`ReminderScheduler`、`BrowserNotificationService`、`SseEmitterManager`
- 领域层：`Event.reminderMinutes`、`Event.lastRemindedAt`、`Event.isActive()`、`NotificationChannel`

## Database Impact

无。不涉及 Flyway 迁移。

## Impact

- 新增：`openspec/specs/reminder-scheduler/spec.md`（归档时）
- 现有测试充分：ReminderSchedulerTest(7) / SseEmitterManagerTest(5) / BrowserNotificationServiceTest(5)
