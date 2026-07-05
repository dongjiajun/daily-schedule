# Theme System

## ADDED Requirements

### Requirement: 用户可以通过 data-theme 属性切换全应用配色方案
系统 SHALL 在 `<html>` 元素上设置 `data-theme` 属性来控制主题。所有组件颜色 SHALL 通过 CSS 自定义属性（`var(--color-*)`）间接引用，而非硬编码色值。切换 `data-theme` 属性值 SHALL 即时改变所有引用该属性的 UI 元素颜色。

#### Scenario: 用户从浅色主题切换到深色主题
- **WHEN** 用户将主题从 "default" 切换为 "dark"
- **THEN** 页面背景、卡片表面、文本颜色、边框颜色、日历组件颜色在 200ms 内全部转变为深色方案

#### Scenario: 深色主题下刷新页面
- **WHEN** 用户在深色主题下刷新浏览器页面
- **THEN** 页面加载时即应用深色主题（在 React 挂载前通过 `<script>` 读取 localStorage 设置 `data-theme`）

### Requirement: 系统提供五套内置主题预设
系统 SHALL 内置 5 套主题：default（冷灰蓝，当前视觉）、warm（暖琥珀色系）、nature（森林绿色系）、dark（深色模式）、lavender（薰衣草紫色系）。每套主题 SHALL 定义全部 21 个语义 Token。

#### Scenario: 用户浏览所有可用主题
- **WHEN** 用户打开偏好设置面板
- **THEN** 系统展示 5 个主题选项，每个附带名称与颜色预览

#### Scenario: 切换到 warm 主题后创建日程
- **WHEN** 用户在 warm 主题下创建新日程
- **THEN** 日程表单的背景、输入框边框、按钮颜色均呈现暖色系风格

### Requirement: 主题选择持久化到 localStorage
系统 SHALL 将用户的主题选择持久化到 `settingsStore`，通过 Zustand `persist` 中间件写入 localStorage 键 `settings.v1`。用户下次访问时 SHALL 自动恢复其选择的主题。

#### Scenario: 选择 lavender 主题后重新打开应用
- **WHEN** 用户选择了 lavender 主题，关闭浏览器标签页，然后重新打开应用
- **THEN** 应用自动以 lavender 主题渲染

### Requirement: 存在统一的语义化设计 Token 层
系统 SHALL 定义 21 个 CSS 自定义属性作为设计 Token，涵盖：背景（bg / surface / surface-elevated / sidebar / sidebar-muted）、文本（text / text-secondary / text-muted）、边框（border / border-subtle）、强调（accent / accent-fg / focus-ring）、状态（hover-bg / overlay）、日历专用（cal-bg / cal-border / cal-today-bg / cal-today-ring / event-done-text / event-text）、渐变（app-gradient）。所有组件 SHALL 通过 Tailwind 4 `@theme` 生成的 utility 类引用这些 Token。

#### Scenario: 新增第六套主题
- **WHEN** 开发者在 `themes.css` 中新增 `:root[data-theme="ocean"]` 块并定义 21 个 Token 值
- **THEN** 系统无需修改任何组件代码即可使用新主题

### Requirement: 语义色不受主题影响
系统 SHALL 为成功（success）、错误（error）、警告（warning）定义独立的语义色 Token，这些 Token 在所有主题中 SHALL 保持不变，因为它们传达的是语义而非品牌风格。

#### Scenario: 在 dark 主题下查看表单验证错误
- **WHEN** 用户在 dark 主题下提交一个有验证错误的新建日程表单
- **THEN** 错误边框和错误文字仍显示红色系（如 `#ef4444`），不会因暗色主题而变色

### Requirement: 设置框架支持未来扩展
`settingsStore` SHALL 支持在不修改其数据结构架构的情况下添加新设置项。每个设置项 SHALL 包含类型化的状态字段与对应的 setter 函数。

#### Scenario: 未来新增"通知开关"设置项
- **WHEN** 开发者在 `SettingsState` 接口中新增 `notificationsEnabled: boolean` 字段及其 setter
- **THEN** 该设置自动获得 localStorage 持久化，并在偏好设置面板中渲染
