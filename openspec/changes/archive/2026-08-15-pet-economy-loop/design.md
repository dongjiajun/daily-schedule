# Design: 宠物经济闭环（专注币收入来源 + 奖励发放）

## Context

当前宠物经济是死局：`InteractionType` 仅 FEED（扣币）/PLAY（免费），`PetApplicationService.create()` 发放初始 100 币后没有任何收入来源。任务/日程完成的"奖励"只存在于前端动画（`petEventBridge`），后端数值零流入。同时 `PetApplicationService` 直连 `PetAccessoryMapper`/`PetInteractionMapper`（架构债 P1：application → infrastructure 违规），habit/focus/checkin 事件在 shared 中已定义但无监听方（线4 #5）。M2.4 商店（购买/换装）是本变更的直接下游，必须先有健康的币经济。

约束：DDD 依赖方向（应用层不依赖基础设施 Mapper）；API 契约驱动（openapi.yaml 唯一真相源）；`unwrap()` 错误处理；事件总线是模块间唯一通道；奖励发放不能阻断无宠物用户的核心业务流程（任务/日程操作）。

## Goals / Non-Goals

**Goals:**
- 为专注币建立收入来源（任务/日程/专注/签到/习惯），数值有界、幂等、可审计
- 取消日程产生一次性负面反馈（心情 -10）
- 补齐 pet 仓储端口，消除 application → infrastructure 的 Mapper 直连
- habit/focus/checkin 事件桥接落地（为 Phase 2 习惯/专注模块预留）

**Non-Goals:**
- 逾期日程惩罚（需 sweep 调度器，后续变更）
- 奖励数值动态配置（固定枚举值即可，需要时再走 `pet.*` properties）
- 商店/换装消费闭环（变更 5 `pet-accessory-equip`）
- 任务删除负面惩罚（删除任务已有撤销 toast，不惩罚）

## Decisions

### Decision 1: 发放路径分工——任务/日程走后端挂钩，习惯/专注/签到走前端桥接
- **选择**: `TodoApplicationService.moveTask()` 与 `EventApplicationService.update()/delete()` 检测状态迁移后直接调用 `PetApplicationService.grantReward()`（同事务）；前端 `petEventBridge` 补监听 `habit:checked`/`focus:completed`/`user:dailyCheckin` 调用新增奖励 API。
- **理由**: 任务/日程的状态迁移是后端事务的一部分——同事务发放保证"完成即到账"，页面刷新、网络抖动都不丢奖励，且无宠物用户静默跳过（granted=false 不抛异常），零风险侵入主流程。习惯/专注模块尚未实现，唯一可行路径是前端事件 → 奖励 API；该 API 同时作为未来其他奖励来源（如成就）的统一入口。
- **备选方案**: ① 全部走前端桥接（task:completed/event:completed 也调奖励 API）——奖励与状态更新解耦后存在丢失窗口（emit 后 API 失败即丢），且后端挂钩在 plan 中已明确；② 全部走后端（含习惯/专注）——这些模块后端不存在，无法挂钩。

### Decision 2: 幂等机制——独立 `pet_rewards` 表 + UNIQUE(pet_id, source, ref_id)
- **选择**: 新表 `pet_rewards` 记录每次发放（含数值快照），`grantReward` 先查 `existsBySourceAndRefId`，命中则返回 `granted=false`。
- **理由**: 状态来回切换（DONE↔TODO、COMPLETED↔PLANNED、每日重复签到）必然产生重复迁移事件；唯一键在数据库层硬防刷，比应用层去重可靠（并发下仍安全）。数值快照兼顾审计（后续经济调参/客服查询）。refId 语义：taskId/eventId/habitId/sessionId/日期——天然幂等标识。
- **备选方案**: ① pets 表加 `last_reward_source`/`last_reward_ref` 字段——只能记住"上一次"，无法表达"任意历史事件不重复"，且并发写同一行有竞态；② 复用 `pet_interactions` 表加 source/ref_id 列——交互表语义是"每次互动明细"，奖励不是互动，混表会让 M2.4 统计/展示变复杂；③ 应用层内存去重——重启即失效，多实例不安全。

### Decision 3: 数值应用复用 `Pet.applyInteraction()` 钳制链路
- **选择**: `PetDomainService.grant(pet, source)` 返回 `InteractionResult`（hungerChange=0），`PetApplicationService.grantReward` 调用 `pet.applyInteraction(result)` 应用数值并回填新值。
- **理由**: `applyInteraction` 已实现 mood 0-100 钳制、coins/exp 累加、level 重算、lastInteractedAt 刷新、结果回填——复用避免复制粘贴钳制逻辑（line1 O8 也正是要消灭 `PetApplicationService.purchase` 里的手工钳制，变更 5 接手）。
- **备选方案**: 新建 `Pet.applyReward()` 方法——与 applyInteraction 逻辑 95% 重复，仅 hungerChange 差异。

### Decision 4: 无宠物语义——`granted=false` 静默跳过（不抛异常）
- **选择**: `grantReward` 无宠物或重复时返回 `granted=false`；奖励 API 一律返回 200（granted 字段承载语义）。
- **理由**: 挂钩路径中"完成任务的用户没有宠物"是正常状态，抛 404 会让 moveTask/update 整个回滚，破坏主流程。统一静默语义也让前端桥接无需区分错误类型。`granted` 布尔是 API 显式契约，比状态码承载更简单。
- **备选方案**: 无宠物抛 `ResourceNotFoundException`（与 `getMyPet` 一致）——挂钩处必须 try-catch 吞掉，吞异常比返回值更隐晦；且 API 层 404 语义对"幂等重放"（应 200）与"无宠物"（404）双态矛盾。

### Decision 5: 仓储端口拆分——3 个独立端口
- **选择**: `PetAccessoryRepository`（findAllShopItems/findById，PO↔ShopItem 转换收口）、`PetInteractionRepository`（save(PetInteraction)）、`PetRewardRepository`（existsBySourceAndRefId/save(PetReward)），基础设施层三个 Impl + `PetRewardPO`/`PetRewardMapper`。
- **理由**: 与 `EventRepository`/`TaskRepository` 的"端口按聚合边界划分"先例一致；奖励发放的幂等查询与交互记录、商品目录职责不同，合并会造出三不像的 `PetShopRepository`。PO↔Domain 转换收口在 RepositoryImpl 是项目既定模式（线1 结论）。
- **备选方案**: 单 `PetAccessoryRepository` 塞三个职责——接口臃肿，Mock 测试时粒度粗。

### Decision 6: 奖励与业务同事务（REQUIRED 传播）
- **选择**: `grantReward` 使用默认 `@Transactional`，挂钩处不做事务嵌套调整——任务状态更新与奖励发放同事务提交。
- **理由**: 一致性优先：不会出现"任务显示 DONE 但奖励丢失"或反向的中间态。grantReward 本身无远程调用/慢操作（一次 exists + 一次 insert + 一次 update），事务膨胀可忽略。
- **备选方案**: `REQUIRES_NEW` 独立事务——主业务成功但奖励失败时出现奖励丢失，违背"完成即到账"目标。

### Decision 7: 前端 QueryClient 单例提取到 `core/lib/queryClient.ts`
- **选择**: 从 `App.tsx` 内联的 `new QueryClient(...)` 提取为 `core/lib/queryClient.ts` 导出单例，`App.tsx` 与 `petEventBridge` 共用。
- **理由**: 桥接层（非组件、非 hook）需要 `invalidateQueries(['pet','me'])`；core/lib 是"稳定基础设施"的既定位置（eventBus/moduleRegistry 同款先例）。React Query 官方推荐模块级单例（非组件上下文中可安全使用）。
- **备选方案**: ① 桥接不刷新缓存，等 30s 轮询自然更新——奖励反馈延迟 30s，体验断裂；② 自定义事件触发 hook 内部刷新——多一层间接，无收益。

### Decision 8: 奖励 API 独立于 interact 端点
- **选择**: 新端点 `POST /pets/me/rewards`（operationId `grantPetReward`），DTO `GrantRewardRequest`/`RewardResult`。
- **理由**: interact 语义是"用户主动互动"（记录 pet_interactions），奖励是"系统行为结算"（记录 pet_rewards），混用会让 `InteractionType` 枚举膨胀且幂等语义无处安放。
- **备选方案**: 扩展 `POST /pets/me/interact` 加 `type=REWARD`——污染交互语义，M2.4 交互统计需额外过滤。

## DDD Layer Design

### 领域层 (domain/pet/)
- 新增 `RewardSource` 枚举：6 个常量，构造参数 `(coinChange, experienceGain, moodChange)`，getter 暴露——奖励数值唯一来源
- 新增 `RewardResult`：`granted/source/coinChange/experienceGain/moodChange/newCoins/newExperience/newMood` POJO + 静态工厂 `notGranted(source)` / `granted(source, InteractionResult)`
- 新增 `PetReward`：`id/petId/source/refId/coinChange/experienceGain/moodChange/createdAt` POJO + 静态工厂 `of(petId, source, refId, InteractionResult)`
- 新增 `PetInteraction`：`id/petId/type/quantity/moodChange/hungerChange/experienceGain/createdAt` POJO（interact 记录用）
- `PetDomainService` 新增 `grant(Pet pet, RewardSource source): InteractionResult`（hunger=0）
- 新增端口 `PetAccessoryRepository` / `PetInteractionRepository` / `PetRewardRepository`
- `Pet.java` 不变（复用 applyInteraction）

### 基础设施层 (infrastructure/persistence/)
- `PetAccessoryRepositoryImpl`：注入 `PetAccessoryMapper`，PO→`ShopItem` 转换（迁移自 `PetApplicationService.toShopItem`）
- `PetInteractionRepositoryImpl`：注入 `PetInteractionMapper`，`PetInteraction`→`PetInteractionPO`（迁移自 `interact()` 手写构造）
- `PetRewardRepositoryImpl`：注入新 `PetRewardMapper`（`BaseMapper<PetRewardPO>`），`existsBySourceAndRefId` 用 `selectCount` + `eq` 条件查询
- 新增 `PetRewardPO`（`@TableName("pet_rewards")`）
- Flyway `V7__create_pet_rewards.sql`；`schema-h2.sql` 同步建表（H2 集成测试）

### 应用层 (application/pet/, application/event/, application/todo/)
- `PetApplicationService`：构造器注入 3 端口替换 2 Mapper；`interact()` 改用 `accessoryRepository.findById/findAllShopItems` + `interactionRepository.save`；新增 `grantReward(source, refId)`（findByUserId → 无宠物 granted=false；existsBySourceAndRefId → granted=false；domainService.grant + applyInteraction + petRepository.save + rewardRepository.save → granted=true）
- `EventApplicationService`：构造器新增 `PetApplicationService`；`update()` 迁移检测（`existing.getStatus()` 非 COMPLETED 且更新后 COMPLETED → grantReward(EVENT_COMPLETED, id)）；`delete()` 删除非 COMPLETED 日程 → grantReward(EVENT_CANCELLED, id)
- `TodoApplicationService`：构造器新增 `PetApplicationService`；`moveTask()` 中 `oldStatus != DONE && target == DONE` → grantReward(TASK_COMPLETED, id)

### API 层 (api/)
- `PetController` 实现生成的 `grantPetReward(GrantRewardRequest)`；`PetAssembler` 新增 `toRewardResultDto(RewardResult)`（RewardSource 枚举生成 DTO 直接映射）
- 错误码：400（非法 source/refId 空，@Valid 约束）、401（认证）——奖励逻辑本身不产生 404/409

### 前端 (frontend/src/)
- `core/lib/queryClient.ts` 新增单例（App.tsx 改为引用）
- `modules/pet/lib/petEventBridge.ts`：新增 3 个监听器（habit:checked/focus:completed/user:dailyCheckin）→ `grantPetReward` → granted=true 时 `queryClient.invalidateQueries(['pet','me'])` + `store.triggerParticle('coins')` + `showBubble('+N 专注币')`；catch 静默；`event:completed`/`task:completed` 监听器追加 invalidate
- `packages/shared/src/eventBus.ts`：`focus:completed` payload 增加 `sessionId?: string`
- SDK 重新生成：`pnpm run generate:api`

## API Design

`specs/openapi.yaml` 新增（Pet tag，version v3.4.0）：

```yaml
/pets/me/rewards:
  post:
    operationId: grantPetReward
    tags: [Pet]
    summary: 领取行为奖励（幂等）
    requestBody:
      required: true
      content:
        application/json:
          schema: { $ref: '#/components/schemas/GrantRewardRequest' }
    responses:
      '200': { description: 发放结果（granted=false 表示未发放）, content: { application/json: { schema: { $ref: '#/components/schemas/RewardResult' } } } }
      '400': { $ref: '#/components/responses/BadRequest' }
      '401': { $ref: '#/components/responses/Unauthorized' }

GrantRewardRequest:
  type: object
  required: [source, refId]
  properties:
    source: { type: string, enum: [TASK_COMPLETED, EVENT_COMPLETED, EVENT_CANCELLED, FOCUS_COMPLETED, DAILY_CHECKIN, HABIT_CHECKED] }
    refId: { type: string, maxLength: 64 }

RewardResult:
  type: object
  required: [granted, coinChange, experienceGain, moodChange, newCoins, newExperience, newMood]
  properties:
    granted: { type: boolean }
    coinChange: { type: integer }
    experienceGain: { type: integer }
    moodChange: { type: integer }
    newCoins: { type: integer }
    newExperience: { type: integer }
    newMood: { type: integer }
```

同步：`specs/CHANGELOG.md` + 三处版本号（openapi/pom.xml/package.json → v3.4.0）。

## Database Design

`V7__create_pet_rewards.sql`：

```sql
CREATE TABLE pet_rewards (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    pet_id           BIGINT       NOT NULL,
    source           VARCHAR(32)  NOT NULL COMMENT 'TASK_COMPLETED / EVENT_COMPLETED / EVENT_CANCELLED / FOCUS_COMPLETED / DAILY_CHECKIN / HABIT_CHECKED',
    ref_id           VARCHAR(64)  NOT NULL,
    coin_change      INT          NOT NULL DEFAULT 0,
    experience_gain  INT          NOT NULL DEFAULT 0,
    mood_change      INT          NOT NULL DEFAULT 0,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_reward_pet_source_ref (pet_id, source, ref_id),
    CONSTRAINT fk_reward_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

`schema-h2.sql` 同步同结构表（H2 语法兼容，无 ENGINE 子句）。

## Risks / Trade-offs

- [**删除 DONE 任务后撤销 → 新 taskId → 可再次领奖**]（撤销流重建任务，refId 变化）→ 已知局限，+10 币收益微薄且操作繁琐；M2.4 经济调参时若成问题，可将撤销流的奖励改为携带原 taskId 的显式标记
- [**Event 应用服务与 Pet 应用服务耦合**]（event/todo 注入 pet）→ 单向依赖（pet 不依赖 event/todo），无循环；若未来模块拆分，可替换为领域事件发布（Spring ApplicationEvent），本变更不引入
- [**奖励 API 开放给任意客户端调用**]（理论上可伪造 source/refId 刷币）→ 与现有 interact/purchase 同等级信任模型（认证后即可调用）；幂等键限制单 source/refId 一次；若需强化可在 M2.4 引入每日限额
- [**reward 记录无限增长**]（每次发放一行）→ 单行小（<100B），用户量级下单机 MySQL 无压力；必要时 M2.4 加归档策略
- [**focus:completed 无 sessionId 时以时间戳为 refId**] → 幂等窗口仅为"同一毫秒重复 emit"（不可能），语义上每次专注会话独立结算，可接受

## Migration Plan

1. `V7__create_pet_rewards.sql` 由 Flyway 启动自动执行（向后兼容：只建新表，不动现有 pets/pet_interactions）
2. 后端契约生成：`mvn compile`（openapi-generator 生成 `grantPetReward` 接口 + DTO）；前端 `pnpm run generate:api`
3. 部署顺序：后端先行（前端桥接对 404 端点调用会静默失败，不阻断 UI）
4. 回滚：代码回滚即可；`pet_rewards` 表保留（新表无破坏性），如需清理 `DROP TABLE pet_rewards` 安全
5. 存量用户：已完成的旧任务/日程不追溯发奖（幂等表从上线起算），避免历史数据一次性发奖冲击

## Open Questions

- 奖励数值（10/20/5/15）是否需要产品侧确认？当前为拍板初值，M2.4 商店定价时统一调参
- 每日签到目前无前端模块发出 `user:dailyCheckin`——监听器落地后处于待命状态，是否接受？（plan 已明确为 Phase 2 预留）
