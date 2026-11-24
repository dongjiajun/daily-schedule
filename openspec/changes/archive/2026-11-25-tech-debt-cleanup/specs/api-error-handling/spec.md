# API Error Handling

## ADDED Requirements

### Requirement: 分类与标签重名映射 409
`CategoryApplicationService` 与 `TagApplicationService` 在创建或更新时检测到同用户下名称冲突，SHALL 抛出 `BusinessException` 并由 `GlobalExceptionHandler` 映射为 HTTP `409`（`ModelApiResponse.code = 409`），与 `specs/openapi.yaml` 契约一致；空白名称校验仍返回 HTTP `400`。

#### Scenario: 创建或更新重名分类返回 409
- **WHEN** 用户调用 `POST /api/v1/categories` 或 `PUT /api/v1/categories/{id}` 提交当前用户已存在的分类名称
- **THEN** 服务端返回 HTTP 409，响应体 `code` 为 `409` 且 `message` 包含 `"分类名称已存在"`

#### Scenario: 创建或更新重名标签返回 409
- **WHEN** 用户调用 `POST /api/v1/tags` 或 `PUT /api/v1/tags/{id}` 提交当前用户已存在的标签名称
- **THEN** 服务端返回 HTTP 409，响应体 `code` 为 `409` 且 `message` 包含 `"标签名称已存在"`

#### Scenario: 空白名称仍返回 400
- **WHEN** 用户创建分类或标签时提交空字符串或纯空白名称
- **THEN** 服务端抛出 `IllegalArgumentException` 并返回 HTTP 400
