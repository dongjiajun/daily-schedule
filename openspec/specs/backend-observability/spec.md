# Backend Observability（后端可观测性）

## Purpose
后端日志、链路追踪、健康探活与调度资源隔离四类可观测性基础设施落地：日志滚动持久化（重启不丢）、request-id 全链路关联（异常可定位）、Actuator health + 容器 healthcheck（部署可探活）、@Scheduled 专用线程池（调度任务互不阻塞）。

## Requirements

### Requirement: 日志滚动与分级
`src/main/resources/logback-spring.xml` SHALL 定义日志输出策略：prod profile 下 SHALL 输出到滚动文件（`logs/daily-schedule.log`，按天滚动，保留 7 天）；dev/test profile SHALL 以控制台输出为主。pattern SHALL 包含时间、级别、线程、类名、requestId（MDC `requestId`）、消息与异常堆栈。包级分级 SHALL 将项目包 `com.dailyschedule` 设为 INFO，框架包保持默认 WARN。

#### Scenario: prod 日志落盘滚动
- **WHEN** prod profile 运行且产生日志
- **THEN** 日志写入 `logs/daily-schedule.log`，按天滚动（`daily-schedule.2026-08-15.log`），超过 7 天的归档文件自动删除

#### Scenario: 日志条目含 requestId
- **WHEN** 请求携带 `X-Request-Id: abc-123` 且处理中产生日志
- **THEN** 日志行 pattern 中 requestId 位置输出 `abc-123`（无请求时为空/占位）

#### Scenario: 按包分级
- **WHEN** `com.dailyschedule` 包产生 INFO 级别日志
- **THEN** 输出该日志；框架包（如 org.springframework）的 DEBUG 日志不输出

### Requirement: Request-Id 全链路
新增 `RequestIdFilter`（OncePerRequestFilter，注册于 Security 过滤器链之前）SHALL：请求携带 `X-Request-Id` 时沿用（回显校验长度 ≤ 64 字符），否则生成 UUID；将 requestId 写入 MDC（key `requestId`）；响应头 `X-Request-Id` 回写同一值。请求处理结束 SHALL 清理 MDC 防线程复用串号。

#### Scenario: 沿用客户端 requestId
- **WHEN** 请求头含 `X-Request-Id: trace-42`
- **THEN** MDC requestId 为 `trace-42`，响应头 `X-Request-Id: trace-42`，日志行含 `trace-42`

#### Scenario: 无 requestId 时生成
- **WHEN** 请求头不含 `X-Request-Id`
- **THEN** 生成 UUID 格式 requestId，写入 MDC 并回写响应头

#### Scenario: MDC 清理
- **WHEN** 请求处理完成（finally）
- **THEN** MDC 移除 `requestId`，后续复用同线程的请求不受污染

### Requirement: Controller 入口与认证失败日志
7 个 Controller（Auth/Category/Event/Pet/Sse/Tag/Todo）的公开端点方法 SHALL 在入口记录 INFO 日志（方法名 + 关键参数如 id/userId，不含敏感字段密码/token）；`SecurityConfig` 的 `HttpStatusEntryPoint` SHALL 记录 WARN 日志（未认证访问路径），替换静默 401。

#### Scenario: 控制器入口日志
- **WHEN** 请求进入 `CategoryController.create`
- **THEN** 输出 INFO 日志含方法名与 userId

#### Scenario: 认证失败日志
- **WHEN** 未携带凭证的请求访问受保护端点
- **THEN** 输出 WARN 日志含请求路径，并返回 401

### Requirement: 异常日志含堆栈
`ReminderScheduler.dispatch` 与 `BrowserNotificationService.serialize` 的 `log.error` SHALL 传入异常对象（`log.error("...", e)`），堆栈 SHALL 出现在日志中，而非仅 message。

#### Scenario: 提醒分发失败记录堆栈
- **WHEN** 提醒通道 send 抛出异常
- **THEN** 日志含异常堆栈（exception 参数传入）

#### Scenario: 载荷序列化失败记录堆栈
- **WHEN** JSON 序列化抛出 JsonProcessingException
- **THEN** 日志含异常堆栈（exception 参数传入）

### Requirement: Actuator health 与容器 healthcheck
pom SHALL 引入 `spring-boot-starter-actuator`，仅暴露 `health` 端点（`management.endpoints.web.exposure.include: health`）；`SecurityConfig` SHALL 显式放行 `GET /actuator/health`（匿名探活）；`docker-compose.yml` backend 服务 SHALL 增加 healthcheck（`curl /actuator/health` 判定 UP）。

#### Scenario: 探活端点返回 UP
- **WHEN** 应用运行中，请求 `GET /actuator/health`
- **THEN** 返回 200 `{"status":"UP"}`，无需认证

#### Scenario: 容器健康检查生效
- **WHEN** docker-compose 启动 backend 容器
- **THEN** healthcheck 周期探测 `/actuator/health`，UP 时容器标记 healthy

### Requirement: @Scheduled 专用线程池
`ScheduleConfig` SHALL 定义 `TaskScheduler` bean（池大小 ≥ 2，线程名前缀 `scheduler-`），`ReminderScheduler`（30s 提醒扫描）与 `PetStatusScheduler`（10min 宠物衰减）SHALL 运行于该线程池——一个调度任务阻塞 SHALL NOT 阻塞另一个。

#### Scenario: 调度任务并行独立
- **WHEN** 提醒扫描任务耗时阻塞
- **THEN** 宠物衰减任务仍在独立线程按时执行（不等待阻塞任务释放）

#### Scenario: 调度线程可识别
- **WHEN** 查看线程名
- **THEN** 调度任务运行于 `scheduler-*` 前缀线程
