# Tabbed Dialog

通用 TabbedDialog 容器组件，支持以声明方式注册标签页，供各模块复用。

## ADDED Requirements

### Requirement: TabbedDialog Component

`core/components/layout/` SHALL 提供 `TabbedDialog` 通用容器组件。

`TabbedDialog` SHALL 接受以下 props：
- `open: boolean` — 对话框开关状态
- `onOpenChange: (open: boolean) => void` — 状态变更回调
- `title: string` — 对话框标题
- `tabs: Array<{ id: string; label: string; content: React.ReactNode }>` — 标签页定义
- `defaultTab?: string` — 默认激活的标签页 ID（可选）

`TabbedDialog` SHALL 使用：
- `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` (来自 `@/core/components/ui/dialog`)
- `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` (来自 `@/core/components/ui/tabs`)

#### Scenario: 渲染多标签对话框

- **WHEN** TabbedDialog 接收 `tabs: [{ id: 'a', label: '标签A', content: <div>A</div> }, { id: 'b', label: '标签B', content: <div>B</div> }]`
- **THEN** 对话框 SHALL 渲染两个标签按钮
- **THEN** 默认激活第一个标签（`defaultTab` 未指定时）
- **THEN** 点击标签按钮 SHALL 切换显示对应内容

#### Scenario: 指定默认标签

- **WHEN** TabbedDialog 接收 `defaultTab: 'preferences'`
- **THEN** 对话框打开时 SHALL 激活 `preferences` 标签

#### Scenario: 关闭对话框

- **WHEN** 用户点击对话框外部或关闭按钮
- **THEN** `onOpenChange(false)` SHALL 被调用
- **THEN** 对话框 SHALL 关闭

### Requirement: Calendar ManagePanel Uses TabbedDialog

日历模块 SHALL 在 `modules/calendar/components/ManagePanel.tsx` 中使用 `TabbedDialog` 替代原有 `ManageDialog`。

ManagePanel SHALL 注入三个标签页：
- `{ id: 'categories', label: '分类', content: <ItemList /> }` — 分类 CRUD
- `{ id: 'tags', label: '标签', content: <ItemList /> }` — 标签 CRUD
- `{ id: 'preferences', label: '偏好设置', content: <PreferencesPanel /> }` — 默认视图/提醒/时长/主题设置

#### Scenario: 打开管理面板

- **WHEN** 用户在 Sidebar 中点击"管理分类"或"设置"
- **THEN** TabbedDialog SHALL 打开
- **THEN** 若通过"管理分类"触发，SHALL 激活 `categories` 标签
- **THEN** 若通过"设置"触发，SHALL 激活 `preferences` 标签

#### Scenario: 分类和标签管理功能不变

- **WHEN** 用户在管理面板中创建/编辑/删除分类或标签
- **THEN** 行为 SHALL 与迁移前完全一致
- **THEN** React Query cache SHALL 正确更新

### Requirement: Deprecation of Old ManageDialog

`src/components/layout/ManageDialog.tsx` SHALL 被删除，由 `modules/calendar/components/ManagePanel.tsx` + `core/components/layout/TabbedDialog.tsx` 替代。

#### Scenario: 旧 ManageDialog 已移除

- **WHEN** 迁移完成
- **THEN** `src/components/layout/ManageDialog.tsx` SHALL 不存在
- **THEN** 无任何文件 SHALL import `ManageDialog` from `@/components/layout/ManageDialog`

### Requirement: AppShell Uses Module-Based ManageDialog

`AppShell.tsx` SHALL 不在顶层渲染管理对话框。管理对话框 SHALL 由各模块在自身侧边栏内容中按需渲染。

- `AppShell.tsx` SHALL 移除 `<ManageDialog />`
- 日历模块的 `CalendarSidebar` SHALL 负责渲染 `ManagePanel`

#### Scenario: 管理对话框由模块控制

- **WHEN** 用户在日历页面点击"设置"按钮
- **THEN** CalendarSidebar SHALL 渲染 ManagePanel（内部使用 TabbedDialog）
- **THEN** 管理对话框 SHALL 正常显示
- **WHEN** 用户导航到其他模块页面
- **THEN** 日历的 ManagePanel SHALL NOT 渲染（随 CalendarSidebar 卸载）
