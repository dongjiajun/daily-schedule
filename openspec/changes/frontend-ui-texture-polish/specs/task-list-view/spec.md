# Task List View Delta Specification

## MODIFIED Requirements

### Requirement: 列表视图渲染
前端 SHALL 在列表视图模式下以单列表格形式渲染所有任务，按 `sort_order` 排序；每行显示状态着色图标、标题、`Badge` 优先级标签、等宽 `tabular-nums` 截止日期（逾期红色附 `AlertTriangle`）、柔和标签 chips 及操作按钮；`DONE` 状态任务行标题 SHALL 呈现删除线与弱化文字色以形成完成闭环反馈。

#### Scenario: 列表渲染全部任务
- **WHEN** 用户切换到列表视图，当前有 10 个任务
- **THEN** 显示 10 行任务条目，按 sort_order 排序，已完成任务标题呈删除线弱化态

#### Scenario: 逾期高亮
- **WHEN** 任务 `dueDate` 早于今天且 `status !== 'DONE'`
- **THEN** 截止日期以错误语义色显示并附带警告图标，已完成任务逾期不再标红告警
