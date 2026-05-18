# UML 设计图

## 领域模型

```
┌──────────────────────────────────────────────────┐
│                    User                          │
├──────────────────────────────────────────────────┤
│ + id: Long                                       │
│ + username: String                               │
│ + passwordHash: String                           │
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
  │──────────────>│             │           │            │
```
