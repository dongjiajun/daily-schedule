# Design: Phase 1 稳定性验证 (M1.6)

## Context

Phase 1 M1.1-M1.5 全部实现并归档。项目已引入 Playwright E2E 基础设施（`frontend-test-coverage-and-e2e` 已归档），CI 集成已完成（MySQL service container + 后端自动启动）。现有自动化测试: 257 后端 + 166 前端 + 8 E2E 用例。

M1.6 的验证手段从原始设计中的"手动冒烟"演变为"Playwright E2E 自动化为主 + 少量手动目视为辅"。

## Goals / Non-Goals

**Goals:**
- 编写 Playwright E2E 用例，自动化覆盖 Go/No-Go 验收条件中可脚本化的部分（32/35 项）
- 执行自动化回归 + 手动目视验证 3 项无法脚本化的场景
- 产出验证报告，做 Go/No-Go 决策

**Non-Goals:**
- 不新增功能代码
- 不修改 API/数据库

## Decisions

### Decision 1: 验证方法 — Playwright E2E 为主

- **选择**: Playwright E2E 自动化 32 项 + 手动目视 3 项（粒子/主题/降级）
- **理由**: 项目已有 Playwright + CI 集成（MySQL + 后端自动启动），E2E 用例可可靠断言 DOM 状态、Zustand store、HTTP 响应；粒子/主题视觉效果需肉眼确认
- **备选方案**: 纯手动冒烟 — 效率低、不可重复、易遗漏

### Decision 2: 缺陷分级策略

- **选择**: P0（阻断 Go）→ P1（修后 Go）→ P2（记录到 Phase 2）
- **P0 标准**: 核心流程不可用、数据丢失、安全漏洞

### Decision 3: E2E 用例组织

- **选择**: 在已有 `e2e/` 目录下新增 5 个 spec 文件
- **理由**: 复用已有 Playwright 配置、CI 基础设施、测试模式
- **文件规划**: `e2e/calendar-crud.spec.ts`, `e2e/pet-events.spec.ts`, `e2e/todo-crud.spec.ts`, `e2e/edge-cases.spec.ts`, `e2e/holiday-theme.spec.ts`

### Decision 4: Zustand Store 状态断言

- **选择**: 通过 `page.evaluate()` 读取 Zustand store 内部状态
- **理由**: 粒子效果、comboCount、emotionState 等不直接映射到 DOM，需读 store
- **技术**: `await page.evaluate(() => { const s = window.__ZUSTAND_STORES__; ... })` 或在组件中暴露 data-testid

## Verification Design

### 自动化维度（Playwright E2E）

| 维度 | 用例文件 | 覆盖项数 |
|------|---------|---------|
| 日历零退化 | `e2e/calendar-crud.spec.ts` | 9 |
| 宠物事件联动 | `e2e/pet-events.spec.ts` | 7 |
| 看板全功能 | `e2e/todo-crud.spec.ts` | 10 |
| 节日主题 | `e2e/holiday-theme.spec.ts` | 2 |
| 边界条件 | `e2e/edge-cases.spec.ts` | 5 |
| **合计** | 5 文件 | **33** |

### 手动目视维度（3 项）

1. 粒子爆发（stars/hearts）—— 肉眼确认动画正常
2. 节日主题 CSS 变量 —— 肉眼确认配色切换
3. prefers-reduced-motion 降级 —— DevTools 手动切换确认

## DDD Layer Design

不适用。不修改后端代码。

## API Design

不适用。不修改 `specs/openapi.yaml`。

## Database Design

不适用。不新增 Flyway 迁移。E2E 复用 CI 的 MySQL service container。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| E2E flaky（拖拽/动画断言） | Playwright `dragTo` + 自动等待；CI retries: 2 |
| Zustand store 暴露不友好 | 先用 `page.evaluate` 直读；备选：组件加 `data-testid` |
| 粒子效果无法自动化 | 仅手动目视确认 |

## Go/No-Go 判定

| 条件 | 判定方式 | 阈值 |
|------|---------|------|
| 自动化回归 | `mvn test` + `pnpm run test` | 100% |
| 日历零退化 | E2E 用例 | 9/9 |
| 宠物联动 | E2E 用例 + 手动目视粒子 | 7/7 |
| 看板全功能 | E2E 用例 | 10/10 |
| Phase 0 零回归 | 已有 E2E + 自动化测试 | 100% |
| 边界条件 | E2E 用例 | 5/5 |

## Open Questions

无。基础设施已就绪，直接执行。
