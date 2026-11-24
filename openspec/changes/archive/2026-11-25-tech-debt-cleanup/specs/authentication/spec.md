# Authentication

## ADDED Requirements

### Requirement: SSE Cookie 单一头与安全标志可配置
`AuthController` 下发或清除 `dsa_sse_session` Cookie 时 SHALL 仅使用 `ResponseCookie` 输出单条 `Set-Cookie` 响应头（含 `HttpOnly`、`SameSite=Lax`、`Path=/api/v1/sse`），其 `Secure` 属性由配置 `app.cookie.secure`（默认 `false`）控制；`/auth/wechat-login` SHALL 继续不下发该 Cookie。

#### Scenario: 登录与续签下发单条 Set-Cookie 头
- **WHEN** 用户调用 `POST /api/v1/auth/login`、`POST /api/v1/auth/register` 或 `POST /api/v1/auth/refresh` 成功
- **THEN** 响应仅包含 1 条 `Set-Cookie` 头，携带 `dsa_sse_session=`、`HttpOnly`、`SameSite=Lax` 及 `Path=/api/v1/sse`

#### Scenario: 登出下发单条失效 Cookie 头
- **WHEN** 用户调用 `POST /api/v1/auth/logout` 成功
- **THEN** 响应返回 204，且仅包含 1 条 `Set-Cookie` 头，携带 `dsa_sse_session=` 与 `Max-Age=0`

#### Scenario: 微信登录不下发 SSE Cookie
- **WHEN** 小程序用户调用 `POST /api/v1/auth/wechat-login` 成功
- **THEN** 响应不包含 `Set-Cookie` 头，继续通过 Bearer token 鉴权
