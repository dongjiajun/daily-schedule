# UML 设计图

## 领域模型

```
┌──────────────────────────────────────────────────┐
│                    User                          │
├──────────────────────────────────────────────────┤
│ + id: Long                                       │
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
│ + feed(item, quantity): InteractionResult        │
│ + play(): InteractionResult                      │
│ + updateMood(delta): void                        │
└──────────────┬───────────────────────────────────┘
               │ has
┌──────────────▼───────────────────┐
│        PetInteraction            │
├──────────────────────────────────┤
│ + id: Long                       │
│ + petId: Long (FK)               │
│ + type: FEED / PLAY              │
│ + quantity: Integer              │
│ + moodChange: Integer            │
│ + hungerChange: Integer          │
│ + experienceGain: Integer        │
│ + createdAt: LocalDateTime       │
└──────────────────────────────────┘

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
│ + tagIds: Set<Long>           ── 写路径          │
│ + tags: List<Tag>             ── 读路径投影      │
│ + createdAt: LocalDateTime                       │
│ + updatedAt: LocalDateTime                       │
├──────────────────────────────────────────────────┤
│ + isValid(): boolean                             │
│ + moveToStatus(status): void                     │
└──────────────────────────────────────────────────┘
```
