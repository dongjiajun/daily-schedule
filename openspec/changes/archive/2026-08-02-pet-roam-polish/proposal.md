# Proposal: pet-roam-polish

宠物游走机制修复与区域感知重构。

## Why

宠物模块存在三类问题：**展示 bug**（气泡文字随宠物朝向翻转成镜像，不可读）；**算法缺陷**（soft 避让区边缘排斥导致宠物被困左上角）；**机制空转**（spec 定义的 Interest Point Attraction 在 UI 层从未接线，引擎孤岛 + 全 body MutationObserver 性能隐患）。

## What Changes

- 镜像气泡修复：`<PetBubble />` 移出翻转容器（或反向补偿），气泡文字任何朝向正读
- 游走算法修复：soft 避让区拒绝策略重设计 + 逃逸机制，消除"困在左上角"的边缘排斥
- 兴趣点 → 区域感知机制：`InterestPoint`（点+权重）重新设计为 `Zone`（矩形+类型+数据），UI 接线补齐（鼠标停留/点击触发），建立区域注册机制
- 性能：MutationObserver 缩小监听范围（替代全 body 监听）+ 区域检测几何化（rect 缓存 + 纯数学判断，事件驱动更新）

非 **BREAKING**（纯前端 + shared 引擎，无 API 契约变化）。

## Capabilities

### New Capabilities
- `pet-zone-interaction`: 区域感知机制——Zone 模型（类型化区域：user-interaction / pet-spot / calendar-cell）、区域注册表、几何化进入检测

### Modified Capabilities
- `pet-roaming-system`: 游走目标生成（边缘排斥修复）、Interest Point Attraction 修改为基于 Zone 的区域吸引、气泡文字正读契约、区域检测性能约束

## API Contract Impact

无。不修改 `specs/openapi.yaml`，无后端接口变化。变更集中在 `packages/shared`（roaming 引擎）与前端 pet 模块。

## DDD Layer Impact

无后端影响。纯前端模块 + shared 引擎层（`@daily-schedule/shared/pet`）。

## Database Impact

无。不涉及 Flyway 迁移。

## Impact

- `packages/shared/src/pet/roaming.ts` — 游走目标生成、Zone 模型、区域进入检测
- `frontend/src/modules/pet/components/RoamingPet.tsx` — 气泡结构、兴趣点接线、MutationObserver 瘦身
- `frontend/src/modules/pet/store/petStore.ts` — 区域状态（如需）
- `frontend/src/modules/pet/lib/` — 区域注册表
- 测试：`packages/shared/src/pet/__tests__/roaming.test.ts`（引擎用例更新+新增）、RoamingPet 组件测试、E2E pet.spec.ts
- spec：`openspec/specs/pet-roaming-system/spec.md`（修改）+ 新增 `pet-zone-interaction` capability

为后续变更铺路：变更 B（小窝：pet-spot 区域停靠休息）与变更 C（日程框互动：calendar-cell 区域 + 完成度表现）将复用本变更建立的区域感知机制。
