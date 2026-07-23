# Tasks: 宠物系统 v2 — 角色化游走 & Lottie 动画引擎

纯前端变更，无后端/数据库/API 变更。

## 1. 游走引擎（shared 包）

- [x] 1.1 新建 `packages/shared/src/pet/roaming.ts` — 游走算法核心
  - `computeNextTarget()`: 随机漫步 / 兴趣点吸引 / 休息点
  - `clampToViewport()`: 边界 clamp
  - `avoidZone()`: 避让日历网格等区域
- [x] 1.2 编写 `roamingEngine.test.ts` — 游走算法单元测试
  - 边界 clamp 正确性
  - 避让区域逻辑正确性
  - 兴趣点权重计算

## 2. 宠物 SVG 插画资产

- [x] 2.1 新建 `modules/pet/assets/svg/orange_cat/` — 橘猫 SVG 组件集
  - idle / happy / sad / hungry / sleepy / excited / idle_variant
- [x] 2.2 新建 `modules/pet/assets/svg/shiba_inu/` — 柴犬 SVG 组件集
  - 同上 7 种情绪
- [x] 2.3 新建 `modules/pet/components/SvgAvatar.tsx` — SVG 插画渲染组件
  - Props: `species`, `emotionState`, `size`, `facing`
  - 根据 species + emotionState 动态选择 SVG 组件
  - CSS `transition` 做情绪切换过渡

## 3. 宠物状态机扩展

- [x] 3.1 扩展 `modules/pet/store/petStore.ts`:
  - 新增 `EmotionState` 类型（8 种状态）
  - 新增 `position`, `targetPosition`, `facing`, `isResting` 状态字段
  - 新增 `comboCount`, `lastInteractionTime`, `idleVariantTimer`
  - 新增 `setEmotion(state, duration?)` action — 定时自动回 idle
  - 新增 `setPosition()`, `setFacing()`, `startResting()`, `wakeUp()` actions

## 4. 游走宠物核心组件

- [x] 4.1 新建 `modules/pet/components/RoamingPet.tsx`:
  - framer-motion `motion.div` 驱动 x/y 位置（`animate: { x, y }`）
  - 集成 PetAvatar + PetBubble + PetStatus (hover)
  - 游走循环: `useEffect` + `setInterval` 调用 roamingEngine
  - 鼠标/手指交互: onClick(摸头) / onDoubleClick(玩耍) / onDragOver(喂食)
  - Hover 显示迷你状态浮窗（3s 自动消失）
  - 情绪状态驱动动画切换

- [x] 4.2 新建 `modules/pet/components/ParticleBurst.tsx`:
  - Props: `origin`, `type` ('hearts'|'stars'|'coins'|'sparkles'), `count`
  - framer-motion `AnimatePresence` 管理粒子生命周期
  - 粒子: 从 origin 向随机方向移动 + 缩放 + 淡出 (duration 1-2s)
  - 数量上限: 15 (Web) / 性能降级检测

- [x] 4.3 新建 `modules/pet/components/SidebarPet.tsx`:
  - 侧边栏底部 40-50px 迷你宠物精灵
  - 迷你情绪动画（简化版 SVG）
  - 心情/饱食度迷你指示点（2 个彩色圆点）
  - 点击跳转 `/pet`

## 5. 组件汰换

- [x] 5.1 修改 `components/layout/AppShell.tsx`:
  - `import { PetPanel }` → `import { RoamingPet }`
  - `<PetPanel />` → `<RoamingPet />`

- [x] 5.2 修改 `components/layout/Sidebar.tsx`:
  - 用户信息上方插入 `<SidebarPet />`（`mt-auto` 上方）

- [x] 5.3 修改 `modules/pet/components/PetAvatar.tsx`:
  - 内部切换: `useLottie` hook（检测 Lottie 可用性）→ SVG fallback
  - Props 扩展: `emotionState`, `facing`
  - 移除 framer-motion float 动画（游走引擎已有位置动画）

- [x] 5.4 删除 `modules/pet/components/PetPanel.tsx`
- [x] 5.5 删除 `modules/pet/components/PetMenu.tsx`
- [x] 5.6 更新 `modules/pet/index.ts` — 移除 PetMenu 引用（如有）

## 6. 事件桥接升级 — 表演序列

- [x] 6.1 重构 `modules/pet/lib/petEventBridge.ts`:
  - `event:completed` → `happy` 或 `excited` (累计 3 连击)
  - `task:completed` → `happy` + particleBurst('stars', 8)
  - `event:created` → `happy` (短促)
  - `task:created` → idle_variant (点头)
  - `event:cancelled` → `sad`
  - 所有事件: 先 triggerAnimation → 300ms 后 showBubble → 500ms 后 particleBurst

## 7. 前端测试

- [x] 7.1 编写 `petStore.test.ts` — 状态机扩展测试
  - setEmotion 定时回 idle
  - combo 计数与 excited 触发
  - startResting / wakeUp 状态切换

- [x] 7.2 编写 `SvgAvatar.test.tsx` — SVG 插画渲染测试
  - 各物种×情绪正确选择组件
  - facing 翻转正确

- [x] 7.3 编写 `RoamingPet.test.tsx` — 游走宠物核心测试
  - position 变化触发 re-render
  - pointer-events: none 确保
  - 交互事件（click/dblclick）

- [x] 7.4 编写 `ParticleBurst.test.tsx` — 粒子组件测试
  - 粒子数量正确
  - 生命周期管理

- [x] 7.5 运行 `pnpm run test` 确认全部通过

## 8. 文档同步

- [x] 8.1 新前端组件 → 更新 `docs/frontend/component-catalog.md`
  - 新增: RoamingPet, ParticleBurst, SidebarPet, SvgAvatar
  - 删除: PetPanel, PetMenu
- [x] 8.2 是否有新实体/表/字段？无
- [x] 8.3 是否有新 API 端点？无
- [x] 8.4 新增 shared 包模块 → 更新 `CLAUDE.md`

## 9. 全量验证

- [x] 9.1 `cd backend && mvn test` — 后端全量（确认无回归）
- [x] 9.2 `cd frontend && pnpm run verify` — lint + tsc + build + test
- [x] 9.3 Smoke test — 浏览器验证:
  - [x] 宠物以独立精灵形态出现在页面（非卡片包裹）
  - [x] 宠物自主游走，不遮挡日历最后一行
  - [x] 点击宠物 → 摸头反应 + ❤️ 粒子
  - [x] 双击宠物 → 玩耍反应
  - [x] 完成日程/任务 → 宠物开心 + 粒子爆发
  - [x] Hover 宠物 → 迷你状态浮窗
  - [x] 侧边栏底部迷你宠物可见，点击跳转 /pet
  - [x] `/pet` 页面大面积展示正常
  - [x] 移动端响应式正常
