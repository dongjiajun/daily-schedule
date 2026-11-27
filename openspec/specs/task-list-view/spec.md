# Task List View（列表视图）

## Purpose

任务列表视图：提供任务列表的表格化展示——排序控件、状态下拉快速切换、过期高亮，作为任务看板的补充视图。

## Requirements

### Requirement: 列表视图渲染
前端 SHALL 在列表视图模式下以单列表格形式渲染所有任务，按 `sort_order` 排序；每行显示状态着色图标、标题、`Badge` 优先级标签、等宽 `tabular-nums` 截止日期（逾期红色附 `AlertTriangle`）、柔和标签 chips 及操作按钮；`DONE` 状态任务行标题 SHALL 呈现删除线与弱化文字色以形成完成闭环反馈。

#### Scenario: 列表渲染全部任务
- **WHEN** 用户切换到列表视图，当前有 10 个任务
- **THEN** 显示 10 行任务条目，按 sort_order 排序，已完成任务标题呈删除线弱化态

#### Scenario: 逾期高亮
- **WHEN** 任务 `dueDate` 早于今天且 `status !== 'DONE'`
- **THEN** 截止日期以错误语义色显示并附带警告图标，已完成任务逾期不再标红告警

### Requirement: 列表排序
系统 SHALL 支持在列表视图中按优先级、截止日期、创建时间排序。

- 排序控件位于列表顶部，默认按 `sort_order` 排序
- 排序选项: 优先级（高→低）、截止日期（早→晚）、创建时间（新→旧）
- 排序 SHALL 为纯前端操作（不触发 API 请求）

#### Scenario: 按优先级排序
- **WHEN** 用户选择排序方式 "优先级（高→低）"
- **THEN** 任务列表实时按 URGENT > HIGH > MEDIUM > LOW 排序显示

#### Scenario: 按截止日期排序
- **WHEN** 用户选择排序方式 "截止日期（早→晚）"
- **THEN** 有截止日期的任务按日期排序，无截止日期的排在末尾

### Requirement: 列表快速状态切换
系统 SHALL 支持在列表视图中通过下拉框快速切换任务状态。

- 每行任务含状态下拉框（TODO / IN_PROGRESS / DONE）
- 切换后 SHALL 调用 `PATCH /tasks/{id}/move` 更新状态
- SHALL 使用 React Query optimistic update

#### Scenario: 下拉框切换状态
- **WHEN** 用户在列表中将任务 A 的状态从 TODO 改为 DONE
- **THEN** `PATCH /tasks/1/move` 发送 `{ status: "DONE", sortOrder: <DONE列最大+1> }`
- **THEN** 任务行状态图标立即变为 ✅
