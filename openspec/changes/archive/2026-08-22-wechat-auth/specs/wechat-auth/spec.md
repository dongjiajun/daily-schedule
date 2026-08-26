# 微信小程序登录（wechat-auth）

<!-- 参考: specs/openapi.yaml + docs/api/overview.md + docs/database/schema.md -->

## ADDED Requirements

### Requirement: 微信登录端点（API 契约）
系统 SHALL 新增 `POST /api/v1/auth/wechat-login`（operationId `wechatLogin`，tags `[Auth]`，`security: []` 免认证），请求体 `WechatLoginRequest { code: string（required） }`，成功响应 `LoginResponse`（`accessToken`/`refreshToken`/`expiresIn`/`user`，与 `/auth/login` 完全同构）。响应错误语义：`code` 无效（微信 errcode 40029）→ 400；微信上游服务错误（其余 errcode）→ 502。

#### Scenario: 有效 code 登录成功
- **WHEN** 客户端携带 `wx.login` 返回的有效 code 调用 `/auth/wechat-login`
- **THEN** 返回 200 与 `LoginResponse`（含 `accessToken`、`refreshToken`、`expiresIn` 秒数、`user` 信息），后续业务请求可携带该 accessToken

#### Scenario: 无效 code 返回 400
- **WHEN** code 已过期或格式错误（微信返回 errcode 40029）
- **THEN** 返回 400 与 `ApiResponse { code, message }`，message 说明登录凭证无效

#### Scenario: 微信上游错误返回 502
- **WHEN** 微信 `jscode2session` 返回 40029 以外的 errcode（如 appid 配置错误）或网络异常
- **THEN** 返回 502 与 `ApiResponse { code, message }`，不泄露微信内部错误详情

### Requirement: user 表 openid 存储（数据库迁移）
Flyway 新迁移 `V9__add_user_openid.sql` SHALL 为 `user` 表新增 `openid VARCHAR(64) NULL` 列与 `UNIQUE KEY uk_user_openid (openid)` 唯一约束（可空列 UNIQUE 允许多个 NULL）。`V10__make_user_email_nullable.sql` SHALL 将 `email` 改为 `NULL` 可空（微信静默注册无邮箱，MySQL NOT NULL 无默认值会拒绝 insert）。H2 测试 schema（`schema-h2.sql`）SHALL 同步补 openid 列。

#### Scenario: openid 可空且唯一
- **WHEN** 迁移执行后查看 `user` 表结构
- **THEN** 存在 `openid` 列（VARCHAR(64)，可空）与 `uk_user_openid` 唯一索引；多个 NULL 值可共存

#### Scenario: Web 老用户 openid 为 NULL
- **WHEN** 迁移前已存在的用户名密码用户
- **THEN** 其 `openid` 列为 NULL，用户名密码登录行为不变

### Requirement: 微信静默注册与再登录
应用层 SHALL 实现 `wechatLogin` 用例：`code` → 微信 `jscode2session` 换 `openid` → 按 `openid` 查用户 → 命中则直接签发 JWT；未命中则静默创建新用户（`username` 自动生成 `wx_<openid 前缀>` 且符合 `^[a-zA-Z0-9_]+$`，`password_hash` 存随机不可知 BCrypt 哈希使其无法通过密码登录，`openid` 落库）并签发 JWT。SHALL NOT 影响 Web 端用户名密码注册/登录链路。

#### Scenario: 首次登录静默注册
- **WHEN** openid 未关联任何用户时调用 wechat-login
- **THEN** 创建新用户（username 为 `wx_` 前缀自动生成、password_hash 为随机哈希），`user.openid` 写入，返回 200 LoginResponse

#### Scenario: 再次登录命中同一用户
- **WHEN** 同一微信账号二次登录（openid 已关联用户）
- **THEN** 不创建新用户，直接返回该用户的 LoginResponse

#### Scenario: Web 登录不受影响
- **WHEN** 已有 Web 用户使用用户名密码调用 `/auth/login`
- **THEN** 行为与变更前完全一致（校验、JWT 签发、SSE Cookie 下发均不变）

### Requirement: 微信 jscode2session 客户端
基础设施层 SHALL 新增 `WechatClient`，封装微信 `GET https://api.weixin.qq.com/sns/jscode2session`（参数 `appid`/`secret`/`js_code`/`grant_type=authorization_code`）。`appid`/`secret` SHALL 通过配置项 `wechat.app-id` / `wechat.app-secret` 注入（环境变量优先，仓库不落明文）。

#### Scenario: 配置注入
- **WHEN** 应用启动并加载配置
- **THEN** `wechat.app-id` 与 `wechat.app-secret` 从 `application.yml` 占位符解析（`WECHAT_APP_ID`/`WECHAT_APP_SECRET` 环境变量可覆盖）

#### Scenario: 成功解析 openid
- **WHEN** 微信返回 `{ openid, session_key, errcode: 0 }`
- **THEN** `WechatClient` 返回 openid，应用层继续登录/注册分流

### Requirement: 小程序端登录接入（骨架级）
小程序 SHALL 在首页接入登录链路：调用 `Taro.login()` 获取 code → 请求 `/auth/wechat-login` → 成功后 token 持久化到本地存储（`Taro.setStorageSync`），页面展示登录态（用户名/登录状态）；失败时展示错误提示。完整业务页面（日历/任务/宠物）在后续变更接入，本变更仅验证 code→JWT 链路。

#### Scenario: 登录态展示
- **WHEN** 小程序首页加载且用户已登录（本地有 token 且有效）
- **THEN** 页面展示当前用户名与"已登录"状态

#### Scenario: 登录失败提示
- **WHEN** wechat-login 请求失败（code 无效或网络错误）
- **THEN** 页面展示失败提示（如"登录失败，请重试"），不进入已登录状态

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 有效 code 登录成功（端点 200） | AuthControllerTest | wechatLogin_shouldReturn200 | ✅ |
| 无效 code 返回 400 | GlobalExceptionHandlerTest | wechatInvalidCode_maps400 | ✅ |
| 微信上游错误返回 502 | GlobalExceptionHandlerTest | wechatUpstreamError_maps502 / wechatNetworkError_maps502 | ✅ |
| 首次登录静默注册 | AuthApplicationServiceTest | wechatLogin_firstLogin_createsWechatUser | ✅ |
| 再次登录命中同一用户 | AuthApplicationServiceTest | wechatLogin_existingOpenid_returnsSameUser | ✅ |
| code 空校验 → 400 | AuthApplicationServiceTest | wechatLogin_blankCode_throwsIllegalArgument | ✅ |
| 微信 API 成功解析 openid / 40029 / 其他 errcode / 网络异常 | WechatClientTest | resolveOpenId_*（7 用例，text/plain 真实行为） | ✅ |
| 登录态展示 / 失败提示（小程序） | miniprogram auth.test.ts | parseLoginResponse 6 用例 + smoke test（真实 appid 导入验证） | ✅ |
| 微信异常上抛不落库 | AuthApplicationServiceTest | wechatLogin_wechatError_propagates | ✅ |
