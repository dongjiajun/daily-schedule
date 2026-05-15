# API 契约变更日志

本文件记录 `specs/openapi.yaml` 的所有破坏性、增量与修复型变更，格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)：

- **MAJOR**：破坏性变更（删除端点、修改响应结构、必填字段调整）
- **MINOR**：向后兼容的新增（新端点、新可选字段、新事件）
- **PATCH**：向后兼容的修复（文档勘误、错误响应补全）

每条变更需同步更新：
- `specs/openapi.yaml` 的 `info.version`
- `backend/pom.xml` 的 `<version>`（按 `MAJOR.MINOR.PATCH-SNAPSHOT` 命名）
- `frontend/package.json` 的 `version`
- 前端 SDK 重新生成（`cd frontend && npm run generate:api`）

---

## [Unreleased]

> 契约本身未变，但本次发布配套了大量后端与前端的非契约改动。
> v2.0.x PATCH 段会在下次破坏性或新增变更前累积。

### Fixed
- `EventResponse.tags` 此前只返回 `id` 占位，现在 Repository 通过单次 JOIN 填充
  完整 `name` / `color` / `createdAt`，避免前端二次查表与列表 N+1。
- `Category` / `Tag` 的 update 路径补全重名校验；`Tag` 在 create 路径补充重名校验。
- 提醒推送 JSON 序列化由 `String.format` 改为 Jackson `ObjectMapper`，标题中的
  双引号 / 反斜杠 / 换行不再破坏 payload。
- `ReminderScheduler` 引入 `event.last_reminded_at` 字段（V2 迁移）做幂等，
  ±30 秒窗口的边界抖动不再导致重复推送。

### Added
- `specs/CHANGELOG.md`（本文件）+ `info.version` 升至 `2.0.0`。
- `docs/design/multi-user-auth.md`：多用户登录系统的完整设计（v3.0 规划）。
- `MybatisPlusConfig` 注册 `PaginationInnerInterceptor`（为后续分页能力铺路）。
- GitHub Actions CI：后端 `mvn test`、前端 `lint` + `tsc` + `build`、
  前端 SDK drift 检查。
- 后端测试 64 → 81 用例（新增 `SseEmitterManagerTest`、`BrowserNotificationServiceTest`、`ReminderSchedulerTest`）。

## [2.0.0] — 2026-05-15

### Changed (BREAKING)
- 列表端点响应改为直接返回数组（移除 `XListResponse` 包装）：
  - `GET /events` → `EventResponse[]`
  - `GET /categories` → `CategoryResponse[]`
  - `GET /tags` → `TagResponse[]`
- 错误响应统一为 `ApiResponse { code, message }`，HTTP 状态码承载语义。
- `POST /tags`、`PUT /tags/{id}`、`PUT /categories/{id}` 响应体由 204/200 无体改为返回 `XResponse`。

### Added
- `GET /sse/notifications`（`text/event-stream`）纳入契约，文档化 `connect` / `reminder` / `heartbeat` 三种命名事件。
- 新增 `ReminderEvent` schema 描述 `reminder` 事件的 `data` JSON 结构。
- 所有端点显式声明 400 / 404 错误响应引用统一 `ApiResponse`。

### Migration
- 前端调用方：`resp.data?.data` → `resp.data`。
- 后端 Controller：删除 `XListResponse` 包装代码，直接返回 `List<XResponse>`。
- 已在同一 PR 中完成前后端同步：commit `bdf83a3`。

## [1.0.0] — 2026 v1.0 首发

### Added
- Event / Category / Tag 三组核心资源的 CRUD 端点
- 列表端点 `{code, message, data}` 包装响应
- `EventListResponse` / `CategoryListResponse` / `TagListResponse` 包装 schema
