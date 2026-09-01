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
│   pets | pet_accessories（FOOD+ACCESSORY 种子）           │
│   pet_rewards | tasks | task_tags                         │
│   event.last_reminded_at（幂等标记）                       │
└──────────────────────────────────────────────────────────┘
```

## 认证与安全

- **JWT 无状态认证**: Spring Security + `JwtAuthFilter`，除 `/auth/**` 外所有 `/api/v1/**` 需认证
- **注册/登录**: `POST /api/v1/auth/register` 与 `POST /api/v1/auth/login`
- **微信小程序登录**: `POST /api/v1/auth/wechat-login`（wx.login code → openid → 静默登录/注册，返回同构 `LoginResponse`）——`WechatClient`（RestClient）调 jscode2session，appid/secret 环境变量注入；code 无效（errcode 40029）→ 400，其余上游错误 → 502
- **密码**: BCrypt 加密存储（微信用户 password_hash 为随机哈希，不可密码登录；`user.openid` 唯一索引关联微信账号）
- **数据隔离**: 所有业务表含 `user_id`，查询强制按当前用户过滤
- **前端**: token 存 localStorage，`core/lib/authInterceptor.ts`（main.tsx 启动时注册到 hey-api 客户端）自动附加 `Authorization: Bearer` 头；小程序侧 `apps/miniprogram/src/lib/auth.ts` 独立实现（Taro.login → wechat-login → Storage 持久化），业务请求经 `lib/api.ts` 统一注入 Bearer（401 清态 + 静默重登，日历月视图与任务列表均已消费该链路）

## 响应契约

- **成功响应**直接返回业务数据：单条对象 / 列表数组；HTTP 状态码承载语义（200/201/204）。
- **错误响应**统一为 `ApiResponse { code, message }`（400/401/403/404/409/500）。
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

`BrowserNotificationService` 通过 `SseEmitterManager.sendToUser` 按 userId 推送 SSE，前端 `useSseNotifications` 依赖登录时下发的 `dsa_sse_session` HttpOnly Cookie 自动认证（v3.0+ 不再使用 `?token=` 查询参数），指数退避自动重连。

## 宠物经济闭环（v3.4）

```
任务 moveTask（非 DONE → DONE）──┐
日程 update（非 COMPLETED → COMPLETED）──┤   同事务
日程 delete（非 COMPLETED）──负面───────┼──▶ PetApplicationService.grantReward(source, refId)
习惯/专注/签到（前端事件桥接）──▶ POST /pets/me/rewards ─┘
                                                          │
                    幂等检查 pet_rewards UNIQUE(pet_id, source, ref_id)
                    命中/无宠物 → granted=false（静默，不阻断主流程）
                    未命中 → PetDomainService.grant（RewardSource 数值）→ Pet.applyInteraction（钳制/等级）→ 记录发放
```

- **数值唯一来源**: `RewardSource` 枚举（TASK +10币/+20经验、EVENT +20/+30、FOCUS +5/+10、CHECKIN +15/+10、HABIT +5/+10、取消 -10 心情）
- **幂等**: `pet_rewards` 表唯一键在数据库层防重复刷币（状态来回切换仅首次发放）
- **仓储端口**: `PetAccessoryRepository` / `PetInteractionRepository` / `PetRewardRepository`（v3.4 补齐，PetApplicationService 不再直连 Mapper）
- **前端**: `petEventBridge` 监听 habit:checked / focus:completed / user:dailyCheckin → 奖励 API（Phase 2 习惯/专注模块预留）；任务/日程完成事件 invalidate 宠物查询即时刷新专注币

## 宠物装扮系统（v3.5）

```
购买（purchase，按 type 分流）
├─ FOOD      → PetDomainService.purchase → applyInteraction（钳制）  即时消费
└─ ACCESSORY → 校验 quantity==1 → Pet.currentAccessory = itemId      购买即装备（覆盖）
取下（DELETE /pets/me/accessory）→ PetRepository.clearCurrentAccessory（显式 SET NULL，幂等）
渲染 → SvgAvatar(accessory 名称) → accessoryRenderMap 映射
       ├─ 叠加层类（帽/角/耳/发饰/背包）→ AccessoryOverlay 同 viewBox SVG 叠放
       └─ 皮肤类 → 基础插画 CSS filter 近似（年兽红调/玉兔白亮/印度象灰调）
```

- **种子**: V8 迁移 11 个 ACCESSORY 物品，名称与 `shared/holiday/themeMapping.petAccessory` 逐一对齐（价格档位 30-80）
- **数值钳制唯一实现点**: `Pet.applyInteraction`（购买/奖励/互动三路径共用，线1 O8 收尾）
- **全场景生效**: RoamingPet / PetPage / SidebarPet 均经 useEquippedAccessoryName 解析当前配饰
- **明确不做**: 节日自动穿戴（需库存概念，M2.4）；皮肤逐图层重绘（filter 近似）

## 宠物状态持久化（v3.5.1）

- `petStore` 接入 zustand `persist` 中间件（localStorage key `pet-roaming-state`，version 1）：白名单 `{ position, facing, isResting, emotionState }`——刷新后位置/朝向/休息态/稳定情绪恢复，陪伴感不中断
- **情绪归一**：仅稳定情绪（idle/idle_variant/hungry/sleepy）落盘，瞬态情绪（happy/sad/excited/surprised）写入时归一 idle（刷新后不残留）
- **恢复钳制**：rehydrate 时 position 按视口（-90px 宠物尺寸）钳制，窗口缩放后宠物仍可见
- **瞬态不落盘**：action/粒子/气泡/连击/定时器句柄不进序列化，刷新回默认
- 后端数值状态（mood/hunger/coins）仍由 pets 表 + 30s 轮询承载，localStorage 仅存游走陪伴态

## 缓存

- **Caffeine 本地缓存**: 分类列表 (categories)、标签列表 (tags)，5 分钟过期（`spring.cache.type=caffeine` 主配置声明），缓存键按 userId 隔离
- **写操作驱逐**: create/update/delete 按 userId 精确 `@CacheEvict`（不跨用户清空）；测试环境（H2）禁用缓存（`spring.cache.type=none`）
- **CORS 单轨**: `SecurityConfig` 的 `CorsConfigurationSource` 读取 `cors.allowed-origin-patterns`（默认 `http://localhost:*`，prod 由 `CORS_ORIGINS` 环境变量注入）

## 可观测性与监控

- **日志**: `logback-spring.xml` —— prod 滚动文件（`logs/daily-schedule.log` 按天滚动、保留 7 天），dev/test 控制台；pattern 含 requestId（MDC）；业务包 INFO 分级
- **request-id 全链路**: `RequestIdFilter`（Security 链之前）解析/生成 `X-Request-Id` → MDC → 响应头回写 → finally 清理；`GlobalExceptionHandler` 错误响应 message 携带 `（requestId: xxx）` 后缀，凭响应可检索日志
- **入口与安全日志**: 7 个 Controller 入口 INFO 日志（敏感字段不入日志）；认证失败 WARN（请求路径）
- **探活**: Actuator 仅暴露 `health` 端点（`SecurityConfig` 显式放行 `/actuator/health`）；docker-compose backend healthcheck 周期探测
- **调度线程池**: `ScheduleConfig` 的 `TaskScheduler`（pool 2，`scheduler-` 前缀）——提醒扫描与宠物衰减独立线程互不阻塞

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
├── apps/
│   └── miniprogram/          # 微信小程序（Taro 4.2 + React 18 + NutUI，Phase 2 M2.1-2.2）
│       ├── config/           # Taro 编译配置（webpack5、designWidth 750）
│       ├── src/              # app + 页面（TabBar：首页/日历/任务/宠物/我的）+ lib/（auth 登录库 + 业务数据层）+ __tests__（vitest 纯逻辑）
│       └── types/            # 全局类型声明
├── packages/
│   └── shared/               # @daily-schedule/shared — 跨平台共享库
│       └── src/              # 类型定义、EventBus、业务常量、
│                             #   holiday/（节日引擎）、pet/（游走引擎）
├── docs/                     # 项目文档
└── specs/                    # API 契约 + 变更日志
```

**包管理器**: pnpm（workspace 协议），强制使用（`.npmrc` `engine-strict=true`）
**任务编排**: Turborepo — `turbo run build` 按依赖顺序构建（shared → frontend / miniprogram）；`turbo run verify` 覆盖全部包 lint + build + test
**共享库**: `@daily-schedule/shared` — 纯 TypeScript（无 React/DOM 依赖），Web 与小程序共用（小程序侧复用 holiday/pet 引擎已由 miniprogram-foundation 验证）

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
| 领域 | `domain/event/`, `domain/category/`, `domain/tag/`, `domain/user/`, `domain/pet/`, `domain/task/`, `domain/notification/` | 业务实体与规则（35 个文件，`<!-- DOCS-CHECK: domain-files=35 -->`）、仓储接口 |
| 基础设施 | `infrastructure/persistence/`, `infrastructure/security/`, `infrastructure/config/`, `infrastructure/scheduled/`, `infrastructure/notification/` | 持久化、JWT/认证、缓存配置、调度、SSE |

## 前端模块架构（core + modules）

- **core/** — 稳定基础设施：authStore、settingsStore、EventBus、ModuleRegistry、UI 组件、共享 hooks、节日特效
- **modules/calendar/** — 日历模块：日历视图、事件管理、筛选、ICS 导出
- **modules/pet/** — 宠物模块（核心差异化）：自由游走、昼夜节律（夜间回窝/早晨唤醒/午后小憩/深夜提示）、SVG 插画、情绪状态机、动作动画层（eat 进食/小动作 stretch/yawn/scratch/look/情绪眨眼过渡）、粒子特效、事件总线联动
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

- **后端**: 45 个测试类，342 个用例，0 失败。H2 内存数据库（MySQL 兼容模式）。`<!-- DOCS-CHECK: backend-test-classes=45 -->`
- **前端**: 51 个测试文件，267 个用例，0 失败。vitest + jsdom。`<!-- DOCS-CHECK: frontend-test-files=51 -->`
- **小程序**: 7 个测试文件，83 个用例（vitest 纯逻辑——shared 跨端复用回归 + wechat-auth 登录响应解析 + miniprogram-calendar 日期纯函数/数据层/请求封装 + miniprogram-todo 任务数据层分组/校验/四函数请求路径 + miniprogram-pet 宠物数据层校验/换算纯函数/三函数请求路径与 404 业务态）。Taro 组件渲染级测试待业务变更引入
- **E2E**: 13 个 spec 文件，57 条 Playwright 用例（auth/calendar/task/pet），CI 集成。webServer 复用后台启动的后端 + 自动启动前端 Vite。`<!-- DOCS-CHECK: e2e-files=13 -->`
- **CI**: GitHub Actions — version-check（版本 + 文档一致性）→ openspec-validation（OpenSpec 一致性：validate --all --strict + doctor + 主 spec 无 delta 头 + CLI 版本=CLAUDE.md 声明 + 归档完整性 validate --archived + test-plan 内容门禁（活动变更场景↔行映射 / 归档无残留 🔴）+ CLAUDE.md 序列一致性守卫（工件序列声明↔schema 链））→ backend mvn test → frontend lint → test → build（含 SDK freshness）四道阻断门禁 + E2E（`continue-on-error` 软性，不阻断）
- **运行**: `cd backend && mvn test` / `cd frontend && pnpm run test`

## 容器化部署

```bash
docker-compose up -d   # MySQL 8.0 + 后端 8080 + 前端 :5173
```

## 设计文档

- `specs/openapi.yaml` — API 契约（唯一真相源）
- `openspec/specs/` — 69 个能力规格文档（`<!-- DOCS-CHECK: specs-count=69 -->`）
- `docs/planning/execution-plan.md` — 产品愿景与路线图（规划）
- OpenSpec 指令体系分层 — 机制层（`.dsh`/`.claude` 技能命令，CLI 版本钉住，随升级经 `openspec update` 重生成）/ 指令层（`openspec instructions` 动态指引，来源 schema + config.yaml）/ 文档层（`CLAUDE.md` 仅承载 CLI 不可表达约定）；详见 `openspec-conventions` 主 spec「指令体系分层与收敛」

## 交互式架构图（Archify）

自包含 HTML 图（浏览器直接打开，支持暗/亮主题、缩放、聚焦与 PNG/SVG/WebM 导出；候选规格在 `docs/diagrams/_drafts/`）：

| 图 | 说明 |
|----|------|
| [architecture-overview.html](diagrams/architecture-overview.html) | 整体系统架构：Web / 小程序 → Spring Boot DDD 四层 → MySQL（含 SSE 通道、共享层、外部依赖） |
| [frontend-module-platform.html](diagrams/frontend-module-platform.html) | 前端插件式模块平台：core + modules + ModuleRegistry / EventBus 边界（模块间禁止直接 import） |
| [pet-economy.html](diagrams/pet-economy.html) | 宠物经济闭环：行为触发 → RewardSource 数值 → 幂等闸门 grantReward → 发放 → 落库 → 前端反馈 |
| [contract-pipeline.html](diagrams/contract-pipeline.html) | 契约驱动 API 管道：openapi.yaml → 后端生成（编译期强制）→ 前端 SDK → freshness / 版本 / OpenSpec 门禁 |
| [sse-reminder-sequence.html](diagrams/sse-reminder-sequence.html) | SSE 提醒推送时序（与 `docs/uml/README.md` 交互式图同源） |

领域模型 ER / EventStatus 生命周期 / 宠物情绪状态机见 `docs/uml/README.md` 交互式图段。
