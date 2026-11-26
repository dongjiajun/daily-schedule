# Proposal: frontend-ux-and-pet-convergence

## Why
当前前端在真实使用中有多处交互、布局与工程收口问题：首次登录时 `OnboardingGuide` 与 `PetSelection` 弹窗叠层冲突且 404 状态每 30 秒反复强弹；SSE 通知和全局快捷键挂在日历页导致切页断连；`OrangeCat`/`ShibaInu` SVG 叠加 `transform: scale(size / 100)` 导致 `/pet` 页 200px 形象放大至 400px 溢出遮挡内容、侧栏 40px 缩至 16px；`RoamingPet` 未避让侧边栏与移动端菜单且回窝与侧栏小猫重叠、进入 `/pet` 仍显示浮层分身；`/pet` 页缺乏纵向滚动、未全面收口至设计系统原语且喂食区混入配饰、缺少改名入口。

## What Changes
- **工作流选择**：采用 `spec-driven-custom`（五工件含 `test-plan.md`），理由是本次横跨 `core`、`components/layout`、`calendar`、`todo` 与 `pet` 多模块，涉及多条已有规格调整与新增行为，并需刷新 30 张 `@visual` 视觉回归基线与完整红绿测试账本。
- **引导与领养弹窗串行编排**：`OnboardingGuide` 迁移至 Radix `Dialog`（Portal + 焦点捕获 + `Esc` 关闭）；全局仅在 `RoamingPet` 挂载单份 `<PetSelection />`，等待 `showOnboarding === false` 后按需弹出，主动关闭后设会话态 `selectionDismissed` 免打扰，且 `useMyPet` 在 error（含 404）态暂停 30s 轮询。
- **全站 SSE 常驻与分层快捷键**：将 `useSseNotifications()` 与全局 `?` 快捷键（`useGlobalShortcuts`）上移至 `AppShell`，任务看板新增 `useTodoKeyboardShortcuts`（`N` 新建、`1`/`2` 切视图），`ShortcutsDialog` 按「全局 / 日历视图 / 任务看板」分组展示。
- **宠物 SVG 修复、避让与去分身**：移除 `OrangeCat` / `ShibaInu` 的重复 `transform: scale(size / 100)`；`RoamingPet` 对 `[data-pet-avoid]`（侧边栏与移动端菜单按钮）注册 `hard` 避让区、修正回窝停靠坐标偏移并在 `/pet` 路由隐藏浮层；`SidebarPet` 在窝休息态收起重复迷你精灵，改为窝垫休眠指示。
- **`/pet` 专页重整与原语收口**：补充 `h-full overflow-y-auto` 滚动容器，全面收口至 `Card` / `Skeleton` / `EmptyState` / `Progress` / `Button`；主卡直接提供免费「玩耍」按钮并移除套娃浮窗；`FoodActionList` 严格拆分 `feed`（仅食物）与 `accessory`（配饰装备 + 取下）；物种汉化并接入已有 `useUpdatePet` 内联改名。

## Capabilities

### New Capabilities
（无新增独立能力，全部基于既有能力规格收敛与修复）

### Modified Capabilities
- `pet-selection`: 补充单实例弹窗、等待新手引导结束再自动弹出、及关闭后本会话免打扰与暂停 404 轮询规则
- `pet-avatar`: 规范 `SvgAvatar` 内各物种 SVG 仅通过 `width`/`height` 与 `viewBox` 单次缩放，不叠加 `transform: scale`
- `pet-roaming-system`: 新增侧栏与移动端按钮 `hard` 避让、回窝左侧停靠去分身及 `/pet` 专页自动隐藏游走浮层行为
- `pet-interaction-ui`: 新增 `/pet` 专页设计系统原语收口、喂食/装扮分区去重、直接玩耍与内联改名规范
- `dynamic-module-routing`: 新增全站 `AppShell` 常驻 SSE 通知、跨模块分层快捷键及 Radix `Dialog` 无障碍引导行为

## API Contract Impact
无影响——`specs/openapi.yaml` 保持 `v3.5.1` 不变（改名接口 `PUT /api/v1/pets/me` 与 `useUpdatePet` 已存在）。

## DDD Layer Impact
无——纯前端变更，不修改后端领域、基础设施、应用或 API 层代码。

## Database Impact
无需新增 Flyway 迁移，表结构维持 V1–V10 不变。

## Impact
- **核心与布局**：`frontend/src/core/hooks/{useSseNotifications,useGlobalShortcuts}.ts`、`frontend/src/components/layout/{AppShell,Sidebar,ShortcutsDialog,OnboardingGuide}.tsx`
- **业务模块**：`frontend/src/modules/calendar/**`、`frontend/src/modules/todo/**`、`frontend/src/modules/pet/**`（SVG、store、hooks、组件）
- **测试与基线**：对应 Vitest 单测（含新增 `PetPage.test.tsx`、`useGlobalShortcuts.test.tsx`、`useTodoKeyboardShortcuts.test.tsx`）、Playwright E2E 与 30 张 `@visual` 截图基线
- **文档**：`docs/frontend/component-catalog.md`、`docs/architecture.md`、`AGENTS.md`
