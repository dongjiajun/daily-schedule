# Proposal: 修复模块路由 & 侧边栏 UI 打磨

## Why

Phase 1 完成后，宠物模块和任务看板模块存在路由渲染失败（空白页）、侧边栏导航布局溢出、宠物面板视觉风格与整体应用割裂三个问题，影响用户体验连贯性，需在 Phase 2 开始前统一修复。

## What Changes

- 修复 Pet/Todo 模块路由空白页：React Router 7.18 `lazy` 与路由系统不兼容，改为 eager loading（与 calendar 模块一致）
- 修复侧边栏模块导航溢出：三模块按钮横向排列超出 `w-60` 宽度，改为纵向列表布局
- 美化宠物面板：统一毛玻璃视觉风格，增大尺寸，改进状态条/气泡主题化

## Capabilities

### New Capabilities

- `sidebar-navigation`: 侧边栏模块导航 — 纵向可扩展菜单，支持模块切换与活跃态高亮
- `pet-panel-theming`: 宠物面板主题化 — 毛玻璃背景、主题色状态条、自适应布局

### Modified Capabilities

- `module-registry`: ModuleDefinition 的路由加载策略从 lazy 调整为 eager（React Router 7.18 兼容性修复）

## API Contract Impact

无。纯前端 UI 修复，不涉及 API 端点变更。

## DDD Layer Impact

无。纯前端变更。

## Database Impact

无。不涉及数据库 schema 变更。

## Impact

| 类别 | 受影响的文件 |
|------|------------|
| 路由修复 | `frontend/src/modules/pet/routes.tsx`, `frontend/src/modules/todo/routes.tsx` |
| 侧边栏 UI | `frontend/src/components/layout/Sidebar.tsx` |
| 宠物面板 | `frontend/src/modules/pet/components/PetPanel.tsx`, `PetAvatar.tsx`, `PetBubble.tsx`, `PetStatus.tsx` |
| 文档 | `docs/frontend/component-catalog.md` |
