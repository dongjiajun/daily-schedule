# Module-Driven Navigation

Sidebar 基于 `moduleRegistry.getAll()` 动态生成导航项，支持多模块切换。

## ADDED Requirements

### Requirement: Module Navigation Items

Sidebar SHALL 在顶部渲染模块导航区，遍历 `moduleRegistry.getAll()` 生成导航按钮。

- 每个已注册模块 SHALL 渲染为一个导航按钮
- 导航按钮 SHALL 显示模块的 `icon` 组件
- 导航按钮的 tooltip SHALL 显示模块的 `name`
- 导航项 SHALL 按模块 `order` 升序排列
- 点击导航按钮 SHALL 导航到该模块的默认路由

#### Scenario: 单模块时显示日历导航

- **WHEN** 仅日历模块已注册（当前 Phase 0 状态）
- **THEN** Sidebar 顶部 SHALL 显示一个日历图标导航按钮
- **THEN** 该按钮 SHALL 处于活跃状态（当前路由匹配）

#### Scenario: 多模块时显示多个导航项

- **WHEN** 日历（order: 1）和任务（order: 2）模块已注册
- **THEN** Sidebar 顶部 SHALL 显示两个导航按钮（日历在前，任务在后）
- **THEN** 当前活跃模块的导航按钮 SHALL 高亮显示

### Requirement: Module Sidebar Content Area

Sidebar SHALL 在导航区下方渲染当前活跃模块的侧边栏内容。

- `ModuleDefinition` SHALL 新增可选字段 `sidebarComponent?: React.ComponentType<{ onNavigate?: () => void }>`
- Sidebar SHALL 根据当前路由匹配的模块 ID，渲染对应模块的 `sidebarComponent`
- 若当前活跃模块未提供 `sidebarComponent`，内容区 SHALL 为空

#### Scenario: 日历模块侧边栏内容渲染

- **WHEN** 用户当前在日历页面（`/`）
- **THEN** Sidebar 内容区 SHALL 渲染日历模块的 `CalendarSidebar` 组件
- **THEN** CalendarSidebar SHALL 包含新建按钮、搜索框、分类/标签筛选、周统计

#### Scenario: 无 sidebarComponent 的模块

- **WHEN** 用户导航到未提供 `sidebarComponent` 的模块
- **THEN** Sidebar 内容区 SHALL 为空
- **THEN** 导航按钮 SHALL 正常显示

### Requirement: CalendarSidebar Component

日历模块 SHALL 在 `modules/calendar/components/CalendarSidebar.tsx` 中提供其专属侧边栏内容。

CalendarSidebar SHALL 包含：
- 新建日程按钮（调用 `calendarStore.openCreateModal`）
- 搜索框（绑定 `calendarStore.searchKeyword`）
- 分类筛选列表（使用 `useCategories` hook）
- 标签筛选列表（使用 `useTags` hook）
- 本周统计（使用 `useEvents` hook）
- 设置/导出/快捷键/指南按钮
- 移动端关闭回调（`onNavigate` prop）

#### Scenario: 日历侧边栏筛选功能

- **WHEN** 用户在 CalendarSidebar 点击某个分类
- **THEN** `calendarStore.setFilterCategory` SHALL 被调用
- **THEN** 日历视图 SHALL 按选中分类筛选日程

#### Scenario: 移动端导航后关闭抽屉

- **WHEN** 用户在移动端点击"新建日程"按钮
- **THEN** CalendarSidebar SHALL 调用 `onNavigate?.()` 关闭移动端抽屉
- **THEN** 日程创建弹窗 SHALL 打开

### Requirement: Global Logout Button

Sidebar 底部 SHALL 保留用户信息 + 登出按钮，不依赖任何模块。

- 用户显示名 SHALL 从 `authStore.user` 读取
- 登出 SHALL 调用 `authStore.logout()`

#### Scenario: 登出按钮始终可见

- **WHEN** 用户登录后打开任意模块页面
- **THEN** Sidebar 底部 SHALL 显示用户名 + 登出按钮
- **THEN** 点击登出 SHALL 清除 token 并跳转登录页
