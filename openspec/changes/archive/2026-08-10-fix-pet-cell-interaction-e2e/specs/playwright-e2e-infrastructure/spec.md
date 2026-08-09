# Playwright E2E Infrastructure

## Purpose
Playwright E2E 基础设施 — 引入端到端测试框架，编写关键路径 E2E 用例并集成到 CI。本次变更补充节律/时段敏感用例的时钟固定约束。

## ADDED Requirements

### Requirement: 节律/时段敏感用例固定 Date 到明确时段
涉及昼夜节律（night/morning/afternoon/daytime 判定）或依赖本地时间行为的 E2E 用例 SHALL 在场景开始前通过 `page.clock.setFixedTime()` 固定 `Date` 到明确的时段，不得依赖真实运行时刻——否则测试结果随时区/运行时段漂移（如本地凌晨运行落入 night 时段，宠物按节律回窝、格子点击吸引失效）。

#### Scenario: 格内互动用例固定白天时段
- **WHEN** E2E 用例需要验证白天行为（如点击日历格子触发宠物格内互动）
- **THEN** 用例在交互前调用 `page.clock.setFixedTime(白天时段时间)`（仅固定 `Date`，不影响 timers）
- **THEN** 用例断言与真实运行时刻/时区无关，本地与 CI 结果一致

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 格内互动用例固定白天时段 | e2e/pet.spec.ts | 宠物进入日历格子 → 格内互动（pace 启动 + 贴壁旋转出现） | ➕ |
