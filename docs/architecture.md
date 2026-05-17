# 架构说明

## 整体架构

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (React 19)                     │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐  │
│  │ Calendar  │ │ EventForm │ │ Sidebar   │ │ Zustand   │  │
│  │ (DnD)    │ │ + Modal   │ │ + Search  │ │ + RQuery  │  │
│  └──────────┘ └──────────┘ └───────────┘ └───────────┘  │
│  shadcn/ui + Framer Motion + sonner Toast                 │
└───────────────────────┬──────────────────────────────────┘
                        │ REST / SSE (JWT Bearer auth)
┌───────────────────────▼──────────────────────────────────┐
│              Spring Boot 3.4 (Java 21)                    │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ API 层 — Controller + DTO + Assembler              │   │
│  │ 实现 generated/api/ 接口，编译期强制契约同步        │   │
│  └─────────────────────┬─────────────────────────────┘   │
│                        │                                  │
│  ┌─────────────────────▼─────────────────────────────┐   │
│  │ 应用层 — ApplicationService                        │   │
│  │ 业务流程编排、事务管理、参数校验、重名校验          │   │
│  └─────────────────────┬─────────────────────────────┘   │
│                        │                                  │
│  ┌─────────────────────▼─────────────────────────────┐   │
│  │ 领域层 — Entity + DomainService + Repository 接口   │   │
│  │ 纯 POJO，封装核心业务规则与读路径投影               │   │
│  └─────────────────────▲─────────────────────────────┘   │
│                        │                                  │
│  ┌─────────────────────┴─────────────────────────────┐   │
│  │ 基础设施层 — Repository Impl + PO + Mapper         │   │
│  │ MyBatis-Plus、Flyway、Security/JWT、缓存、SSE       │   │
│  └───────────────────────────────────────────────────┘   │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│                  MySQL 8.0 (InnoDB)                       │
│   user | category | tag | event | event_tag               │
│   event.last_reminded_at（幂等标记）                       │
└──────────────────────────────────────────────────────────┘
```

## 认证与安全

- **JWT 无状态认证**: Spring Security + `JwtAuthFilter`，除 `/auth/**` 外所有 `/api/v1/**` 需认证
- **注册/登录**: `POST /api/v1/auth/register` 与 `POST /api/v1/auth/login`
- **密码**: BCrypt 加密存储
- **数据隔离**: 所有业务表含 `user_id`，查询强制按当前用户过滤
- **前端**: token 存 localStorage，`client.gen.ts` 自动附加 `Authorization: Bearer` 头

## 响应契约（v1.1）

- **成功响应**直接返回业务数据：单条对象 / 列表数组；HTTP 状态码承载语义（200/201/204）。
- **错误响应**统一为 `ApiResponse { code, message }`（400/404/500）。
- **SSE 通道** `/api/v1/sse/notifications` 已纳入 OpenAPI 契约；命名事件 `connect` / `reminder` / `heartbeat`，`reminder.data` 为 `ReminderEvent` JSON。
- 变更历史与版本号管理见 `specs/CHANGELOG.md`。

## 数据流示例：创建日程

1. Browser `POST /api/v1/events`（携带 JWT）→ `JwtAuthFilter` 解析 userId
2. Controller 接收生成的 `EventCreateRequest` DTO，注入 userId
3. `EventAssembler.toDomain()` 转换 DTO → 领域 `Event`
4. `EventApplicationService.create()` → `isValid()` + `hasTimeConflict()` → `save()`
5. `EventRepositoryImpl.save()` 转换 Event → EventPO → MyBatis-Plus insert，批量写回 `event_tag` 关联
6. `EventAssembler.toResponse(saved)` 直接返回 `EventResponse`（含完整 tag 信息）

## 数据流示例：查询日程（含标签详情）

1. Browser `GET /api/v1/events?start=&end=&keyword=&page=&size=` → `EventController.listEvents()`
2. `EventApplicationService.listByRange()` → `EventRepository.findByRange()`
3. `EventRepositoryImpl.enrichWithTags()`：
   - `EventMapper.selectByRange` 查 event 主表（含 keyword LIKE + user_id 过滤 + LIMIT/OFFSET 分页）
   - **单次** `EventTagMapper.selectByEventIds(allIds)` JOIN tag 表，避免 N+1
   - 按 `event_id` 分组回填 `Event.tagMap`（完整 name/color）
4. `EventAssembler.toResponse()` 使用 `Event.tagMap` 输出完整 `TagResponse[]`

## 提醒通道（幂等）

```
Scheduler (30s fixedDelay, Clock-injected)
   │
   ├─ findUpcoming(now, now+1h)         读取设有 reminderMinutes 的事件
   │
   ├─ 跳过：!withinWindow(remindAt)      ±35s 触发窗口
   ├─ 跳过：sentReminders 去重           key = eventId + remindAt
   │
   ├─ 分发：channels.forEach(send)      所有 NotificationChannel
   └─ 幂等写回（去重 Set 定期清理）
```

`BrowserNotificationService` 通过 `SseEmitterManager.sendToAll` 广播 SSE，前端 `useSseNotifications` 指数退避自动重连。

## 缓存

- **Caffeine 本地缓存**: 分类列表 (categories)、标签列表 (tags)，5 分钟过期
- **写操作驱逐**: create/update/delete 自动 `@CacheEvict`

## 模块结构

| 模块 | 路径 | 职责 |
|------|------|------|
| API | `api/controller/`, `api/assembler/`, `api/exception/` | REST 端点、DTO 转换、全局异常处理 |
| 应用 | `application/event/`, `application/category/`, `application/tag/` | 用例编排、重名校验、缓存注解 |
| 领域 | `domain/event/`, `domain/category/`, `domain/tag/`, `domain/user/`, `domain/notification/` | 业务实体与规则、读侧投影、仓储接口 |
| 基础设施 | `infrastructure/persistence/`, `infrastructure/security/`, `infrastructure/config/`, `infrastructure/scheduled/`, `infrastructure/notification/` | 持久化、JWT/认证、缓存配置、调度、SSE |

## 测试矩阵

| 层 | 测试类 | 用例数 |
|---|--------|------|
| 领域 | `EventDomainServiceTest` | 5 |
| 应用 | `EventApplicationServiceTest` / `CategoryApplicationServiceTest` / `TagApplicationServiceTest` | 5 / 4 / 4 |
| 基础设施 | `EventRepositoryImplTest` / `SseEmitterManagerTest` / `BrowserNotificationServiceTest` / `ReminderSchedulerTest` | 5 / 1 / 1 / 1 |
| API | `EventControllerTest` / `CategoryControllerTest` / `EventAssemblerTest` | 5 / 4 / 3 |
| **合计** | 11 类 | **38** |

## 容器化部署

```bash
docker-compose up -d   # MySQL 8.0 + 后端 8080 + 前端 :5173
```

## 设计文档

- `docs/design/multi-user-auth.md` — 多用户登录方案（已实现）
