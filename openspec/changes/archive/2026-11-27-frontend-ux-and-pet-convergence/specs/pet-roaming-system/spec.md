# Pet Roaming System

## ADDED Requirements

### Requirement: 侧栏与专页避让及回窝去分身
`RoamingPet` 漫步时 SHALL 将侧边栏与移动端菜单按钮标记为 `hard` 避让区；回窝休息时仅以视觉停靠偏移落在小窝外侧（侧栏右侧紧邻小窝处，不遮挡名称、等级、快捷键与登出入口且不越出视口底边），并在底边附近悬停时向上展开状态浮窗；点击唤醒处于避让区内的宠物时 SHALL 推出至主画布；同时 `SidebarPet` 收起迷你精灵展示休眠状态；进入 `/pet` 专页时 SHALL 隐藏游走宠物浮层。

#### Scenario: 漫步避让侧栏且回窝停靠不遮字无双猫
- **WHEN** 游走宠物处于主应用非 `/pet` 页面，侧边栏带 `[data-pet-avoid]` 标记，或宠物处于 `isResting === true` 进窝休息状态
- **THEN** `updateAvoidZones` 为可见避让元素注册带精灵边距的 `strength: 'hard'` 区域；进窝休息时视觉渲染停靠在侧栏右侧小窝旁、底边附近 hover 浮窗向上展开且 `SidebarPet` 渲染小窝休眠指示而非重复 `SvgAvatar`

#### Scenario: 进入宠物专页隐藏游走浮层离开后恢复
- **WHEN** 路由处于 `/pet` 及其子路径
- **THEN** 全局 `<PetSelection />` 保持挂载但 `RoamingPet` 不渲染悬浮宠物精灵（避免与专页 200px 主形象重复出现），切回 `/` 或 `/todo` 后正常恢复显示
