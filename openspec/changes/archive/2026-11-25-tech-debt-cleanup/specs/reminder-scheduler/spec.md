# Reminder Scheduler

## ADDED Requirements

### Requirement: SSE 连接握手与定时心跳
`SseEmitterManager.register(userId)` 在连接注册成功后 SHALL 立即发送事件名为 `connect`、数据为 `"connected"` 的握手事件；系统 SHALL 按 `sse.heartbeat.intervalMs`（默认 `30000` ms）定时向所有活跃连接发送事件名为 `heartbeat`、数据为 `"ping"` 的心跳事件，并在发送 `IOException` 时移除失效连接与空用户条目；`ScheduleConfig.taskScheduler()` 池大小 SHALL ≥ 3 以容纳提醒、衰减与心跳三类定时任务。

#### Scenario: 注册连接立即发送握手事件
- **WHEN** 客户端订阅 `GET /api/v1/sse/notifications` 调用 `SseEmitterManager.register(userId)`
- **THEN** 连接立刻收到事件名为 `connect`、data 为 `"connected"` 的 SSE 事件

#### Scenario: 定时心跳向所有活跃连接推送保活事件
- **WHEN** `SseEmitterManager.sendHeartbeat()` 触发且多个用户存在活跃 SSE 连接
- **THEN** 所有健康连接均收到事件名为 `heartbeat`、data 为 `"ping"` 的 SSE 事件

#### Scenario: 心跳或推送遇 IOException 时清理失效连接
- **WHEN** 某连接的 `send()` 抛出 `IOException`（客户端已断开）
- **THEN** 该失效 emitter 从注册表中移除，若该用户无剩余连接则移除用户条目并减少 `getActiveCount()`，其他连接不受影响
