# Proposal: pet-rhythm

## Why
宠物作息只有"深夜 23 点硬切 resting"一个开关（`determineMode` 中 `getHours() >= 23`），睡觉是突然发生的状态切换而非自然的每日循环：早晨无醒来问候、白天无小憩、深夜判定生硬。

## What Changes
- 夜间自动回窝：23 点后不再原地 resting，而是走向小窝进窝睡觉（复用回窝逻辑，去掉"23 点硬切"的突兀）
- 早晨醒来问候：7-9 点醒来时气泡"早上好~"（睡醒动作 + 伸懒腰）
- 午后小憩：12-14 点低概率短暂打盹（1-2 分钟），与夜间睡眠区分
- 深夜使用打哈欠：23 点后未睡觉时随机打哈欠气泡提示休息（蓝图"反哺机制"的首个落地）

## Capabilities

### New Capabilities
无（本变更为既有游走休息机制的节律增强，无全新能力）

### Modified Capabilities
- `pet-roaming-system`: resting 模式从"23 点硬切"改为昼夜节律驱动——夜间回窝入睡、早晨醒来问候、午后小憩、深夜未睡打哈欠提示

## API Contract Impact
无影响（纯前端行为决策）

## DDD Layer Impact
无（后端不涉及）

## Database Impact
无

## Impact
- `packages/shared/src/pet/roaming.ts` — `determineMode` 节律判定扩展
- `frontend/src/modules/pet/components/RoamingPet.tsx` — 夜间回窝/醒来问候/小憩接线
- `packages/shared/src/pet/__tests__/roaming.test.ts` — 节律判定测试
- `docs/frontend/component-catalog.md` + `docs/architecture.md` — 行为描述同步
