# UML 设计图

## 领域模型

```
┌──────────────────────────────────────────────────┐
│                    Event                         │
├──────────────────────────────────────────────────┤
│ + id: Long                                       │
│ + title: String                                  │
│ + description: String                            │
│ + startTime: LocalDateTime                       │
│ + endTime: LocalDateTime                         │
│ + allDay: boolean                                │
│ + location: String                               │
│ + color: String                                  │
│ + reminderMinutes: Integer                       │
│ + categoryId: Long                               │
│ + tagIds: List<Long>                             │
├──────────────────────────────────────────────────┤
│ + isValid(): boolean                             │
│ + isOverlapping(Event): boolean                  │
│ + update(Event): void                            │
└──────────────┬───────────────────────────────────┘
               │ belongs to
┌──────────────▼───────────────────┐
│           Category               │
├──────────────────────────────────┤
│ + id: Long                       │
│ + name: String                   │
│ + color: String                  │
│ + description: String            │
└──────────────────────────────────┘
               │
┌──────────────▼─────┐    ┌──────────────┐
│      EventTag      │    │     Tag      │
├────────────────────┤    ├──────────────┤
│ + eventId: Long    │    │ + id: Long   │
│ + tagId: Long      │────│ + name: String│
└────────────────────┘    │ + color: String│
                          └──────────────┘

┌──────────────────────────────────────────────────┐
│           <<interface>>                          │
│        NotificationChannel                       │
├──────────────────────────────────────────────────┤
│ + send(Event): void                              │
│ + supports(NotificationType): boolean            │
└──────────────────────┬───────────────────────────┘
                       △
                       │ implements
          ┌────────────┴────────────┐
          │ BrowserNotification     │
          │ Service                 │
          └─────────────────────────┘
```

## 创建日程时序

```
Client      Controller    AppService    DomainService   Repository
  │              │             │              │              │
  │ POST /events │             │              │              │
  │─────────────>│             │              │              │
  │              │ toDomain()  │              │              │
  │              │────────────>│              │              │
  │              │             │ isValid()    │              │
  │              │             │─────────────>│              │
  │              │             │ findByRange()│              │
  │              │             │─────────────────────────────>│
  │              │             │ hasConflict()│              │
  │              │             │─────────────>│              │
  │              │             │ save()       │              │
  │              │             │─────────────────────────────>│
  │              │ toResponse()│              │              │
  │              │<────────────│              │              │
  │<─────────────│             │              │              │
```

## 提醒通知时序

```
Scheduler     Repository    Channel    SseEmitter    Browser
  │               │            │           │            │
  │ findUpcoming()│            │           │            │
  │──────────────>│            │           │            │
  │  upcoming[]   │            │           │            │
  │<──────────────│            │           │            │
  │               │            │           │            │
  │ send(event)   │            │           │            │
  │──────────────>│            │           │            │
  │               │ SSE event  │           │            │
  │               │───────────>│           │            │
  │               │            │  notify   │            │
  │               │            │──────────>│            │
  │               │            │           │            │
  │               │            │       browser notify  │
  │               │            │───────────────────────>│
```
