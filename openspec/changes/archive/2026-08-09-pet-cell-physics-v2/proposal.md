# Proposal: pet-cell-physics-v2

## Why
格内物理状态机存在一处明确 bug：`cling`（吸附停留）期间每帧执行重力下沉，导致宠物在顶边/侧边停留时被持续拖向底部——用户观察"只沿底部和侧边下部行走、顶部几乎不出现"；同时吸附点路径相邻点跨边（底→右、右→顶为大斜线），行走是斜穿格子而非贴边绕行，且 `snapToEdge` 从未被调用，吸附感缺失。

## What Changes
- 修复 cling 重力 bug：重力只在 enter 落地阶段生效，贴边停留时位置不再漂移
- 吸附点路径改造：底→右下角→右→右上角→顶→左上角→左→左下角 连续绕边，相邻点总在同一边或紧邻角点
- walk 连续沿边：到达点不必然停留（概率性短暂 cling 或直接续走），绕圈节奏连续
- 吸附感：接近目标 <12px 加速滑入 + 到位落定
- enter 落向底边吸附点 + 落地小弹跳（重力可见但不失控）
- 会话退出按圈数（绕 1.5 圈）而非固定秒数，不再中途被踢
- 贴壁旋转与移动方向一致（角点转向时切换）

## Capabilities

### New Capabilities
无（本变更为既有格内物理行为的修正，无全新能力）

### Modified Capabilities
- `pet-roaming-system`: 格内物理行为从"斜穿格子的点间跳转 + 停留期重力漂移"修正为"沿四边连续绕行 + 吸附滑入/落定 + 落地弹跳"；状态机超时从固定秒数改为按圈数退出

## API Contract Impact
无影响（纯前端 + shared 包逻辑）

## DDD Layer Impact
无（后端不涉及）

## Database Impact
无

## Impact
- `packages/shared/src/pet/cellPhysics.ts` — 路径生成、吸附点顺序、吸附/落地逻辑
- `frontend/src/modules/pet/components/RoamingPet.tsx` — 状态机 cling/enter 逻辑、贴壁旋转时序
- `packages/shared/src/pet/__tests__/cellPhysics.test.ts` + `frontend/src/modules/pet/components/__tests__/RoamingPet.test.tsx` — 测试同步
- `docs/frontend/component-catalog.md` — RoamingPet 格内状态机描述
