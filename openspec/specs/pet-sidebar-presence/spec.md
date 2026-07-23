# Pet Sidebar Presence

侧边栏底部迷你宠物常驻，提供始终可见的宠物存在感。

## Requirements

### Requirement: Mini Pet in Sidebar Footer
侧边栏底部 SHALL 渲染迷你宠物精灵 + 状态摘要。

#### Scenario: Render mini pet sprite
- **WHEN** 用户已拥有宠物且侧边栏可见
- **THEN** 侧边栏底部用户信息上方渲染 40-50px 迷你宠物精灵
- **THEN** 迷你宠物展示当前情绪状态的简化动画

#### Scenario: Status summary
- **WHEN** 迷你宠物渲染
- **THEN** 精灵旁显示心情/饱食度摘要（迷你进度点而非完整进度条）
- **THEN** 点击迷你宠物跳转到 `/pet` 完整页面

#### Scenario: No pet state
- **WHEN** 用户未创建宠物
- **THEN** 显示引导文案 "领养一只伙伴" + 点击触发 PetSelection Dialog
