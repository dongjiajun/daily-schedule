# Sidebar Navigation

侧边栏模块导航组件，提供已注册模块的纵向可扩展菜单，支持模块切换与活跃态高亮。

## ADDED Requirements

### Requirement: Module Navigation Menu
侧边栏 SHALL 以纵向列表形式展示所有已注册模块的导航入口。

#### Scenario: Display registered modules in vertical list
- **WHEN** 侧边栏渲染且 `moduleRegistry.getAll()` 返回 ≥2 个模块
- **THEN** 导航按钮以纵向列表排列，每项包含图标（16px）+ 模块名称
- **THEN** 所有按钮文本完整可见，不溢出侧边栏边界（`w-60` = 240px）

#### Scenario: Navigate to module on click
- **WHEN** 用户点击某模块导航按钮
- **THEN** 系统跳转至该模块的默认路由（`index` 路由 → `/`，`path` 路由 → `/<path>`）
- **THEN** 移动端调用 `onNavigate()` 关闭抽屉

#### Scenario: Highlight active module
- **WHEN** 当前 URL 匹配某模块的路由
- **THEN** 该模块按钮应用活跃态样式（`bg-accent/10 text-foreground font-medium`）
- **THEN** 其他按钮保持非活跃态（`text-foreground-muted`）

#### Scenario: Single module hides navigation section
- **WHEN** 仅注册 1 个模块
- **THEN** 不渲染模块导航区域，直接显示该模块的 `sidebarComponent`（如有）

### Requirement: Sidebar Module Content Area
侧边栏 SHALL 在导航下方渲染当前活跃模块的 sidebarComponent。

#### Scenario: Render active module sidebar content
- **WHEN** 活跃模块定义了 `sidebarComponent`
- **THEN** 在导航区域下方渲染该组件，传入 `onNavigate` 回调
- **THEN** 组件占据侧边栏剩余高度（`flex-1 overflow-hidden`）

#### Scenario: No sidebarComponent for active module
- **WHEN** 活跃模块未定义 `sidebarComponent`
- **THEN** 显示空白占位区域（`flex-1`），不报错
