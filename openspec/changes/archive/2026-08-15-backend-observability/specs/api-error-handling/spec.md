# API Error Handling（API 异常语义）

## Purpose
修复异常→HTTP 状态码语义缺口：业务冲突映射 409、用户不存在映射 404（现状 `IllegalStateException` 一律落 500）；合并重复兜底 handler；错误响应携带 requestId 支撑异常定位。

## ADDED Requirements

### Requirement: 业务冲突映射 409
`PetApplicationService` 中"重复创建宠物"（`IllegalStateException("已有宠物，不可重复创建")`）与"商店无可用食物"（`IllegalStateException("商店中没有可用的食物")`）SHALL 改为抛出 `BusinessException`；`GlobalExceptionHandler` SHALL 将 `BusinessException` 映射为 HTTP 409，响应 `code=409`。

#### Scenario: 重复创建宠物返回 409
- **WHEN** 已有宠物的用户再次调用 `POST /api/v1/pets/me`
- **THEN** 返回 409，message 为"已有宠物，不可重复创建"（而非 500）

#### Scenario: 商店无食物返回 409
- **WHEN** 商店无食物可售时用户购买食物
- **THEN** 返回 409，message 为"商店中没有可用的食物"（而非 500）

### Requirement: 用户不存在映射 404
`AuthApplicationService` 中"当前用户已不存在"（`IllegalStateException`）SHALL 改为抛出 `ResourceNotFoundException`；响应为 HTTP 404（与资源不存在的语义一致，不泄露区分）。

#### Scenario: 已删除用户操作返回 404
- **WHEN** 携带有效 token 但用户记录已被删除，调用需用户信息的端点
- **THEN** 返回 404，message 为"当前用户已不存在"（而非 500）

### Requirement: 单一兜底 handler
`GlobalExceptionHandler` SHALL 合并 `handleRuntime`（RuntimeException→500）与 `handleGeneral`（Exception→500）为单一兜底 handler（`@ExceptionHandler(Exception.class)` → 500），消除重复实现；兜底日志 SHALL 含异常堆栈。

#### Scenario: 未预期异常统一 500
- **WHEN** 任意未显式映射的异常（含 RuntimeException 与非运行时异常）抛出
- **THEN** 单一 handler 返回 500 `code=500`、message 为"服务器内部错误"，日志含堆栈

### Requirement: 错误响应携带 requestId
`GlobalExceptionHandler` 的错误响应 SHALL 在 message 中携带 requestId（MDC `requestId`，格式如 `（requestId: xxx）`），用户凭响应即可向运维定位对应日志；未捕获异常与业务异常均适用。

#### Scenario: 业务错误响应携带 requestId
- **WHEN** 请求触发 `ResourceNotFoundException` 且 requestId 为 `trace-42`
- **THEN** 响应 message 含 `（requestId: trace-42）`，日志中同 requestId 的堆栈可被检索

#### Scenario: 无 requestId 时响应不含后缀
- **WHEN** 异常发生在过滤器链之外（无 MDC requestId）
- **THEN** 响应 message 不含 requestId 后缀（不出现空占位）
