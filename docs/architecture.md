# 架构说明

## 整体架构

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (React 19)                     │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐  │
│  │ 日历模块   │ │ 通用 Shell │ │ Zustand   │ │ModuleReg  │  │
│  │Calendar  │ │ Sidebar   │ │ + RQuery  │ │ + EventBus│  │
│  └──────────┘ └───────────┘ └───────────┘ └───────────┘  │
│  core/ (基础设施) + modules/calendar/ (可插拔)             │
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
│   pets | pet_accessories | pet_interactions               │
│   tasks | task_tags                                       │
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
3. `EventRepositoryImpl.loadWithTags()`：
   - `EventMapper.selectByRange` 查 event 主表 LEFT JOIN category（含 keyword LIKE + user_id 过滤 + LIMIT/OFFSET 分页 + category_name/category_color）
   - **单次** `EventTagMapper.selectTagsByEventIds(allIds)` JOIN tag 表，避免 N+1
   - 按 `event_id` 分组回填 `Event.tags`（完整 name/color）及 `Event.categoryName`/`Event.categoryColor`
4. `EventAssembler.toResponse()` 使用 `Event.tags`、`Event.categoryName`、`Event.categoryColor` 输出完整响应

## 提醒通道（幂等）

```
Scheduler (30s fixedDelay, Clock-injected)
   │
   ├─ findUpcoming(now, now+1h)         读取设有 reminderMinutes 的事件
   │
   ├─ 跳过：!withinWindow(remindAt)      ±30s 触发窗口
   ├─ 跳过：alreadyReminded()             last_reminded_at >= remindAt 则幂等跳过
   │
   ├─ 分发：channels.forEach(send)      所有 NotificationChannel（按 userId 路由）
   └─ 标记已提醒：markReminded(id, now)  写入 last_reminded_at
```

`BrowserNotificationService` 通过 `SseEmitterManager.sendToUser` 按 userId 推送 SSE，前端 `useSseNotifications` 通过 `?token=` 查询参数传递 JWT，指数退避自动重连。

## 缓存

- **Caffeine 本地缓存**: 分类列表 (categories)、标签列表 (tags)，5 分钟过期
- **写操作驱逐**: create/update/delete 自动 `@CacheEvict`

## 项目结构（Monorepo）

```
daily-schedule/
├── package.json              # pnpm workspace 根（private）
├── pnpm-workspace.yaml       # workspace 包声明
├── turbo.json                # Turborepo 任务编排
├── .npmrc                    # pnpm 配置
├── pnpm-lock.yaml            # 依赖锁文件
│
├── backend/                  # Spring Boot 3.4 后端（Maven）
├── frontend/                 # React 19 Web 前端（Vite）
│   └── src/
│       ├── core/             # 核心基础设施（稳定、精简）
│       │   ├── lib/          # utils, unwrap, authInterceptor, eventBus, moduleRegistry
│       │   ├── store/        # authStore, settingsStore
│       │   ├── components/
│       │   │   ├── ui/       # shadcn/ui 基础组件 (button, dialog, input...)
│       │   │   └── layout/   # 通用布局容器 (TabbedDialog)
│       │   ├── hooks/        # useTheme, useNotification, useSseNotifications
│       │   └── styles/       # themes.css
│       ├── modules/          # 可插拔功能模块
│       │   ├── calendar/     # 日历模块
│       │   ├── pet/          # 宠物模块（核心差异化）
│       │   └── todo/         # 任务看板模块
│       │       ├── index.ts  # ModuleDefinition 导出
│       │       ├── routes.tsx
│       │       ├── components/ (HomePage, CalendarView, EventForm/Modal,
│       │       │                CalendarSidebar, ManagePanel)
│       │       ├── hooks/    (useEvents, useCategories, useTags, useKeyboardShortcuts)
│       │       ├── store/    (calendarStore)
│       │       └── lib/      (ics.ts)
│       ├── components/layout/ # 应用 Shell 布局 (AppShell, Sidebar, ShortcutsDialog...)
│       ├── pages/            # LoginPage
│       ├── lib/              # colors.ts (re-export 兼容层)
│       └── api/              # 自动生成的 API SDK
├── packages/
│   └── shared/               # @daily-schedule/shared — 跨平台共享库
│       └── src/              # 类型定义、EventBus、业务常量
├── docs/                     # 项目文档
└── specs/                    # API 契约 + 变更日志
```

**包管理器**: pnpm（workspace 协议），强制使用（`.npmrc` `engine-strict=true`）
**任务编排**: Turborepo — `turbo run build` 按依赖顺序构建（shared → frontend）
**共享库**: `@daily-schedule/shared` — 纯 TypeScript（无 React/DOM 依赖），供 Web + 未来小程序共用

## 事件总线 + 模块注册中心

模块间唯一通信方式——事件总线（`SystemEvent` 联合类型 + `EventBus` 类）：

```
模块 A (calendar)                模块 B (pet)
     │                                │
     │ emit('event:completed')        │ on('event:completed')
     │                                │
     └────────── EventBus ────────────┘
                     │
              packages/shared/src/eventBus.ts
```

- **SystemEvent**: 10 种事件类型（日程/任务/习惯/专注/用户）
- **EventBus**: 同步派发，定义在 shared 包中，frontend 创建单例 `core/lib/eventBus.ts`
- **ModuleRegistry**: 模块注册/注销/路由收集/petActions 收集，`core/lib/moduleRegistry.ts`
- **模块隔离**: 模块间不直接 import store/组件，只通过事件总线通信

## 后端模块结构（DDD 四层）

| 层 | 包路径 | 职责 |
|------|------|------|
| API | `api/controller/`, `api/assembler/`, `api/exception/` | REST 端点、DTO 转换、全局异常处理（7 个 Controller） |
| 应用 | `application/event/`, `application/category/`, `application/tag/`, `application/pet/`, `application/todo/`, `application/auth/` | 用例编排、重名校验、缓存注解 |
| 领域 | `domain/event/`, `domain/category/`, `domain/tag/`, `domain/user/`, `domain/pet/`, `domain/task/`, `domain/notification/` | 业务实体与规则（33+ 文件）、仓储接口 |
| 基础设施 | `infrastructure/persistence/`, `infrastructure/security/`, `infrastructure/config/`, `infrastructure/scheduled/`, `infrastructure/notification/` | 持久化、JWT/认证、缓存配置、调度、SSE |

## 前端模块架构（core + modules）

- **core/** — 稳定基础设施：authStore、settingsStore、EventBus、ModuleRegistry、UI 组件、共享 hooks、节日特效
- **modules/calendar/** — 日历模块：日历视图、事件管理、筛选、ICS 导出
- **modules/pet/** — 宠物模块（核心差异化）：自由游走、SVG 插画、情绪状态机、粒子特效、事件总线联动
- **modules/todo/** — 任务看板模块：三列看板 + 列表视图、拖拽排序、标签筛选
- **ModuleRegistry** — 模块注册/注销/路由收集，`main.tsx` 启动时注册
- **EventBus** — 同步事件总线，类型安全的 `SystemEvent` 联合类型（定义在 `@daily-schedule/shared`）
- **模块通信** — 模块间不直接 import store/组件，只通过事件总线通信

### 模块定义接口

```typescript
ModuleDefinition {
  id: string; name: string; icon: ComponentType;
  order: number; routes: RouteObject[];
  sidebarComponent?: ComponentType;  // 模块专属侧边栏
  petActions?: PetActionDefinition[];  // 宠物行为声明
}
```

## 测试

- **后端**: 37 个测试类，257 个用例，0 失败。H2 内存数据库（MySQL 兼容模式）。
- **前端**: 43 个测试文件，166 个用例，0 失败。vitest + jsdom。
- **E2E**: 8 条 Playwright 用例（auth/calendar/task/pet），CI 集成。webServer 复用后台启动的后端 + 自动启动前端 Vite。
- **CI**: GitHub Actions 四道门禁 — 版本检查 → 后端 mvn test → 前端 lint → test → build（含 SDK freshness）
- **运行**: `cd backend && mvn test` / `cd frontend && pnpm run test`

## 容器化部署

```bash
docker-compose up -d   # MySQL 8.0 + 后端 8080 + 前端 :5173
```

## 设计文档

- `specs/openapi.yaml` — API 契约（唯一真相源）
- `openspec/specs/` — 50 个能力规格文档
- `docs/planning/execution-plan.md` — 产品愿景与路线图（规划）
