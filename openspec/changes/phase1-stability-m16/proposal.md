# Proposal: Phase 1 稳定性验证 (M1.6)

## Why

Phase 1 M1.1-M1.5（宠物后端/前端/v2 游走动画、节日引擎/主题/特效、任务看板）已全部实现并归档。需执行 M1.6 Go/No-Go 验证，确认五个验收条件全部达成后，Phase 1（v4.5 情感核心）才算真正完成，才可推进 Phase 2（v5.0 多端+深度）。

## What Changes

- **全量回归测试**: 后端 257 用例 + 前端 96 用例 全部通过
- **节日主题自切验证**: 手动验证当前日期对应节日主题是否正确自动切换
- **看板全功能验证**: 手动冒烟 Task CRUD + 拖拽排序 + 看板/列表视图切换 + 标签筛选
- **宠物联动端到端**: 验证完成日程/任务后宠物情绪变化 + 粒子爆发效果
- **CI 门禁通过**: GitHub Actions 四道门禁全部通过
- **边界条件检查**: 空数据、超长文本、并发操作的容错表现

## Capabilities

### New Capabilities

无新增代码能力。本变更产出验证报告而非功能模块。

### Modified Capabilities

无修改。本变更仅对已有能力进行系统性验证：

- `pet-interaction-particle`: 验证粒子爆发效果在真实场景中正常触发
- `pet-event-bridge`: 验证 event:completed / task:completed 事件链完整
- `holiday-theme-auto`: 验证节日检测正确性
- `holiday-effects`: 验证特效渲染无性能问题
- `task-crud`: 验证看板 CRUD 全流程
- `task-board-view`: 验证三列看板拖拽排序
- `task-pet-bridge`: 验证任务事件→宠物反应联动

## API Contract Impact

无变更。不修改 `specs/openapi.yaml`。

## DDD Layer Impact

无变更。不新增/修改任何后端代码。

## Database Impact

无新增 Flyway 迁移。

## Impact

- **文档**: 如发现缺陷需修复，则同步更新相关 docs/ 文件
- **CI**: 正常通过（当前已知通过）
- **版本号**: 不变更（当前 v3.3.0）
