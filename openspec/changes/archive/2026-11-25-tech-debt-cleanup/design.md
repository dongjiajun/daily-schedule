# Design: tech-debt-cleanup

## Context
项目当前版本为 `v3.5.1`，已完成 Phase 0/1 与 Phase 2 前 5 项小程序任务及设计系统基建。在全面审计中发现五类技术债：
1. 后端配置与测试基线漂移（`application.yml` 顶层 `flyway:`、`schema-h2.sql` 缺 V3 列、`pom.xml` 残留 `mapstruct`、`PetDomainService.decay` 未注入 `Clock`、`AuthController` 双 `Set-Cookie` 头、`PetApplicationService` 注释不准）。
2. 后端行为与 OpenAPI 契约偏差（分类/标签重名抛 `IllegalArgumentException` 返回 400 而非 409；`SseEmitterManager` 缺少契约声明的 `connect` 握手和 `heartbeat` 心跳）。
3. 前端跨模块耦合与硬编码残留（`App`/`AppShell`/`ShortcutsDialog`/`settingsStore` 反向导入 `modules/calendar`；`AppShell`/`Sidebar` 硬编码导入 `modules/pet`；`CalendarView` 直接导入 `modules/pet/lib/zoneRegistry`；`PetPage`/`ManagePanel`/`OnboardingGuide` 残留 `bg-white`/`bg-black/40`；`frontend/package.json` 残留未使用依赖）。
4. 小程序与 CI 缺口（`pages/pet` 缺 `index.config.ts` 且弹跳/反馈定时器未在卸载时清理；CI 未运行小程序 `verify`）。
5. Docker 容器化滞后（`backend/Dockerfile` 越出构建上下文、`frontend/Dockerfile` 停留在旧 `npm ci` 单仓结构、`docker-compose.yml` 环境变量与 `application-prod.yml` 不匹配、`.env.example` 缺省必要生产变量）。

约束：API 契约 `specs/openapi.yaml` 保持 v3.5.1 不变；`user_id` 数据隔离保持不变；`docs-check` / `ui-check` / `openspec-check` 必须全部通过。

## Goals / Non-Goals

**Goals:**
- 修复后端配置/测试基线漂移并让后端 409/SSE/Cookie 行为严格对齐 `specs/openapi.yaml`。
- 彻底消除前端 `core/` / `components/layout/` / `App.tsx` 与 `modules/` 间的直接依赖，并用自动化单元测试锁死模块边界。
- 消除业务代码中的 `bg-white`/`bg-black` 硬编码并在 `ui:check` 中长期拦截。
- 修复小程序 `pet` 页配置与定时器生命周期，并将小程序纳入 CI 阻断门禁。
- 修复基于根上下文的 Docker 多阶段构建与 Nginx SSE 代理，并同步所有相关文档。

**Non-Goals:**
- 不改变 API 契约版本号（保持 v3.5.1），不新增数据库表或 Flyway 迁移脚本。
- 不修改现有 `specs/openapi.yaml` schema 结构或破坏现有 E2E 行为。
- 不重构 `PetPage` / `ManagePanel` 的业务交互逻辑或开展 Phase 2 新功能开发（`subscribe-message` / `habit-*`）。

## Decisions

### Decision 1: 分类与标签重名统一映射 HTTP 409
- **选择**: `CategoryApplicationService` 与 `TagApplicationService` 的 `existsByName` / `existsByNameExcludingId` 冲突改抛 `BusinessException`（复用 `GlobalExceptionHandler` 的 409 映射），空白/非法名称保留 `IllegalArgumentException`（400）。
- **理由**: `specs/openapi.yaml` 与 `docs/api/overview.md` 明确规定分类/标签创建和更新重名返回 409；`BusinessException` 已是项目内标准 409 异常。
- **备选方案**: 新增专用 `DuplicateResourceException` — 否定，多一个冗余异常类且与既有 `BusinessException` 重复。

### Decision 2: SSE 握手与定时心跳 + 调度线程池扩容
- **选择**: `SseEmitterManager.register(userId)` 在加入集合后即发送 `connect` / `"connected"` 事件；新增 `@Scheduled(fixedRateString = "${sse.heartbeat.intervalMs:30000}") sendHeartbeat()` 向全部活跃连接广播 `heartbeat` / `"ping"`；发送或心跳遇 `IOException` 统一调 `remove(userId, emitter)` 清理空桶；`ScheduleConfig.taskScheduler` 池大小从 2 扩至 3。
- **理由**: 对齐 `specs/openapi.yaml` `/sse/notifications` 契约，避免代理（Nginx 等）长时间无流量断连，并在单连接断开后及时释放服务端内存；3 个并发调度任务（提醒/衰减/心跳）各占独立线程互不阻塞。
- **备选方案**: 在 `SseController` 手动发送 `connect` 且不加心跳 — 否定，连接异常清理逻辑与测试内聚在 `SseEmitterManager` 更合理且可单测。

### Decision 3: 单一 ResponseCookie + app.cookie.secure 配置化
- **选择**: `AuthController.setSseCookie` / `clearSseCookie` 改用 Spring `ResponseCookie` 生成标准 `Set-Cookie` 头字符串（移除 `resp.addCookie(c)`），`Secure` 标志由 `@Value("${app.cookie.secure:false}")` 注入，并在 `application-prod.yml` 通过 `${COOKIE_SECURE:false}` 暴露。
- **理由**: 原实现同时调 `addCookie` 与 `addHeader("Set-Cookie", ...)` 导致响应发两条重复 `Set-Cookie`；单条 `ResponseCookie` 保留 `SameSite=Lax` 且支持 HTTPS 生产部署。
- **备选方案**: 仅移除 `addHeader` 保留 `Servlet Cookie` — 否定，Jakarta Cookie API 对 `SameSite` 属性支持不如 `ResponseCookie` 显式统一。

### Decision 4: 前端模块解耦（shellStore + zoneRegistry 上提 + ModuleDefinition Shell 槽位）
- **选择**:
  1. 将 `CalendarView` 类型定义迁入 `core/store/settingsStore.ts`（`calendarStore.ts` re-export 兼容）。
  2. 新建 `core/store/shellStore.ts` 承接 `showOnboarding` / `showShortcuts` / `sidebarOpen`。
  3. 将 `zoneRegistry.ts` 从 `modules/pet/lib/` 迁至 `core/lib/zoneRegistry.ts` 供 `CalendarView` 与 `pet` 共同依赖。
  4. `ModuleDefinition` 增加 `globalOverlayComponent` 与 `sidebarFooterComponent`，`petModule` 声明 `RoamingPet` 与 `SidebarPet`，`AppShell` 与 `Sidebar` 通过 `moduleRegistry` 动态渲染，不再直接 import `modules/pet/`。
  5. 新增 `moduleBoundary.test.ts` 在 vitest 中静态守卫 `import` 方向。
- **理由**: 严格兑现 `docs/architecture.md` 规定的「core + 可插拔 modules、禁止跨模块直接 import」边界，日后禁用某模块（如 `VITE_USE_MODULE_CALENDAR=false` 或关闭宠物模块）不会引发编译或运行时崩溃。
- **备选方案**: 保留硬编码 import 只写注释说明 — 否定，技术债会继续扩散。

### Decision 5: Docker 根上下文构建与 `.dockerignore`
- **选择**: `docker-compose.yml` 中 `backend` 与 `frontend` 构建上下文统一改为仓库根 `.`，分别通过 `backend/Dockerfile` 与 `frontend/Dockerfile` 进行多阶段构建（`backend` 拷贝 `specs/openapi.yaml`；`frontend` 使用 pnpm workspace 过滤安装并先构建 `@daily-schedule/shared`）；`frontend/nginx.conf` 新增 `/api/v1/sse/` `proxy_buffering off` 块；补充 `application-prod.yml` 实际读取的 `DB_HOST`/`DB_NAME`/`DB_USER`/`CORS_ORIGINS`/`COOKIE_SECURE`/`WECHAT_APP_*` 环境变量。
- **理由**: 根目录上下文才能合法访问 `specs/`、`pnpm-workspace.yaml` 与 `packages/shared/`，避免 Docker `COPY ../specs` 报错与 `npm ci` 找不到 `package-lock.json`。
- **备选方案**: 在子目录复制构建产物或引入脚本预拷贝 — 否定，易飘移且违背单源原则。

## DDD Layer Design

### 领域层 (domain/)
- `domain/pet/PetDomainService`: 构造注入 `java.time.Clock`（保留无参构造委托上海时区时钟，兼容既有直接 `new PetDomainService()` 单测），`decay()` 使用 `LocalDateTime.now(clock)`。

### 基础设施层 (infrastructure/)
- `infrastructure/config/ScheduleConfig`: `ThreadPoolTaskScheduler.setPoolSize(3)`。
- `infrastructure/notification/SseEmitterManager`: `register()` 推 `connect`，新增 `@Scheduled sendHeartbeat()` 推 `heartbeat`，`sendToUser()` 与 `sendHeartbeat()` 失败均调用 `remove(userId, emitter)`。
- `application.yml`: `flyway:` 归位 `spring.flyway:`；`application-prod.yml`: 增加 `app.cookie.secure: ${COOKIE_SECURE:false}`。
- `schema-h2.sql`: 补齐 V3 `user` 字段与业务表索引。

### 应用层 (application/)
- `CategoryApplicationService` / `TagApplicationService`: 重名检查抛 `BusinessException`。
- `PetApplicationService`: 修正默认食物选择注释。

### API 层 (api/)
- `AuthController`: 单一 `ResponseCookie` + `@Value("${app.cookie.secure:false}")`。

### 前端 (frontend/src/) & 小程序 (apps/miniprogram/)
- `core/store/{shellStore,settingsStore}.ts`、`core/lib/{moduleRegistry,zoneRegistry}.ts`、`components/layout/{AppShell,Sidebar,ShortcutsDialog,OnboardingGuide}.tsx`、`App.tsx`、`modules/calendar/**`、`modules/pet/**`。
- 清理 `frontend/package.json` 4 个未使用依赖，更新 `pnpm-lock.yaml`。
- 小程序补齐 `apps/miniprogram/src/pages/pet/index.config.ts` 并在 `index.tsx` 全量清理定时器。

## API Design
- `POST /api/v1/categories`、`PUT /api/v1/categories/{id}`、`POST /api/v1/tags`、`PUT /api/v1/tags/{id}`：重名返回 `409 Conflict`（`ModelApiResponse { code: 409, message }`），与 `specs/openapi.yaml` 完全一致。
- `GET /api/v1/sse/notifications`：建连发 `connect` (`"connected"`)，周期 30s 发 `heartbeat` (`"ping"`)，提醒发 `reminder` (`ReminderEvent`)，与 `specs/openapi.yaml` 完全一致。
- `POST /api/v1/auth/{login,register,refresh,logout}`：单条 `Set-Cookie: dsa_sse_session=...; Path=/api/v1/sse; HttpOnly; SameSite=Lax`。
- 无需重新生成前后端 SDK。

## Database Design
- 无新增 Flyway 迁移脚本（维持 `V1`–`V10`）。
- 同步测试用 `backend/src/test/resources/schema-h2.sql`：为 `user` 补充 `email`、`display_name`、`avatar_url`、`status`、`last_login_at` 与 `uk_user_email`；补充 `uk_category_user_name`、`uk_tag_user_name`、`idx_event_user_time`。

## Risks / Trade-offs
- [分类/标签重名从 400 变为 409] → 检查现有前端/E2E 均未写死 400 状态码，统一经 `unwrap()` 透传后端 `message`，行为更符合 REST 语义。
- [`SseEmitterManager` 在 `register()` 同步发送 `connect` 可能导致测试中 Mock `SseEmitter` 交互变化] → `register()` 内部 `new SseEmitter(0L)` 并包裹 `IOException` 捕获；新增单测覆盖异常分支。
- [`PetPage.tsx` 由 `bg-white` 改为 `bg-surface` 可能改变宠物页截图像素] → 交付阶段明确提醒用户本地运行 `pnpm run test:visual -- --update-snapshots` 更新 `@visual` 截图基线（CI 本身排除 `@visual`）。
- [移除 `axios`/`cmdk`/`@rive-app/react-canvas`/`lottie-react` 可能存在未察觉引用] → 已全库 grep 验证零源码引用，且将执行全量 `pnpm run verify` 确认构建与测试无误。

## Review Checklist
- [x] 失败路径是否覆盖？（分类/标签 409 冲突与 400 空白校验、SSE 握手/心跳 `IOException` 自动清理与空桶回收、Docker prod 缺少 `DB_PASSWORD` 时有安全默认值且 `COOKIE_SECURE` 可切换、`ui:check` 拦截 `bg-white`/`bg-black` 失败路径、`moduleBoundary.test.ts` 边界违规检测）
- [x] 回滚/降级方案是什么？（全部改动按单个 OpenSpec 变更提交，无破坏性 DB 变更或不可逆迁移；可整笔 `git revert`，且 `spring.flyway` 在既有库上 `baseline-on-migrate: true` 不会触发重复建表）
- [x] 契约/DB 兼容性影响？（`specs/openapi.yaml` v3.5.1 零破坏变更，后端实现向既有 OpenAPI 契约收敛；数据库表结构在生产 MySQL 上零改动，`schema-h2.sql` 向既有 V1–V10 对齐）

## Migration Plan
1. 在 `tech-debt-cleanup` 变更内按 DDD 分层顺序逐项实施并翻转 `test-plan.md` 与 `tasks.md`。
2. `cd backend && mvn test` 验证后端全部测试通过。
3. 根目运行 `pnpm install`（更新 lockfile）与 `pnpm run verify`（覆盖 shared/frontend/miniprogram）。
4. 运行 `node scripts/ui-check.mjs --self-test`、`pnpm run ui:check`、`pnpm run docs:check`、`./scripts/sync-version.sh --check`、`pnpm run openspec:check`。
5. 若使用 Docker 部署，运行 `docker compose build && docker compose up -d` 使用新根上下文重建镜像。

## Open Questions
- 无阻塞问题；`PetPage.tsx` 替换 `bg-white` 为 `bg-surface` 后的 `@visual` 截图基线将在用户本地环境由 `pnpm run test:visual -- --update-snapshots` 确认更新。
