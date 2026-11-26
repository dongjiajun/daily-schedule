# Design: frontend-ux-and-pet-convergence

## Context
阶段 1 聚焦前端交互、视觉尺寸、避让与设计系统原语收口，契约与后端接口（`v3.5.1`）零变动。必须遵守 `moduleBoundary.test.ts` 模块边界守卫（`core/` 与 `components/layout/` 不得反向 import `modules/`）及 `pnpm run ui:check` 的 token/裸色值/动效门禁。

## Goals / Non-Goals

**Goals:**
- 消除首次登录时 `OnboardingGuide` 与 `PetSelection` 模态叠层锁死及 404 态 30s 反复弹窗。
- 将 SSE 通知与 `?` 帮助上移至 `AppShell`，并为 `/todo` 补齐分层键盘快捷键。
- 彻底修复 `OrangeCat`/`ShibaInu` 双重缩放 Bug，补齐侧栏/移动端按钮避让与回窝/专页去分身。
- `/pet` 页补齐纵向滚动、全面收口至设计系统原语、去重分区并提供直接玩耍与内联改名入口，刷新 30 张 `@visual` 截图基线。

**Non-Goals:**
- 不改造路由 `React.lazy` 懒加载、Rolldown 分包或 PWA 预缓存策略（留待阶段 2 `frontend-bundle-and-lazy-loading`）。
- 不调整后端 API、MyBatis/Flyway schema 或小程序端代码。

## Decisions

### Decision 1: 引导与领养弹窗单实例串行编排 + 404 态停止轮询
- **选择**: `OnboardingGuide` 迁移为 Radix `Dialog`；全应用只在 `RoamingPet` 保留全局唯一 `<PetSelection />`；`RoamingPet` 监听 `useShellStore((s) => s.showOnboarding)` 与 `usePetStore((s) => s.selectionDismissed)`，仅当 `isError && !isLoading && !isFetching && !showOnboarding && !selectionDismissed` 时自动打开；`PetSelection` 关闭触发 `dismissSelection()`；`useMyPet` 在 `query.state.status === 'error'` 时返回 `refetchInterval: false`。
- **理由**: 彻底避免双 `Dialog` 同时挂载导致 Radix 对 `#root` 或兄弟弹窗误设 `aria-hidden` 与 `pointer-events: none`，用户明确关掉领养窗后当前会话免打扰且不产生无意义 404 网络噪音。
- **备选方案**: 在 `useShellStore` 内嵌宠物逻辑 — 否定，会触发 `core/` 反向依赖 `modules/pet/` 违反模块边界。

### Decision 2: SSE 上移至 AppShell + `core/hooks/useGlobalShortcuts` 统一屏蔽守卫
- **选择**: `useSseNotifications()` 与新抽出的 `useGlobalShortcuts()`（及纯函数 `isShortcutBlocked(e)`）放入 `core/hooks/` 并在 `AppShell` 挂载；`calendar/hooks/useKeyboardShortcuts.ts` 与新增 `todo/hooks/useTodoKeyboardShortcuts.ts` 共用 `isShortcutBlocked(e)` 屏蔽输入框与弹窗态。
- **理由**: 既满足切页不断连、全站 `?` 可用，又通过 `core/hooks/` 共享守卫函数保持 `calendar` 与 `todo` 模块完全解耦。
- **备选方案**: 把所有模块快捷键集中写进 `AppShell` — 否定，会导致 `AppShell` 直接 import `calendarStore`/`todoStore` 破坏模块隔离。

### Decision 3: SVG 单次缩放 + 回窝渲染层视觉偏移与避让属性约定
- **选择**: 删除 `OrangeCat.tsx` 与 `ShibaInu.tsx` 上多余的 `transform: scale(size / 100)`；在 `Sidebar` 与移动端抽屉按钮标注 `data-pet-avoid`，由 `RoamingPet` 按精灵尺寸与视口贴边外扩后采集为 `strength: 'hard'` 避让区；回窝停靠仅在 `motion.div` 渲染层偏移至 `homeZone.rect.right + 12`（侧栏右侧紧邻小窝处），不修改 `petStore.position`，点击唤醒若仍在避让区内则推出至主画布，且靠底边时 hover 浮窗自动向上翻转；`SidebarPet` 在 `isResting && !isPetRoute` 时切换为小窝休眠圆标，而 `RoamingPet` 在 `/pet` 路由下不渲染精灵。
- **理由**: 保持 `petStore.position` 与 `RoamingPet` 单测坐标契约、昼夜节律 `svg[data-action="sleep"]` E2E 断言完全兼容，同时消除屏幕同框双猫与文字遮挡。
- **备选方案**: 进窝睡着后卸载 `RoamingPet` 改由 `SidebarPet` 渲染 `sleep` — 否定，会导致移动端抽屉关闭后无法看见夜间入睡宠物。

### Decision 4: `/pet` 专页原语收口与内联改名（无新后端端点）
- **选择**: `PetPage` 增加 `h-full overflow-y-auto`，引入 `Card`/`Skeleton`/`EmptyState`/`Progress`/`Button`/`Input` 原语，去掉嵌套 `PetMenu` 按钮与重复列表，主卡内直接提供免费「玩耍」并挂载本地 `ParticleBurst`/`FloatingText`；`FoodActionList` 支持 `'feed' | 'shop' | 'accessory'` 三模式过滤；信息卡通过已有 `useUpdatePet` 实现 1–30 字内联改名。
- **理由**: 消除列表重复与配饰混入喂食区的困惑，所有交互直接复用既有后端契约。
- **备选方案**: 保留嵌套 `PetMenu` Popover — 否定，专页本身已有完整空间且多一次点击成本。

## DDD Layer Design

### 领域层 / 基础设施层 / 应用层 / API 层
- 本次不涉及后端四层改动。

### 前端 (`frontend/src/`)
- `core/hooks/useSseNotifications.ts`（加 `EventSource` 环境守卫）、`core/hooks/useGlobalShortcuts.ts`（新增）
- `components/layout/{AppShell,Sidebar,ShortcutsDialog,OnboardingGuide}.tsx`
- `modules/calendar/{components/HomePage.tsx,hooks/useKeyboardShortcuts.ts}`
- `modules/todo/{components/TodoPage.tsx,hooks/useTodoKeyboardShortcuts.ts}`
- `modules/pet/{assets/svg/OrangeCat.tsx,assets/svg/ShibaInu.tsx,store/petStore.ts,hooks/usePet.ts,components/{PetSelection,RoamingPet,SidebarPet,PetStatus,FoodActionList,PetPage}.tsx}`

## API Design
无变化（继续复用 `GET/POST/PUT /api/v1/pets/me` 等既有 `v3.5.1` 端点）。

## Database Design
无变化。

## Risks / Trade-offs
- [SVG 尺寸与 `/pet` 卡片改动会使 30 张 `@visual` 截图与旧快照产生像素差异] → 在第 9 步运行 `pnpm run test:e2e` 通过后，执行 `pnpm run test:visual -- --update-snapshots` 刷新并复验全部 30 张基线。
- [E2E `pet.spec.ts` / `pet-accessory.spec.ts` / `rhythm-smoke.spec.ts` 依赖特定选择器与文本] → 保留 `喂食-小鱼干`、`[aria-label^="宠物状态"]`、`取下` 与 `svg[data-action="sleep"]` 等关键语义锚点，并实跑全量 E2E 兜底。
- [`TodoPage` 在 `isLoading` 返回前挂载快捷键 hook] → 确保 `useTodoKeyboardShortcuts` 置于所有 early return 之前，避免 Hook 调用顺序变化报错。

## Review Checklist
- [x] **失败路径是否覆盖？** `OnboardingGuide` `Esc`/关闭按钮、`PetSelection` 空名/超长禁用与关闭免打扰、`useMyPet` 404 停轮询、输入/弹窗态快捷键屏蔽、`/pet` 空态/改名空白禁用均已覆盖。
- [x] **回滚/降级方案是什么？** 纯前端多文件增量优化，无 DB 与 API 契约不可逆改动，可通过单一 Git revert 完整回滚。
- [x] **契约/DB 兼容性影响？** OpenAPI v3.5.1 与 MySQL/H2 schema 零变更，完全兼容。

## Migration Plan
1. 按 `tasks.md` 实施代码与单元测试并翻绿 `test-plan.md`。
2. 运行 `pnpm run verify` + `pnpm run ui:check`。
3. 启动本地后端 `test` profile 与前端 dev server，运行 `pnpm run test:e2e` 与 `pnpm run test:visual -- --update-snapshots && pnpm run test:visual`。
4. 浏览器 smoke 验证、同步文档、运行 `docs:check` 与 `openspec:check`。

## Open Questions
- 无阻塞问题。
