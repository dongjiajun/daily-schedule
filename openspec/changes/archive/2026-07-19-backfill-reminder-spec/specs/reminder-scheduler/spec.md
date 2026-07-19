# Reminder Scheduler

<!-- 参考: specs/openapi.yaml + docs/api/overview.md + docs/database/schema.md -->

## ADDED Requirements

### Requirement: 定时轮询未来 1 小时内的待提醒事件
`ReminderScheduler.checkReminders()` SHALL 以 `fixedDelay=30s` 的频率执行（上一次执行结束后 30s 启动下一次）。每次执行时 SHALL 查询 `start_time` 在 `[now, now+1h]` 范围内、`reminder_minutes IS NOT NULL`、`status='PLANNED'` 的事件。SHALL 使用注入的 `Clock` 获取当前时间（便于测试）。

#### Scenario: 存在待提醒事件时触发
- **WHEN** 当前时间 09:00，存在一个 09:15 开始、`reminderMinutes=15` 的 PLANNED 事件
- **THEN** `checkReminders()` 查询到该事件，计算 `remindAt=09:00`，触发提醒

#### Scenario: 无待提醒事件时静默
- **WHEN** 1 小时内无 PLANNED 或 reminderMinutes 非空的事件
- **THEN** `checkReminders()` 查询结果为空，不触发任何提醒

#### Scenario: COMPLETED 事件不触发提醒
- **WHEN** 存在一个 `reminderMinutes=15` 但 `status=COMPLETED` 的事件
- **THEN** 该事件不被查询到，不触发提醒

### Requirement: 触发窗口限制（±30s）
系统 SHALL 仅在 `remindAt` 落在 `[now - 30s, now + 30s)` 半开区间内时才触发提醒。此窗口确保在 30s 轮询周期内恰好触发一次。

#### Scenario: remindAt 在窗口内触发
- **WHEN** `now=09:00:00`，`remindAt=09:00:10`（窗口内）
- **THEN** `withinWindow(remindAt, now)` 返回 true，触发提醒

#### Scenario: remindAt 在窗口前不触发
- **WHEN** `now=09:00:00`，`remindAt=08:59:00`（窗口前 60s）
- **THEN** 跳过该事件，不触发提醒

#### Scenario: remindAt 恰好在窗口边界
- **WHEN** `now=09:00:00`，`remindAt=08:59:30`（恰好窗口起始）
- **THEN** `withinWindow` 返回 true（`remindAt >= now-30s`）

### Requirement: 幂等跳过已提醒事件
系统 SHALL 使用 `event.last_reminded_at` 字段实现幂等。若 `last_reminded_at >= remindAt`，SHALL 跳过该事件，避免同一次提醒在连续轮询周期中重复触发。

#### Scenario: 未提醒过的事件正常触发
- **WHEN** `last_reminded_at = null`，`remindAt = 09:00`
- **THEN** `alreadyReminded()` 返回 false，触发提醒并写入 `last_reminded_at = now`

#### Scenario: 已提醒过的事件跳过
- **WHEN** `last_reminded_at = 09:00:05`，`remindAt = 09:00:00`
- **THEN** `alreadyReminded()` 返回 true（`last_reminded_at >= remindAt`），跳过

#### Scenario: 旧提醒不阻止新提醒
- **WHEN** 事件 A 昨天已被提醒（`last_reminded_at = 昨天`），今天又有新的 `remindAt = 今天 09:00`
- **THEN** `last_reminded_at < remindAt`，`alreadyReminded()` 返回 false，正常触发

### Requirement: 多通道分发容错
系统 SHALL 遍历所有注入的 `NotificationChannel` bean 并依次调用 `send(event)`。单个通道抛出异常时 SHALL 被 catch 并记录日志，不影响其他通道继续执行。所有通道处理完毕后 SHALL 调用 `eventRepository.markReminded(id, now)`。

#### Scenario: 两个通道均成功
- **WHEN** 系统有 BrowserNotification 和另一个通道均正常
- **THEN** 两个通道均被调用，`markReminded` 被调用一次

#### Scenario: 一个通道失败不影响其他
- **WHEN** 通道 A 抛出 RuntimeException，通道 B 正常
- **THEN** 通道 B 仍被调用，`markReminded` 仍被调用，错误日志记录通道 A 的异常

#### Scenario: 多个事件独立处理
- **WHEN** 同时存在 3 个待提醒事件：事件1在窗口内、事件2在窗口外、事件3已提醒过
- **THEN** 仅事件1触发提醒分发和 `markReminded`，事件2和事件3被跳过

### Requirement: SSE 推送 JSON 格式提醒
`BrowserNotificationService.send(event)` SHALL 将事件序列化为 JSON 格式 `{"id":<id>,"title":"<title>","startTime":"<ISO>","reminderMinutes":<minutes>}` 并通过 `SseEmitterManager.sendToUser(event.userId, payload)` 推送给对应用户。SHALL 仅支持 `NotificationType.BROWSER`。序列化失败时 SHALL 记录错误日志并返回（不推送）。

#### Scenario: 正常推送提醒 JSON
- **WHEN** 事件 id=42, title="团队周会", startTime="2026-05-10T09:00:00", reminderMinutes=15
- **THEN** SSE 事件名 "reminder"，payload 为 `{"id":42,"title":"团队周会","startTime":"2026-05-10T09:00:00","reminderMinutes":15}`

#### Scenario: 特殊字符正确 JSON 转义
- **WHEN** 事件标题含引号、反斜杠、换行符
- **THEN** JSON payload 中特殊字符被正确转义

#### Scenario: reminderMinutes 为 null 时正常序列化
- **WHEN** 事件 reminderMinutes 为 null
- **THEN** JSON payload 中 `"reminderMinutes":null`

### Requirement: SseEmitterManager 按 userId 路由与失败自动清理
`SseEmitterManager` SHALL 使用 `ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>>` 维护每个用户的 SSE 连接列表。`register(userId)` SHALL 创建 `SseEmitter(0L)`（永不超时）并注册 `onCompletion`/`onTimeout`/`onError` 回调自动移除。`sendToUser(userId, event)` SHALL 向该用户的所有 emitter 推送名为 `"reminder"` 的 SSE 事件。发送期间 `IOException` SHALL 导致该 emitter 被移除，不影响同用户的其他 emitter。

#### Scenario: 注册增加活跃连接数
- **WHEN** 调用 `register(userId=1L)`
- **THEN** `getActiveCount()` 从 0 变为 1

#### Scenario: 多 emitter 按用户隔离
- **WHEN** 用户 1 注册 2 个 emitter，用户 2 注册 1 个 emitter
- **THEN** `sendToUser(1L, payload)` 仅推送给用户 1 的 2 个 emitter，用户 2 不收

#### Scenario: IOException 自动移除失败 emitter
- **WHEN** 用户 1 有 2 个 emitter，其中 1 个在 send 时抛 IOException
- **THEN** 失败 emitter 被移除，activeCount 减 1，另一个 emitter 正常收到推送

#### Scenario: 用户无 emitter 时不抛异常
- **WHEN** 调用 `sendToUser(userId=99L, payload)` 但该用户未注册任何 emitter
- **THEN** 静默返回，不抛异常

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 存在待提醒事件时触发 | ReminderSchedulerTest | `atReminderTime_dispatchesAndMarks` | ✅ |
| 窗口前不触发 | ReminderSchedulerTest | `beforeReminderWindow_skips` | ✅ |
| 已提醒过跳过 | ReminderSchedulerTest | `alreadyReminded_skips` | ✅ |
| 无 reminderMinutes 跳过 | ReminderSchedulerTest | `noReminderMinutes_skips` | ✅ |
| 单通道失败不影响其他 | ReminderSchedulerTest | `oneChannelFails_othersStillFire` | ✅ |
| 多事件独立处理 | ReminderSchedulerTest | `multipleEvents_handledIndependently` | ✅ |
| 正常推送提醒 JSON | BrowserNotificationServiceTest | `send_publishesJsonPayload` | ✅ |
| 特殊字符 JSON 转义 | BrowserNotificationServiceTest | `send_handlesSpecialCharactersInTitle` | ✅ |
| reminderMinutes 为 null | BrowserNotificationServiceTest | `send_nullReminderMinutes_stillSerializes` | ✅ |
| 序列化失败不推送 | BrowserNotificationServiceTest | `send_serializationFailure_skipsBroadcast` | ✅ |
| 注册增加活跃连接数 | SseEmitterManagerTest | `register_increasesActiveCount` | ✅ |
| 多 emitter 按用户隔离 | SseEmitterManagerTest | `sendToUser_invokesCorrectUserEmitters` | ✅ |
| IOException 自动移除 | SseEmitterManagerTest | `sendToUser_failedEmitter_isRemoved` | ✅ |
| 用户无 emitter 不抛异常 | SseEmitterManagerTest | `sendToUser_noEmitters_doesNotThrow` | ✅ |
