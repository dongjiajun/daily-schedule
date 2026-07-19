# Design: 回填 Event Lifecycle Spec

## Context

纯 spec 回填——将 v3.1 引入的 Event 状态机与生命周期行为形式化为 spec。已通过 agent 全面分析了 EventStatus、Event、EventDomainService、EventApplicationService、useToggleEventStatus。

## Goals / Non-Goals

**Goals:**
- 将 Event 生命周期的 6 个核心需求形式化为 WHEN/THEN 场景
- 审计测试覆盖

**Non-Goals:**
- 不修改任何代码
- 不修改 API 契约

## Decisions

无架构决策。纯 spec 回填。

## Risks / Trade-offs

- [spec 与代码行为不一致] → apply 阶段对照源码逐场景确认

## Open Questions

无。
