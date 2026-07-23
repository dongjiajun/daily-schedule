# Design: 修复模块路由 & 侧边栏 UI 打磨

## Context

Phase 1 交付后，三个前端问题影响用户体验：

1. **路由空白**：Pet/Todo 路由使用 React Router 7.18 `lazy` 加载，与 calendar 修复前的同一问题。Calendar 已通过 eager loading 修复。
2. **导航溢出**：Sidebar 横向排列 3 个模块按钮超出 `w-60`（240px）宽度，`truncate` 因缺少 `min-w-0` 不生效。
3. **宠物面板风格割裂**：PetPanel 使用硬编码白色背景/灰色边框，与 AppShell 的毛玻璃主题（`bg-surface/90 backdrop-blur`）不一致。

约束：不引入新依赖、不修改后端、不涉及 API/数据库。

## Goals / Non-Goals

**Goals:**
- 修复 Pet/Todo 页面空白，使三个模块均能正常渲染
- 修复侧边栏导航溢出，文本完整可见
- 统一宠物面板与整体应用视觉风格

**Non-Goals:**
- 不引入新动画文件（Rive/APNG），仍用 emoji 占位
- 不重构模块路由系统架构
- 不改动任何后端代码

## Decisions

### Decision 1: 路由从 lazy 改为 eager loading
- **选择**：`{ path: 'pet', element: <PetPage /> }`（与 calendar 一致）
- **理由**：React Router 7.18 `lazy` 机制与本项目路由结构存在兼容性问题。Calendar 模块已通过此方案修复（commit f39d635 附近），Pet/Todo 采用相同策略保持一致性。
- **备选方案**：升级 react-router-dom → 被否决（风险大，可能引入新问题，非本次范围）

### Decision 2: 侧边栏导航从横向改纵向
- **选择**：`flex-col gap-1` 纵向列表，每个按钮 `w-full`
- **理由**：纵向排列是侧边栏导航的标准模式（如 VS Code sidebar、Notion sidebar）。彻底解决溢出问题，且利于后续新增模块。
- **备选方案**：横向 `flex-1 min-w-0` + 截断 → 被否决（模块名称截断可读性差，3 个模块以上时更糟糕）

### Decision 3: 宠物面板主题自适应
- **选择**：使用 Tailwind CSS 变量（`bg-surface`、`text-foreground`、`border-border-subtle`）替代硬编码颜色
- **理由**：应用中所有布局组件（AppShell、Sidebar、ErrorBoundary）均使用此模式。CSS 变量由 `useTheme` hook 驱动，自动适配 5 套主题。
- **备选方案**：为 PetPanel 单独定义一套颜色 → 被否决（违背设计一致性）

### Decision 4: PetAvatar 增加浮动动画
- **选择**：使用 framer-motion `animate` 实现持续微浮动（`y` 轴 ±4px 循环）
- **理由**：项目已依赖 `framer-motion`。微动效增加生命力，不依赖外部动画资源。
- **备选方案**：Tailwind `animate-pulse` → 被否决（脉冲动画不够自然，且与 emoji 表情适配差）

## DDD Layer Design

无后端变更。

## 前端设计

### 变更文件清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `modules/pet/routes.tsx` | 修改 | `lazy` → `element: <PetPage />` |
| `modules/todo/routes.tsx` | 修改 | `lazy` → `element: <TodoPage />` |
| `components/layout/Sidebar.tsx` | 修改 | 导航 `flex` → `flex-col` |
| `modules/pet/components/PetPanel.tsx` | 重写 | 主题化容器 + 增大尺寸 |
| `modules/pet/components/PetAvatar.tsx` | 修改 | 增大尺寸 + 浮动动画 |
| `modules/pet/components/PetBubble.tsx` | 修改 | 毛玻璃风格 + 主题文字 |
| `modules/pet/components/PetStatus.tsx` | 修改 | 主题色进度条 |

### 组件树（不变）

```
AppShell
├── Sidebar
│   ├── Logo + 标题
│   ├── 模块导航（纵向列表）        ← 变更：横向 → 纵向
│   ├── ActiveSidebarComponent
│   └── 用户信息 + 登出
├── <Outlet /> (主内容)
├── ShortcutsDialog
└── PetPanel (右下角悬浮)           ← 变更：主题化
```

## API Design

无。

## Database Design

无。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| eager loading 增加初始 bundle 体积 | PetPage + TodoPage 本身很小（无第三方依赖），影响可忽略（~5KB gzip） |
| 纵向导航改变用户操作习惯 | 纵向列表是侧边栏标准范式，3 个模块时学习成本为零 |

## Migration Plan

1. 修改 7 个前端文件
2. 运行 `pnpm run verify` 确认 lint + build + test 通过
3. 重启前端 dev server 验证
4. 无需数据库迁移、无需后端部署

## Open Questions

无。
