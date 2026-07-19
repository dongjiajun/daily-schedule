# Proposal: 回填 Multi-User Isolation Spec

## Why

多用户数据隔离是系统安全基石——所有业务表含 `user_id`，通过 JwtAuthFilter → CurrentUserService → ApplicationService → Repository 的完整链路强制过滤。隔离方案的特殊设计（无 MyBatis-Plus 全局拦截器、归属校验返回 404 而非 403、`findUpcoming` 例外不过滤 userId）散布在多个文件，无集中定义。当前无 spec 覆盖。

## What Changes

- 新增 `multi-user-isolation` capability spec，覆盖 userId 注入链路、归属校验、SQL 级过滤、findUpcoming 例外、名唯一性约束
- 在 spec 末尾附加 Test Coverage 表
- **无代码变更**（纯 spec 回填）

## Capabilities

### New Capabilities
- `multi-user-isolation`: 多用户数据隔离体系 — userId 注入链路 + 归属校验(404) + SQL 过滤 + findUpcoming 例外 + 名跨用户唯一性

### Modified Capabilities
- 无

## API Contract Impact

无。`user_id` 不暴露在 API 契约中（由服务端从 token 提取）。

## DDD Layer Impact

无代码变更。spec 覆盖范围：
- 基础设施层：`JwtAuthFilter`、`CurrentUserService`、`EventMapper`、`EventRepositoryImpl`、`CategoryRepositoryImpl`、`TagRepositoryImpl`
- 应用层：`EventApplicationService.getById/update/delete`
- 领域层：`EventRepository.findById`（不过滤 userId，由上层保证）

## Database Impact

无。`V3__multi_user.sql` 已执行。

## Impact

- 新增：`openspec/specs/multi-user-isolation/spec.md`（归档时）
- 现有测试：CurrentUserServiceTest(3) / EventApplicationServiceTest（归属校验场景）/ JwtAuthFilterTest(6)
