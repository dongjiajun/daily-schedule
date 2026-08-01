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

### 前置条件

启动前确认以下环境就绪：

```powershell
# 1. MySQL 8.0 已运行（Windows 服务名 MySQL80）
sc query MySQL80 | findstr RUNNING

# 2. Java 21+ 已安装（实测 JDK 21/24 均可）
java --version

# 3. Maven 3.8+ 已安装
mvn --version

# 4. Node 22+ 和 pnpm 11+ 已安装
node --version
pnpm --version
```

数据库 `daily_schedule_dev` 需要提前创建（若不存在）：
```powershell
mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS daily_schedule_dev"
```

### 启动步骤

**1. 安装依赖**（仅首次，根目录）

```powershell
pnpm install
```

**2. 启动后端**（打开第一个终端）

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"
```

首次运行需下载依赖 + 生成 OpenAPI 代码，约 2-5 分钟。看到 `Started` 日志表示就绪，访问 http://localhost:8080。

若报 `Port 8080 was already in use`，说明有残留 Java 进程，执行：
```powershell
netstat -ano | findstr :8080          # 找到 PID
taskkill //PID <PID> //F               # 结束进程
```

> **PowerShell 特别注意**：`-D` 参数必须用引号包裹 `"-Dspring-boot.run.profiles=dev"`，否则 PowerShell 会把 `.run.profiles=dev` 错误解析为 Maven 生命周期名。

**3. 启动前端**（打开第二个终端）

```powershell
cd frontend
pnpm run dev
```

访问 http://localhost:5173，注册账号后即可使用。

### 使用 Docker（备选，需 Docker Desktop）

```powershell
docker compose up -d
```

访问 http://localhost:5173。Docker 镜像构建可能较慢，适合不想配置本地环境的情况。

### 常见问题

| 问题 | 解决 |
|------|------|
| 端口 8080 被占用 | `taskkill //PID <PID> //F` 杀掉旧进程 |
| `mvn` 不是可执行命令 | Maven 未安装或未加入 PATH |
| MySQL 连接超时 | `sc start MySQL80` 启动 MySQL 服务 |
| 数据库不存在 | `mysql -u root -p123456 -e "CREATE DATABASE daily_schedule_dev"` |
| `pnpm` 找不到 | `npm install -g pnpm@11` 安装 pnpm |
| 前端端口自动切换 | 5173 被占时 Vite 自动使用 5174/5175，看终端输出确认实际端口 |
| 前端 API 请求 401 | 先注册账号，登录后自动注入 JWT Token |
| JDK 24 上有 WARNING 日志 | 正常现象，不影响运行（Maven 3.8 兼容性警告） |

## 提交前验证

```powershell
cd frontend; pnpm run verify   # lint + TypeScript 检查 + 构建 + 测试
cd backend; mvn test            # 编译 + 单元测试（H2 内存库）
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
| [docs/planning/execution-plan.md](docs/planning/execution-plan.md) | 宏观执行计划（Phase 进度、产品愿景） |
| [specs/openapi.yaml](specs/openapi.yaml) | API 契约（**唯一真相源**） |
| [specs/CHANGELOG.md](specs/CHANGELOG.md) | API 变更日志 |

## 技术栈

| 层 | 技术 |
|----|------|
| 后端框架 | Spring Boot 3.4 / Java 21+ |
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
