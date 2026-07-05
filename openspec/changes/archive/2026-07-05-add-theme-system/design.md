# Design: 主题系统与可配置设置框架

## Context

当前日程管理系统前端使用 Tailwind CSS 4 + shadcn/ui 风格组件。所有颜色均为硬编码：
- 组件中大量使用 `gray-*` Tailwind 类（`bg-gray-900`、`text-gray-400`、`border-gray-200` 等）
- `calendar.css` 含 31+ 处十六进制/RGBA 色值
- `index.css` body 样式硬编码了 `#f5f6f8` 背景和 `#1a1a2e` 文字色
- 没有任何 CSS 自定义属性、`@theme` 配置或暗色模式基础设施

目标：引入 21 个语义 Token + 5 套主题预设 + 可扩展设置框架，纯前端变更，不影响后端。

## Goals / Non-Goals

**Goals:**
- 全应用级多套配色方案（不仅仅是浅色/深色二元切换）
- 语义化设计 Token 层：组件引用语义类名（`bg-surface`、`text-primary`），不直接引用具体色值
- 运行时即时切换，无需刷新页面
- 主题选择持久化，刷新后保持
- 可扩展的设置框架：未来新增设置项无需重构 store 架构
- 默认主题视觉表现与当前硬编码效果无差异（零视觉回归）

**Non-Goals:**
- 不修改任何后端 Java 代码
- 不修改 API 契约或数据库
- 不引入新的 npm 依赖
- 不改变 react-big-calendar 的事件渲染逻辑
- 不改变语义色（成功绿、错误红、警告黄）在不同主题间的色值

## Decisions

### Decision 1：CSS data-attribute 方案（非 JS ThemeContext）
- **选择**：`html[data-theme="default"]` CSS 选择器 + Tailwind 4 `@theme` 映射
- **理由**：Tailwind 4 原生支持 CSS 自定义属性与 `@theme` 的互操作。CSS 切换是同步的，无 React 渲染延迟，无 FOUC。data-attribute 方案天然支持 SSR/预渲染。
- **备选方案**：React Context ThemeProvider → 拒绝：每个组件需用 `useContext` 访问色值，且无法覆盖 CSS 伪类中的颜色。CSS-in-JS → 拒绝：引入新依赖，与 Tailwind 4 模式冲突。

### Decision 2：语义 Token 数量为 27 个
- **选择**：按颜色角色分类定义 27 个 Token（bg / surface / surface-elevated / sidebar / sidebar-muted / foreground / foreground-secondary / foreground-muted / border / border-subtle / accent / accent-fg / accent-hover / focus / focus-strong / hover / overlay / cal-bg / cal-border / cal-today-bg / cal-today-ring / event-done-text / event-text / grid-dot / gradient-from / gradient-via / gradient-to），覆盖背景/文本/边框/强调/交互/日历/渐变
- **理由**：基于代码库完整颜色审计（100+ 处硬编码）确定的最小并集。既不过少（每种角色有独立 Token），也不过多（避免与 Tailwind 默认 token 体系冲突）。实施过程中根据实际使用场景从计划的 21 个扩展至 27 个。
- **备选方案**：仅 8 个 Token（背景/文本/边框/强调各一个） → 拒绝：无法覆盖日历 css 中的细分变化（今日高亮、事件文本、周末色等）

### Decision 3：语义色（红/绿/黄）独立于主题
- **选择**：success、error、warning 色值在所有主题中保持不变
- **理由**：这些颜色承载语义信息，改变会导致用户认知混乱。例如暗色主题中"删除按钮"如果变成紫色会失去警示含义。
- **备选方案**：semantic colors 也随主题变化 → 拒绝：破坏无障碍和用户直觉

## DDD Layer Design

### 领域层 (domain/)
无变更。纯前端视觉层改动。

### 基础设施层 (infrastructure/)
无变更。

### 应用层 (application/)
无变更。

### API 层 (api/)
无变更。

### 前端 (frontend/src/)

#### 新增文件
```
frontend/src/styles/themes.css          ← 5 套主题的 CSS 自定义属性定义
frontend/src/hooks/useTheme.ts          ← 读取 store → 设置 data-theme
```

#### 文件变更概览
```
index.css              ← @theme 块 + 主题引入
store/settingsStore.ts ← theme 字段 + setTheme
main.tsx               ← 调用 useTheme hook（或内联预渲染脚本）
components/ui/         ← 9 个组件 gray-* → 语义类
components/layout/     ← 6 个布局组件 gray-* → 语义类
components/event/      ← 2 个事件组件 gray-* → 语义类
components/calendar/   ← CalendarView.tsx + calendar.css 变量化
pages/LoginPage.tsx    ← 渐变 + 输入框 + 按钮迁移
```

## API Design

无 API 变更。本变更不触及 `specs/openapi.yaml`。

## Database Design

无数据库变更。

## Risks / Trade-offs

- [风险] `calendar.css` 迁移可能遗漏某些伪类/状态色值 → 缓解：逐个 rule 审计，在 dark 主题下肉眼检查每个日历状态
- [风险] Tailwind 4 `@theme` 与语义 token 的冲突：如果某组件同时用了 `text-muted`（新语义类）和 `text-gray-400`（旧硬编码类），后者可能覆盖前者 → 缓解：全局搜索确保无遗漏的 `gray-*` 残留
- [风险] 登录页渐变特殊，无法用单体 CSS 变量表达 → 缓解：登录页保留 JS 构建渐变字符串的能力，改用主题 token 中的色值

## Migration Plan

1. 先建 tokens + store + hook（基础设施先行，不影响任何显示）
2. 迁移 UI 组件（最底层，被所有组件引用）
3. 迁移布局组件（中层）
4. 迁移日历组件（最复杂，含 calendar.css）
5. 迁移页面组件（最顶层）
6. 全局 lint + build + 冒烟测试

回滚策略：每个 Phase 只有 CSS 变量定义和类名替换，随时可通过 `git checkout` 恢复单个文件。

## Open Questions

无。技术方案经三个并行探索 agent 的代码审计验证后确定。
