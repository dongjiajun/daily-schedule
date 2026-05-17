# API 契约变更日志

本文件记录 `specs/openapi.yaml` 的所有破坏性、增量与修复型变更，格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)：

- **MAJOR**：破坏性变更（删除端点、修改响应结构、必填字段调整）
- **MINOR**：向后兼容的新增（新端点、新可选字段、新事件）
- **PATCH**：向后兼容的修复（文档勘误、错误响应补全）

---

## [1.1.0] — Unreleased

### Added
- `GET /events` 新增 `keyword`（搜索标题/描述/地点）、`page`、`size` 查询参数
- `EventListResponse` 新增 `total`、`page`、`size` 字段
- `POST /api/v1/auth/register` 注册端点
- `POST /api/v1/auth/login` 登录端点，返回 JWT token
- 所有端点（除 `/auth/**` 外）需 JWT Bearer 认证
- `POST /tags` 返回 `TagResponse`（此前为 void）

### Fixed
- `EventResponse.tags` 此前只返回 `id`，现在完整返回 `name` / `color`
- `GlobalExceptionHandler` 补全日志 + `MethodArgumentNotValidException` 处理
- `ReminderScheduler` 窗口从 ±30s 扩展为 ±35s，间隔从 60s 缩短为 30s

### Changed (BREAKING)
- 所有 API 端点需 JWT 认证（请求头 `Authorization: Bearer <token>`）
- 所有业务数据按 `user_id` 隔离，数据库新增 `user` 表 + `user_id` 外键
- `EventRepository` 接口方法签名变更（增加 userId/keyword/page/size 参数）

---

## [1.0.0] — 2026 v1.0 首发

### Added
- Event / Category / Tag 三组核心资源的 CRUD 端点
- `{code, message, data}` 包装响应结构
- `EventListResponse` / `CategoryListResponse` / `TagListResponse` 包装 schema
- SSE 通知端点 `GET /sse/notifications`（`connect` / `reminder` / `heartbeat` 事件）
- `ReminderEvent` schema

### Migration 建议（从 v1.0 → v1.1）
- 前端: 需新增登录/注册页面，API 调用自动附加 JWT token
- 后端: 数据库需执行 `V2__add_user_support.sql` Flyway 迁移
- 默认用户: admin / admin123
