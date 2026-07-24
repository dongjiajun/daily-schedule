# 日程管理系统 (Daily Schedule)

Spring Boot 3.4 + React 19 + MySQL 8.0 全栈日程管理应用。

## 功能

- 📅 日程 CRUD + 状态闭环（PLANNED / COMPLETED / CANCELLED）
- 📆 日历月/周/日/议程视图 + 拖拽改期 + 拉伸时长
- 🏷️ 分类与标签管理 + 标签筛选
- 🐾 宠物养成系统 — 橘猫/柴犬自由游走、情绪状态机、粒子特效、日程联动
- 📋 任务看板 — 三列看板视图（TODO/IN_PROGRESS/DONE）+ 列表视图 + 拖拽排序
- 🎨 节日主题引擎 — 国际节日自动检测 + 主题自动切换 + 5 种特效（雪花/烟花/花瓣/灯笼/枫叶）
- 🧩 插件式模块架构 — ModuleRegistry + EventBus 松耦合通信
- 🔐 JWT 认证 + 多用户数据隔离
- 🔔 SSE 实时提醒推送 + 浏览器通知
- 📥 ICS 日历导出
- 📲 PWA 支持 — 离线访问 + 桌面安装
- ⌨️ 键盘快捷键
- 📱 移动端适配

## 快速开始

### Docker（推荐）

```bash
docker-compose up -d
```

访问 http://localhost:5173

### 本地开发

**要求**: JDK 21、Node 22、pnpm 11+、MySQL 8.0

```bash
# 安装依赖（根目录，安装所有 workspace 包）
pnpm install

# 后端
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 前端（新终端）
cd frontend
pnpm run dev
```

## 提交前验证

```bash
cd frontend && pnpm run verify   # lint + TypeScript 检查 + 构建 + 测试
cd backend && mvn test            # 编译 + 单元测试（H2 内存库）
```

CI 四道门禁：版本一致性检查 → 后端 `mvn test` → 前端 `pnpm run lint` → `pnpm run test` → `pnpm run build`（含 SDK freshness check）

## 文档

| 文档 | 内容 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | AI 助手指南（项目约定、开发流程） |
| [docs/architecture.md](docs/architecture.md) | 系统架构 |
| [docs/api/overview.md](docs/api/overview.md) | API 设计概览 |
| [docs/database/schema.md](docs/database/schema.md) | 数据库表结构 |
| [docs/frontend/component-catalog.md](docs/frontend/component-catalog.md) | 前端组件清单 |
| [docs/uml/README.md](docs/uml/README.md) | UML 图 |
| [docs/execution-plan.md](docs/execution-plan.md) | 宏观执行计划（Phase 进度） |
| [docs/vision-roadmap-draft.md](docs/vision-roadmap-draft.md) | 愿景路线图草案 |
| [specs/openapi.yaml](specs/openapi.yaml) | API 契约（**唯一真相源**） |
| [specs/CHANGELOG.md](specs/CHANGELOG.md) | API 变更日志 |

## 技术栈

| 层 | 技术 |
|----|------|
| 后端框架 | Spring Boot 3.4 / Java 21 |
| ORM | MyBatis-Plus 3.5 |
| 数据库迁移 | Flyway |
| 认证 | Spring Security + JWT (HS256) |
| 缓存 | Caffeine |
| 实时推送 | SSE (Server-Sent Events) |
| 前端框架 | React 19 / TypeScript 6 |
| 构建工具 | Vite 8 |
| CSS | Tailwind CSS 4 |
| 状态管理 | Zustand 5 (UI) + TanStack React Query 5 (服务端) |
| 日历组件 | react-big-calendar |
| UI 组件 | Radix UI + shadcn/ui |
| 包管理器 | pnpm 11 (Monorepo workspace) |
| 数据库 | MySQL 8.0 (dev/prod) / H2 (test) |
