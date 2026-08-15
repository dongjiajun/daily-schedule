# Pet Roaming System

## MODIFIED Requirements

### Requirement: Free-Roaming Character
宠物 SHALL 以独立角色精灵（非卡片包裹）形式存在于应用页面中，`pointer-events: none`。初始位置 SHALL 优先取持久化记录（`pet-roaming-state`，恢复时做视口越界钳制，详见 pet-state-persist）；无记录时使用默认位置 (100, 100)。

#### Scenario: Pet renders as standalone sprite
- **WHEN** 用户已拥有宠物且位于主应用页面
- **THEN** 宠物渲染为 50-80px 的角色精灵，无卡片/边框/背景包裹
- **THEN** `pointer-events: none` 确保日历网格和其他 UI 元素可正常交互

#### Scenario: No overlap with calendar cells
- **WHEN** 宠物游走到日历月视图区域
- **THEN** 宠物自动停留在日历网格外部，不遮挡单元格内容
- **THEN** 检测 `.rbc-month-view` 边界并调整路径

#### Scenario: 刷新后从持久化位置恢复
- **WHEN** 用户刷新页面且存在持久化记录
- **THEN** 宠物从上次会话的位置（经视口钳制）继续游走，不回到默认 (100,100)

#### Scenario: 越界持久化位置钳制回视口
- **WHEN** 持久化位置在屏外（如窗口从 2560 宽缩到 1200 宽后刷新）
- **THEN** 宠物位置钳制回当前视口安全范围，保持可见
