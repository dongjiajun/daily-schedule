# Design: 后端可观测性与异常语义修复（backend-observability）

## Context

**现状**（线2 调查确认）：
- 102 个 Java 文件仅 5 个含日志（4.9%）；零 logback 配置（Spring Boot 默认控制台输出，重启即丢）
- 零 request-id/MDC——多请求并发下日志无法关联到具体请求，异常无法定位
- 零 Actuator/health 端点；docker-compose backend 无 healthcheck（mysql 有）
- 两个 `@Scheduled` 任务（ReminderScheduler 30s / PetStatusScheduler 10min）共享 Spring 默认单线程调度器——一个阻塞拖住另一个
- 异常语义缺口（线1 O9）：`IllegalStateException` 无 handler 映射 → 一律 500；`GlobalExceptionHandler` 的 `handleRuntime`/`handleGeneral` 重复实现同一逻辑
- 4 处 `log.error` 中 2 处（`ReminderScheduler.java:73`、`BrowserNotificationService.java:51`）缺 ex 参数无堆栈

**约束**：不改 API 契约（错误响应仍为 `ModelApiResponse` 结构）；DDD 分层（异常类型放 api/exception 包，供应用层引用——与既有 `ResourceNotFoundException` 先例一致）；测试 H2 + `@SpringBootTest` 先例；docker-compose 是部署唯一入口。

## Goals / Non-Goals

**Goals:**
- 日志持久化（prod 文件滚动 7 天）+ request-id 全链路（MDC + X-Request-Id + 错误响应携带）
- 探活（Actuator health + 容器 healthcheck）+ 调度线程池隔离
- 异常状态码语义修复（409/404）+ 单一兜底 handler
- Controller 入口与认证失败日志，异常日志含堆栈

**Non-Goals:**
- 不做 Prometheus/Grafana（D 路线按需上，TEMP doc 已定）
- 不做 Loki/ELK 集中日志（多实例场景再上）
- 不改 API 契约/版本号；不做日志查询管理页
- 不做性能级 tracing（OpenTelemetry）——request-id 手动链路足够当前单机排查

## Decisions

### Decision 1: logback-spring.xml 按 profile 分流（prod 滚动 / dev+test 控制台）
- **选择**: `src/main/resources/logback-spring.xml` 定义：默认（dev/test）控制台 pattern；`<springProfile name="prod">` 下追加滚动文件 appender（`logs/daily-schedule.log`，`TimeBasedRollingPolicy` 按天 `%d{yyyy-MM-dd}` 滚动，`maxHistory=7`）；pattern 统一含 `%X{requestId}`
- **理由**: Spring Boot 官方推荐 `logback-spring.xml`（支持 springProfile 条件段）；一个文件管三环境，避免 yml 碎片化配置；7 天保留与单机运维习惯一致
- **备选方案**: 三份 yml logging 配置——logging.file 仅单文件无滚动策略，需额外 logback 定制，双处配置更乱；`logback.xml`（非 -spring）——无法用 profile 条件段

### Decision 2: RequestIdFilter 用 @Component + @Order 注册（Security 链之前）
- **选择**: 新建 `infrastructure/security/RequestIdFilter extends OncePerRequestFilter`，`@Component` + `@Order(Ordered.HIGHEST_PRECEDENCE)` 注册到 Servlet 容器（在 Spring Security 过滤器链之前执行）；解析/生成 requestId（沿用值校验长度 ≤ 64）→ MDC → 响应头回写 → finally 清理 MDC
- **理由**: 注册在 Security 链之前，认证失败（401 entry point）、CORS 预检、后续所有日志（含 SecurityConfig 的 401 WARN）都能拿到 requestId；OncePerRequestFilter 防异步转发重复执行；纯 Servlet 依赖，测试无需 Spring 上下文
- **备选方案**: 在 SecurityConfig.filterChain 内 addFilterBefore——Security 自身处理（401 等）拿不到 requestId；`HandlerInterceptor`——晚于过滤器链，且不能覆盖异步线程

### Decision 3: Controller 入口日志手工逐方法添加（不引入 AOP）
- **选择**: 7 个 Controller 的公开端点方法各加一行 `log.info`（方法名 + userId/关键 id 参数；AuthController 不记录密码/token 字段）；401 日志通过自定义 `HttpStatusEntryPoint` lambda（WARN + 路径）
- **理由**: 显式、零新依赖、字段可控（敏感字段不入日志）；约 28 个方法规模下手工成本可接受
- **备选方案**: AOP 切面统一入口日志——少侵入但参数序列化难控（可能误记敏感字段），且引入切面依赖与隐式行为，项目无 AOP 先例

### Decision 4: BusinessException 新建于 api/exception 包
- **选择**: 新建 `api/exception/BusinessException.java`（继承 RuntimeException，构造 message）；`PetApplicationService` 两处 `IllegalStateException` 替换为 `BusinessException`；`AuthApplicationService.java:110` 替换为 `ResourceNotFoundException("当前用户已不存在")`；GlobalExceptionHandler 新增 `@ExceptionHandler(BusinessException.class)` → 409
- **理由**: 与既有 `ResourceNotFoundException` 同包同模式（应用层可引用，异常映射收口 GlobalExceptionHandler）；领域/应用层保持不依赖 HTTP 语义，仅抛语义化业务异常
- **备选方案**: Spring `ResponseStatusException`——含 HTTP 耦合且模板冗长；自定义 `ConflictException`——与 BusinessException 等价，命名更通用选后者

### Decision 5: 兜底 handler 合并为单一 Exception handler
- **选择**: 删除 `handleRuntime`，保留 `@ExceptionHandler(Exception.class)` 单一兜底（500 + "服务器内部错误" + log.error 含堆栈）
- **理由**: `Exception` 是 `RuntimeException` 超类，单一 handler 天然覆盖两者，现有实现逐行重复
- **备选方案**: 保留双 handler——重复维护，且未来逻辑漂移风险

### Decision 6: 错误响应 message 携带 requestId 后缀
- **选择**: GlobalExceptionHandler 加私有 helper `withRequestId(String msg)`：MDC 有 requestId 时返回 `msg + "（requestId: " + id + "）"`，否则原样；所有 handler 的 `resp.setMessage(...)` 统一走 helper
- **理由**: 不改变 `ModelApiResponse` schema（message 仍是 string），用户凭响应可检索日志；所有错误类型统一携带，行为一致
- **备选方案**: 响应加独立 requestId 字段——需改 openapi 契约 + 生成代码，超出本次范围；仅兜底 handler 携带——业务错误（409/404）同样需要定位，覆盖不足

### Decision 7: Actuator 仅暴露 health + 显式放行
- **选择**: pom 加 `spring-boot-starter-actuator`；`application.yml` 配 `management.endpoints.web.exposure.include: health`；`SecurityConfig` 在 permitAll 列表显式加 `"/actuator/health"`；docker-compose backend 加 healthcheck（`curl -sf http://localhost:8080/actuator/health`）
- **理由**: 只暴露 health 最小攻击面；显式 permitAll 声明意图（现状 anyRequest().permitAll() 隐式放行，actuator 引入后必须显式约束）；容器探活是部署闭环
- **备选方案**: 暴露全部端点——metrics/env 等敏感信息裸奔，违背最小暴露原则

### Decision 8: TaskScheduler 专用线程池（池 2）
- **选择**: `ScheduleConfig` 新增 `TaskScheduler` bean：`ThreadPoolTaskScheduler`，poolSize 2，threadNamePrefix `scheduler-`（Clock bean 不动）
- **理由**: 两个调度任务独立线程互不阻塞；`@Scheduled` 自动检测容器内唯一的 TaskScheduler bean 并采用；池 2 匹配任务数，名前缀便于线程识别
- **备选方案**: 分别用 `@Async` 线程池 + Scheduled——复杂度高无收益；pool 1——等于现状

### Decision 9: 测试方式（纯单测 + 集成各半）
- **选择**: `GlobalExceptionHandlerTest` 纯 Mockito 单测（new 实例直调各 handler，断言 code/message/requestId 后缀，MDC 手动 put/remove）+ `RequestIdFilterTest` 纯单测（MockHttpServletRequest/Response + MockFilterChain 断言 MDC/响应头/清理）；另加 1 个 `@SpringBootTest` + MockMvc 集成用例验证 `/api/v1/**` 未认证 401 响应含 X-Request-Id 头（复用 CorsConfigTest 模式）
- **理由**: handler/filter 无外部依赖，纯单测覆盖全部映射分支零上下文开销；集成 1 例验证过滤器链真实注册顺序（@Order 是否生效）
- **备选方案**: 全部 @SpringBootTest 集成——上下文启动慢且重复；零集成——@Order 注册错误（如被 Security 吞掉）无法发现

## DDD Layer Design

### 领域层 (domain/)
无变更。

### 基础设施层 (infrastructure/)
- **security**: 新增 `RequestIdFilter.java`（@Component @Order(HIGHEST_PRECEDENCE)）；`SecurityConfig`：permitAll 列表加 `/actuator/health`，`HttpStatusEntryPoint` 改自定义 lambda（WARN 日志含请求路径）
- **config**: `ScheduleConfig` 加 `TaskScheduler` bean
- **scheduled/notification**: `ReminderScheduler.dispatch`、`BrowserNotificationService.serialize` 的 log.error 补 ex 参数
- **resources**: 新增 `logback-spring.xml`；`application.yml` 加 management.endpoints 配置

### 应用层 (application/)
- `PetApplicationService`：两处 `IllegalStateException` → `BusinessException`（:41 已有宠物、:92 无食物）
- `AuthApplicationService`：:110 `IllegalStateException("当前用户已不存在")` → `ResourceNotFoundException`

### API 层 (api/)
- **exception**: 新增 `BusinessException.java`；`GlobalExceptionHandler`：+BusinessException→409 handler、删 handleRuntime 保留单一兜底、全部 handler message 走 withRequestId helper
- **controller**: 7 个 Controller 入口 INFO 日志（Auth 不记录敏感字段）

### 前端 (frontend/src/)
无变更。

## API Design
无契约变更——`specs/openapi.yaml`、CHANGELOG、版本号不动。响应新增头 `X-Request-Id`（非契约 schema）；`ModelApiResponse.message` 内容追加 requestId 后缀（schema 不变）。

## Database Design
无数据库变更。

## Risks / Trade-offs
- **[错误响应 message 变化（追加 requestId 后缀）可能影响前端断言]** → 前端不解析 message 全文（sonner 直接展示），E2E 断言按包含匹配；若 E2E 有精确 message 相等断言需核对（E2E 回归覆盖）
- **[logback 文件滚动目录权限（Docker 容器 logs/ 写权限）]** → 容器以默认用户运行，WORKDIR /app 可写，logs/ 相对路径落在 /app/logs；本地 dev 同理落在 backend/logs
- **[RequestIdFilter @Order 与 Spring Security 的注册顺序]** → 集成测试断言未认证 401 响应携带 X-Request-Id 头（若顺序错误该断言失败）
- **[healthcheck curl 依赖（eclipse-temurin:21-jre 镜像是否含 curl）]** → docker-compose up 验证任务实测；若镜像缺 curl 改用 `bash /dev/tcp` 方案（compose healthcheck 支持 bash 语法）
- **[BusinessException 语义与 DuplicateKeyException 重叠]** → 重复创建宠物路径先查库（服务层判定）不落数据库约束冲突，409 handler 覆盖两种场景（既有 DuplicateAccountException/DuplicateKeyException handler 不变）
- **[@Scheduled 线程池变更影响测试（时钟 mock 与调度并发）]** → 既有 ReminderSchedulerTest/PetStatusSchedulerTest 为直接方法调用（不依赖容器调度），TaskScheduler bean 仅在容器启动时生效，无测试影响（全量回归确认）

## Migration Plan
- **部署**: 纯新增配置+日志+异常语义；无数据迁移；重启生效
- **回滚**: git revert 单变更；日志文件为运行时产物不影响回滚
- **验证顺序**: `mvn test`（新增 2 个测试类 + 既有回归）→ 本地启动 dev 观察日志格式与控制台 → docker-compose up 观察 healthcheck → `docs:check`

## Open Questions
无。healthcheck 的 curl 可用性在验证任务中实测确认（风险表已列 fallback）。
