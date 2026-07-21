# Tasks: 宠物前端 v1 (Pet Frontend)

## 1. SDK 同步
- [x] 1.1 `cd frontend && pnpm run generate:api` — 刷新 SDK（确保 pet/shop API 可用）

## 2. petStore（Zustand UI 状态）
- [x] 2.1 新建 `modules/pet/store/petStore.ts` — animationState / bubbleMessage / menuOpen / selectionOpen
- [x] 2.2 编写 petStore 测试

## 3. usePet（React Query hooks）
- [x] 3.1 新建 `modules/pet/hooks/usePet.ts` — useMyPet / useCreatePet / useInteract / useShopItems / usePurchase
- [x] 3.2 编写 usePet hooks 测试（mock API + unwrap）

## 4. 事件桥接
- [x] 4.1 新建 `modules/pet/lib/petEventBridge.ts` — 注册/注销 eventBus 监听
- [x] 4.2 编写 petEventBridge 测试（emit → animationState + bubbleMessage）

## 5. 组件开发
- [x] 5.1 新建 `modules/pet/components/PetAvatar.tsx` — useRive Canvas + fallback emoji
- [x] 5.2 新建 `modules/pet/components/PetBubble.tsx` — Framer Motion 对话气泡
- [x] 5.3 新建 `modules/pet/components/PetStatus.tsx` — mood/hunger/coins/level 彩色进度条
- [x] 5.4 新建 `modules/pet/components/PetMenu.tsx` — 互动菜单 Popover（喂食/玩耍/商店）
- [x] 5.5 新建 `modules/pet/components/PetSelection.tsx` — 选择 Dialog（橘猫/柴犬卡片+命名）
- [x] 5.6 新建 `modules/pet/components/PetPanel.tsx` — 悬浮面板容器（组合 Avatar+Bubble+Status+Menu）
- [x] 5.7 新建 `modules/pet/components/PetPage.tsx` — 宠物详情页（大号 Avatar + 完整状态 + 互动历史）

## 6. 路由 + 模块注册
- [x] 6.1 新建 `modules/pet/routes.tsx` — lazy(() => import PetPage)
- [x] 6.2 新建 `modules/pet/index.ts` — ModuleDefinition（id: 'pet', order: 2, petActions: []）
- [x] 6.3 更新 `main.tsx` — `moduleRegistry.register(petModule)`
- [x] 6.4 更新 `AppShell.tsx` — 渲染 `<PetPanel />`（固定右下角）

## 7. 组件测试
- [x] 7.1 编写 PetPanel.test.tsx（无宠物→选择/有宠物→展示）
- [x] 7.2 编写 PetAvatar.test.tsx（动画状态/fallback）
- [x] 7.3 编写 PetStatus.test.tsx（颜色编码/loading/空状态）
- [x] 7.4 编写 PetSelection.test.tsx（物种选择/命名/提交）

## 8. 全量验证
- [x] 8.1 `pnpm run verify` — lint + build + test 全部通过
- [x] 8.2 `cd backend && mvn test` — 后端 230 测试零回归
- [x] 8.3 手动冒烟：选择宠物 → 展示 → 喂食 → 玩耍 → 商店购买 → 完成日程→宠物开心
