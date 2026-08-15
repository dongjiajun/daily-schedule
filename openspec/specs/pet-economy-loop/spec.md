# Pet Economy Loop（宠物经济闭环）

## Purpose
为专注币建立收入来源——任务/日程完成、专注、签到、习惯打卡发放奖励（+币+经验），日程取消产生一次性心情惩罚；奖励按 `(pet_id, source, ref_id)` 幂等发放，防重复刷币。M2.4 商店的直接前置。

## Requirements

### Requirement: 奖励来源与数值定义
系统 SHALL 定义领域枚举 `RewardSource`，包含 6 种来源及固定奖励数值（专注币 / 经验 / 心情），作为全系统奖励数值的唯一来源：

| 来源 | 币 | 经验 | 心情 |
|------|-----|------|------|
| TASK_COMPLETED | +10 | +20 | 0 |
| EVENT_COMPLETED | +20 | +30 | 0 |
| FOCUS_COMPLETED | +5 | +10 | 0 |
| DAILY_CHECKIN | +15 | +10 | 0 |
| HABIT_CHECKED | +5 | +10 | 0 |
| EVENT_CANCELLED | 0 | 0 | -10 |

#### Scenario: 奖励数值唯一来源
- **WHEN** 任意发放路径（后端挂钩 / 奖励 API / 前端桥接）引用奖励数值
- **THEN** 数值 SHALL 来自 `RewardSource` 枚举定义，禁止各路径硬编码

### Requirement: 幂等奖励发放
`PetApplicationService.grantReward(RewardSource source, String refId)` SHALL 按 `(pet_id, source, ref_id)` 幂等发放奖励：
- 当前用户无宠物时 SHALL 返回 `granted=false`，不抛异常、不阻断调用方业务流程
- 已发放过相同 `(source, refId)` 时 SHALL 返回 `granted=false`，不重复发放
- 首次发放时 SHALL 应用数值（mood 钳制 0-100，coins/experience 累加，level 按 `PetDomainService.calculateLevel` 重算），写入 `pet_rewards` 记录，返回 `granted=true` 及数值变化与最新值

数据库 SHALL 新增 `pet_rewards` 表：

| 列 | 类型 | 约束 |
|----|------|------|
| id | BIGINT AUTO_INCREMENT | PRIMARY KEY |
| pet_id | BIGINT NOT NULL | FK → pets(id) ON DELETE CASCADE |
| source | VARCHAR(32) NOT NULL | 枚举名 |
| ref_id | VARCHAR(64) NOT NULL | 业务引用标识 |
| coin_change | INT NOT NULL DEFAULT 0 | |
| experience_gain | INT NOT NULL DEFAULT 0 | |
| mood_change | INT NOT NULL DEFAULT 0 | |
| created_at | DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP | |

索引：`UNIQUE KEY uk_reward_pet_source_ref (pet_id, source, ref_id)`。

#### Scenario: 首次完成奖励发放
- **WHEN** 拥有宠物的用户首次以 `(TASK_COMPLETED, "42")` 请求发放
- **THEN** 宠物专注币 +10、经验 +20，`pet_rewards` 新增一行，返回 `granted=true`

#### Scenario: 重复 refId 幂等跳过
- **WHEN** 已发放过 `(TASK_COMPLETED, "42")`，再次以相同键请求
- **THEN** 数值不变，不新增记录，返回 `granted=false`

#### Scenario: 无宠物静默跳过
- **WHEN** 当前用户无宠物时请求发放
- **THEN** 返回 `granted=false`，不抛异常

#### Scenario: 心情钳制
- **WHEN** 宠物心情为 95，发放 `EVENT_CANCELLED`（心情 -10）
- **THEN** 新心情为 85；当心情为 5 时发放同来源，新心情钳制为 0（不为负）

### Requirement: 任务完成挂钩
`TodoApplicationService.moveTask()` SHALL 在任务由非 DONE 状态迁入 DONE 时调用 `grantReward(TASK_COMPLETED, String.valueOf(taskId))`。DONE→DONE（同列重排）与 DONE→其他状态 SHALL NOT 触发。奖励与状态更新 SHALL 处于同一事务。

#### Scenario: 任务迁入 DONE 发放奖励
- **WHEN** 用户将 TODO 任务拖入 DONE 列（或下拉切换为 DONE）
- **THEN** 任务状态更新为 DONE，宠物获得 +10 专注币 / +20 经验（幂等）

#### Scenario: DONE 列内重排不重复发放
- **WHEN** 用户将 DONE 列中的任务在同列内拖动调整排序（旧状态与目标状态均为 DONE）
- **THEN** 不触发奖励发放

#### Scenario: 无宠物用户完成任务不受影响
- **WHEN** 未创建宠物的用户将任务移入 DONE
- **THEN** 任务状态正常更新，无异常抛出（奖励静默跳过）

### Requirement: 日程完成与取消挂钩
`EventApplicationService.update()` SHALL 在原状态非 COMPLETED 且更新后为 COMPLETED 时调用 `grantReward(EVENT_COMPLETED, String.valueOf(eventId))`。`EventApplicationService.delete()` SHALL 在删除非 COMPLETED 日程时调用 `grantReward(EVENT_CANCELLED, String.valueOf(eventId))`（心情 -10，按 eventId 幂等一次）；删除 COMPLETED 日程 SHALL NOT 惩罚。

#### Scenario: 日程标记完成发放奖励
- **WHEN** 用户将 PLANNED 日程标记为 COMPLETED
- **THEN** 宠物获得 +20 专注币 / +30 经验（幂等）

#### Scenario: 恢复为计划中不重复发放
- **WHEN** 用户将 COMPLETED 日程恢复为 PLANNED，再重新标记为 COMPLETED
- **THEN** 首次完成已发放；后续迁移因幂等键命中返回 `granted=false`，不重复发放

#### Scenario: 删除未完成日程触发负面奖励
- **WHEN** 用户删除一个 PLANNED 日程
- **THEN** 宠物心情 -10（按 eventId 仅一次）

#### Scenario: 删除已完成日程不惩罚
- **WHEN** 用户删除一个 COMPLETED 日程
- **THEN** 不触发任何奖励发放

### Requirement: 奖励领取 API
系统 SHALL 新增幂等端点 `POST /api/v1/pets/me/rewards`（OpenAPI operationId: `grantPetReward`），请求体 `GrantRewardRequest { source: string（RewardSource 枚举值，必填）, refId: string（必填，最大 64 字符） }`，响应 200 `RewardResult { granted: boolean, coinChange: integer, experienceGain: integer, moodChange: integer, newCoins: integer, newExperience: integer, newMood: integer }`。`granted=false` 表示未发放（无宠物或重复 refId）。

#### Scenario: 首次领取奖励
- **WHEN** 拥有宠物的用户 POST `{ source: "FOCUS_COMPLETED", refId: "s1" }`
- **THEN** 返回 200，`granted=true`，`coinChange=+5`，`newCoins` 为发放后现值

#### Scenario: 重复领取幂等
- **WHEN** 以相同 `(source, refId)` 再次 POST
- **THEN** 返回 200，`granted=false`，数值变化为 0

### Requirement: 前端事件桥接发放奖励
`registerPetEventListeners()` SHALL 补监听以下事件并调用奖励 API（granted=true 时 SHALL invalidate 宠物查询缓存 `['pet','me']`、触发金币粒子（`coins`）、气泡显示「+N 专注币」；API 失败或无宠物 SHALL 静默忽略，不阻断其他监听器）：

| 事件 | 映射 source | refId |
|------|-------------|-------|
| `habit:checked` | HABIT_CHECKED | `payload.habitId` |
| `focus:completed` | FOCUS_COMPLETED | `payload.sessionId`（缺省时用时间戳） |
| `user:dailyCheckin` | DAILY_CHECKIN | 本地日期 `YYYY-MM-DD` |

`event:completed` / `task:completed` 的监听器 SHALL 额外 invalidate 宠物查询缓存，使后端挂钩发放的专注币即时刷新。

#### Scenario: 习惯打卡发放奖励
- **WHEN** eventBus emit `{ type: 'habit:checked', payload: { habitId: 'h1' } }`
- **THEN** 调用奖励 API（HABIT_CHECKED, refId="h1"）；granted=true 时刷新宠物数据、触发金币粒子、气泡「+5 专注币」

#### Scenario: 专注完成发放奖励
- **WHEN** eventBus emit `{ type: 'focus:completed', payload: { duration: 1500, sessionId: 'f-9' } }`
- **THEN** 调用奖励 API（FOCUS_COMPLETED, refId="f-9"）

#### Scenario: 每日签到每天一次
- **WHEN** eventBus 在同一天两次 emit `user:dailyCheckin`
- **THEN** 第一次 granted=true；第二次因 refId 相同（当日日期）返回 granted=false，不重复发放

#### Scenario: 无宠物或网络失败静默
- **WHEN** 无宠物用户触发上述事件，或奖励 API 调用失败
- **THEN** 不抛未捕获异常，其余宠物动画/气泡逻辑不受影响

### Requirement: 宠物仓储端口
`PetApplicationService` SHALL 通过领域端口 `PetAccessoryRepository` / `PetInteractionRepository` / `PetRewardRepository` 访问持久化，SHALL NOT 注入 MyBatis Mapper（`PetAccessoryMapper` / `PetInteractionMapper`）。

- `PetAccessoryRepository`：`findAllShopItems(): List<ShopItem>`、`findById(Long id): Optional<ShopItem>`（PO↔领域转换收口在基础设施实现）
- `PetInteractionRepository`：`save(PetInteraction interaction)`（领域 POJO：petId/type/quantity/moodChange/hungerChange/experienceGain）
- `PetRewardRepository`：`existsBySourceAndRefId(Long petId, RewardSource source, String refId)`、`save(PetReward reward)`

#### Scenario: 端口注入
- **WHEN** 构造 `PetApplicationService`
- **THEN** 依赖仅为 `PetRepository` + `PetDomainService` + 三个端口 + `CurrentUserService`，无 Mapper 引用

### Requirement: 共享事件类型扩展
`packages/shared/src/eventBus.ts` 中 `focus:completed` 事件的 payload SHALL 增加可选字段 `sessionId?: string`（幂等 refId 用），保持向后兼容（既有消费方无需修改）。

#### Scenario: 旧 payload 兼容
- **WHEN** 发出方 emit `{ type: 'focus:completed', payload: { duration: 1500 } }`（无 sessionId）
- **THEN** 类型检查通过，桥接以时间戳作为 refId 发放

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 首次完成奖励发放 | `PetApplicationServiceTest` | `grantReward_firstTime` | ➕ |
| 重复 refId 幂等跳过 | `PetApplicationServiceTest` | `grantReward_duplicate_skips` | ➕ |
| 无宠物静默跳过 | `PetApplicationServiceTest` | `grantReward_noPet_skips` | ➕ |
| 心情钳制 | `PetApplicationServiceTest` | `grantReward_moodClamped` | ➕ |
| 任务迁入 DONE 发放奖励 | `TodoApplicationServiceTest` | `moveTask_intoDone_grantsReward` | ➕ |
| DONE 列内重排不重复发放 | `TodoApplicationServiceTest` | `moveTask_doneToDone_noReward` | ➕ |
| 日程标记完成发放奖励 | `EventApplicationServiceTest` | `update_plannedToCompleted_grantsReward` | ➕ |
| 恢复为计划中不重复发放 | `EventApplicationServiceTest` | `update_completedToCompleted_noReward` | ➕ |
| 删除未完成日程触发负面奖励 | `EventApplicationServiceTest` | `delete_planned_grantsCancellationReward` | ➕ |
| 删除已完成日程不惩罚 | `EventApplicationServiceTest` | `delete_completed_noReward` | ➕ |
| 首次领取奖励 | `PetControllerTest` | `grantPetReward_shouldReturnGranted` | ➕ |
| 重复领取幂等 | `PetControllerTest` | `grantPetReward_duplicate_shouldReturnNotGranted` | ➕ |
| 习惯打卡发放奖励 | `petEventBridge.test.ts` | `habit:checked → 调用奖励 API` | ➕ |
| 专注完成发放奖励 | `petEventBridge.test.ts` | `focus:completed → 以 sessionId 为幂等键` | ➕ |
| 旧 payload 兼容（无 sessionId） | `petEventBridge.test.ts` | `focus:completed 无 sessionId → 以时间戳为幂等键` | ➕ |
| 每日签到每天一次 | `petEventBridge.test.ts` | `user:dailyCheckin → 以本地日期为幂等键` | ➕ |
| 无宠物或网络失败静默 | `petEventBridge.test.ts` | `奖励 API 失败 → 静默不抛异常` / `granted=false → 无粒子` | ➕ |
| 任务完成 → 币 +10（端到端） | `e2e/pet-economy.spec.ts` | `任务移入 DONE → 专注币 +10、经验 +20` | ➕ |
| 反复切换幂等（端到端） | `e2e/pet-economy.spec.ts` | `任务反复 TODO↔DONE → 奖励不重复发放` | ➕ |
| 日程完成 → 币 +20（端到端） | `e2e/pet-economy.spec.ts` | `日程标记完成 → 专注币 +20` | ➕ |
| 删除日程心情 -10（端到端） | `e2e/pet-economy.spec.ts` | `删除计划中日程 → 心情 -10` | ➕ |
| 无宠物用户流程正常（端到端） | `e2e/pet-economy.spec.ts` | `无宠物用户完成任务/日程 → 流程正常` | ➕ |
| 端口注入（零 Mapper） | `PetRewardRepositoryImplTest` | `exists_true` / `exists_false` / `save_mapsAndBackfills` | ➕ |
