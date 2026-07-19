# Proposal: 回填 Authentication Spec

## Why

项目在 v3.1 后期才接入 OpenSpec，此前 v3.0 引入的完整认证体系（JWT 双 token + 注册/登录/续签/登出 + Bearer/Cookie 双路鉴权 + 前端自动续签）均无 spec 覆盖。认证是安全关键路径，任何修改都需精确理解当前行为，否则极易引入安全漏洞或破坏用户体验。

## What Changes

- 新增 `authentication` capability spec，覆盖 JWT 生成/解析、认证过滤器、注册/登录/续签/登出全流程、前端自动续签机制
- 在 spec 末尾附加 Test Coverage 表，审计现有测试覆盖，标记盲区
- **无代码变更**（纯 spec 回填）

## Capabilities

### New Capabilities
- `authentication`: JWT 双 token 认证体系 — 注册/登录/续签/登出 + Bearer/Cookie 双路鉴权 + 前端 30s 预刷新窗口

### Modified Capabilities
- 无

## API Contract Impact

无。不修改 `specs/openapi.yaml`，不新增/删除/修改任何端点。

## DDD Layer Impact

无代码变更。spec 覆盖范围：
- 基础设施层：`JwtUtil`、`JwtAuthFilter`、`CurrentUserService`
- 应用层：`AuthApplicationService`
- API 层：`AuthController`
- 前端：`authInterceptor.ts`、`authStore.ts`

## Database Impact

无。不涉及 Flyway 迁移。

## Impact

- 新增：`openspec/specs/authentication/spec.md`（归档时）
- 现有测试审计：JwtUtilTest(10) / JwtAuthFilterTest(6) / AuthApplicationServiceTest(16) / CurrentUserServiceTest(3) 均充分覆盖
- 盲区：前端 `authInterceptor` 单飞锁无后端单测（属前端范畴，非阻塞）
