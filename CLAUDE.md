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
- 前端: React 19 + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion
- 状态管理: Zustand 管 UI 状态，React Query 管服务端数据
- 日历: react-big-calendar + dayjs，CSS 覆盖适配 Tailwind 设计系统
- UI 风格: 现代极简，类似 Notion Calendar / Cron

## 本地环境
- MySQL 8.0.29 服务名 MySQL80，root/123456
- 开发库 daily_schedule_dev，测试库 daily_schedule_test
- JDK 21

## 当前版本: v1.0
