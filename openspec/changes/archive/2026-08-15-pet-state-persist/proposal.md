# Proposal: 宠物状态持久化（刷新不丢陪伴感）

## Why
宠物游走状态（位置/朝向/休息态/情绪）全部存在 Zustand 内存 store，刷新页面即归零（回到 (100,100) 初始位、情绪重置 idle）——陪伴感断裂，游走引擎的位置积累与夜间回窝状态每次刷新都作废（线4 #3）。

## What Changes
- `petStore` 接入 zustand `persist` 中间件：持久化 `{ position, facing, isResting, emotionState }` 到 localStorage（key `pet-roaming-state`，version 1）
- 情绪持久化白名单：仅稳定情绪（idle / idle_variant / hungry / sleepy）落盘；瞬态情绪（happy / sad / excited / surprised）由定时器自动回落，持久化时归一为 idle，避免"刷新后永远开心"
- 挂载恢复：persist 自动 rehydrate（localStorage 同步读）；恢复时对 position 做视口越界钳制（窗口缩放/换分辨率后旧位置可能在屏外——window 不可用时跳过钳制）
- 瞬态状态明确不持久化：action / particleTrigger / feedbackTrigger / bubbleMessage / selectionOpen / timers / comboCount
- 新增 vitest：持久化写入与恢复、瞬态情绪归一、越界钳制、reset 清空

## Capabilities

### New Capabilities
- `pet-state-persist`: 宠物游走状态持久化（范围白名单、恢复钳制、瞬态归一规则）

### Modified Capabilities
- `pet-roaming-system`: 游走初始位置来源从固定 (100,100) 变为"持久化位置（钳制后）"

## API Contract Impact
- 无（纯前端变更）

## DDD Layer Impact
- 无（纯前端）

## Database Impact
- 无需（localStorage，不入库；宠物数值状态仍以后端 30s 轮询为准）

## Impact
- **前端**：`modules/pet/store/petStore.ts`（persist 中间件 + partialize + 钳制）、`modules/pet/store/__tests__/petStore.test.ts`（新增用例）
- **文档**：`docs/frontend/component-catalog.md`（petStore 持久化说明）、`docs/architecture.md` + `CLAUDE.md`（测试计数变化）、其余核对结论
- **版本号**：前端 patch 级改动无契约变化——三处版本号不动（无 API/契约变更）

## 明确不做
- 后端数值状态持久化（mood/hunger/coins 已由后端 pets 表 + 30s 轮询承载）
- 跨设备同步（localStorage 仅本机；未来可迁 IndexedDB/后端偏好表）
- 情绪定时器恢复（stateTimer 不落盘——瞬态情绪本身不持久化）
