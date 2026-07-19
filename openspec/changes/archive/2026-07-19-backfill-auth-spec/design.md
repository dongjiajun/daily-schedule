# Design: 回填 Authentication Spec

## Context

纯 spec 回填——将 v3.0 认证体系的现有行为形式化为 spec。不涉及任何代码、API、数据库变更。已通过 agent 全面分析了 7 个源文件（JwtUtil、JwtAuthFilter、AuthApplicationService、AuthController、authInterceptor.ts、authStore.ts）和 4 个测试类（JwtUtilTest、JwtAuthFilterTest、AuthApplicationServiceTest、CurrentUserServiceTest）。

## Goals / Non-Goals

**Goals:**
- 将认证系统的 8 个核心需求形式化为 WHEN/THEN 场景
- 审计现有测试覆盖，标记盲区

**Non-Goals:**
- 不修改任何代码
- 不补充测试（前端 authInterceptor 盲区属前端范畴，mvn test 无法覆盖）
- 不修改 API 契约

## Decisions

### Decision 1: 不为此变更创建 design.md 的完整章节目录
- **选择**: 跳过后端分层设计、API 设计、数据库设计等章节（标注非必要）
- **理由**: 纯 spec 回填，无架构决策、无实现方案需讨论
- **备选方案**: 写完整 design.md but 内容为空 → 浪费

## Risks / Trade-offs

- [spec 与代码行为不一致的风险] → apply 阶段逐场景对照源码验证

## Open Questions

无。
