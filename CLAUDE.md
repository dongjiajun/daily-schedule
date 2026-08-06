# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述
日程管理系统 — Spring Boot 3.4 + React 19 + MySQL 8.0

## 开发工作流（OpenSpec）

本项目使用 **OpenSpec** 进行 artifact-driven 开发，schema 为 `spec-driven-custom`。
**所有变更都走这个流程**，不直接在代码库中"裸写"代码。

### Artifact 序列

```
/opsx:new <name> → proposal → design → spec → tasks → /opsx:apply → /opsx:verify → /opsx:archive
```

| 命令 | 用途 |
|------|------|
| `/opsx:new <kebab-case-name>` | 创建新变更，生成目录骨架 |
| `/opsx:continue` | 继续下一步 artifact（proposal → design → spec → tasks） |
| `/opsx:ff` | 一次性生成全部 artifacts（快速通道） |
| `/opsx:apply` | 按 tasks.md 逐项实施 |
| `/opsx:verify` | 验证实现与 artifacts 一致 |
| `/opsx:archive` | 归档已完成的变更 |
| `/opsx:sync` | 将 delta specs 同步到 `openspec/specs/` 主目录 |
| `/opsx:explore` | 进入探索模式，梳理需求 |
| `/opsx:update` | 修订已有 artifacts |

- **变更目录**: `openspec/changes/archive/<date>-<name>/`（proposal / design / spec / tasks）
- **主 specs**: `openspec/specs/<capability>/spec.md`

## 常用命令

```bash
pnpm install                    # 安装所有 workspace 依赖
turbo run build                 # 按依赖顺序构建（shared → frontend）
turbo run verify                # 全量 lint + build + test
```

**shared 包子路径**: `@daily-schedule/shared/holiday` 独立导出 HolidayEngine、`@daily-schedule/shared/pet` 独立导出 roam engine（避免 barrel export 级联加载）。消费：
```typescript
import { holidayEngine } from '@daily-schedule/shared/holiday'
import { computeNextTarget, createDefaultConfig } from '@daily-schedule/shared/pet'
```

**后端**（`mvn clean test` 全量测试；`mvn spring-boot:run -Dspring-boot.run.profiles=dev` 启动需本地 MySQL）：
```bash
cd backend
mvn test -Dtest="EventApplicationServiceTest"    # 单个测试类
```

**前端**（`:5173`，API 代理到 localhost:8080）：
```bash
cd frontend
pnpm run dev          # 开发服务器
pnpm run verify       # lint + build + test（提交前必须通过）
pnpm run test:e2e     # Playwright E2E（需先启动前后端）
pnpm run generate:api # 从 ../specs/openapi.yaml 生成 SDK
```

首次设置：`cd backend && mvn compile` + `pnpm install` + `docker-compose up -d`（详见根 README 快速开始）。

## 提交前验证（CI 门禁对齐）

```bash
turbo run verify && cd backend && mvn test && cd frontend && npm run test:e2e
```

**CI 五层门禁**: 后端 `mvn test` + 前端 `pnpm run lint` + `pnpm run test` + `pnpm run build`（含 SDK freshness check）+ `npm run test:e2e`
**常见失败**: `@typescript-eslint/no-explicit-any` / `tsc -b` 类型错误 / 后端单测失败

**文档检查**（每次变更后逐项确认——未触及的类别须写明"现有描述已核对仍准确"，不得仅以"无新增"跳过；不走 OpenSpec 流程的小改动（热修/文档勘误）同样适用，提交前逐项核对）：
- 组件/目录（新增**或修改**）→ `docs/frontend/component-catalog.md`
- 表/字段/领域模型（新增**或修改**）→ `docs/database/schema.md` + `docs/uml/README.md`
- API 端点/契约（新增**或修改**）→ `docs/api/overview.md`
- 架构/模块/测试规模变动 → `docs/architecture.md` + `CLAUDE.md`
- 版本号/测试数/模块列表变动 → `CLAUDE.md` 底部版本声明 + `README.md`
- **自动化验证**: 提交前运行 `pnpm run docs:check`（`scripts/docs-check.mjs`）——版本声明/端点覆盖/结构计数与代码不一致会非零退出（CI version-check job 已接入）

## 关键文档

| 文档 | 内容 |
|------|------|
| `specs/openapi.yaml` | API 契约（**唯一真相源**） |
| `specs/CHANGELOG.md` | API 变更日志 |
| `docs/architecture.md` | 架构说明 |
| `docs/api/overview.md` | API 规范 |
| `docs/database/schema.md` + `docs/uml/README.md` | 数据库 + UML |
| `docs/frontend/component-catalog.md` | 组件清单 |
| `docs/planning/execution-plan.md` | 规划（Phase 进度，内部代号） |

## 契约驱动的 API 开发管道

```
specs/openapi.yaml
    ├─→ 后端: openapi-generator-maven-plugin → target/generated-sources/openapi/
    │       └── api/*.java (接口，Controller 必须实现) + dto/*.java
    └─→ 前端: npm run generate:api (@hey-api/openapi-ts) → src/api/
            └── sdk.gen.ts / types.gen.ts / client.gen.ts
```

**关键约定：**
- Controller **必须实现**生成的接口，编译期强约束
- `src/api/` 由代码生成器完全管理（`generate:api` 会清空重写）
- 自定义逻辑（token 注入、unwrap）**只能**放在 `src/lib/` 下，在 `main.tsx` 启动时注册
- API 变更必须同步：`specs/openapi.yaml` + `specs/CHANGELOG.md` + `pom.xml` 版本 + `package.json` 版本

## 架构（详见 docs/architecture.md）

### 后端 DDD 四层

| 层 | 包路径 | 职责 |
|------|------|------|
| API | `api/controller/`, `api/assembler/`, `api/exception/` | REST 端点、DTO↔Domain 转换、全局异常处理 |
| 应用 | `application/event/`, `application/category/`, `application/tag/`, `application/auth/` | 用例编排、事务、缓存注解、重名校验 |
| 领域 | `domain/event/`, `domain/category/`, `domain/tag/`, `domain/user/`, `domain/notification/` | 实体 + 仓储接口 + DomainService（纯 POJO） |
| 基础设施 | `infrastructure/persistence/`, `infrastructure/security/`, `infrastructure/config/`, `infrastructure/scheduled/`, `infrastructure/notification/` | MyBatis-Plus 仓储实现（PO + Mapper）、JWT/Spring Security、Caffeine 缓存、提醒调度、SSE |

依赖方向：API → 应用 → 领域 ← 基础设施

### 前端（模块化架构）

```
src/
├── core/       # 稳定基础设施（lib: eventBus/moduleRegistry/unwrap/authInterceptor; store: auth/settings; components/ui: shadcn; hooks: useTheme/useNotification; styles: themes.css）
├── modules/    # 可插拔功能模块（calendar/pet/todo），各含 index.ts + routes.tsx + components/hooks/store/lib
├── components/layout/   # AppShell, Sidebar, ShortcutsDialog
├── pages/               # LoginPage
├── lib/                 # colors.ts (兼容层)
└── api/                 # 自动生成 SDK
```

- **状态管理两层分离**: Zustand（UI 状态: authStore/calendarStore/settingsStore）+ React Query（服务端数据: useEvents/useCategories/useTags）
- **模块间通信唯一通道**: `core/lib/eventBus.ts`（模块间不直接 import store/组件）；模块注册 `core/lib/moduleRegistry.ts`（路由收集/petActions/sidebarComponent）
- **持久层**: MyBatis-Plus（domain 定义仓储接口，infrastructure 用 PO + Mapper 实现）；Flyway `V*__*.sql` 启动自动迁移
- **测试**: 单元测试 H2 内存库（`src/test/resources/application-test.yml`，Flyway 关闭，`schema-h2.sql` 初始化）；启动用 test profile 连接 MySQL `daily_schedule_test`（CI/E2E 用）
- **PWA**: `vite-plugin-pwa`（autoUpdate + CacheFirst 静态资源 + NetworkOnly API）

## 关键约定

### `unwrap()` — SDK 错误处理
`@hey-api/openapi-ts` 生成的 SDK 把错误放在 `result.error` 而非抛出异常，React Query `onError` 因此从不触发。所有 hooks 的 `queryFn`/`mutationFn` 必须用 `lib/unwrap.ts` 包裹：检查 `result.error` 或 `!response.ok` 则抛出带后端 `message` 的 `Error`。

### Auth 拦截器自动续签
`lib/authInterceptor.ts` 在 `main.tsx` 启动时注册到 hey-api 客户端：
- **请求前**: 注入 `Authorization: Bearer <accessToken>`
- **过期前 30s**: 自动用 refresh token 续签（单飞锁 `refreshPromise`，避免并发刷新）
- **401 响应**: 强制登出 + 调 `/auth/logout` 清 SSE Cookie

### 认证与数据隔离
- JWT 无状态认证：access 15min + refresh 7d，BCrypt 密码加密
- `JwtAuthFilter` 支持 Bearer header 和 `dsa_sse_session` Cookie 两路 token
- SSE 鉴权用 Cookie（v3.0+），不再用 `?token=` 查询参数
- 所有业务表含 `user_id`，查询通过 `CurrentUserService` 强制按当前用户过滤

### 版本号同步
API 契约版本号在三个文件中保持一致：`specs/openapi.yaml` → `backend/pom.xml` → `frontend/package.json`（规划代号 v4.x 与此无关）

### 配置文件速查

| Profile | 数据库 | 用途 |
|---------|--------|------|
| dev (默认) | MySQL `daily_schedule_dev` | 本地开发，打印 SQL |
| test | MySQL `daily_schedule_test` | CI/E2E 测试环境，需 MySQL |
| test (classpath) | H2 内存 | `mvn test` 单元测试专用，无需外部数据库 |
| prod | MySQL（环境变量注入） | Docker 部署 |

## 本地环境
- MySQL 8.0.29（服务名 `MySQL80`），root/123456；开发库 `daily_schedule_dev`，测试库 `daily_schedule_test`
- JDK 21 / Node 22；Swagger UI（dev）: http://localhost:8080/swagger-ui.html

## 当前版本：v3.3.4（2026-08-02）

核心能力：Event 状态闭环 + 日历拖拽改期/拉伸时长 + 标签筛选 + 5 套主题 + 节日主题自动切换 + 特效系统（5 种）+ 键盘快捷键 + JWT 自动续签 + SSE 提醒推送 + ICS 导出 + PWA + 移动端适配 + 宠物养成（区域感知游走/小窝进窝休息/日程框互动/情绪/粒子；健壮性：兴趣区惰性过期 + 游走节奏与渲染解耦）+ 任务看板（三列看板+列表+拖拽）
测试覆盖：37 类 259 用例（后端 H2，`<!-- DOCS-CHECK: backend-test-classes=37 -->`）+ 47 文件 212 用例（前端 vitest，`<!-- DOCS-CHECK: frontend-test-files=47 -->`）+ 10 文件 35 用例（Playwright E2E，`<!-- DOCS-CHECK: e2e-files=10 -->`）
