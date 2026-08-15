# Proposal: 后端可观测性与异常语义修复（线2 A+B+C + 线1 O9）

## Why
后端可观测性近乎为零（线2 调查：102 个 Java 文件仅 5 个含日志、零 logback 配置日志重启即丢、零 Actuator/health 端点、零 request-id/MDC——生产问题无法定位）；异常状态码存在语义缺口（线1 O9：`IllegalStateException` 一律落 500，业务冲突与用户不存在无法区分；`handleRuntime` 与 `handleGeneral` 重复）。

## What Changes
- **日志基础设施**：新增 `logback-spring.xml`——滚动文件（按天 + 保留 7 天）+ pattern 含 requestId + 按包分级；dev/test/prod yml 补 logging 配置（dev/test 控制台为主，prod 文件滚动）
- **request-id 全链路**：新增 `RequestIdFilter`（OncePerRequestFilter）——解析/生成 `X-Request-Id` 写入 MDC，响应回写头；`GlobalExceptionHandler` 错误响应携带 requestId（真正解决"异常定位"）
- **日志补齐**：7 个 Controller 入口 + 认证失败（SecurityConfig `HttpStatusEntryPoint` 静默 401）补日志；`ReminderScheduler.java:73`、`BrowserNotificationService.java:51` 的 `log.error` 补 ex 参数（现状仅 message 无堆栈）
- **健康与调度**：pom 加 `spring-boot-starter-actuator`，仅暴露 health 端点，`SecurityConfig` 显式放行 `/actuator/health`；docker-compose backend 加 healthcheck；`ScheduleConfig` 配 `@Scheduled` 专用线程池（现状两个调度任务共享默认单线程，一个卡死拖住另一个）
- **异常状态码修复（线1 O9）**：`PetApplicationService.java:41,92` 的 `IllegalStateException`（重复创建/无食物）→ `BusinessException`→409；`AuthApplicationService.java:110`（当前用户已不存在）→ `ResourceNotFoundException`→404；`GlobalExceptionHandler` 合并 `handleRuntime`/`handleGeneral` 为单一兜底 handler

## Capabilities

### New Capabilities
- `backend-observability`: 后端可观测性——日志滚动与分级、request-id 全链路（MDC + X-Request-Id）、Controller/认证失败日志、Actuator health + 容器 healthcheck、@Scheduled 专用线程池
- `api-error-handling`: API 异常语义——业务冲突 409 / 资源与用户不存在 404 的状态码映射、单一兜底 handler、错误响应携带 requestId

### Modified Capabilities
- 无（主 specs 无异常处理/可观测性相关 requirement 可改）

## API Contract Impact
- 无契约字段变更（错误响应为既有 `ModelApiResponse` 结构，message 字段携带 requestId 后缀不改变 schema；响应头 `X-Request-Id` 为新增头，非契约破坏）
- `specs/openapi.yaml`、CHANGELOG、版本号不动

## DDD Layer Impact
- **API 层**：`GlobalExceptionHandler`（状态码修复 + 合并兜底 + requestId 携带）、7 个 Controller（入口日志）
- **应用层**：`PetApplicationService`、`AuthApplicationService`（异常类型替换）
- **基础设施层**：新增 `RequestIdFilter`；`SecurityConfig`（actuator 放行 + 401 日志）、`ScheduleConfig`（调度线程池）、`logback-spring.xml`、yml 配置

## Database Impact
- 无需 Flyway 迁移

## Impact
- **后端**：`api/exception/`、`api/controller/`、`application/pet/`、`application/auth/`、`infrastructure/security/`、`infrastructure/config/`、`infrastructure/scheduled/`、`infrastructure/notification/`、`src/main/resources/`
- **依赖**：pom 加 `spring-boot-starter-actuator`
- **部署**：docker-compose backend 加 healthcheck
- **测试**：新增 `GlobalExceptionHandlerTest`（盲区）+ `RequestIdFilter` 测试；既有测试核对异常类型替换后的断言
- **文档**：`docs/architecture.md` 补监控/日志章节 + `CLAUDE.md` 同步
