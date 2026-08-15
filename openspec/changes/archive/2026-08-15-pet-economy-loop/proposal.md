# Proposal: 宠物经济闭环（专注币收入来源 + 奖励发放）

## Why
专注币是死局经济：`InteractionType` 仅 FEED（扣币）/PLAY（免费），没有任何收入来源，初始 100 币用完即死，M2.4 商店无法成立。同时宠物模块应用层直连 Mapper（架构债 P1），habit/focus/checkin 事件已定义却从未被监听（线4 #5）。

## What Changes
- 后端新增 `RewardSource` 枚举（6 种来源）与 `PetDomainService.grant()`，`PetApplicationService.grantReward()` 幂等发放奖励（+币/+经验/±心情），幂等键为 `(pet_id, source, ref_id)`
- Event/Task 应用服务挂钩：日程 PLANNED→COMPLETED、任务移入 DONE 时发放正向奖励；删除未完成日程发放负面奖励（心情 -10，一次性）
- 新增幂等 API `POST /api/v1/pets/me/rewards`，供前端 habit/focus/checkin 事件桥接调用
- 补齐 pet 仓储端口（吸收线1 P1）：`PetAccessoryRepository` / `PetInteractionRepository` / `PetRewardRepository`，`PetApplicationService` 不再注入 Mapper
- 前端 `petEventBridge.ts` 补监听 `habit:checked` / `focus:completed` / `user:dailyCheckin` → 调奖励 API + 刷新宠物数据 + 金币粒子
- `QueryClient` 单例提取到 `core/lib/queryClient.ts`（桥接层需要 invalidate 宠物查询）

## Capabilities

### New Capabilities
- `pet-economy-loop`: 宠物经济闭环——奖励来源定义、幂等发放、状态迁移挂钩、事件桥接调用

### Modified Capabilities
- `pet-event-bridge`: 桥接监听范围扩展至 habit/focus/checkin 事件，触发奖励发放与反馈
- `task-pet-bridge`: 任务完成 → 宠物侧新增经济奖励（专注币+经验），不再仅动画
- `event-lifecycle`: 日程完成/取消的状态迁移新增宠物奖励挂钩语义

## API Contract Impact
- **新增端点**：`POST /api/v1/pets/me/rewards`（`GrantRewardRequest { source, refId }` → `RewardResult { granted, coinChange, experienceGain, moodChange, newCoins, newExperience, newMood }`），幂等语义（重复 refId 返回 `granted=false`）
- `specs/openapi.yaml` version: v3.3.4 → **v3.4.0**（新增端点，非 BREAKING）
- `specs/CHANGELOG.md` 记录

## DDD Layer Impact
- **API 层**：`PetController` 实现新增 `grantPetReward`；`PetAssembler` 增补 RewardResult 转换
- **应用层**：`PetApplicationService`（grantReward + 端口注入替换 Mapper）、`EventApplicationService`（完成/取消挂钩）、`TodoApplicationService`（DONE 迁移挂钩）
- **领域层**：新增 `RewardSource`、`RewardResult`、`PetReward`、`PetInteraction` 领域类型；`PetDomainService.grant()`；三个新仓储接口
- **基础设施层**：`PetAccessoryRepositoryImpl` / `PetInteractionRepositoryImpl` / `PetRewardRepositoryImpl` + `PetRewardPO` / `PetRewardMapper`

## Database Impact
- **需要新 Flyway 迁移**：`V7__create_pet_rewards.sql` — 新建 `pet_rewards` 表（幂等发放记录，`UNIQUE KEY (pet_id, source, ref_id)`）
- `schema-h2.sql` 同步新增该表（H2 集成测试用）

## Impact
- **后端**：`application/pet/`、`application/event/`、`application/todo/`、`domain/pet/`（+3 文件）、`infrastructure/persistence/`（+3 文件）、`api/controller/PetController.java`、`api/assembler/PetAssembler.java`；测试更新 `PetApplicationServiceTest`、`EventApplicationServiceTest`、`TodoApplicationServiceTest`、`PetControllerTest`
- **前端**：`core/lib/queryClient.ts`（新增）、`App.tsx`、`modules/pet/lib/petEventBridge.ts`、`modules/pet/lib/__tests__/petEventBridge.test.ts`；SDK 重新生成（`src/api/`）
- **shared**：`packages/shared/src/eventBus.ts` — `focus:completed` payload 增加可选 `sessionId`（向后兼容，幂等 refId 用）
- **文档**：`docs/api/overview.md`、`docs/database/schema.md`、`docs/uml/README.md`、`docs/architecture.md`、`CLAUDE.md`、`README.md`（版本号/测试计数）
- **版本号**：三处同步 v3.4.0
