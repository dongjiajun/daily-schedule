# Task Pet Bridge（任务宠物联动）

## Purpose
通过 EventBus 将任务模块的关键事件（完成、创建）与宠物动画/气泡联动，实现模块间松耦合的行为驱动。

## Requirements

### Requirement: 任务完成触发宠物开心
当用户完成任务时，系统 SHALL 通过 EventBus 发出 `task:completed` 事件，宠物模块消费该事件后播放开心动画 + 显示气泡消息；后端 SHALL 在任务迁入 DONE 时幂等发放经济奖励（TASK_COMPLETED：+10 专注币 / +20 经验，详见 pet-economy-loop）。

- Todo 模块 SHALL 在任务状态变为 DONE 时调用 `eventBus.emit({ type: 'task:completed', payload: { taskId: string, title: string } })`
- 宠物模块 SHALL 在 `registerPetEventListeners()` 中监听 `task:completed` 事件
- 宠物反应: `animationState = 'happy'`，`bubbleMessage = '任务「{title}」完成！你真棒！✅'`
- 宠物模块 SHALL 在 `task:completed` 时 invalidate 宠物查询缓存，即时刷新后端发放的专注币
- 后端 `TodoApplicationService.moveTask()` SHALL 在非 DONE→DONE 迁移时调用 `grantReward(TASK_COMPLETED, taskId)`（幂等，同事务）
- 5 秒后动画状态自动恢复为默认

#### Scenario: 完成任务 → 宠物开心
- **WHEN** 用户将任务从 TODO 拖到 DONE 列（或下拉框切换为 DONE）
- **THEN** eventBus emit `{ type: 'task:completed', payload: { taskId: '5', title: '提交报告' } }`
- **THEN** 宠物播放开心动画，气泡显示 "任务「提交报告」完成！你真棒！✅"

#### Scenario: 任务完成发放经济奖励
- **WHEN** 用户将任务从非 DONE 状态移入 DONE
- **THEN** 后端在状态更新事务中发放 +10 专注币 / +20 经验（按 taskId 幂等）；前端 invalidate 宠物查询后专注币即时刷新

#### Scenario: 同列重排不重复发放
- **WHEN** 用户在 DONE 列内拖动任务调整排序（状态未变化）
- **THEN** 不触发 `task:completed` 事件，也不重复发放奖励

### Requirement: 任务创建触发宠物鼓励
当用户创建任务时，系统 SHALL 通过 EventBus 发出 `task:created` 事件，宠物模块消费后显示鼓励气泡。

- Todo 模块 SHALL 在任务创建成功后调用 `eventBus.emit({ type: 'task:created', payload: { taskId: string } })`
- 宠物反应: `bubbleMessage = '新任务已就绪，一起加油！💪'`（不改变动画状态，仅显示气泡）

#### Scenario: 创建任务 → 宠物鼓励
- **WHEN** 用户创建新任务 "学习 TypeScript"
- **THEN** eventBus emit `{ type: 'task:created', payload: { taskId: '6' } }`
- **THEN** 宠物气泡显示 "新任务已就绪，一起加油！💪"

### Requirement: 宠物模块无任务事件时兼容
当 Todo 模块未注册时（如未来卸载该模块），宠物模块 SHALL 正常运作，不因缺少 `task:completed` / `task:created` 监听器而报错。

- `registerPetEventListeners()` SHALL 用 try-catch 包裹监听注册
- 事件类型即使永不触发也不影响宠物功能

#### Scenario: Todo 模块未注册
- **WHEN** 用户在 ModuleRegistry 中仅注册 calendar 和 pet 模块
- **THEN** 宠物模块正常加载，日历事件联动正常，无报错
