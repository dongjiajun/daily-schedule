# Proposal: miniprogram-pet

## Why
Phase 2 主链（M2.1-2.2）第五个能力：web 端宠物养成（游走/互动/情绪/昼夜节律）已全量交付且 shared/pet roam engine 为纯函数、经 miniprogram-foundation 验证可跨端复用（小程序首页已用 `computeNextTarget` 演示）。但小程序端目前只有"引擎数值预览"——用户在小程序里看不到/碰不到宠物。本次将宠物互动带到小程序：TabBar 新增「宠物」入口，可创建宠物、查看状态、喂食/玩耍互动，并让宠物在页面上真正游走起来。

## What Changes
- 小程序新增 `pages/pet/` 宠物页（TabBar 第 5 入口「宠物」，与「首页/日历/任务/我的」并存）
- 宠物数据层 `lib/pet.ts`：类型映射 + `fetchMyPet()` / `createPet()` / `interactWithPet()` 封装（复用 `lib/api.ts` 的 `apiRequest`：Bearer 注入、≥400 抛后端 message、401 特判抛 `UnauthorizedError`）
- 宠物展示：名称/物种/等级/经验条/心情/饥饿/金币（PetProfile 字段），无宠物（404）时展示创建引导（物种二选一：ORANGE_CAT/SHIBA_INU + 命名 maxLength 30）
- 互动：喂食（FEED）/玩耍（PLAY）——调用 `POST /pets/me/interact`，展示 InteractionResult 变化反馈（心情/饥饿/经验数值），失败提示保持原状态
- 游走动画：复用 `@daily-schedule/shared/pet` roam engine（`computeNextTarget`/`createDefaultConfig`/随机节奏），wandering 模式目标驱动游走（视图移动 + CSS transition），互动时播放反馈动画
- 401 静默重登：照搬 todo 页模式（首载失败清态 → wechatLogin 重登 → 重拉）
- 范围排除：商店/配饰/进化/行为奖励（M2.4 主线）、日程框格内物理互动（cellPhysics）、粒子动作动画层——小程序端留待后续

## Capabilities

### New Capabilities
- `miniprogram-pet`: 小程序宠物互动——TabBar 入口 + 宠物页（状态展示/创建/喂食玩耍/游走动画），复用后端现有 `/pets/me` 系列端点

### Modified Capabilities
<!-- 仅列需求级变更（非实现细节），用 openspec/specs/ 下的已有名称 -->

## API Contract Impact
无。复用现有端点（API 契约零变更）：
- `GET /pets/me` → PetProfile（404 = 无宠物）
- `POST /pets/me` → 创建（CreatePetRequest {species, name}）
- `POST /pets/me/interact` → InteractionResult（InteractRequest {type: FEED|PLAY}）

## DDD Layer Impact
无（后端零变更）。

## Database Impact
无需。

## Impact
- 代码：`apps/miniprogram/src/pages/pet/`（index.tsx + index.scss）、`apps/miniprogram/src/lib/pet.ts`、`apps/miniprogram/src/app.config.ts`（tabBar 第 5 入口）、`apps/miniprogram/src/__tests__/pet.test.ts`（新增）
- 文档：`docs/frontend/component-catalog.md`、`docs/architecture.md`（小程序测试计数）、`docs/planning/phase2-execution-plan.md`、`CLAUDE.md`、`README.md`
- 依赖：复用 `@daily-schedule/shared/pet`（已接入）；无新依赖
