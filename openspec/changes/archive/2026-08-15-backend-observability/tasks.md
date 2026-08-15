# Tasks: 后端可观测性与异常语义修复（backend-observability）

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更（无 Flyway 迁移、无表/列变动）

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无领域层变更（异常类型放 api/exception 包，与 ResourceNotFoundException 先例一致）

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 新增 `src/main/resources/logback-spring.xml`：默认控制台 pattern（含 `%X{requestId}`），prod profile 滚动文件 appender（`logs/daily-schedule.log` 按天滚动、maxHistory 7 天）；`com.dailyschedule` 包 INFO 分级
- [x] 3.2 `pom.xml` 加 `spring-boot-starter-actuator`；`application.yml` 加 `management.endpoints.web.exposure.include: health`
- [x] 3.3 新增 `infrastructure/security/RequestIdFilter.java`（OncePerRequestFilter，`@Component` + `@Order(Ordered.HIGHEST_PRECEDENCE)`）：解析/生成 X-Request-Id（沿用值校验 ≤64 字符）→ MDC → 响应头回写 → finally 清理 MDC
- [x] 3.4 `SecurityConfig`：permitAll 列表加 `/actuator/health`；`HttpStatusEntryPoint` 改自定义 lambda（WARN 日志含请求路径）
- [x] 3.5 `ScheduleConfig` 加 `TaskScheduler` bean（ThreadPoolTaskScheduler，poolSize 2，前缀 `scheduler-`）
- [x] 3.6 `ReminderScheduler.dispatch`、`BrowserNotificationService.serialize` 的 `log.error` 补 ex 参数（堆栈入日志）
- [x] 3.7 编写 `RequestIdFilterTest`（纯单测：沿用/生成/MDC 清理/响应头）+ `CorsConfigTest` 补 1 集成用例（未认证 401 响应携带 X-Request-Id 头，验证 @Order 真实注册顺序）

## 4. 应用层 (application/)
- [x] 4.1 `PetApplicationService`：:41「已有宠物，不可重复创建」与 :92「商店中没有可用的食物」的 `IllegalStateException` → `BusinessException`
- [x] 4.2 `AuthApplicationService`：:110「当前用户已不存在」的 `IllegalStateException` → `ResourceNotFoundException`
- [x] 4.3 核对/更新既有测试：`PetApplicationServiceTest` / `AuthApplicationServiceTest` 断言更新为 BusinessException / ResourceNotFoundException（PetControllerTest 无相关断言）

## 5. API 层 (api/)
- [x] 5.1 新增 `api/exception/BusinessException.java`（继承 RuntimeException）
- [x] 5.2 `GlobalExceptionHandler`：新增 `BusinessException` → 409 handler；删除 `handleRuntime` 保留单一 `Exception` 兜底（500）；全部 handler 的 message 走 `withRequestId` helper（MDC 有值时追加 `（requestId: xxx）`）
- [x] 5.3 7 个 Controller（Auth/Category/Event/Pet/Sse/Tag/Todo）公开端点方法加 INFO 入口日志（方法名 + userId/关键 id；Auth 不记录密码/token）
- [x] 5.4 编写 `GlobalExceptionHandlerTest`（纯单测：全部 handler 映射 code/message、409/404 新语义、requestId 后缀有无两种情形、单一兜底覆盖 RuntimeException 与 checked Exception）

## 6. 契约同步
- [x] 6.1 N/A — 无契约变更（ModelApiResponse schema 不变；X-Request-Id 为响应头非契约字段；版本号不动）

## 7. 前端 (frontend/src/)
- [x] 7.1 N/A — 无前端变更

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — 无组件/目录变动 → 核对结论："现有描述已核对仍准确"
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 无表/字段/领域模型变动 → 核对结论："现有描述已核对仍准确"
- [x] 8.3 `docs/api/overview.md` — 无端点变动；新增 X-Request-Id 响应头与错误响应 requestId 后缀说明 → 更新
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — architecture.md 补「可观测性与监控」章节（日志滚动/request-id/Actuator/调度线程池）；CLAUDE.md 架构表与测试计数同步（43 类 324 用例）
- [x] 8.5 `README.md` — 无版本/功能清单变动 → 核对结论："现有描述已核对仍准确"
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端全部通过（324 用例 0 失败，新增 GlobalExceptionHandlerTest 9 + RequestIdFilterTest 5 + CorsConfigTest +2）
- [x] 9.2 N/A — 前端零变更（无需 `pnpm run verify`）
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 57 过 0 失败（requestId 后缀不影响既有断言）
- [x] 9.4 Smoke test — 启动 dev 后端手工验证 mock 无法覆盖的场景：
  - [x] `curl /actuator/health` → 200 `{"status":"UP"}`（匿名）
  - [x] 请求带 `X-Request-Id: smoke-1` → 响应头回显 + 控制台日志含 `smoke-1`
  - [x] 未认证请求 → 401 + 响应含 X-Request-Id + 控制台 WARN「未认证访问被拒绝」
  - [x] 错误请求（404）→ 响应 message 含 `（requestId: smoke-404）` 且日志同 requestId 可检索
  - [x] docker-compose healthcheck 配置已写入（Docker 本机不可用，实测留待部署环境；health 端点本身已 curl 实测 UP）
