# 架构说明

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React 19)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Calendar  │ │ EventForm │ │ Sidebar  │ │ Zustand   │  │
│  │ (big-cal) │ │ + Modal   │ │ + Filter │ │ + RQuery  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│  shadcn/ui: Button/Dialog/Input/Select/Switch/...        │
└──────────────────────┬──────────────────────────────────┘
                       │ REST / SSE
┌──────────────────────▼──────────────────────────────────┐
│              Spring Boot 3.4 (Java 21)                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ API 层 — Controller + DTO + Assembler             │   │
│  │ 实现 generated/api/ 接口，编译期强制契约同步       │   │
│  └─────────────────────┬────────────────────────────┘   │
│                        │                                 │
│  ┌─────────────────────▼────────────────────────────┐   │
│  │ 应用层 — ApplicationService                       │   │
│  │ 业务流程编排、事务管理、参数校验、重名校验        │   │
│  └─────────────────────┬────────────────────────────┘   │
│                        │                                 │
│  ┌─────────────────────▼────────────────────────────┐   │
│  │ 领域层 — Entity + DomainService + Repository 接口  │   │
│  │ 纯 POJO，封装核心业务规则与读路径投影              │   │
│  └─────────────────────▲────────────────────────────┘   │
│                        │                                 │
│  ┌─────────────────────┴────────────────────────────┐   │
│  │ 基础设施层 — Repository Impl + PO + Mapper        │   │
│  │ MyBatis-Plus、Flyway、定时任务、通知通道          │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  MySQL 8.0 (InnoDB)                      │
│   category | tag | event | event_tag                     │
│   event.last_reminded_at（幂等标记）                      │
└──────────────────────────────────────────────────────────┘
```

## 响应契约（v2.0）

- **成功响应**直接返回业务数据：单条对象 / 列表数组；HTTP 状态码承载语义（200/201/204）。
- **错误响应**统一为 `ApiResponse { code, message }`（400/404/500）。
- **SSE 通道** `/api/v1/sse/notifications` 已纳入 OpenAPI 契约；命名事件 `connect` / `reminder` / `heartbeat`，`reminder.data` 为 `ReminderEvent` JSON。
- 变更历史与版本号管理见 `specs/CHANGELOG.md`。

## 数据流示例：创建日程

1. Browser `POST /api/v1/events` → `EventController.createEvent()`
2. Controller 接收生成的 `EventCreateRequest` DTO
3. `EventAssembler.toDomain()` 转换 DTO → 领域 `Event`
4. `EventApplicationService.create()` → `isValid()` + `hasTimeConflict()` → `save()`
5. `EventRepositoryImpl.save()` 转换 Event → EventPO → MyBatis-Plus insert，再重写 `event_tag` 关联
6. `EventAssembler.toResponse(saved)` 直接返回 `EventResponse`

## 数据流示例：查询日程（含标签详情）

1. Browser `GET /api/v1/events?start=&end=` → `EventController.listEvents()`
2. `EventApplicationService.listByRange()` → `EventRepository.findByRange()`
3. `EventRepositoryImpl.loadWithTags()`：
   - `EventMapper.selectByRange` 查 event 主表
   - **单次** `EventTagMapper.selectTagsByEventIds(allIds)` JOIN tag 表，避免 N+1
   - 按 `event_id` 分组回填 `Event.tags`（完整 name/color/createdAt）与 `Event.tagIds`
4. `EventAssembler.toResponse()` 优先使用 `Event.tags` 输出完整 `TagResponse[]`

## 提醒通道（幂等）

```
Scheduler (60s rate, Clock-injected)
   │
   ├─ findUpcoming(now, now+1h)         读取设有 reminderMinutes 的事件
   │
   ├─ 跳过：!withinWindow(remindAt)      ±30s 触发窗口
   ├─ 跳过：alreadyReminded()           last_reminded_at ≥ remindAt
   │
   ├─ 分发：channels.forEach(send)      所有 NotificationChannel
   └─ markReminded(id, now)             幂等写回
```

`BrowserNotificationService` 使用 Jackson `ObjectMapper` 序列化 `ReminderEvent`（含特殊字符转义），经 `SseEmitterManager.sendToAll` 广播到全部活跃 `SseEmitter` 连接。

## 模块结构

| 模块 | 路径 | 职责 |
|------|------|------|
| API | `api/controller/`, `api/assembler/` | REST 端点、DTO 转换 |
| 应用 | `application/event/`, `application/category/`, `application/tag/` | 用例编排、重名校验 |
| 领域 | `domain/event/`, `domain/category/`, `domain/tag/`, `domain/notification/` | 业务实体与规则、读侧投影 |
| 基础设施 | `infrastructure/persistence/`, `infrastructure/config/`, `infrastructure/scheduled/`, `infrastructure/notification/` | 持久化、配置、调度、SSE |

## 测试矩阵

| 层 | 测试类 | 用例数 |
|---|--------|------|
| 领域 | `EventDomainServiceTest` | 13 |
| 应用 | `EventApplicationServiceTest` / `CategoryApplicationServiceTest` / `TagApplicationServiceTest` | 5 / 9 / 8 |
| 基础设施 | `EventRepositoryImplTest` / `SseEmitterManagerTest` / `BrowserNotificationServiceTest` / `ReminderSchedulerTest` | 13 / 5 / 5 / 7 |
| API | `EventControllerTest` / `CategoryControllerTest` / `EventAssemblerTest` | 5 / 4 / 7 |
| **合计** | 11 类 | **81** |

## 设计文档

- `docs/design/multi-user-auth.md` — 多用户登录方案（v3.0 规划，含 schema、JWT、SSE 改造、前端落地、风险评估）
