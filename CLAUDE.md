# CLAUDE.md

## 项目概述
日程管理系统 — Spring Boot 3.4 + React 19 + MySQL 8.0

## 关键文档
- 架构说明: docs/architecture.md
- API 契约: specs/openapi.yaml（唯一真相源）
- API 规范: docs/api/overview.md
- UML 设计图: docs/uml/README.md
- 组件清单: docs/frontend/component-catalog.md
- 数据库: docs/database/schema.md

## 技术约定
- 后端: DDD 四层架构，API 层→应用层→领域层←基础设施层
- 持久层: MyBatis-Plus，domain 定义仓储接口，infrastructure 实现
- API: 契约驱动，specs/openapi.yaml → Maven 插件生成 Java 接口 + DTO
- Controller: 实现 generated/api/ 下的接口，编译期强制契约同步
- 安全: Spring Security + JWT 无状态认证，多用户数据隔离（user_id）
- 前端: React 19 + TypeScript + Tailwind CSS + Framer Motion + sonner Toast
- 状态管理: Zustand 管 UI 状态（含 authStore），React Query 管服务端数据
- 日历: react-big-calendar + dayjs，支持拖拽调整日程时间
- UI 风格: 现代极简，类似 Notion Calendar / Cron
- 缓存: Caffeine 本地缓存分类/标签列表
- 容器化: Dockerfile + docker-compose（MySQL + 后端 + 前端 Nginx）

## 本地环境
- MySQL 8.0.29 服务名 MySQL80，root/123456
- 开发库 daily_schedule_dev，测试库 daily_schedule_test
- JDK 21

## 当前版本: v3.1

v3.1 围绕用户体验闭环演进：
- Event 新增 status（PLANNED/COMPLETED/CANCELLED），支持一键标记完成；已完成不提醒、不参与冲突检测
- `GET /events` 新增 tagId / status 过滤；仓储层重构为 EventFilter 模式便于扩展
- 前端：日历拖拽改期/拉伸时长、标签筛选、分类/标签管理弹窗、偏好设置（默认视图/提醒/时长）、
  键盘快捷键（N/T/←→/1-4//?）、周统计、ICS 导出、移动端抽屉侧栏、zh-cn 周一起始
- 认证体验：access token 过期前自动续签（不再 15 分钟掉线）、401 强制登出、logout 调服务端清 SSE Cookie

v3.0 完成多用户认证契约闭环 + Auth 端点入约 + SSE Cookie 鉴权 + AuthApplicationService 重构。

API 契约变更必须同步更新 `specs/CHANGELOG.md` 与三处版本号（`specs/openapi.yaml`、`backend/pom.xml`、`frontend/package.json`）。
