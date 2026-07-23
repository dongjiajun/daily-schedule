# Proposal: 宠物系统 v2 — 角色化游走 & Lottie 动画引擎

## Why

Pet v1（emoji 占位 + 右下角固定卡片）完成了"有宠物"的基础闭环，但离路线图中"情感驱动、宠物是体验层"的愿景差距大。宠物应该是页面上自由漫步的**角色**，而非嵌在卡片里的进度条。三个核心问题：1) 固定卡片遮挡日历月视图 2) emoji 缺乏生命力 3) 交互方式工具化（菜单+按钮）而非情感化（触摸+表演）。

## What Changes

- **废弃** PetPanel 右下角固定卡片，改为 RoamingPet 游走角色
- **引入** Lottie 动画引擎替代 emoji 占位（优先 SVG 插画过渡，后续 Lottie 升级）
- **重构** 交互模型：点击摸头 / 双击玩耍 / 拖拽食物喂食 / Hover 状态浮窗
- **新增** 情绪状态机：idle → idle_variant / happy / sad / hungry / sleepy / excited
- **新增** 互动粒子爆发（hearts / stars / coins / sparkles）
- **新增** 宠物主动行为（定时说话、条件触发、空闲小动作）
- **新增** 侧边栏迷你宠物常驻
- **废弃** PetMenu Popover，改为直接触摸宠物触发

## Capabilities

### New Capabilities

- `lottie-animation-engine`: Lottie 动画运行时集成，管理动画片段切换与情绪状态映射
- `pet-roaming-system`: 宠物游走引擎 — 随机漫步、兴趣点吸引、边界避让、休息点偏好
- `pet-emotion-state-machine`: 情绪状态机 — 8 种情绪状态 + 平滑过渡 + 条件触发
- `pet-interaction-particle`: 互动粒子爆发系统 — 短暂局部特效（爱心/星星/金币）
- `pet-sidebar-presence`: 侧边栏宠物常驻 — 迷你精灵 + 状态摘要

### Modified Capabilities

- `pet-panel-theming`: PetPanel 组件废弃，视觉风格逻辑迁移至 RoamingPet
- `pet-event-bridge`: 事件桥接从"气泡文字"升级为"表演序列编排"
- `sidebar-navigation`: 侧边栏底部新增迷你宠物区域

## API Contract Impact

无。仍使用现有 `/pets/me`、`/pets/me/interact`、`/shop/items`、`/shop/purchase` 端点。

## DDD Layer Impact

无后端变更。所有交互逻辑复用现有 `PetApplicationService` / `PetDomainService`。

## Database Impact

无。

## Impact

| 类别 | 受影响的文件 |
|------|------------|
| 新增核心 | `core/lib/lottieEngine.ts`, `core/lib/roamingEngine.ts`, `core/lib/particleBurst.ts` |
| 新增组件 | `modules/pet/components/RoamingPet.tsx`, `PetIdleVariant.tsx`, `ParticleBurst.tsx`, `SidebarPet.tsx` |
| 删除组件 | `PetPanel.tsx`, `PetMenu.tsx`（逻辑融入 RoamingPet） |
| 重构组件 | `PetAvatar.tsx`（支持 Lottie/SVG）, `PetBubble.tsx`, `PetStatus.tsx`, `PetSelection.tsx` |
| 状态管理 | `petStore.ts` 扩展: 情绪状态机、游走位置、主动说话、空闲小动作 |
| 事件桥接 | `petEventBridge.ts` 重构: 表演序列编排 |
| 侧边栏 | `Sidebar.tsx` 底部新增 SidebarPet |
| 依赖新增 | `lottie-react`（Lottie Web） |
| 文档 | `docs/frontend/component-catalog.md` |
