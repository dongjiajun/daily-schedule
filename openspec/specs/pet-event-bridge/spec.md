# Pet Event Bridge（事件桥接）

## Purpose
通过 EventBus 监听日历/任务模块事件，驱动宠物动画反应和气泡消息，实现模块间松耦合联动。

## Requirements

### Requirement: 模块注册时绑定事件
`petModule.onInit` SHALL 在模块注册时调用 `registerPetEventListeners()`，监听 calendar 事件（`event:completed` / `event:created` / `event:cancelled`）、todo 事件（`task:completed` / `task:created`）、habit 事件（`habit:checked`）、focus 事件（`focus:completed`）和 user 事件（`user:dailyCheckin`），触发宠物动画和气泡消息。habit/focus/user 事件 SHALL 额外调用奖励 API 发放奖励（详见 pet-economy-loop）；`event:completed` / `task:completed` 监听器 SHALL 额外 invalidate 宠物查询缓存以即时刷新专注币。

#### Scenario: 日程完成 → 宠物开心
- **WHEN** eventBus emit `{ type: 'event:completed', payload: { eventId: '1', title: '团队周会' } }`
- **THEN** petStore.animationState = 'happy'，petStore.bubbleMessage = '太棒了！「团队周会」已完成！🎉'

#### Scenario: 日程创建 → 宠物开心
- **WHEN** eventBus emit `{ type: 'event:created', payload: { eventId: '2', title: '新任务' } }`
- **THEN** petStore.animationState = 'happy'，bubbleMessage 含日程名称

#### Scenario: 日程取消 → 宠物失落
- **WHEN** eventBus emit `{ type: 'event:cancelled', payload: { eventId: '3', title: '项目评审' } }`
- **THEN** petStore.animationState = 'sad'，petStore.bubbleMessage = '「项目评审」取消了… 😿'

#### Scenario: 任务完成 → 宠物开心
- **WHEN** eventBus emit `{ type: 'task:completed', payload: { taskId: '5', title: '提交报告' } }`
- **THEN** petStore.animationState = 'happy'，petStore.bubbleMessage = '任务「提交报告」完成！你真棒！✅'

#### Scenario: 任务创建 → 宠物鼓励
- **WHEN** eventBus emit `{ type: 'task:created', payload: { taskId: '6' } }`
- **THEN** petStore.bubbleMessage = '新任务已就绪，一起加油！💪'（不改变 animationState）

#### Scenario: 习惯打卡 → 奖励发放
- **WHEN** eventBus emit `{ type: 'habit:checked', payload: { habitId: 'h1' } }`
- **THEN** 调用奖励 API（HABIT_CHECKED, refId="h1"）；granted=true 时触发金币粒子并刷新宠物数据

#### Scenario: 专注完成 → 奖励发放
- **WHEN** eventBus emit `{ type: 'focus:completed', payload: { duration: 1500, sessionId: 'f-9' } }`
- **THEN** 调用奖励 API（FOCUS_COMPLETED, refId="f-9"）；granted=true 时触发金币粒子并刷新宠物数据

#### Scenario: 每日签到 → 奖励发放
- **WHEN** eventBus emit `{ type: 'user:dailyCheckin', payload: { timestamp: 1753500000000 } }`
- **THEN** 调用奖励 API（DAILY_CHECKIN, refId=当日日期）；granted=true 时触发金币粒子并刷新宠物数据

#### Scenario: Todo 模块未注册时兼容
- **WHEN** 用户仅注册 calendar 和 pet 模块（未注册 todo）
- **THEN** 宠物模块正常加载，日历事件联动正常，`task:completed` / `task:created` 事件永不触发，无报错

#### Scenario: 动画自动恢复
- **WHEN** 事件触发动画状态变化（happy/sad）
- **THEN** 5 秒后 animationState 自动恢复为 mood/hunger 对应的默认状态

### Requirement: 模块注销时解绑事件
`petModule.onDestroy` SHALL 调用所有 `eventBus.off()` 解绑，防止内存泄漏。

#### Scenario: 模块注销
- **WHEN** `moduleRegistry.unregister('pet')` 或应用卸载
- **THEN** 不再响应 calendar 和 todo 事件
