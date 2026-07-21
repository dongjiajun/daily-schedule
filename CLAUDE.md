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

### 常用 Slash 命令

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

### 关键路径
- **变更目录**: `openspec/changes/archive/<date>-<name>/`（proposal / design / spec / tasks）
- **主 specs**: `openspec/specs/<capability>/spec.md`
- **模板**: `openspec/schemas/spec-driven-custom/templates/`

## 常用命令

### 首次设置
```bash
cd backend && mvn compile      # 确认 JDK 21 + Maven 就绪
pnpm install                    # Node 22 + pnpm（根目录，安装所有 workspace 包）
docker-compose up -d            # 或 Docker 一键启动全部服务
```

### Monorepo（根目录）
```bash
pnpm install                    # 安装所有 workspace 依赖
turbo run build                 # 按依赖顺序构建（shared → frontend）
turbo run verify                # 全量 lint + build + test
pnpm --filter @daily-schedule/shared run build   # 仅构建共享库
```

**shared 包子路径**: `@daily-schedule/shared/holiday` 独立导出 HolidayEngine（避免 barrel export 级联加载 lunar-typescript）。消费方式：
```typescript
import { holidayEngine } from '@daily-schedule/shared/holiday'
```

### 后端（backend/）
```bash
mvn clean test                                   # 编译 + 全部测试
mvn test -Dtest="EventApplicationServiceTest"    # 单个测试类
mvn spring-boot:run -Dspring-boot.run.profiles=dev   # 启动（需本地 MySQL）
mvn spring-boot:run -Dspring-boot.run.profiles=test  # 启动（H2 内存库，无需 MySQL）
```

### 前端（frontend/）
```bash
pnpm run dev          # :5173，API 代理到 localhost:8080
pnpm run build        # tsc -b + vite build（tsc -b 自动构建 shared）
pnpm run lint         # ESLint
pnpm run test         # vitest 单元测试
pnpm run test:watch   # vitest 监视模式
pnpm run generate:api # 从 ../specs/openapi.yaml 生成 SDK
pnpm run verify       # lint + build + test（提交前必须通过）
```

## 提交前验证（CI 门禁对齐）

```bash
cd frontend && pnpm run verify   # lint + TypeScript 检查 + 构建 + 测试
cd backend && mvn test            # 编译 + 单元测试（H2 内存库）
# 或根目录全量验证：
turbo run verify && cd backend && mvn test
```

**CI 四层门禁**: 后端 `mvn test` + 前端 `pnpm run lint` + 前端 `pnpm run test` + 前端 `pnpm run build`（含 SDK freshness check）
**常见失败**: `@typescript-eslint/no-explicit-any` / `tsc -b` 类型错误 / 后端单测失败

**文档检查**（每次变更后逐项确认）：
- 新前端组件 → `docs/frontend/component-catalog.md`
- 新实体/表/字段 → `docs/database/schema.md` + `docs/uml/README.md`
- 新 API 端点 → `docs/api/overview.md`
- 架构/模块变动 → `docs/architecture.md` + `CLAUDE.md`

## 关键文档
- API 契约: `specs/openapi.yaml`（**唯一真相源**）
- 变更日志: `specs/CHANGELOG.md`
- 架构说明: `docs/architecture.md`
- API 规范: `docs/api/overview.md`
- 数据库: `docs/database/schema.md`
- UML: `docs/uml/README.md`
- 组件清单: `docs/frontend/component-catalog.md`

## 契约驱动的 API 开发管道

```
specs/openapi.yaml
    │
    ├─→ 后端: openapi-generator-maven-plugin
    │    → target/generated-sources/openapi/
    │       ├── api/*.java    (接口，Controller 必须实现)
    │       └── dto/*.java    (DTO)
    │
    └─→ 前端: npm run generate:api (@hey-api/openapi-ts)
         → src/api/
            ├── sdk.gen.ts / types.gen.ts / client.gen.ts
```

**关键约定：**
- Controller **必须实现**生成的接口，编译期强约束
- `src/api/` 由代码生成器完全管理（`generate:api` 会清空重写）
- 自定义逻辑（token 注入、unwrap）**只能**放在 `src/lib/` 下，在 `main.tsx` 启动时注册
- API 变更必须同步：`specs/openapi.yaml` + `specs/CHANGELOG.md` + `pom.xml` 版本 + `package.json` 版本

## 架构

### 后端 DDD 四层

| 层 | 包路径 | 职责 |
|------|------|------|
| API | `api/controller/`, `api/assembler/`, `api/exception/` | REST 端点、DTO↔Domain 转换、全局异常处理 |
| 应用 | `application/event/`, `application/category/`, `application/tag/`, `application/auth/` | 用例编排、事务、缓存注解、重名校验 |
| 领域 | `domain/event/`, `domain/category/`, `domain/tag/`, `domain/user/`, `domain/notification/` | 实体 + 仓储接口 + DomainService（纯 POJO） |
| 基础设施 | `infrastructure/persistence/`, `infrastructure/security/`, `infrastructure/config/`, `infrastructure/scheduled/`, `infrastructure/notification/` | MyBatis-Plus 仓储实现（PO + Mapper）、JWT/Spring Security、Caffeine 缓存、提醒调度、SSE |

依赖方向：API → 应用 → 领域 ← 基础设施

### 前端目录结构
```
src/
├── core/                    # 稳定基础设施（不可被模块直接依赖）
│   ├── lib/                 # eventBus, moduleRegistry, utils, unwrap, authInterceptor
│   ├── store/               # authStore, settingsStore
│   ├── components/ui/       # shadcn/ui 基础组件
│   ├── components/layout/   # 通用布局 (TabbedDialog)
│   ├── hooks/               # useTheme, useNotification, useSseNotifications
│   └── styles/              # themes.css
├── modules/                 # 可插拔功能模块
│   └── calendar/            # 日历模块
│       ├── index.ts         # ModuleDefinition 导出
│       ├── routes.tsx        # lazy 路由
│       ├── components/      # HomePage, CalendarView, EventForm/Modal, CalendarSidebar, ManagePanel
│       ├── hooks/           # useEvents, useCategories, useTags, useKeyboardShortcuts
│       ├── store/           # calendarStore
│       └── lib/             # ics.ts
├── components/layout/       # 应用 Shell (AppShell, Sidebar, ShortcutsDialog...)
├── pages/                   # LoginPage
├── lib/                     # colors.ts (兼容层)
└── api/                     # 自动生成 SDK
```

### 前端状态管理（两层分离）
- **Zustand**（UI 状态）: `authStore`（core，token + user）、`calendarStore`（calendar 模块，视图/弹窗/筛选）、`settingsStore`（core，偏好 persist）
- **React Query**（服务端数据）: `useEvents`/`useCategories`/`useTags` 等 hooks，文件在 `modules/calendar/hooks/`
- **路径别名**: `@/` → `src/`
- **模块注册**: `main.tsx` 中 `moduleRegistry.register(calendarModule)` 注册日历模块
- **动态路由**: `App.tsx` 使用 `useRoutes(moduleRegistry.getRoutes())` 动态装配
- **PWA**: `vite-plugin-pwa` 提供 manifest + Service Worker（autoUpdate + CacheFirst 静态资源 + NetworkOnly API）

### 模块间通信（事件总线）
- **唯一通道**: `core/lib/eventBus.ts`（EventBus 单例），模块间不直接 import store/组件
- **事件类型**: `SystemEvent` 联合类型（定义在 `packages/shared/src/eventBus.ts`），10 种跨模块事件
- **模块注册**: `core/lib/moduleRegistry.ts` — `ModuleRegistry` 单例，管理模块生命周期（注册/注销/路由收集/petActions/sidebarComponent）

### 持久层
- **MyBatis-Plus**: domain 定义仓储接口，infrastructure 用 PO + Mapper 实现
- **Flyway**: `V*__*.sql` 按序执行，启动时自动迁移
- **测试用 H2**: `src/test/resources/application-test.yml`，`MODE=MySQL` 兼容，**Flyway 关闭**，用 `schema-h2.sql` 初始化表结构

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
API 契约版本号在三个文件中保持一致：`specs/openapi.yaml` → `backend/pom.xml` → `frontend/package.json`

### 配置文件速查

| Profile | 数据库 | 用途 |
|---------|--------|------|
| dev (默认) | MySQL `daily_schedule_dev` | 本地开发，打印 SQL |
| test | H2 内存 | 单元测试，无需外部数据库 |
| prod | MySQL（环境变量注入） | Docker 部署 |

## 本地环境
- MySQL 8.0.29（服务名 `MySQL80`），root/123456
- 开发库 `daily_schedule_dev`，测试库 `daily_schedule_test`
- JDK 21 / Node 22
- Swagger UI（dev）: http://localhost:8080/swagger-ui.html

## 当前版本：v3.1（2026-06-09）

核心能力：Event 状态闭环（PLANNED/COMPLETED/CANCELLED）+ 日历拖拽改期/拉伸时长 + 标签筛选 + 5 套主题 + 键盘快捷键 + access token 自动续签 + SSE 提醒推送 + ICS 导出 + 移动端适配
测试覆盖：26 类 185 用例（H2 内存数据库）+ 前端 4 类 15 用例（vitest）
