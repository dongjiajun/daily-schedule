# Proposal: pet-calendar-cell-interaction

## Why
宠物对日历格子无感知——完成日程后宠物没有反应。让宠物进入日历格子时产生互动：**格内左右往返走动**，**当天完成度决定速度/情绪风格**（完成度高→快+开心、完成度低→慢+懒散），形成"宠物随日程状态变化"的陪伴感，也为区域感知机制补齐第二个 Zone 类型（`calendar-cell`，spec 契约已定义但未实现）。

## What Changes
- calendar 模块在月视图注册 `calendar-cell` 类型 Zones：每个可见日期格子（`.rbc-day-bg-cell`）注册为 Zone（矩形边界 + payload 携带当天完成度）
- 完成度口径：当天事件 `COMPLETED` 占比（与 CalendarSidebar 周完成率同款逻辑，按天分组）
- RoamingPet 消费：宠物游走进入某日期格子 → **格内左右往返走动**；完成度决定往返速度与情绪风格（高→happy+快、低→sad/懒散+慢）
- `Zone.payload` 类型收紧：从 `Record<string, unknown>` 收紧为区分 Zone 类型的 payload 结构（calendar-cell 携带完成度）

## Capabilities

### New Capabilities
- (无新 capability，机制复用 pet-zone-interaction 的区域感知基础设施)

### Modified Capabilities
- `pet-zone-interaction`: 补充 `calendar-cell` Zone 的注册方（calendar 月视图）与完成度 payload 落地（此前仅类型定义，无实际注册方；"Zone with completion payload" 场景未实现）
- `pet-roaming-system`: 新增格内互动行为——宠物进入 `calendar-cell` Zone 后格内左右往返，速度/情绪由当天完成度决定

## API Contract Impact
无影响（纯前端行为变更，无端点/字段变化）

## DDD Layer Impact
无（纯前端，不触碰后端任何层）

## Database Impact
无需

## Impact
- `packages/shared/src/pet/roaming.ts`：`Zone.payload` 类型收紧（calendar-cell 完成度结构）
- `frontend/src/modules/calendar/components/CalendarView.tsx`（或新 lib）：月视图注册 calendar-cell Zones + 完成度计算
- `frontend/src/modules/pet/components/RoamingPet.tsx`：进入格子互动（往返走动 + 完成度风格）
- spec: `pet-zone-interaction` + `pet-roaming-system`
- 文档: `docs/frontend/component-catalog.md`（如新增组件）
