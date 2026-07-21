# Pet Event Bridge（事件桥接）

## ADDED Requirements

### Requirement: 模块注册时绑定事件
`petModule.onInit` SHALL 在模块注册时调用 `registerPetEventListeners()`，监听 calendar 事件（`event:completed` / `event:created` / `event:cancelled`），触发宠物动画和气泡消息。

#### Scenario: 日程完成 → 宠物开心
- **WHEN** eventBus emit `{ type: 'event:completed', payload: { eventId: '1', title: '团队周会' } }`
- **THEN** petStore.animationState = 'happy'，petStore.bubbleMessage = '太棒了！「团队周会」已完成！🎉'

#### Scenario: 日程创建 → 宠物开心
- **WHEN** eventBus emit `{ type: 'event:created', payload: { eventId: '2', title: '新任务' } }`
- **THEN** petStore.animationState = 'happy'，bubbleMessage 含日程名称

#### Scenario: 日程取消 → 宠物失落
- **WHEN** eventBus emit `{ type: 'event:cancelled', payload: { eventId: '3', title: '项目评审' } }`
- **THEN** petStore.animationState = 'sad'，bubbleMessage = '「项目评审」取消了… 😿'

#### Scenario: 动画自动恢复
- **WHEN** 事件触发动画状态变化（happy/sad）
- **THEN** 5 秒后 animationState 自动恢复为 mood/hunger 对应的默认状态

### Requirement: 模块注销时解绑事件
`petModule.onDestroy` SHALL 调用所有 `eventBus.off()` 解绑，防止内存泄漏。

#### Scenario: 模块注销
- **WHEN** `moduleRegistry.unregister('pet')` 或应用卸载
- **THEN** 不再响应 calendar 事件

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| completed→happy | petEventBridge.test.ts | shouldTriggerHappyOnCompleted | ➕ |
| cancelled→sad | petEventBridge.test.ts | shouldTriggerSadOnCancelled | ➕ |
| 动画恢复 | petEventBridge.test.ts | shouldResetAnimationAfterDelay | ➕ |
| 注销解绑 | petEventBridge.test.ts | shouldUnbindOnDestroy | ➕ |
