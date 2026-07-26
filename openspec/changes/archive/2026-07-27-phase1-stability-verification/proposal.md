# Proposal: Phase 1 稳定性验证 (M1.6)

## Why

Phase 1 M1.1-M1.5（宠物后端/前端/v2 游走动画、节日引擎/主题/特效、任务看板）已全部实现并归档。需执行 M1.6 Go/No-Go 验证，确认五个验收条件全部达成后，Phase 1（v4.5 情感核心）才算真正完成，才可推进 Phase 2（v5.0 多端+深度）。

当前项目已有 Playwright E2E 基础设施 + CI 集成（`frontend-test-coverage-and-e2e` 已归档），验证手段从手动冒烟演进为自动化 E2E 为主 + 少量手动目视为辅。

## What Changes

- **自动化回归**: 后端 257 用例 + 前端 166 用例全部通过
- **Playwright E2E 验证**: 编写 E2E 用例覆盖日历功能退化检测、宠物事件联动、任务看板 CRUD+拖拽、边界条件。32 项原手动冒烟 checklist 转为自动化
- **手动目视验证**（3 项，无法可靠自动化）: 粒子爆发动画效果、节日主题视觉呈现、`prefers-reduced-motion` 降级行为
- **CI 门禁**: GitHub Actions 四道门禁全绿（含 E2E job）
- **缺陷修复**: 验证过程中暴露的 P0/P1 缺陷

## Capabilities

### New Capabilities

- `phase1-e2e-verification`: 为 Phase 1 Go/No-Go 条件编写 Playwright E2E 验证用例，覆盖日历/宠物/看板/边界条件

### Modified Capabilities

无。不修改现有功能代码。

## API Contract Impact

无变更。不修改 `specs/openapi.yaml`。

## DDD Layer Impact

无变更。不新增/修改任何后端代码。

## Database Impact

无新增 Flyway 迁移。

## Impact

- **测试**: `e2e/` 目录新增 ~5 个验证用例文件
- **CI**: 复用已有 E2E job
- **文档**: 产出验证报告，更新 execution-plan M1.6 状态
