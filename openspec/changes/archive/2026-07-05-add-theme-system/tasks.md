# Tasks: 主题系统与可配置设置框架

## 1. Token 基础设施

- [x] 1.1 创建 `frontend/src/styles/themes.css`，定义 5 套主题的 27 个 CSS 自定义属性
- [x] 1.2 重构 `frontend/src/index.css`：添加 `@theme` 块将 Token 映射为 Tailwind utilities，引入 themes.css，body 色改用 `var(--color-bg)` 和 `var(--color-foreground)`

## 2. 设置框架

- [x] 2.1 扩展 `frontend/src/store/settingsStore.ts`：新增 `ThemePreset` 类型、`theme` 字段、`setTheme` action
- [x] 2.2 新建 `frontend/src/hooks/useTheme.ts`：读取 settingsStore.theme → 设置 `document.documentElement.dataset.theme`
- [x] 2.3 在 `index.html` 中注入预渲染脚本：读取 localStorage 设置 `data-theme`，避免 FOUC；`App.tsx` 调用 `useTheme()`

## 3. 主题选择器 UI

- [x] 3.1 在 `ManageDialog.tsx` 偏好设置页新增主题选择 `Select` 组件（5 个选项）

## 4. UI 组件迁移

- [x] 4.1 `button.tsx`：6 个 variant 全部 `gray-*` → 语义类
- [x] 4.2 `dialog.tsx`：overlay/surface/border/text → 语义类
- [x] 4.3 `input.tsx`：border/bg/placeholder/focus-ring → 语义类
- [x] 4.4 `textarea.tsx`：同 input 模式
- [x] 4.5 `select.tsx`：trigger/content/item/separator → 语义类
- [x] 4.6 `switch.tsx`：checked/unchecked/thumb/focus-ring → 语义类
- [x] 4.7 `tabs.tsx`：list/trigger/focus-ring → 语义类
- [x] 4.8 `popover.tsx`：content → 语义类
- [x] 4.9 `label.tsx`：text → 语义类

## 5. 布局组件迁移

- [x] 5.1 `AppShell.tsx`：背景渐变 + 网格纹理 + 主区域卡片 + 移动端按钮 → CSS 变量
- [x] 5.2 `Sidebar.tsx`：侧边栏背景 + 搜索框 + 筛选器 + 统计卡片 + 页脚 → 语义类
- [x] 5.3 `ManageDialog.tsx`：新建区域 + 列表行 + 色板 ring → 语义类
- [x] 5.4 `ShortcutsDialog.tsx`：kbd 标签 → 语义类
- [x] 5.5 `OnboardingGuide.tsx`：步骤颜色 + 遮罩层 + 按钮 → 语义类
- [x] 5.6 `ErrorBoundary.tsx`：文本 + 按钮 → 语义类

## 6. 事件组件迁移

- [x] 6.1 `EventForm.tsx`：表单区域 + 标签 + 输入框错误态 + 色板 ring → 语义类
- [x] 6.2 `EventModal.tsx`：完成徽章 + 操作按钮 + 删除确认 → 语义类

## 7. 日历组件迁移

- [x] 7.1 `CalendarView.tsx`：内联色（事件默认色、完成事件文本、今日高亮、工具栏按钮）→ CSS 变量
- [x] 7.2 `calendar.css`：31+ 处 `#hex`/`rgba()` → `var(--color-*)` 引用

## 8. 页面组件迁移

- [x] 8.1 `LoginPage.tsx`：背景渐变 + 网格纹理 + 浮动圆点 + 输入框（含蓝色聚焦 → 统一为 focus）+ 提交按钮渐变 + 表单卡片 → CSS 变量

## 9. 清理与验证

- [x] 9.1 提取重复的 `PRESET_COLORS` 为共享常量 `lib/colors.ts`
- [x] 9.2 全局搜索残留的 `gray-` 类，补漏 7 处
- [x] 9.3 `npm run build` 通过（lint 的 `any` 错误为预存，非本次变更引入）
- [x] 9.4 冒烟测试：5 套主题正常展示，切换即时生效，刷新持久化
