# 架构说明

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React 19)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Calendar  │ │ EventForm │ │ Sidebar  │ │ Zustand   │  │
│  │ (big-cal) │ │ + Modal   │ │ + Filter │ │ + RQuery  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ REST / SSE
┌──────────────────────▼──────────────────────────────────┐
│              Spring Boot 3.4 (Java 21)                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ API 层 — Controller + DTO + Assembler             │   │
│  │ 实现 generated/api/ 接口，编译期强制契约同步       │   │
│  └─────────────────────┬────────────────────────────┘   │
│                        │                                 │
│  ┌─────────────────────▼────────────────────────────┐   │
│  │ 应用层 — ApplicationService                       │   │
│  │ 业务流程编排、事务管理、参数校验                   │   │
│  └─────────────────────┬────────────────────────────┘   │
│                        │                                 │
│  ┌─────────────────────▼────────────────────────────┐   │
│  │ 领域层 — Entity + DomainService + Repository 接口  │   │
│  │ 纯 POJO，无框架依赖，封装核心业务规则              │   │
│  └─────────────────────▲────────────────────────────┘   │
│                        │                                 │
│  ┌─────────────────────┴────────────────────────────┐   │
│  │ 基础设施层 — Repository Impl + PO + Mapper        │   │
│  │ MyBatis-Plus、Flyway、定时任务、通知通道          │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  MySQL 8.0 (InnoDB)                      │
│   category | tag | event | event_tag                     │
└──────────────────────────────────────────────────────────┘
```

## 数据流示例：创建日程

1. Browser `POST /api/v1/events` → `EventController.createEvent()`
2. Controller 接收生成的 `EventCreateRequest` DTO
3. `EventAssembler.toDomain()` 转换 DTO → 领域 `Event`
4. `EventApplicationService.create()` → `isValid()` + `hasTimeConflict()` → `save()`
5. `EventRepositoryImpl` 转换 Event → EventPO → MyBatis-Plus insert
6. 结果经 `EventAssembler.toResponse()` 返回客户端

## 模块结构

| 模块 | 路径 | 职责 |
|------|------|------|
| API | `api/controller/`, `api/assembler/` | REST 端点、DTO 转换 |
| 应用 | `application/event/`, `application/category/`, `application/tag/` | 用例编排 |
| 领域 | `domain/event/`, `domain/category/`, `domain/tag/`, `domain/notification/` | 业务实体与规则 |
| 基础设施 | `infrastructure/persistence/`, `infrastructure/config/`, `infrastructure/scheduled/`, `infrastructure/notification/` | 持久化、配置、调度 |
