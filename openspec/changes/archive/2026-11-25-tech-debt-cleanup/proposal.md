# Proposal: tech-debt-cleanup

## Why
当前代码库存在若干配置漂移、后端实现与 OpenAPI 契约不一致、前端模块边界交叉、硬编码背景色及容器/CI 覆盖缺口等技术债；在进入 Phase 2 后续功能开发前集中清理，确保契约一致、架构清晰且全端门禁可信。

## What Changes
- **后端配置/测试基线与代码卫生**：修正 `application.yml` 中 `spring.flyway` 缩进；对齐 `schema-h2.sql` 与 Flyway V1–V10；`AuthController` 改用单一 `ResponseCookie` 下发/清除 `dsa_sse_session`（`app.cookie.secure` 可配置）；`PetDomainService` 注入 `Clock` 驱动衰减；修正 `PetApplicationService` 默认食物注释；清理 `pom.xml` 未使用 `mapstruct` 与 `mysql.version` 声明。
- **后端行为对齐 OpenAPI 契约**：`CategoryApplicationService` 与 `TagApplicationService` 重名异常改抛 `BusinessException` 返回 HTTP `409`；`SseEmitterManager` 补充连接握手 `connect` 事件、30s 定时 `heartbeat` 保活与失效连接清理（`ScheduleConfig` 线程池扩容至 3）。
- **前端架构解耦、UI 修复与依赖清理**：抽离 `core/store/shellStore.ts`、`CalendarView` 类型归属 `core/store/settingsStore.ts`、上提 `core/lib/zoneRegistry.ts`；扩展 `ModuleDefinition` 的 `globalOverlayComponent` / `sidebarFooterComponent` 槽位消除 `core/layout/modules` 跨层直接依赖，并增加 `moduleBoundary.test.ts` 守卫；修复 `PetPage` / `ManagePanel` 的 `bg-white` 与 `OnboardingGuide` 的 `bg-black/40` 为语义 token 并加固 `ui:check` 门禁；清理未使用的 `axios`/`cmdk`/`@rive-app/react-canvas`/`lottie-react`。
- **小程序与 CI**：补齐 `apps/miniprogram/src/pages/pet/index.config.ts` 标题及卸载/隐藏全量定时器清理；在 `.github/workflows/ci.yml` 接入阻断型 `miniprogram` verify job。
- **Docker 与文档同步**：重构 `backend/Dockerfile`、`frontend/Dockerfile`（根上下文多阶段 + pnpm monorepo）、`frontend/nginx.conf`（SSE 代理禁用缓冲）、`docker-compose.yml` 与 `.env.example`；同步补全 `docs/database/schema.md`、`docs/api/overview.md`、`docs/frontend/component-catalog.md`、`docs/architecture.md`、`AGENTS.md`、`README.md`。
- **Workflow schema 选择**：选用 `spec-driven-custom`（五工件含 `test-plan.md`），理由是本次横跨前后端/小程序/CI/Docker 且含行为与架构边界变更，需要红绿测试账本逐场景对齐验证。

## Capabilities

### New Capabilities
（无新增独立能力，全部为现有能力的技术债收敛与契约对齐）

### Modified Capabilities
- `api-error-handling`: 分类与标签重名创建/更新返回 HTTP 409（对齐 `specs/openapi.yaml`）
- `authentication`: SSE Cookie 改用单一 `ResponseCookie` 响应头，支持 `app.cookie.secure` 环境配置
- `reminder-scheduler`: SSE 连接建立推送 `connect` 握手事件、定时推送 `heartbeat` 保活并清理失效连接
- `core-directory`: `shellStore`、`CalendarView` 类型与 `zoneRegistry` 归属 `core/` 基础设施层
- `module-registry`: 扩展 `globalOverlayComponent` / `sidebarFooterComponent` Shell 槽位并落地模块边界隔离测试
- `design-token-contract`: 业务组件禁止残留 `bg-white` / `bg-black` 硬编码背景并接入 `ui:check` 门禁
- `miniprogram-pet`: 补齐 `pages/pet/index.config.ts` 页面标题配置与交互/游走定时器全量清理
- `ci-actions-maintenance`: CI 流水线新增阻断性 `miniprogram` verify job 覆盖微信小程序构建与测试

## API Contract Impact
- 无破坏性变更，**无需修改 `specs/openapi.yaml` 与版本号（维持 v3.5.1）**：分类/标签接口 `409 Conflict` 及 `/sse/notifications` 的 `connect` / `heartbeat` 命名事件均已在 `specs/openapi.yaml` 中声明，本次为后端实现向既有契约对齐。

## DDD Layer Impact
- **领域层 (`domain/`)**：`domain/pet/PetDomainService` 注入 `Clock`。
- **基础设施层 (`infrastructure/`)**：`infrastructure/config/ScheduleConfig` 线程池扩容；`infrastructure/notification/SseEmitterManager` 实现 `connect`/`heartbeat` 与失效连接清理；`application.yml` / `application-prod.yml` / `schema-h2.sql` 配置与测试基线对齐。
- **应用层 (`application/`)**：`CategoryApplicationService` / `TagApplicationService` 重名改抛 `BusinessException`；`PetApplicationService` 默认食物注释修正。
- **API 层 (`api/`)**：`AuthController` SSE Cookie 改为单一 `ResponseCookie` 头。

## Database Impact
- **无新增 Flyway 迁移**（维持 V1–V10）。仅修复 `application.yml` 中 `spring.flyway` YAML 层级使配置实际生效，并补齐 `backend/src/test/resources/schema-h2.sql` 缺失的 V3 列与唯一索引定义。

## Impact
- **后端**：`pom.xml`、`application*.yml`、`schema-h2.sql`、`PetDomainService`、`ScheduleConfig`、`SseEmitterManager`、`CategoryApplicationService`、`TagApplicationService`、`PetApplicationService`、`AuthController` 及对应单测。
- **前端**：`frontend/package.json`、`App.tsx`、`AppShell.tsx`、`Sidebar.tsx`、`ShortcutsDialog.tsx`、`OnboardingGuide.tsx`、`core/store/{shellStore,settingsStore}.ts`、`core/lib/{moduleRegistry,zoneRegistry}.ts`、`modules/calendar/**`、`modules/pet/**` 及新增/更新单测。
- **小程序 & 门禁 & 容器**：`apps/miniprogram/src/pages/pet/{index.tsx,index.config.ts}`、`scripts/ui-check.mjs`、`.github/workflows/ci.yml`、`.dockerignore`、`backend/Dockerfile`、`frontend/{Dockerfile,nginx.conf}`、`docker-compose.yml`、`.env.example`。
- **文档**：`docs/database/schema.md`、`docs/api/overview.md`、`docs/frontend/component-catalog.md`、`docs/architecture.md`、`AGENTS.md`、`README.md`。
