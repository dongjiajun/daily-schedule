# Design: 回填 Multi-User Isolation Spec

## Context

纯 spec 回填——将 v1.1 引入、v3.0 强化的多用户数据隔离体系行为形式化为 spec。已通过 agent 全面分析了 JwtAuthFilter、CurrentUserService、所有 ApplicationService、所有 RepositoryImpl、所有 Mapper。

## Goals / Non-Goals

**Goals:**
- 将多用户隔离的 5 个核心需求形式化为 WHEN/THEN 场景
- 审计测试覆盖

**Non-Goals:**
- 不修改任何代码

## Decisions

无架构决策。纯 spec 回填。

## Key Architectural Insight

系统不使用 MyBatis-Plus 全局拦截器——隔离在 ApplicationService 层和 Repository 层逐方法显式控制。`findById` 是唯一不过滤 userId 的查询，归属校验由调用方 `getById()` 执行（返回 404 而非 403）。`findUpcoming` 是另一个例外，但那是系统级调度需求，用户隔离在 dispatch 层实现。

## Risks / Trade-offs

- [findById 不过滤 userId 被误用] → spec 中已明确记录此设计决策
- [spec 与代码行为不一致] → apply 阶段对照源码确认

## Open Questions

无。
