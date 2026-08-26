# UML 设计图

> **领域模型图用于表达实体关系与字段，方法签名以代码为准**（仅修改方法签名而不改实体关系时不必更新本图）。

## 领域模型

```
┌──────────────────────────────────────────────────┐
│                    User                          │
├──────────────────────────────────────────────────┤
│ + id: Long                                       │
│ + openid: String          ── 微信登录（v3.5.1）   │
│ + username: String                               │
│ + email: String                                  │
│ + passwordHash: String                           │
│ + displayName: String                            │
│ + avatarUrl: String                              │
│ + status: UserStatus (ACTIVE/INACTIVE)           │
│ + lastLoginAt: LocalDateTime                     │
│ + createdAt: LocalDateTime                       │
│ + updatedAt: LocalDateTime                       │
└──────────────┬───────────────────────────────────┘
               │ owns (user_id)
┌──────────────▼───────────────────────────────────┐
│                    Event                         │
├──────────────────────────────────────────────────┤
│ + id: Long                                       │
│ + title: String                                  │
│ + description: String                            │
│ + startTime: LocalDateTime                       │
│ + endTime: LocalDateTime                         │
│ + allDay: Boolean                                │
│ + location: String                               │
│ + color: String                                  │
│ + reminderMinutes: Integer                       │
│ + status: EventStatus (PLANNED/COMPLETED/CANCELLED) │
│ + categoryId: Long                               │
│ + userId: Long                                   │
│ + tagIds: Set<Long>           ── 写路径          │
│ + tags: List<Tag>             ── 读路径投影      │
│ + lastRemindedAt: LocalDateTime ── 幂等去重      │
│ + categoryName: String        ── 读路径投影      │
│ + categoryColor: String       ── 读路径投影      │
│ + createdAt: LocalDateTime                       │
│ + updatedAt: LocalDateTime                       │
├──────────────────────────────────────────────────┤
│ + isValid(): boolean                             │
│ + isOverlapping(Event): boolean                  │
│ + update(Event): void                            │
│                                                   │
│ EventFilter（仓储层查询值对象，非实体）            │
│  + startTime / endTime / categoryId /            │
│    tagId / status / keyword / page / size        │
└──────────────┬───────────────────────────────────┘
               │ belongs to (category_id)
┌──────────────▼───────────────────┐
│           Category               │
├──────────────────────────────────┤
│ + id: Long                       │
│ + name: String                   │
│ + color: String                  │
│ + description: String            │
│ + userId: Long                   │
│ + createdAt: LocalDateTime       │
│ + updatedAt: LocalDateTime       │
├──────────────────────────────────┤
│ + isValid(): boolean             │
└──────────────────────────────────┘
               │
┌──────────────▼─────────┐    ┌──────────────────┐
│       EventTag          │    │       Tag        │
├─────────────────────────┤    ├──────────────────┤
│ + eventId: Long (PK)    │    │ + id: Long       │
│ + tagId: Long (PK)      │────│ + name: String   │
└─────────────────────────┘    │ + color: String  │
                               │ + userId: Long   │
                               │ + createdAt: LocalDateTime │
                               │ + updatedAt: LocalDateTime │
                               ├──────────────────┤
                               │ + isValid(): boolean │
                               └──────────────────┘

┌──────────────────────────────────────────────────┐
│           <<interface>>                          │
│        NotificationChannel                       │
├──────────────────────────────────────────────────┤
│ + send(Event): void                              │
└──────────────────────┬───────────────────────────┘
                       △
                       │ implements
          ┌────────────┴────────────┐
          │ BrowserNotification     │
          │ Service                 │
          └─────────────────────────┘
```

## 创建日程时序（含 JWT 认证）

```
Client      Filter     Controller   AppService   DomainService  Repository
  │           │            │            │             │              │
  │ POST /events           │            │             │              │
  │ JWT Bearer│            │            │             │              │
  │──────────>│            │            │             │              │
  │           │ parse      │            │             │              │
  │           │ userId=1   │            │             │              │
  │           │───────────>│            │             │              │
  │           │            │ toDomain() │             │              │
  │           │            │ setUserId()│             │              │
  │           │            │───────────>│             │              │
  │           │            │            │ isValid()   │              │
  │           │            │            │────────────>│              │
  │           │            │            │ findByRange(userId)       │
  │           │            │            │─────────────────────────>│
  │           │            │            │ hasConflict()│            │
  │           │            │            │────────────>│              │
  │           │            │            │ save()       │              │
  │           │            │            │─────────────────────────>│
  │           │            │            │              │ batchInsert│
  │           │            │ toResponse()│             │              │
  │           │            │<───────────│             │              │
  │<──────────│<───────────│            │             │              │
```

## 查询日程时序（含标签批量加载）

```
Client      Filter     Controller   AppService       Repository     DB
  │           │            │            │                 │           │
  │ GET /events?keyword=&page=&size=    │                 │           │
  │ JWT Bearer│            │            │                 │           │
  │──────────>│            │            │                 │           │
  │           │ userId=1   │            │                 │           │
  │           │───────────>│            │                 │           │
  │           │            │ findByRange(userId,keyword,page,size)   │
  │           │            │───────────>│                 │           │
  │           │            │            │ selectByRange    │           │
  │           │            │            │────────────────>│           │
  │           │            │            │ event rows       │           │
  │           │            │            │<────────────────│           │
  │           │            │            │ selectTagsByEventIds (JOIN) │
  │           │            │            │────────────────>│           │
  │           │            │            │ tag rows          │           │
  │           │            │            │<────────────────│           │
  │           │            │            │ 分组回填 tags     │           │
  │           │ toResponseList()        │                 │           │
  │           │<───────────│            │                 │           │
  │<──────────│<───────────│            │                 │           │
```

## 提醒通知时序（幂等）

```
Scheduler     Repository     Channel    SseEmitter    Browser
  │               │             │           │            │
  │ findUpcoming()│             │           │            │
  │──────────────>│             │           │            │
  │  upcoming[]   │             │           │            │
  │<──────────────│             │           │            │
  │               │             │           │            │
  │ for each event:            │           │            │
  │  withinWindow(remindAt)?   │           │            │
  │  alreadyReminded(last_reminded_at)? │  │            │
  │  │                          │           │            │
  │  ├─ dispatch(event) ──────>│           │            │
  │  │                          │ sendToUser(userId)     │
  │  │                          │──────────>│            │
  │  │                          │           │ SSE event  │
  │  │                          │           │───────────>│
  │  │                          │           │            │ browser notify
  │  markReminded(id, now)      │           │            │
  ```


## Pet 领域模型（v3.2 新增）

```
┌──────────────────────────────────────────────────┐
│                     Pet                          │
├──────────────────────────────────────────────────┤
│ + id: Long                                       │
│ + userId: Long (UNIQUE)                          │
│ + species: PetSpecies (ORANGE_CAT / SHIBA_INU)   │
│ + name: String                                   │
│ + experience: Integer                            │
│ + level: Integer (1-50)                          │
│ + mood: Integer (0-100)                          │
│ + hunger: Integer (0-100)                        │
│ + coins: Integer                                 │
│ + currentAccessory: Long                         │
│ + lastInteractedAt: LocalDateTime                │
│ + createdAt: LocalDateTime                       │
│ + updatedAt: LocalDateTime                       │
├──────────────────────────────────────────────────┤
│ + isValid(): boolean                             │
│ + applyInteraction(InteractionResult): void      │
│ + applyDecay(moodDelta, hungerDelta): void       │
└──────────────────────────────────────────────────┘
               │ belongs to (user_id, 每用户一只)

   说明：互动记录 `pet_interactions` 仅为持久化表，领域层不设实体——
   互动效果由应用层计算为 `InteractionResult` 值对象后由 `Pet.applyInteraction()` 应用。

   说明（v3.4 更新）：`PetInteraction` / `PetReward` 已升级为领域 POJO，
   经 `PetInteractionRepository` / `PetRewardRepository` 端口持久化（应用层不再直连 Mapper）。
   奖励发放 `PetDomainService.grant(pet, source)` 同样产出 `InteractionResult` 后复用 `applyInteraction()`。

   说明（v3.5 更新）：购买数值同样由 `PetDomainService.purchase(pet, item, quantity)` 产出
   `InteractionResult` 后复用 `applyInteraction()`（钳制唯一实现点）。
   装备语义：ACCESSORY 购买 → `Pet.currentAccessory = itemId`（覆盖）；取下 →
   `PetRepository.clearCurrentAccessory(petId)` 显式 SET NULL（updateById 默认跳过 null 字段）。

┌──────────────────────────────────┐
│          ShopItem                 │
├──────────────────────────────────┤
│ + id: Long                       │
│ + name: String                   │
│ + type: FOOD / ACCESSORY         │
│ + price: Integer                 │
│ + effectMood / effectHunger      │
│ + effectExperience: Integer      │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│      RewardSource（枚举）         │
├──────────────────────────────────┤
│ TASK_COMPLETED    +10 币 +20 经验 │
│ EVENT_COMPLETED   +20 币 +30 经验 │
│ EVENT_CANCELLED   心情 -10        │
│ FOCUS_COMPLETED   +5 币 +10 经验  │
│ DAILY_CHECKIN     +15 币 +10 经验 │
│ HABIT_CHECKED     +5 币 +10 经验  │
└──────────────────────────────────┘
               │ 1
               ▼
┌──────────────────────────────────┐
│          PetReward                │
├──────────────────────────────────┤
│ + petId: Long (FK → pets)        │
│ + source: RewardSource           │
│ + refId: String (≤64)            │
│ + coinChange / experienceGain    │
│ + moodChange: Integer            │
├──────────────────────────────────┤
│ UNIQUE (pet_id, source, ref_id)  │ ← 幂等发放硬约束
└──────────────────────────────────┘
```

## Task 领域模型（v3.3 新增）

```
┌──────────────────────────────────────────────────┐
│                     Task                         │
├──────────────────────────────────────────────────┤
│ + id: Long                                       │
│ + userId: Long                                   │
│ + title: String                                  │
│ + description: String                            │
│ + status: TaskStatus (TODO/IN_PROGRESS/DONE)     │
│ + priority: TaskPriority (LOW/MED/HIGH/URGENT)   │
│ + sortOrder: Integer                             │
│ + dueDate: LocalDate                             │
│ + tagIds: List<Long>          ── 写路径          │
│ + tags: List<Tag>             ── 读路径投影      │
│ + createdAt: LocalDateTime                       │
│ + updatedAt: LocalDateTime                       │
├──────────────────────────────────────────────────┤
│ + isValid(): boolean                             │
│ + moveToStatus(status): void                     │
└──────────────────────────────────────────────────┘

               │ belongs to (user_id)
               │ N:M Tag — 关联表 task_tags（task_id + tag_id）
               │   （写路径 tagIds，读路径投影 tags，与 Event 同模式）
```
