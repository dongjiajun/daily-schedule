# Pet Event Bridge（事件桥接）— Delta

## MODIFIED Requirements

### Requirement: 模块注册时绑定事件
`petModule.onInit` SHALL 在模块注册时调用 `registerPetEventListeners()`，监听 calendar 事件（`event:completed` / `event:created` / `event:cancelled`）和 todo 事件（`task:completed` / `task:created`），触发宠物动画和气泡消息。

#### Scenario: 日程完成 → 宠物开心
- **WHEN** eventBus emit `{ type: 'event:completed', payload: { eventId: '1', title: '团队周会' } }`
- **THEN** petStore.animationState = 'happy'，petStore.bubbleMessage = '太棒了！「团队周会」已完成！🎉'

#### Scenario: 日程创建 → 宠物开心
- **WHEN** eventBus emit `{ type: 'event:created', payload: { eventId: '2', title: '新任务' } }`
- **THEN** petStore.animationState = 'happy'，bubbleMessage 含日程名称

#### Scenario: 日程取消 → 宠物失落
- **WHEN** eventBus emit `{ type: 'event:cancelled', payload: { eventId: '3', title: '项目评审' } }`
- **THEN** petStore.animationState = 'sad'，bubbleMessage = '「项目评审」取消了… 😿'

#### Scenario: 任务完成 → 宠物开心
- **WHEN** eventBus emit `{ type: 'task:completed', payload: { taskId: '5', title: '提交报告' } }`
- **THEN** petStore.animationState = 'happy'，petStore.bubbleMessage = '任务「提交报告」完成！你真棒！✅'

#### Scenario: 任务创建 → 宠物鼓励
- **WHEN** eventBus emit `{ type: 'task:created', payload: { taskId: '6' } }`
- **THEN** petStore.bubbleMessage = '新任务已就绪，一起加油！💪'（不改变 animationState）

#### Scenario: 动画自动恢复
- **WHEN** 事件触发动画状态变化（happy/sad）
- **THEN** 5 秒后 animationState 自动恢复为 mood/hunger 对应的默认状态

#### Scenario: Todo 模块未注册时兼容
- **WHEN** 用户仅注册 calendar 和 pet 模块（未注册 todo）
- **THEN** 宠物模块正常加载，日历事件联动正常，`task:completed` / `task:created` 事件永不触发，无报错
