# Task Board View（看板视图）

## Purpose
提供任务看板的可视化拖拽交互——三列布局（TODO/IN_PROGRESS/DONE）、HTML5 拖拽换列、视图切换、内联快速创建。

## Requirements

### Requirement: 看板三列布局
前端 SHALL 在看板视图中展示三列：📋 待办（TODO）、🚀 进行中（IN_PROGRESS）、✅ 已完成（DONE），每列渲染对应状态的任务卡片。

- 状态列定义: `TODO` → 左侧、`IN_PROGRESS` → 中间、`DONE` → 右侧
- 每列 SHALL 显示任务数量徽章
- 空列 SHALL 显示占位提示文字（如 "暂无待办任务"）
- 任务卡片 SHALL 显示：标题、优先级标签（颜色区分）、截止日期（逾期标红）、关联标签 chip

#### Scenario: 三列各含任务
- **WHEN** 用户有 3 个 TODO、2 个 IN_PROGRESS、5 个 DONE 任务
- **THEN** 三列分别显示 3、2、5 张任务卡片
- **THEN** 每列标题显示对应数量

#### Scenario: 空列占位
- **WHEN** 用户没有任何 `IN_PROGRESS` 状态的任务
- **THEN** 中间列显示 "暂无进行中任务" 占位文字

### Requirement: 拖拽换列
系统 SHALL 支持用户通过拖拽将任务卡片从一个状态列移动到另一个状态列（HTML5 Drag & Drop API）。

- 拖拽开始时 SHALL 高亮目标列（蓝色虚线边框）
- 释放到目标列后 SHALL 调用 `PATCH /tasks/{id}/move` 更新任务状态和 `sort_order`
- move API 请求体: `MoveTaskRequest: { status: string, sortOrder: number }`
- 拖拽结束 SHALL 立即更新 React Query cache（optimistic update），失败时回滚

#### Scenario: 拖拽 TODO → IN_PROGRESS
- **WHEN** 用户将 TODO 列中的任务卡片拖放到 IN_PROGRESS 列
- **THEN** `PATCH /tasks/1/move` 发送 `{ status: "IN_PROGRESS", sortOrder: 0 }`
- **THEN** 任务卡片立即出现在 IN_PROGRESS 列（optimistic update）

#### Scenario: 拖拽到同一列（无变化）
- **WHEN** 用户将任务卡片在 TODO 列内拖动（未跨列）
- **THEN** 不发送 API 请求，卡片回弹到原位置

#### Scenario: 拖拽失败回滚
- **WHEN** move API 返回错误（网络异常/404 等）
- **THEN** React Query cache 回滚到拖拽前状态
- **THEN** sonner Toast 显示 "移动失败，请重试"

### Requirement: 看板视图切换
前端 SHALL 提供"看板"和"列表"两种视图模式，默认显示看板视图。切换按钮位于模块顶部工具栏。

- 视图偏好 SHALL 记录在 `todoStore.viewMode: 'board' | 'list'`
- 切换视图 SHALL 不触发 API 请求（纯 UI 状态变更）

#### Scenario: 切换到列表视图
- **WHEN** 用户点击"列表"按钮
- **THEN** 看板三列替换为单列列表视图
- **THEN** `todoStore.viewMode = 'list'`

### Requirement: 看板内快速创建
系统 SHALL 支持在每列底部点击"+ 新建任务"按钮快速创建任务（状态预填为该列对应状态）。

- 点击后 SHALL 弹出内联输入框（非模态弹窗）
- 输入标题后回车创建，`status` 自动设为该列状态
- 创建成功后 SHALL 发送 `task:created` 事件

#### Scenario: 在 TODO 列快速创建
- **WHEN** 用户点击 TODO 列底部的"+ 新建任务"，输入"整理文档"并回车
- **THEN** `POST /tasks` 发送 `{ title: "整理文档", status: "TODO" }`
- **THEN** 新任务卡片立即出现在 TODO 列
