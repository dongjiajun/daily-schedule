# authentication Specification

## Purpose
TBD - created by archiving change backfill-auth-spec. Update Purpose after archive.
## Requirements
### Requirement: 系统生成 access token 和 refresh token 双 token
系统 SHALL 使用 HS384 算法生成 JWT。access token SHALL 包含 claims: `sub`（userId）、`username`、`typ=access`、`iat`、`exp`，有效期由 `jwt.access-ttl-seconds` 配置（默认 900s = 15min）。refresh token SHALL 包含 claims: `sub`（userId）、`username`、`typ=refresh`、`iat`、`exp`，有效期由 `jwt.refresh-ttl-seconds` 配置（默认 604800s = 7d）。v1.1 兼容入口 `generateToken()` SHALL 等同于 `generateAccessToken()`。

#### Scenario: 生成 access token
- **WHEN** 调用 `generateAccessToken(userId=42, username="alice")`
- **THEN** 返回的 JWT 中 `sub=42`、`username=alice`、`typ=access`、`exp = iat + 900s`

#### Scenario: 生成 refresh token
- **WHEN** 调用 `generateRefreshToken(userId=7, username="bob")`
- **THEN** 返回的 JWT 中 `sub=7`、`username=bob`、`typ=refresh`、`exp = iat + 604800s`

#### Scenario: v1.1 兼容入口
- **WHEN** 调用 `generateToken(userId=5, username="legacy")`
- **THEN** 行为与 `generateAccessToken(5, "legacy")` 完全一致

### Requirement: JWT 解析强制类型校验
`parse(token, expectedType)` SHALL 校验签名有效性、过期时间、以及 `typ` claim 与期望类型匹配。当 `expectedType` 非 null 且 token 的 `typ` 为 null 时（v1.1 遗留 token），SHALL 默认视为 `access` 类型。任何校验失败（签名无效、过期、类型不匹配、token 为 null/blank、非 JWT 格式）SHALL 返回 null，不抛出异常。

#### Scenario: 正确类型匹配
- **WHEN** 调用 `parse(accessToken, "access")`
- **THEN** 返回包含 userId 和 username 的 Claims 对象

#### Scenario: 类型不匹配返回 null
- **WHEN** 用 access token 调用 `parse(refreshToken, "refresh")` 或用 refresh token 调用 `parse(accessToken, "access")`
- **THEN** 返回 null

#### Scenario: 无类型校验模式
- **WHEN** 调用 `parse(token, null)`
- **THEN** 跳过 typ 校验，仅校验签名和过期时间

#### Scenario: 篡改 token 返回 null
- **WHEN** token 签名被篡改或为非 JWT 格式
- **THEN** 返回 null

#### Scenario: null/blank token 返回 null
- **WHEN** token 为 null、空字符串或纯空白字符
- **THEN** 返回 null

### Requirement: JwtAuthFilter 支持 Bearer header 和 Cookie 双路 token 来源
`JwtAuthFilter` SHALL 从两个来源提取 token：优先 `Authorization: Bearer <token>` header，其次 Cookie `dsa_sse_session`。当 Bearer header 存在且非 Bearer 前缀时（如 `Basic xxx`），SHALL 回退到 Cookie。验证成功后 SHALL 将 `userId`（Long 类型）注入 `SecurityContextHolder` 作为 principal。验证失败时 SHALL 不设置 SecurityContext 且不阻断请求链。

#### Scenario: Bearer header 认证
- **WHEN** 请求携带 `Authorization: Bearer <validAccessToken>`，SecurityContext 当前为空
- **THEN** SecurityContext 的 principal 设为对应用户的 Long userId

#### Scenario: Cookie 回退认证（SSE 场景）
- **WHEN** 请求无 Bearer header 但携带 Cookie `dsa_sse_session=<validToken>`
- **THEN** SecurityContext 的 principal 设为对应用户的 Long userId

#### Scenario: Bearer 优先于 Cookie
- **WHEN** 请求同时携带 Bearer header（userId=1）和 Cookie（userId=33）
- **THEN** SecurityContext 的 principal 为 1L（Bearer 优先）

#### Scenario: 无效 token 不阻断请求
- **WHEN** 请求携带无效 token
- **THEN** SecurityContext 不设置，filter chain 继续执行（由后续 Spring Security 授权规则处理）

#### Scenario: 非 Bearer Authorization header 回退 Cookie
- **WHEN** 请求携带 `Authorization: Basic xxx` 和 Cookie `dsa_sse_session=<validToken>`
- **THEN** 忽略 Basic header，使用 Cookie 中的 token 认证

### Requirement: 用户注册含输入校验与默认分类初始化
`POST /api/v1/auth/register` SHALL 校验 username（非空、格式合法）、email（非空、格式合法）、password（≥6 位）、displayName（可选，不合法时抛异常）。用户名或邮箱已存在时 SHALL 返回 409（`DuplicateAccountException`）。注册成功后 SHALL 创建用户（BCrypt 加密密码）、自动创建 6 个默认分类（工作/个人/学习/健康/社交/旅行，各带预设颜色）、返回 `LoginResponse`（accessToken + refreshToken + expiresIn + user），HTTP 201。

#### Scenario: 有效注册创建用户和默认分类
- **WHEN** 发送 `POST /api/v1/auth/register` with `{username:"test", email:"test@test.com", password:"test123456"}`
- **THEN** 返回 201，user 含 6 个默认分类，accessToken 和 refreshToken 均非空

#### Scenario: displayName 省略时使用 username
- **WHEN** 注册时未提供 displayName
- **THEN** 创建的 user.displayName 等于 username

#### Scenario: 重复用户名返回 409
- **WHEN** 注册已存在的 username
- **THEN** 返回 409，"用户名已被使用"，不创建新用户

#### Scenario: 重复邮箱返回 409
- **WHEN** 注册已存在的 email
- **THEN** 返回 409，"邮箱已被使用"

#### Scenario: 非法输入返回 400
- **WHEN** 注册时 password 长度 < 6、email 格式非法、或 username 格式非法
- **THEN** 返回 400（IllegalArgumentException），不访问数据库

### Requirement: 用户登录支持用户名/邮箱 + 密码
`POST /api/v1/auth/login` SHALL 接受 `usernameOrEmail` 和 `password`。系统 SHALL 先查用户名匹配，再查邮箱匹配。密码错误、用户不存在、或用户状态为 INACTIVE/DISABLED 时均返回 401（`InvalidCredentialsException`），不区分具体原因。登录成功后 SHALL 更新 `lastLoginAt`、返回 `LoginResponse`（accessToken + refreshToken + expiresIn + user），HTTP 200。同时 SHALL 下发 `dsa_sse_session` HttpOnly Cookie（Path=/api/v1/sse，SameSite=Lax，Max-Age=3600）。

#### Scenario: 用户名登录成功
- **WHEN** 发送 `POST /api/v1/auth/login` with `{usernameOrEmail:"admin", password:"admin123"}`
- **THEN** 返回 200，LoginResponse 含双 token + user，响应 Set-Cookie 含 `dsa_sse_session`

#### Scenario: 邮箱登录成功
- **WHEN** 发送 `POST /api/v1/auth/login` with `{usernameOrEmail:"admin@local", password:"admin123"}`
- **THEN** 返回 200，与用户名登录结果一致

#### Scenario: 密码错误返回 401
- **WHEN** 发送正确用户名但错误密码
- **THEN** 返回 401，不更新 lastLoginAt

#### Scenario: 用户不存在返回 401
- **WHEN** 发送不存在的用户名
- **THEN** 返回 401（与密码错误相同的异常类型，不泄露用户存在性）

#### Scenario: 已禁用用户返回 401
- **WHEN** 状态为 INACTIVE 或 DISABLED 的用户尝试登录
- **THEN** 返回 401

### Requirement: Token 续签使用 refresh token 全量换发
`POST /api/v1/auth/refresh` SHALL 接受 `refreshToken`。系统 SHALL 用 `JwtUtil.parse(refreshToken, "refresh")` 校验类型——传入 access token 将返回 null 并拒绝。校验通过后 SHALL 查用户是否存在且可登录（`canLogin()`），通过则生成**全新的** access + refresh token 对返回。用户不存在或不可登录时返回 401。

#### Scenario: 有效 refresh token 换发新 token 对
- **WHEN** 发送 `POST /api/v1/auth/refresh` with 有效 refreshToken
- **THEN** 返回 200，LoginResponse 含全新的 accessToken + refreshToken + expiresIn

#### Scenario: access token 当 refresh token 使用被拒绝
- **WHEN** 发送 `POST /api/v1/auth/refresh` with access token（typ=access）
- **THEN** 返回 401

#### Scenario: 已禁用用户续签被拒绝
- **WHEN** 发送有效 refreshToken 但对应用户已被禁用
- **THEN** 返回 401

### Requirement: 前端 authInterceptor 自动续签 + 单飞锁
前端 `authInterceptor.ts` SHALL 在每次请求前检查 access token 是否即将过期（`expiresAt - 30s`）。若即将过期且有 refreshToken，SHALL 自动调用 `/api/v1/auth/refresh` 续签。多个并发请求同时触发续签时，SHALL 通过模块级 `refreshPromise` 单飞锁确保只发起一次 refresh 请求，其余请求等待同一结果。续签使用的 fetch SHALL 为原生 `fetch`（绕过 hey-api 拦截器避免死循环）。网络错误时 SHALL 不强制登出（让原请求用旧 token 尝试）。响应 401 且 authStore 认为已登录时 SHALL 强制登出。

#### Scenario: token 有效期充足时直接使用
- **WHEN** `Date.now() < expiresAt - 30000`（过期前 > 30s）
- **THEN** 请求直接携带当前 accessToken，不触发 refresh

#### Scenario: token 即将过期时自动续签
- **WHEN** `Date.now() >= expiresAt - 30000` 且有 refreshToken
- **THEN** 自动发起 POST `/api/v1/auth/refresh`，成功后更新 authStore 的 accessToken/refreshToken/expiresAt

#### Scenario: 并发请求共享单次 refresh
- **WHEN** 3 个请求同时触发续签条件
- **THEN** 仅发起 1 次 refresh HTTP 请求，3 个请求均等待同一 Promise 结果

#### Scenario: 网络错误不强制登出
- **WHEN** refresh 请求因网络错误（非 HTTP 错误）失败
- **THEN** 不调用 logout()，使用当前（可能已过期）的 accessToken 继续原请求

#### Scenario: HTTP 401 响应强制登出
- **WHEN** 任意 API 响应返回 401 且 authStore.isAuthenticated 为 true
- **THEN** 调用 authStore.logout() 清除 token 并跳转登录页

#### Scenario: 认证端点不触发拦截器
- **WHEN** 请求 URL 匹配 `/auth/(login|register|refresh)$`
- **THEN** 跳过 token 注入和续签逻辑

### Requirement: 登出清空服务端 Cookie 和本地状态
`POST /api/v1/auth/logout` SHALL 清除 `dsa_sse_session` Cookie（Set-Cookie Max-Age=0），返回 204。前端 `authStore.logout()` SHALL 异步调用此端点（fire-and-forget，失败不阻塞），然后清除 localStorage 中的 `auth.v3` 和 `auth`（legacy）两个 key，重置所有状态为 null。

#### Scenario: 正常登出
- **WHEN** 已登录用户调用 logout()
- **THEN** 发送 POST `/api/v1/auth/logout`，清除 localStorage，isAuthenticated 变为 false

#### Scenario: 服务端登出失败不阻塞本地清理
- **WHEN** logout API 调用失败（网络错误或服务端异常）
- **THEN** 本地 token 和 user 状态仍然被清除，用户被登出

