# multi-user-isolation Specification

## Purpose

多用户数据隔离：JWT 中的 userId 经 JwtAuthFilter → CurrentUserService 完整注入，使所有业务查询与写入强制按当前登录用户过滤，防止跨用户数据访问。

## Requirements
### Requirement: userId 通过 JwtAuthFilter → CurrentUserService 完整注入链路
`JwtAuthFilter` SHALL 从 JWT 中提取 `userId`（Long 类型），注入 `SecurityContextHolder` 的 Authentication principal。`CurrentUserService.getCurrentUserId()` SHALL 从 SecurityContext 中提取 principal——当 principal 为 Long 时返回该值，否则抛出 `IllegalStateException("未登录")`。此链路 SHALL 使得所有下游代码可通过 `CurrentUserService` 获取当前用户 ID，无需从 token 重复解析。

#### Scenario: 已认证请求获取 userId
- **WHEN** JwtAuthFilter 成功验证 token（sub=42），SecurityContext principal 设为 42L
- **THEN** `CurrentUserService.getCurrentUserId()` 返回 42L

#### Scenario: 未认证请求抛异常
- **WHEN** SecurityContext 中无 Authentication
- **THEN** `CurrentUserService.getCurrentUserId()` 抛出 `IllegalStateException("未登录")`

#### Scenario: principal 类型错误抛异常
- **WHEN** SecurityContext 中 principal 为 String 类型（非 Long）
- **THEN** `CurrentUserService.getCurrentUserId()` 抛出 `IllegalStateException`

### Requirement: 事件归属校验返回 404 而非 403
`EventApplicationService.getById(id, userId)` SHALL 先通过 `EventRepository.findById` 获取事件，然后校验 `event.getUserId().equals(userId)`。不匹配时 SHALL 抛出 `ResourceNotFoundException`（HTTP 404），而非 403 Forbidden——不向攻击者泄露其他用户数据的存在性。

#### Scenario: 访问自己的事件成功
- **WHEN** 用户 1 请求 `GET /api/v1/events/42`，事件 42 的 `user_id=1`
- **THEN** 返回事件详情

#### Scenario: 访问他人事件返回 404
- **WHEN** 用户 2 请求 `GET /api/v1/events/42`，事件 42 的 `user_id=1`
- **THEN** 返回 404 ResourceNotFoundException（与事件不存在的响应相同）

#### Scenario: 事件不存在也返回 404
- **WHEN** 用户 1 请求 `GET /api/v1/events/99999`，该 ID 不存在
- **THEN** 返回 404（与归属不匹配的响应相同，不泄露信息）

#### Scenario: update/delete 同样执行归属校验
- **WHEN** 用户 1 尝试 `PUT /api/v1/events/42` 更新用户 2 的事件
- **THEN** 返回 404

### Requirement: 所有业务查询在 SQL 级别强制 user_id 过滤
所有 MyBatis Mapper 查询 SHALL 在 WHERE 子句中包含 `user_id = #{userId}`。`EventMapper.selectByRange()` SHALL 在查询条件中强制加入 userId。`CategoryRepositoryImpl.findAll(userId)` 和 `TagRepositoryImpl.findAll(userId)` SHALL 通过 MyBatis-Plus `QueryWrapper.eq(userId)` 过滤。`existsByName()` 重名校验 SHALL 在同用户的范围内检查。

#### Scenario: 按范围查询仅返回当前用户事件
- **WHEN** 用户 1 查询 `GET /api/v1/events?start=...&end=...`
- **THEN** SQL 为 `SELECT ... FROM event WHERE user_id=1 AND start_time<... AND end_time>...`

#### Scenario: 分类重名仅在同用户范围内检测
- **WHEN** 用户 1 创建分类"工作"，用户 2 也已有分类"工作"
- **THEN** 用户 1 的创建成功（各自独立），`UNIQUE(user_id, name)` 约束保证不冲突

### Requirement: findUpcoming 查询不过滤 userId（系统级扫描）
`ReminderScheduler` 调用的 `EventMapper.selectUpcoming(now, threshold)` SHALL NOT 包含 `user_id` 过滤——提醒调度是系统级任务，需要扫描所有用户的事件。用户隔离 SHALL 在 dispatch 层实现：`BrowserNotificationService.send(event)` 调用 `sseEmitterManager.sendToUser(event.getUserId(), payload)`，仅推送给事件所属用户。

#### Scenario: 提醒调度扫描所有用户
- **WHEN** 用户 1 和用户 2 各有 1 个待提醒事件
- **THEN** `selectUpcoming()` 返回两者的事件

#### Scenario: 提醒仅推送给事件所属用户
- **WHEN** 提醒调度处理用户 1 的事件
- **THEN** `sendToUser(userId=1, payload)` 仅推送给用户 1 的 SSE emitter

### Requirement: 无全局 MyBatis-Plus 拦截器——隔离在应用层显式控制
系统 SHALL NOT 使用 MyBatis-Plus 全局拦截器或 SQL 自动注入来实施 user_id 过滤。隔离 SHALL 在应用服务层（将 userId 传入 Repository 方法）和 Repository 实现层（在 QueryWrapper 或 SQL 中显式添加条件）逐层手动执行。`EventRepository.findById(id)` SHALL 不过滤 userId——归属校验由调用方 `EventApplicationService.getById()` 在查询后执行。

#### Scenario: 直接调用 findById 返回任意用户事件
- **WHEN** 直接调用 `EventRepository.findById(42)` 而不经过 ApplicationService
- **THEN** 返回事件 42（无论其 user_id），调用方需自行校验归属

#### Scenario: 所有正常业务路径均经过 ApplicationService 校验
- **WHEN** 通过 Controller → ApplicationService → Repository 的完整调用链访问事件
- **THEN** 归属校验在 ApplicationService 层执行，不依赖 Repository 层过滤

