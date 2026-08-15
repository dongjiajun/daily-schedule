# Proposal: todo-board-mobile

## Why
任务看板在移动端/无鼠标设备上基本不可用:卡片操作按钮 `opacity-0 group-hover:opacity-100`(触摸设备永远看不到)、看板无状态切换控件(仅拖拽一条路径,触摸无法触发 HTML5 DnD)、删除用原生 `window.confirm`(破坏主题一致性);另有同列拖拽把任务甩到列尾的交互缺陷。一次变更补齐移动端可用性并消除原生 confirm。

## What Changes
- 看板卡片操作按钮常驻可见(移除 hover-only 显隐),编辑/删除在触摸设备可直接操作
- 看板卡片新增状态下拉控件(复用 shadcn Select,与列表视图 TaskRow 同款),非拖拽用户可改列
- 删除确认替换:去除 `window.confirm`(TaskCard + TaskRow),改 sonner toast + 撤销 action(重新创建任务并恢复原列)
- 同列拖拽不再改变 sortOrder(修复甩尾):事件处理器检测同列早退
- 同步更新 `TaskCard.test.tsx`(hover 显隐断言失效)

## Capabilities

### New Capabilities
无

### Modified Capabilities
- `task-kanban`: 新增 4 条需求(按钮常驻/卡片状态切换/删除撤销/同列拖拽语义)+ 修改 1 个既有场景(hover 出现按钮 → 直接可见)

## API Contract Impact
无——纯前端交互变更,不动 `specs/openapi.yaml`(撤销复用既有 createTask + moveTask 端点)。

## DDD Layer Impact
无后端层级影响(纯前端变更)。

## Database Impact
无需迁移。

## Impact
- 前端:`modules/todo/components/TaskCard.tsx`、`TaskRow.tsx`、`BoardView.tsx`、`hooks/useTasks.ts`(撤销 hook)
- 测试:`TaskCard.test.tsx` 同步;新增撤销/同列拖拽用例;E2E 移动端视口验证
- 文档:`docs/frontend/component-catalog.md` 核对
