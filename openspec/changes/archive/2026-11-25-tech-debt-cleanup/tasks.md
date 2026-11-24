# Tasks: tech-debt-cleanup

<!--
  按 DDD 分层编排，严格保持 1–9 固定分组。
  每步完成即勾选，同时按红绿纪律将 test-plan.md 中对应场景从 🔴 翻为 🟢。
-->

## 1. 数据库迁移
- [x] 1.1 修复 `backend/src/main/resources/application.yml` 中 `flyway:` 缩进至 `spring.flyway:`（无新增 `V*` 脚本，保持 V1–V10）
- [x] 1.2 同步 `backend/src/test/resources/schema-h2.sql`：`user` 表补齐 V3 列（`email`/`display_name`/`avatar_url`/`status`/`last_login_at`）与 `uk_user_email` 索引，并补齐 `uk_category_user_name`/`uk_tag_user_name`/`idx_event_user_time`
- [x] 1.3 清理 `backend/pom.xml` 中未使用的 `mapstruct` 依赖、annotationProcessorPath、`mapstruct.version` 与 `mysql.version` 属性

## 2. 领域层 (domain/)
- [x] 2.1 `PetDomainService` 注入 `java.time.Clock`（保留无参构造兼容），`decay()` 使用 `LocalDateTime.now(clock)`
- [x] 2.2 更新 `PetDomainServiceTest` 新增 `Clock.fixed` 确定性衰减单测

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 `ScheduleConfig.taskScheduler()` 线程池大小从 `2` 调为 `3`（提醒/衰减/SSE 心跳），同步更新 `ScheduleConfigTest`
- [x] 3.2 `SseEmitterManager` 补齐 `register()` 握手事件 `connect`（`"connected"`）、`@Scheduled` 30s `heartbeat`（`"ping"`）及 `sendToUser`/`sendHeartbeat` 遇 `IOException` 清理失效连接与空用户桶
- [x] 3.3 更新 `SseEmitterManagerTest` 覆盖握手推送、多用户心跳广播与 `IOException` 自动清理

## 4. 应用层 (application/)
- [x] 4.1 `CategoryApplicationService` 与 `TagApplicationService` 重名创建/更新校验改抛 `BusinessException`（映射 409），空白名称保持 `IllegalArgumentException`（400）
- [x] 4.2 修正 `PetApplicationService.interact()` 默认食物注释为「第一个 FOOD 物品（小鱼干，按 id 升序）」
- [x] 4.3 更新 `CategoryApplicationServiceTest` 与 `TagApplicationServiceTest` 覆盖重名 `BusinessException` 用例

## 5. API 层 (api/)
- [x] 5.1 `AuthController` 改用单一 Spring `ResponseCookie` 下发/清除 `dsa_sse_session`（`app.cookie.secure` 注入，`application-prod.yml` 配置 `${COOKIE_SECURE:false}`），消除双 `Set-Cookie` 头
- [x] 5.2 更新 `AuthControllerTest` 断言单条 `Set-Cookie` 头与 `wechatLogin` 不下发 Cookie；更新 `CategoryControllerTest` 与 `TagControllerTest` 覆盖重名返回 HTTP 409

## 6. 契约同步
- [x] 6.1 N/A — `specs/openapi.yaml` 维持 v3.5.1 不变（分类/标签 409 与 SSE `connect`/`heartbeat` 均为既有契约，本次实现对齐契约）
- [x] 6.2 N/A — `specs/CHANGELOG.md` 无新增 API 变更
- [x] 6.3 N/A — 版本号（openapi.yaml / pom.xml / package.json）维持 `3.5.1` 同步不变
- [x] 6.4 N/A — 后端 generated API 接口无需重新生成
- [x] 6.5 N/A — 前端 SDK 无需重新生成

## 7. 前端 (frontend/src/、apps/miniprogram/、CI & Docker)
- [x] 7.1 清理 `frontend/package.json` 未使用依赖（`axios`/`cmdk`/`@rive-app/react-canvas`/`lottie-react`）并运行 `pnpm install` 同步 `pnpm-lock.yaml`
- [x] 7.2 修复硬编码背景类：`PetPage.tsx`（4 处）与 `ManagePanel.tsx`（1 处）`bg-white` 改为 `bg-surface`，`OnboardingGuide.tsx` `bg-black/40` 改为 `bg-overlay`；升级 `scripts/ui-check.mjs` 拦截白名单外 `bg-white`/`bg-black` 并补充 `--self-test`
- [x] 7.3 前端模块架构解耦：`CalendarView` 类型移入 `core/store/settingsStore.ts`、新建 `core/store/shellStore.ts`、上提 `core/lib/zoneRegistry.ts`、扩展 `ModuleDefinition` 的 `globalOverlayComponent`/`sidebarFooterComponent` 槽位并在 `petModule`/`AppShell`/`Sidebar`/`CalendarView`/`CalendarSidebar`/`useKeyboardShortcuts`/`App.tsx` 完成迁移
- [x] 7.4 更新并新增前端单测：`shellStore.test.ts`、`moduleBoundary.test.ts`、`moduleRegistry.test.ts`、`calendarStore.test.ts`、`App.test.tsx`、`AppShell.test.tsx`、`Sidebar.test.tsx`、`zoneRegistry.test.ts`、`RoamingPet.test.tsx`、`SidebarPet.test.tsx`
- [x] 7.5 小程序与 CI 修复：新增 `apps/miniprogram/src/pages/pet/index.config.ts`（标题「宠物」）、在 `apps/miniprogram/src/pages/pet/index.tsx` 清理全部定时器、新增 `pet-page-config.test.ts`；`.github/workflows/ci.yml` 接入阻断性 `miniprogram` verify job
- [x] 7.6 Docker 容器栈修复：新增根 `.dockerignore`、重构根上下文 `backend/Dockerfile` 与 `frontend/Dockerfile`、增强 `frontend/nginx.conf` SSE 无缓冲代理、修复 `docker-compose.yml` 环境变量与 `.env.example`

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — 更新路由表（补 `/pet`）、目录结构（`shellStore.ts`/`zoneRegistry.ts` 归属 `core/`）与 `ModuleDefinition` 槽位说明
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 补全 `schema.md` V9/V10 迁移记录与 `user.status` 枚举（`ACTIVE/DISABLED/DELETED/SYSTEM`），并同步更新 `docs/uml/README.md` 的 `UserStatus` 枚举
- [x] 8.3 `docs/api/overview.md` — 修正 409 错误示例为分类重名冲突描述（对齐 `specs/openapi.yaml`）
- [x] 8.4 `docs/architecture.md` + `AGENTS.md` — 补列 `infrastructure/wechat/`、线程池更新为 `pool 3`、CI 说明补充 `miniprogram` job，并同步 `frontend-test-files` marker（55）与实测用例数
- [x] 8.5 `README.md` — 核对并同步 CI 门禁说明与 Docker/本地命令描述
- [x] 8.6 运行 `pnpm run docs:check` 与 `./scripts/sync-version.sh --check` — 全部通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端全量测试通过（45 类 352 用例，0 失败）
- [x] 9.2 `pnpm run verify` — Turborepo 全量 verify（`@daily-schedule/shared` 117 + `frontend` 289 + `@daily-schedule/miniprogram` 86，lint/tsc/test/build）全部通过
- [x] 9.3 `node scripts/ui-check.mjs --self-test && pnpm run ui:check` — UI token 门禁及自检全部通过
- [x] 9.4 `pnpm exec openspec validate --all --strict --no-interactive` + `node scripts/openspec-check.mjs` — OpenSpec 校验（73/73 通过、10 项全绿、`test-plan.md` 无残留 🔴）；注：本机未安装 Docker CLI 无法实跑 `docker compose config -q`，`Dockerfile`/`docker-compose.yml`/`nginx.conf` 已按规范静态核对；`PetPage.tsx` 改用 `bg-surface` 后需用户本地运行 `pnpm run test:visual -- --update-snapshots` 刷新截图基线

## Workflow follow-up
- `/opsx:verify` — 真实代码变更，归档前执行并确认无 CRITICAL（本次停在归档前交付用户确认）
- `/opsx:archive` — 待用户确认及视觉基线处理后执行归档与主 spec 同步
- 归档后复跑门禁：`pnpm run openspec:check` + `openspec validate --archived` + `pnpm run docs:check`
