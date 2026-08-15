# Design: todo-board-mobile

<!-- 参考: docs/architecture.md + CLAUDE.md 技术约定 -->

## Context

四线调查（frontend-ux 线 P1/P2/P3）发现任务看板的移动端可用性缺陷与交互正确性问题：

1. **P1**: `TaskCard.tsx:78` 操作按钮 `opacity-0 group-hover:opacity-100`——触摸设备无 hover，按钮永远不可见；`TaskCard.tsx:30-33` 仅 HTML5 原生 DnD（触摸不触发）——看板上无状态切换控件，移动端无法移列（列表视图 TaskRow 有 Select 可用）
2. **P2**: `TaskCard.tsx:91`、`TaskRow.tsx:128` 删除用原生 `window.confirm`——浏览器原生弹窗，破坏主题一致性
3. **P3**: `BoardView.tsx:26-32` 同列 drop 计算 `max(sortOrder)+1`——卡片拖回原列会被甩到列尾，且列内无法排序

约束：纯前端；不新增 shadcn 组件（dropdown-menu 等不存在）；sonner 已在栈中；宠物联动事件（emitTaskCompleted）在列表视图与拖拽路径已有先例。

## Goals / Non-Goals

**Goals:**
- 触摸/键盘用户在看板可完成"改状态、编辑、删除"全套操作
- 消除原生 confirm，删除可撤销
- 同列拖拽不甩尾

**Non-Goals:**
- 列内拖拽重排（drop 位置感知）——需后端 reorder 支持，列为后续变更
- 撤销恢复 sortOrder 精确位置——恢复为原列即可（近似语义，spec 已声明）
- 拖拽在移动端触控化（touch-based DnD 库）——状态 Select 已覆盖移动端移列需求

## Decisions

### Decision 1: 卡片状态切换选型——复用 shadcn Select（与 TaskRow 同款）
- **选择**: TaskCard 底部操作行左侧新增 `Select`（触发项含当前状态图标 + 文字，宽约 100px），`onValueChange` 复用 TaskRow 的 moveTask + emitTaskCompleted 逻辑
- **理由**: 零新组件（dropdown-menu 不存在于 ui/ 目录）；与列表视图交互一致（用户心智一致）；Select 在触摸设备原生可用
- **备选方案**: ① 新建 ui/dropdown-menu 组件再挂"更多"菜单——新增组件 + 二次点击成本;② 长按菜单——移动端专属逻辑,桌面/键盘不可达,复杂度高

### Decision 2: 按钮可见性——直接常驻
- **选择**: 移除 `opacity-0 group-hover:opacity-100`,按钮常驻显示
- **理由**: 最简单且对所有输入方式(触摸/键盘/鼠标)一视同仁;卡片操作区空间充裕(两枚 ghost sm 按钮)
- **备选方案**: ① `focus-visible` 显示——键盘可达但触摸仍不可见;② `@media (hover: none)` 查询——引入两套显隐逻辑,维护成本高

### Decision 3: 删除确认——sonner toast + 撤销(替代 confirm)
- **选择**: 删除立即执行;`useDeleteTask` 扩展为带撤销能力的封装 `deleteWithUndo(task)`:onSuccess 弹 `toast.success('任务已删除', { action: { label: '撤销', onClick } })`;撤销 = `createTask(原字段+tagIds)` → `moveTask(新 id, 原状态+原 sortOrder)`(两次 mutateAsync 链式)
- **理由**: 与 UX 报告 P14(全站无撤销)一次解决;sonner 已在栈中零新依赖;比卡片内联确认条(EventModal 模式)省去组件级确认状态管理,且卡片空间局促
- **备选方案**: ① EventModal 式内联红色确认条——确定性高但卡片内空间局促、需 showConfirm 状态;② 后端软删除——改契约 + 迁移,超范围
- **已知取舍**: 撤销后任务获得新 id,sortOrder 近似恢复(可能列内顺序略变)——spec 已声明,可接受

### Decision 4: 同列拖拽——事件处理器早退
- **选择**: `BoardView` 的 `task-drop` 处理器检测 `task.status === newStatus` 时直接 return(不发 moveTask 请求)
- **理由**: 同列 drop 语义上就是"无变化";零请求、零副作用
- **备选方案**: 用原 sortOrder 重发 moveTask——冗余请求,无收益

## DDD Layer Design

纯前端变更,后端无影响。

### 前端 (frontend/src/)
- `modules/todo/hooks/useTasks.ts`: 新增 `useDeleteTaskWithUndo()`(组合 useDeleteTask/useCreateTask/useMoveTask,导出 `deleteWithUndo(task)`)
- `modules/todo/components/TaskCard.tsx`: 按钮常驻;新增状态 Select(底部操作行);删除改走 deleteWithUndo;移除 `window.confirm`
- `modules/todo/components/TaskRow.tsx`: 删除改走 deleteWithUndo;移除 `window.confirm`
- `modules/todo/components/BoardView.tsx`: task-drop 处理器同列早退

## API Design

无契约变更。复用既有 `POST /tasks`(createTask,撤销重建)与 `PATCH /tasks/{id}/move`(moveTask,撤销恢复原列)。

## Database Design

无。

## Risks / Trade-offs

- [Select 位于 draggable 卡片内,桌面端点击可能误触发 drag] → dragstart 仅在拖动超过浏览器阈值时触发,点击/下拉展开不受影响;E2E 拖拽用例回归验证
- [撤销 = 删除后重建,任务 id 变化、sortOrder 近似] → spec 已声明;引用该任务的关联(暂无)不受影响
- [toast action 在 4s 后自动消失,撤销窗口短] → sonner 默认 4s;可延长 duration 至 8s(实施时定)
- [TaskCard.test.tsx hover 断言失效] → 同步更新为常驻断言

## Migration Plan

- 部署:仅前端产物;`pnpm run verify` + E2E 通过后合入
- 回滚:纯前端代码,回滚提交即恢复

## Open Questions

无
