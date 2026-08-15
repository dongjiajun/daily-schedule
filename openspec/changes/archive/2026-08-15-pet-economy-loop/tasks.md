# Tasks: 宠物经济闭环（专注币收入来源 + 奖励发放）

## 1. 数据库迁移
- [x] 1.1 编写 `V7__create_pet_rewards.sql`（pet_rewards 表 + UNIQUE(pet_id, source, ref_id) + FK CASCADE）
- [x] 1.2 更新 `schema-h2.sql` 同步新增 pet_rewards 表
- [x] 1.3 启动 local MySQL 验证 Flyway 迁移成功

## 2. 领域层 (domain/pet/)
- [x] 2.1 新增 `RewardSource` 枚举（6 种来源 + 数值属性：coinChange/experienceGain/moodChange）
- [x] 2.2 新增 `RewardResult`（granted + 数值变化 + 最新值 + 静态工厂 notGranted/granted）
- [x] 2.3 新增 `PetReward` 与 `PetInteraction` 领域 POJO（含静态工厂）
- [x] 2.4 `PetDomainService` 新增 `grant(Pet, RewardSource): InteractionResult`
- [x] 2.5 新增端口 `PetAccessoryRepository` / `PetInteractionRepository` / `PetRewardRepository`

## 3. 基础设施层 (infrastructure/persistence/)
- [x] 3.1 新增 `PetRewardPO` + `PetRewardMapper`
- [x] 3.2 新增 `PetAccessoryRepositoryImpl`（PO→ShopItem 转换迁移自 PetApplicationService）
- [x] 3.3 新增 `PetInteractionRepositoryImpl`（PetInteraction→PetInteractionPO）
- [x] 3.4 新增 `PetRewardRepositoryImpl`（existsBySourceAndRefId 用条件查询 + save）
- [x] 3.5 编写 `PetRewardRepositoryImplTest`（H2 集成：保存/幂等查询/唯一键冲突）

## 4. 应用层 (application/)
- [x] 4.1 `PetApplicationService` 注入 3 端口替换 2 Mapper（interact/getShopItems/purchase 改用端口）
- [x] 4.2 `PetApplicationService` 新增 `grantReward(source, refId)`（无宠物/重复 → granted=false；发放 → 应用数值 + 记录）
- [x] 4.3 `TodoApplicationService.moveTask` 挂钩：非 DONE→DONE 迁移发放 TASK_COMPLETED
- [x] 4.4 `EventApplicationService.update` 挂钩：非 COMPLETED→COMPLETED 迁移发放 EVENT_COMPLETED
- [x] 4.5 `EventApplicationService.delete` 挂钩：删除非 COMPLETED 日程发放 EVENT_CANCELLED
- [x] 4.6 更新 `PetApplicationServiceTest`（端口替换 + grantReward：首次/幂等/无宠物/心情钳制）
- [x] 4.7 更新 `TodoApplicationServiceTest`（DONE 迁移发放 / 同列重排不发放 / 无宠物不阻断）
- [x] 4.8 更新 `EventApplicationServiceTest`（完成迁移发放 / 取消负面 / 已完成删除不惩罚）

## 5. API 层 (api/)
- [x] 5.1 `PetController` 实现 `grantPetReward(GrantRewardRequest)`
- [x] 5.2 `PetAssembler` 新增 `toRewardResultDto(RewardResult)`
- [x] 5.3 更新 `PetControllerTest`（首次领取 granted=true / 重复领取 granted=false）

## 6. 契约同步
- [x] 6.1 更新 `specs/openapi.yaml`：新增 `POST /pets/me/rewards` + `GrantRewardRequest`/`RewardResult` schemas + version v3.4.0
- [x] 6.2 更新 `specs/CHANGELOG.md`
- [x] 6.3 同步版本号：`backend/pom.xml` + `frontend/package.json` + openapi.yaml（v3.4.0）
- [x] 6.4 重新生成后端接口（`mvn compile`）
- [x] 6.5 重新生成前端 SDK（`pnpm run generate:api`）

## 7. 前端 (frontend/src/ + packages/shared/)
- [x] 7.1 提取 `core/lib/queryClient.ts` 单例，`App.tsx` 改为引用
- [x] 7.2 `packages/shared/src/eventBus.ts`：`focus:completed` payload 增加可选 `sessionId`
- [x] 7.3 `petEventBridge.ts` 新增 3 个监听器（habit:checked/focus:completed/user:dailyCheckin → 奖励 API + invalidate + 金币粒子 + 气泡，失败静默）
- [x] 7.4 `petEventBridge.ts` 的 event:completed/task:completed 监听器追加 invalidate 宠物查询
- [x] 7.5 更新 `petEventBridge.test.ts`（3 个新监听器 + 幂等 refId + 失败静默）
- [x] 7.6 新增 E2E `e2e/pet-economy.spec.ts`（完成任务 → 宠物专注币 +10；重复切换不重复发放）
- [x] 7.7 运行 `npm run test:e2e` 确认 E2E 全部通过

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — petEventBridge 修改 + queryClient.ts 新增 → 更新；其余组件清单核对结论
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — pet_rewards 表 → 更新
- [x] 8.3 `docs/api/overview.md` — 新增 /pets/me/rewards 端点 → 更新
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 经济闭环描述、pet 仓储端口、测试计数（后端测试类/用例数、E2E 文件数 11→12）、版本号 → 更新
- [x] 8.5 `README.md` — 版本号/功能清单 → 更新
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过
- [x] 9.4 Smoke test — 启动前后端，浏览器手工验证 mock 无法覆盖的场景
  - [x] 登录 → 完成任务（拖入 DONE）→ 宠物面板专注币 +10、经验 +20（已由新增 E2E pet-economy.spec.ts 真实浏览器覆盖）
  - [x] 同一任务反复 TODO↔DONE 切换 → 专注币不再重复增加（幂等）（已由新增 E2E pet-economy.spec.ts 真实浏览器覆盖）
  - [x] 登录 → 标记日程完成 → 专注币 +20；恢复计划中再完成 → 不重复发放（已由新增 E2E pet-economy.spec.ts 真实浏览器覆盖）
  - [x] 删除一个计划中日程 → 宠物心情 -10（仅一次）（已由新增 E2E pet-economy.spec.ts 真实浏览器覆盖）
  - [x] 无宠物账号完成任务/日程 → 流程正常无报错（已由新增 E2E pet-economy.spec.ts 真实浏览器覆盖）
