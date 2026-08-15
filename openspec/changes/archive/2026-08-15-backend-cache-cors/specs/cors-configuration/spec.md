# CORS Configuration（CORS 单轨配置）

## Purpose
CORS 配置收敛为单一配置点：`SecurityConfig.corsConfigurationSource()` 读取环境化配置项 `cors.allowed-origin-patterns`，删除 `WebConfig.addCorsMappings` 双轨失效侧，消除配置漂移。

## ADDED Requirements

### Requirement: CORS 单轨配置
CORS SHALL 仅由 `SecurityConfig` 的 `CorsConfigurationSource` bean 提供（经 `http.cors()` 接入 Spring Security 过滤器链），`WebConfig` 的 `addCorsMappings` SHALL 被删除。允许源 SHALL 读取配置项 `cors.allowed-origin-patterns`（逗号分隔、支持 origin pattern 如 `http://localhost:*`），默认值为 `http://localhost:*`。

#### Scenario: 预检请求按配置放行
- **WHEN** 浏览器发起 `OPTIONS /api/v1/...` 预检，Origin 匹配 `cors.allowed-origin-patterns`
- **THEN** 响应含 `Access-Control-Allow-Origin`（回显匹配的 origin，非 `*`）、`Access-Control-Allow-Credentials: true`、允许的方法/头，预检通过

#### Scenario: 未配置时使用默认值
- **WHEN** 环境未提供 `cors.allowed-origin-patterns` 配置
- **THEN** 允许源为默认 `http://localhost:*`（本地开发前端 :5173 可用）

#### Scenario: 生产环境变量注入
- **WHEN** prod profile 下 `CORS_ORIGINS` 环境变量设为 `https://app.example.com`
- **THEN** `cors.allowed-origin-patterns` 解析为该值，跨域请求仅允许该源

#### Scenario: 不匹配源被拒绝
- **WHEN** 浏览器请求 Origin 不在允许列表内
- **THEN** 响应无 CORS 放行头，浏览器拦截（与 Security 配置一致）

### Requirement: CORS 与 Security 过滤器链一致生效
`http.cors()` SHALL 使用与业务配置相同的 `CorsConfigurationSource`；预检请求（OPTIONS）SHALL 在认证之前由 CORS 过滤器处理，未携带凭证的预检不被 401 拦截。认证要求与 CORS 放行 SHALL 独立——CORS 配置放行不改变端点认证要求（`/api/v1/**` 仍须认证）。

#### Scenario: 预检不被 401 拦截
- **WHEN** 未认证客户端发起跨域预检 `OPTIONS /api/v1/events`
- **THEN** 预检由 CORS 过滤器处理并返回放行头，不进入认证要求（不返回 401）

#### Scenario: CORS 放行不等于端点公开
- **WHEN** 未认证客户端直接发起 `GET /api/v1/events`（非预检）
- **THEN** 仍返回 401（CORS 配置不改变 Security 的认证要求）
