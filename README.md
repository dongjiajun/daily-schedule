# 日程管理系统 (Daily Schedule)

Spring Boot 3.4 + React 19 + MySQL 8.0 全栈日程管理应用。

## 功能

- 📅 日程 CRUD + 状态闭环（PLANNED / COMPLETED / CANCELLED）
- 📆 日历月/周/日/议程视图 + 拖拽改期 + 拉伸时长
- 🏷️ 分类与标签管理 + 标签筛选
- 🔐 JWT 认证 + 多用户数据隔离
- 🔔 SSE 实时提醒推送 + 浏览器通知
- 📥 ICS 日历导出
- 🎨 5 套主题配色方案
- ⌨️ 键盘快捷键
- 📱 移动端适配

## 快速开始

### Docker（推荐）

```bash
docker-compose up -d
```

访问 http://localhost:5173

### 本地开发

**要求**: JDK 21、Node 22、MySQL 8.0

```bash
# 后端
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 前端（新终端）
cd frontend
npm install
npm run dev
```

## 提交前验证

```bash
cd frontend && npm run verify   # lint + TypeScript 检查 + 构建 + 测试
cd backend && mvn test           # 编译 + 单元测试（H2 内存库）
```

## 文档

| 文档 | 内容 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | AI 助手指南（项目约定、开发流程） |
| [docs/architecture.md](docs/architecture.md) | 系统架构 |
| [docs/api/overview.md](docs/api/overview.md) | API 设计概览 |
| [docs/database/schema.md](docs/database/schema.md) | 数据库表结构 |
| [docs/frontend/component-catalog.md](docs/frontend/component-catalog.md) | 前端组件清单 |
| [docs/uml/README.md](docs/uml/README.md) | UML 图 |
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
| 数据库 | MySQL 8.0 (dev/prod) / H2 (test) |
