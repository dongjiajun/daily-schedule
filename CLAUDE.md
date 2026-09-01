# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述
日程管理系统 — Spring Boot 3.4 + React 19 + MySQL 8.0

## 开发工作流（OpenSpec）

本项目使用 **OpenSpec** 进行 artifact-driven 开发，schema 为 `spec-driven-custom`（OpenSpec CLI 1.11.0，skills/commands 同步于 `.dsh/skills/` 与 `.dsh/commands/opsx/`）。
**所有变更都走这个流程**，不直接在代码库中"裸写"代码。

### Artifact 序列

```
/opsx:new <name> → proposal → specs → design → test-plan → tasks → /opsx:apply → /opsx:verify → /opsx:archive
```

| 命令 | 用途 |
|------|------|
| `/opsx:new <kebab-case-name>` | 创建新变更，生成目录骨架 |
| `/opsx:continue` | 继续下一步 artifact（proposal → specs → design → test-plan → tasks） |
| `/opsx:ff` | 一次性生成全部 artifacts（快速通道） |
| `/opsx:apply` | 按 tasks.md 逐项实施 |
| `/opsx:verify` | 验证实现与 artifacts 一致 |
| `/opsx:archive` | 归档已完成的变更 |
| `/opsx:sync` | 将 delta specs 同步到 `openspec/specs/` 主目录 |
| `/opsx:explore` | 进入探索模式，梳理需求 |
| `/opsx:update` | 修订已有 artifacts |

- **指令体系分层**（详见 `openspec-conventions` 主 spec「指令体系分层与收敛」）：
  - **机制层** `.dsh/` + `.claude/` 技能与命令 — CLI 版本钉住（`generatedBy`），随 OpenSpec 升级经 `openspec update` 重生成；schema/工件链变更**不**触发重生成；禁止手改
  - **指令层** `openspec instructions <artifact> --change <name>` — 按 schema（工件链 / instruction / 模板）+ `openspec/config.yaml`（context / rules）动态生成，为工件撰写 / apply / archive 的**唯一动态来源**（含格式纪律）；撰写工件前先取指令，本文件不重复工件格式
  - **文档层** 本文件 — 仅承载 CLI 无法表达的约定（流水线 / CI 门禁 / 验证 / 文档同步 / 工作流选择）
- **变更目录**: `openspec/changes/archive/<date>-<name>/`（proposal / specs / design / test-plan / tasks；lite 无 design/test-plan）
- **主 specs**: `openspec/specs/<capability>/spec.md`
- **skip_specs**: 无行为变化变更（纯重构/工具链/文档/热修）在 `.openspec.yaml` 设 `skip_specs: true`，保留流程留痕，不"裸写"绕开
- **新能力 delta 规范**: 必须以 `## Purpose` 段开头（≥50 字符）；已存在能力的 delta 不得携带；改已有 Purpose 直接编辑主 spec
- **CI 门禁**: `openspec-validation` job 运行 `pnpm run openspec:check`（`scripts/openspec-check.mjs`：validate --all --strict + doctor + 主 spec 无 delta 头 + CLI 版本=CLAUDE.md 声明 + validate --archived 归档完整性 + test-plan 内容门禁（活动变更场景↔test-plan 行映射一致；归档含 test-plan.md 时无残留 🔴）+ CLAUDE.md 序列一致性守卫（工件序列声明 ↔ schema 链））——OpenSpec 一致性不合规会阻断 CI；升级 OpenSpec 须同步 ci.yml 钉版安装行与本节版本声明
- **归档前验证门禁**: 真实代码变更（`backend/`、`frontend/src/`、`apps/miniprogram/`、`packages/` 源码）归档前必须运行 `/opsx:verify` 且报告无 CRITICAL；纯工具链/文档/元数据变更可由 tasks 全量验证组套件（custom 第 9 组 / lite 第 3 组）+ `validate --archived` 等效替代，归档条目注明等效依据
- **lite 工作流**: 小规模/单模块/无架构决策变更可用 `openspec new change <name> --schema spec-driven-custom-lite`（proposal → specs → tasks，无 design 工件）；复杂变更（跨模块/新架构/外部依赖/安全/性能/迁移）必须用默认 `spec-driven-custom`；默认 schema 不变，两 schema 模板单源同步（custom 为先）
- **test-plan 工件**（custom 独有）: 复杂变更 apply 前须创建 `test-plan.md`——delta 场景 → 命名测试映射活账本；格式与红绿/漂移纪律以 `openspec instructions test-plan --change <name>` 为权威（schema.yaml instruction，此处不重复）；归档前须无残留 🔴（openspec-check 第 6 检）；lite 变更无此工件

## 常用命令

```bash
pnpm install                    # 安装所有 workspace 依赖
turbo run build                 # 按依赖顺序构建（shared → frontend / miniprogram）
turbo run verify                # 全量 lint + build + test
```

**shared 包子路径**: `@daily-schedule/shared/holiday` 独立导出 HolidayEngine、`@daily-schedule/shared/pet` 独立导出 roam engine（避免 barrel export 级联加载）。消费：
```typescript
import { holidayEngine } from '@daily-schedule/shared/holiday'
import { computeNextTarget, createDefaultConfig } from '@daily-schedule/shared/pet'
```

**小程序**（`apps/miniprogram/`，Taro 4.2 + React 18 + NutUI 4.0.0-beta.5）：
```bash
cd apps/miniprogram
pnpm run build      # taro build --type weapp → dist/（导入微信开发者工具）
pnpm run dev        # watch 构建
pnpm run verify     # lint + test + build（turbo run verify 覆盖）
```
React 18 是 Taro 4.2 与 NutUI beta 的 peer 共同支持面（frontend 的 React 19 与之并存，pnpm 按包隔离）。NutUI 用组件级按需引入（`dist/es/packages/<name>` + `style/css`），勿用 barrel 入口。

**日历月视图**（`pages/calendar/`，miniprogram-calendar）：月网格（42 格周一起始 + 跨月补位）+ 选中日事件列表（只读），复用 `GET /events`（无新端点）；`lib/api.ts` 统一 Bearer 注入 + 401 清态静默重登（无 refresh 预续签，留待后续）；日期处理为字符串切片纯函数（`lib/calendar-date.ts`，不 new Date 后端日期串——iOS JSC 兼容）

**任务列表**（`pages/todo/`，miniprogram-todo）：TabBar 第 4 入口 + 恒定三组分组（待办/进行中/已完成）+ ActionSheet 状态移动 + 新建弹层（title 必填/优先级 chips/DatePicker 截止日期）+ 删除确认，复用 `/tasks` 四端点（list/create/move/delete，无新端点）；变更成功 = 本地同步 + refetch 对账（非乐观猜测）；`dueDate` 为字符串比较（过期红/今天高亮，iOS JSC 兼容）

**宠物互动**（`pages/pet/`，miniprogram-pet）：TabBar 第 5 入口 + 宠物状态展示（等级/心情/饥饿/经验/金币）+ 创建引导（物种二选一/命名）+ 喂食玩耍（复用 `/pets/me` 三端点，无新端点）+ 游走动效（shared/pet roam engine `computeNextTarget` wandering 模式，View 绝对定位 px + CSS transition + setTimeout 链，卸载/隐藏双路清理）；形象为 emoji 🐱/🐕 + 颜色圈底（微信 image 不支持 svg）；404 = 无宠物业务态（创建引导）；互动成功 = InteractionResult 本地同步 + refetch 对账；坐标全程 px（引擎 px 语义）

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

**CI 门禁**: openspec-validation（OpenSpec 一致性：validate --all --strict + doctor + 主 spec 无 delta 头 + CLI 版本=声明 + 归档完整性 validate --archived + test-plan 内容门禁 + CLAUDE.md 序列一致性守卫）+ version-check（版本同步 + 文档一致性）+ 后端 `mvn test` + 前端 `pnpm run lint` + `pnpm run test` + `pnpm run build`（含 SDK freshness check）为阻断门禁；`npm run test:e2e`（continue-on-error 软性）
**常见失败**: `@typescript-eslint/no-explicit-any` / `tsc -b` 类型错误 / 后端单测失败

**文档检查**（每次变更后逐项确认——未触及的类别须写明"现有描述已核对仍准确"，不得仅以"无新增"跳过；不走 OpenSpec 流程的小改动（热修/文档勘误）同样适用，提交前逐项核对）：
- 组件/目录（新增**或修改**）→ `docs/frontend/component-catalog.md`
- 表/字段/领域模型（新增**或修改**）→ `docs/database/schema.md` + `docs/uml/README.md`
- API 端点/契约（新增**或修改**）→ `docs/api/overview.md`
- 架构/模块/测试规模变动 → `docs/architecture.md` + `CLAUDE.md`
- 版本号/测试数/模块列表变动 → `CLAUDE.md` 底部版本声明 + `README.md`
- **自动化验证**: 提交前运行 `pnpm run docs:check`（`scripts/docs-check.mjs`）——版本声明/端点覆盖/结构计数与代码不一致会非零退出（CI version-check job 已接入）；`pnpm run openspec:check`（`scripts/openspec-check.mjs`）——OpenSpec 一致性不合规会非零退出（CI openspec-validation job 已接入）

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
| 基础设施 | `infrastructure/persistence/`, `infrastructure/security/`, `infrastructure/config/`, `infrastructure/scheduled/`, `infrastructure/notification/`, `infrastructure/wechat/` | MyBatis-Plus 仓储实现（PO + Mapper）、JWT/Spring Security、Caffeine 缓存、提醒调度、SSE、微信 API 客户端 |

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
- 微信小程序登录：`POST /auth/wechat-login`（code→openid→静默登录/注册；`user.openid` 唯一索引；appid/secret 走 `WECHAT_APP_ID`/`WECHAT_APP_SECRET` 环境变量，仓库不落明文）
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

## 当前版本：v3.5.1（2026-08-17）

核心能力：Event 状态闭环 + 日历拖拽改期/拉伸时长 + 标签筛选 + 5 套主题 + 节日主题自动切换 + 特效系统（6 种）+ 键盘快捷键 + JWT 自动续签 + SSE 提醒推送 + ICS 导出 + PWA + 移动端适配 + 宠物养成（区域感知游走/小窝进窝休息/日程框互动：格内物理四边绕行+吸附落地弹跳/情绪/粒子；动作动画层：eat 进食 + idle 小动作 stretch/yawn/scratch/look + 情绪眨眼过渡；昼夜节律：夜间回窝/早晨唤醒问候/午后小憩/深夜打哈欠提示；健壮性：兴趣区惰性过期 + 游走节奏与渲染解耦）+ 任务看板（三列看板+列表+拖拽）+ 微信小程序（Taro 4.2 骨架 + 微信登录：wx.login code→JWT 静默注册 + 日历月视图只读 + 任务列表：三组分组/状态移动/新建/删除 + 宠物互动：状态/创建/喂食玩耍/游走动效）
测试覆盖：45 类 342 用例（后端 H2，`<!-- DOCS-CHECK: backend-test-classes=45 -->`）+ 51 文件 267 用例（前端 vitest，`<!-- DOCS-CHECK: frontend-test-files=51 -->`）+ 13 文件 57 用例（Playwright E2E，`<!-- DOCS-CHECK: e2e-files=13 -->`）+ 7 文件 83 用例（小程序 vitest）
