# Design: <!-- 变更名称 -->

<!-- 参考: docs/architecture.md + CLAUDE.md 技术约定 -->

## Context
<!-- 背景：当前状态、约束条件、利益相关者 -->
<!-- 后端 DDD 四层: API → 应用 → 领域 ← 基础设施 -->
<!-- 前端: React 19 + Zustand (UI) + React Query (服务端数据) -->

## Goals / Non-Goals

**Goals:**
- 

**Non-Goals:**
- 

## Decisions
<!-- 关键技术决策，逐一说明选型理由 + 被否决的备选 -->
<!-- 涉及新依赖时必须写: 为什么选它而非其他 -->

### Decision 1: <!-- 决策名称 -->
- **选择**: 
- **理由**: 
- **备选方案**: <!-- 考虑过但未采纳的方案及原因 -->

## DDD Layer Design

### 领域层 (domain/)
<!-- Entity 变更、DomainService 新增逻辑、Repository 接口、值对象/枚举 -->

### 基础设施层 (infrastructure/)
<!-- persistence: PO/Mapper 变更、Flyway 迁移脚本名
     security: 认证/授权变更
     scheduled: 定时任务变更
     notification: SSE 推送变更 -->

### 应用层 (application/)
<!-- ApplicationService 编排逻辑、事务边界、缓存注解、重名校验 -->

### API 层 (api/)
<!-- Controller (实现 generated 接口)、Assembler (DTO↔Domain)、异常映射 -->

### 前端 (frontend/src/)
<!-- 组件树 (components/*), Zustand store, React Query hooks, 路由 -->

## API Design
<!-- 引用 specs/openapi.yaml 端点，注明请求/响应字段、错误码 -->
<!-- 需新生成 SDK 时标注 -->

## Database Design
<!-- 新表/改表: 列名、类型、约束、默认值、索引
     Flyway 文件名: V5__xxx.sql -->

## Risks / Trade-offs
<!-- [风险] → 缓解措施 -->

## Migration Plan
<!-- 部署步骤、回滚策略、数据迁移注意事项 -->

## Open Questions
<!-- 待确认的技术决策或未知项 -->
