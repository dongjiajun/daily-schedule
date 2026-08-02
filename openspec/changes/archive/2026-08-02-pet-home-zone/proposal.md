# Proposal: pet-home-zone

## Why
宠物当前没有"家"的概念——休息行为只是随机走向页面角落（resting 模式），与宠物专属区域无关联。Zone 模型已定义 `pet-spot` 类型但无实际注册方。让宠物游走到状态面板（Sidebar 底部）区域即自动进窝休息，形成"小窝"归属感，休息行为从"随机角落"升级为"回到自己家"。

## What Changes
- Sidebar 底部 SidebarPet 区域注册为 `pet-spot` 类型 Zone（宠物小窝）
- 宠物游走到小窝区域 → 自动进窝休息（扩展 Resting Behavior 触发条件，不依赖 2 分钟无交互计时）
- 进窝后呈现休息状态表现（sleepy 情绪 + 小窝内停留，而非漫无目的地站在角落）

## Capabilities

### New Capabilities
- (无新 capability，机制复用 pet-zone-interaction 的区域感知基础设施)

### Modified Capabilities
- `pet-zone-interaction`: 补充 `pet-spot` Zone 的注册方与进入行为挂钩（此前仅类型定义，无实际注册方）
- `pet-roaming-system`: Resting Behavior 扩展——宠物游走到小窝区域时 SHALL 自动进窝休息，不再仅依赖"无交互 2 分钟"计时触发

## API Contract Impact
无影响（纯前端行为变更，无端点/字段变化）

## DDD Layer Impact
无（纯前端，不触碰后端任何层）

## Database Impact
无需

## Impact
- `frontend/src/modules/pet/components/SidebarPet.tsx`（或 `components/layout/Sidebar.tsx`）：注册 pet-spot Zone
- `frontend/src/modules/pet/components/RoamingPet.tsx`：游走循环消费 pet-spot Zone，进窝触发休息
- `frontend/src/modules/pet/store/petStore.ts`：休息状态流转（复用现有 isResting，必要时补充进窝标记）
- `packages/shared/src/pet/roaming.ts`：若需小窝内停留目标（依赖已就位的 Zone 模型）
- spec: `pet-zone-interaction` + `pet-roaming-system`
- 文档: `docs/frontend/component-catalog.md`
