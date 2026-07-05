# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述
日程管理系统 — Spring Boot 3.4 + React 19 + MySQL 8.0

## 常用命令

### 后端（backend/）

```bash
# 编译 + 运行测试（无 Maven Wrapper，需系统安装 Maven）
cd backend && mvn clean test

# 运行单个测试类
mvn test -Dtest="EventApplicationServiceTest"

# 跳过测试编译
mvn compile -DskipTests

# 启动应用（dev 环境，需要本地 MySQL）
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 启动应用（test 环境，使用 H2 内存数据库，无需外部 MySQL）
mvn spring-boot:run -Dspring-boot.run.profiles=test
```

### 前端（frontend/）

```bash
cd frontend && npm run dev          # 开发服务器 :5173，API 代理到 localhost:8080
npm run build                        # TypeScript 检查 + Vite 构建
npm run lint                         # ESLint 检查
npm run generate:api                 # 从 ../specs/openapi.yaml 生成 SDK（@hey-api/openapi-ts）
```

### Docker 一键启动

```bash
docker-compose up -d                 # MySQL + 后端 :8080 + 前端 :5173（Nginx 静态服务）
```

## 关键文档
- 架构说明: docs/architecture.md
- API 契约: specs/openapi.yaml（**唯一真相源**）
- 契约变更日志: specs/CHANGELOG.md
- API 规范: docs/api/overview.md
- UML 设计图: docs/uml/README.md
- 组件清单: docs/frontend/component-catalog.md
- 数据库: docs/database/schema.md

## 契约驱动的 API 开发管道

这是本项目最核心的工作流，**所有 API 变更都从 `specs/openapi.yaml` 开始**：

```
specs/openapi.yaml
    │
    ├─→ 后端: Maven openapi-generator-maven-plugin
    │        生成 target/generated-sources/openapi/
    │        ├── com/dailyschedule/api/generated/api/*.java   (接口，Controller 必须实现)
    │        └── com/dailyschedule/api/generated/dto/*.java   (DTO)
    │
    └─→ 前端: npm run generate:api (@hey-api/openapi-ts)
            生成 frontend/src/api/
            ├── sdk.gen.ts      (API 客户端函数，如 eventsControllerCreate)
            ├── types.gen.ts    (TypeScript 类型，如 EventCreateRequest)
            └── client.gen.ts   (fetch 客户端实例)
```

**关键约定：**
- Controller 放在 `api/controller/`，**必须实现**生成的 `api/generated/api/` 下的接口，编译期强制契约同步
- 前端 SDK 中 `client.gen.ts` **会被生成覆盖**——自定义逻辑（如 token 注入）必须放在 `api/authInterceptor.ts` 中，在 `main.tsx` 启动时注册拦截器
- API 契约变更必须同步更新 `specs/CHANGELOG.md` 与三处版本号（`specs/openapi.yaml`、`backend/pom.xml`、`frontend/package.json`）

## 技术栈

### 后端 DDD 四层架构

| 层 | 包路径 | 职责 |
|------|------|------|
| API | `api/controller/`, `api/assembler/`, `api/exception/` | REST 端点、DTO↔Domain 转换、全局异常处理（`GlobalExceptionHandler`） |
| 应用 | `application/event/`, `application/category/`, `application/tag/`, `application/auth/` | 用例编排、事务、缓存注解、重名校验 |
| 领域 | `domain/event/`, `domain/category/`, `domain/tag/`, `domain/user/`, `domain/notification/` | 实体 + 仓储接口 + DomainService（纯 POJO，不依赖框架） |
| 基础设施 | `infrastructure/persistence/`, `infrastructure/security/`, `infrastructure/config/`, `infrastructure/scheduled/`, `infrastructure/notification/` | MyBatis-Plus 仓储实现（PO + Mapper）、JWT/Spring Security、Caffeine 缓存、提醒调度、SSE |

依赖方向：API → 应用 → 领域 ← 基础设施

### 前端技术栈
- **UI**: React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui 风格组件（`components/ui/`，基于 Radix UI）
- **动画**: Framer Motion
- **Toast**: sonner
- **日历**: react-big-calendar + dayjs（支持 DnD 拖拽改期/拉伸时长，`CalendarView.tsx`）
- **状态管理（两层分离）**:
  - Zustand: UI 状态，含 `authStore`（认证/用户）、`calendarStore`（日历视图状态）、`settingsStore`（偏好设置）
  - React Query (`@tanstack/react-query`): 服务端数据，`useEvents`/`useCategories`/`useTags` hooks
- **路由**: react-router-dom v7，`LoginPage` 与 `HomePage` 两个页面
- **SDK 生成**: `@hey-api/openapi-ts`，配置在 `openapi-ts.config.ts`，输入 `../specs/openapi.yaml`，输出 `src/api/`

### 持久层
- **MyBatis-Plus**: domain 定义仓储接口（如 `EventRepository`），infrastructure 用 PO + Mapper 实现
- **Flyway 迁移**: `src/main/resources/db/migration/V*__*.sql`，启动时自动执行
- **测试用 H2**: `spring.profiles: test` 启动时用 H2 内存数据库（MySQL 兼容模式），Flyway 关闭

## 认证与多用户数据隔离
- JWT 无状态认证（access 15min + refresh 7d），BCrypt 密码加密
- `JwtAuthFilter` 支持 Bearer header 和 `dsa_sse_session` Cookie 两路 token 来源
- 前端 `authInterceptor.ts`：请求前自动注入 Bearer、过期前 30s 自动续签、401 响应强制登出
- SSE Cookie 鉴权（v3.0+，不再用 `?token=` 查询参数）
- **所有业务表含 `user_id`**，查询通过 `CurrentUserService` 强制按当前用户过滤

## 本地环境
- MySQL 8.0.29 服务名 MySQL80，root/123456
- 开发库 `daily_schedule_dev`，测试库 `daily_schedule_test`（见 `application-dev.yml`）
- JDK 21
- 前端开发代理：Vite `server.proxy` 将 `/api` 转发到 `localhost:8080`

## 配置文件速查

| Profile | 文件 | 数据库 | 用途 |
|---------|------|--------|------|
| dev (默认) | `application-dev.yml` | MySQL `daily_schedule_dev` | 本地开发，打印 SQL 日志 |
| test | `application-test.yml` | H2 内存 `daily_schedule_test` | 单元测试 / 无需 MySQL 启动 |
| prod | `application-prod.yml` | 通过环境变量注入 | Docker 部署 |

JWT、DB 密码等敏感配置通过环境变量注入，开发环境默认值在 `application-dev.yml` 中。

## 当前版本：v3.1（2026-06-09）

核心功能亮点：
- Event `status`（PLANNED/COMPLETED/CANCELLED）闭环，已完成不提醒、不冲突检测
- 日历拖拽改期/拉伸时长 + 一键完成 + 标签筛选 + 键盘快捷键（`N`/`T`/`←→`/`1-4`/`?`/`/`）
- 分类/标签管理弹窗 + 偏好设置 + 周统计 + ICS 导出 + 移动端抽屉侧栏 + zh-cn 周一起始
- Access token 自动续签（30s 窗口预刷新）+ 401 强制登出 + logout 调服务端清 SSE Cookie
- `GET /events` 支持 tagId/status 过滤；仓储层 `EventFilter` 模式
- 测试覆盖 17 类 134 用例（H2 内存数据库）
