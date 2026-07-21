# Proposal: 宠物前端 v1 (Pet Frontend)

## Why
M1.1 已完成宠物后端（6 个 API 端点 + 3 张表），日历模块已 emit 事件，Rive/Lottie 兼容性已验证。现在需要将宠物系统以可插拔模块形式嵌入前端——宠物是所有模块的"体验层"，始终可见、始终交互、始终陪伴。这是产品核心差异化的首次可视化呈现。

## What Changes
- 新建 `modules/pet/` 插件模块：ModuleDefinition + lazy routes
- PetAvatar（Rive Canvas 动画）、PetBubble（对话气泡）、PetMenu（互动菜单）、PetStatus（状态面板）
- 初始宠物选择（PetSelection：橘猫/柴犬二选一 + 命名）
- React Query hooks（usePet — 查询/创建/互动/购买）+ Zustand petStore
- 事件总线监听：收到 `event:completed`/`event:created`/`event:cancelled` → 宠物动画 + 气泡反应
- 注册到 ModuleRegistry：侧边栏入口 + 默认路由
- 前端 SDK 刷新（`generate:api` 获取 pet API）
- **BREAKING**: 无（纯新增模块）

## Capabilities

### New Capabilities
- `pet-avatar`: 宠物形象展示 — Rive 动画（idle/happy/sad 情绪切换），根据 mood/hunger 状态驱动
- `pet-selection`: 初始选择 — 新用户无宠物时展示橘猫/柴犬二选一 + 命名表单
- `pet-interaction-ui`: 互动菜单 — 喂食（选择食物+消耗专注币）/ 玩耍（免费），显示效果反馈
- `pet-status-panel`: 状态面板 — 实时展示 mood/hunger/coins/level/experience，颜色编码（绿=好/黄=警告/红=差）
- `pet-event-bridge`: 事件桥接 — 监听 calendar 事件（完成日程→开心跳跃、取消→失落低头），气泡文案响应

## API Contract Impact
无影响。M1.1 已完成 `specs/openapi.yaml` 更新（6 个 pet/shop 端点），SDK 已生成。本次仅消费已有 API。

## DDD Layer Impact
无影响。纯前端变更。

## Database Impact
无影响。M1.1 已完成 Flyway V5 迁移。

## Impact
- **新增文件**: `modules/pet/` 下 ~12 个文件（index / routes / 4-5 组件 / hooks / store / lib）
- **已有依赖**: `@rive-app/react-canvas`（Spike 已验证）、`framer-motion`（气泡动画）、`sonner`（toast 反馈）
- **修改文件**: `main.tsx`（register pet 模块）、`AppShell.tsx` 或 `Sidebar.tsx`（宠物常驻区域）
- **前端 SDK**: 执行 `generate:api` 刷新（已有 pet 端点）
- **测试**: 新增 4-5 个前端测试文件（组件渲染 / store / event bridge）
- **文档**: `docs/frontend/component-catalog.md`（新宠物组件）
