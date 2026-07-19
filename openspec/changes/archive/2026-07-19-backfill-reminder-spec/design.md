# Design: 回填 Reminder Scheduler Spec

## Context

纯 spec 回填——将 v1.1 引入、v3.0/v3.1 延续使用的提醒调度系统行为形式化为 spec。已通过 agent 全面分析了 ReminderScheduler、BrowserNotificationService、SseEmitterManager、Event（相关字段）及其测试。

## Goals / Non-Goals

**Goals:**
- 将提醒调度系统 6 个核心需求形式化为 WHEN/THEN 场景
- 审计测试覆盖（17 个场景全部已有覆盖，无盲区）

**Non-Goals:**
- 不修改任何代码
- 不修改 API 契约

## Decisions

### Decision 1: 为此变更跳过完整设计章节
- **选择**: 不写 DDD 分层设计、API 设计、数据库设计章节
- **理由**: 纯 spec 回填，无架构决策

## Risks / Trade-offs

- [spec 与代码行为不一致] → apply 阶段逐场景对照源码确认

## Open Questions

无。
