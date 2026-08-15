# Proposal: 后端缓存补齐与 CORS 配置收敛（架构债）

## Why
CLAUDE.md 声称 Caffeine 缓存，但全库零 `@Cacheable`——6 处 `@CacheEvict` 空转，分类/标签列表每次请求全表查询（线1 P2）。CORS 双轨漂移：`WebConfig.addCorsMappings`（读 `${cors.allowed-origin-patterns}`）与 `SecurityConfig` 硬编码 `CorsConfigurationSource` 并存，Security 生效时 WebConfig 配置实际失效，且两者默认值不一致（线1 P4）。

## What Changes
- 补齐缓存：`CategoryApplicationService.listAll` / `TagApplicationService.listAll` 补 `@Cacheable(value=..., key="#userId")`；6 处 `@CacheEvict` 由 `allEntries=true`（跨用户误伤）改为按 userId 精确清空
- Caffeine CacheManager 全局配置：`application.yml` 补 `spring.cache.type: caffeine` + 默认 spec（`expireAfterWrite=5m`）；`application-test.yml` 禁用缓存（`type: none`）防 H2 测试互相污染
- CORS 合并：删除 `WebConfig.java`（addCorsMappings 双轨失效侧），`SecurityConfig.corsConfigurationSource()` 改读 `${cors.allowed-origin-patterns}` 配置项（prod 的 `CORS_ORIGINS` 环境变量注入保留）

## Capabilities

### New Capabilities
- `service-caching`: 服务层查询缓存——分类/标签列表按用户缓存（Caffeine），写操作按 userId 精确失效，测试环境禁用
- `cors-configuration`: CORS 配置单轨——唯一配置点 `SecurityConfig` + `cors.allowed-origin-patterns` 环境化配置

### Modified Capabilities
- 无（主 specs 无缓存/CORS 相关 requirement 可改；缓存按 userId 隔离作为 `service-caching` 自身需求定义）

## API Contract Impact
- 无影响（纯基础设施/服务层变更，端点与契约不变，版本号不动）

## DDD Layer Impact
- **应用层**：`CategoryApplicationService`、`TagApplicationService`（补 `@Cacheable`、改 `@CacheEvict` key）
- **基础设施层**：`SecurityConfig`（CORS 单一配置点）、删除 `WebConfig`；`application.yml` / `application-dev.yml` / `application-test.yml` 缓存配置

## Database Impact
- 无需 Flyway 迁移

## Impact
- **后端**：`application/category/`、`application/tag/`、`infrastructure/security/SecurityConfig.java`、`infrastructure/config/WebConfig.java`（删除）、`src/main/resources/application*.yml`
- **测试**：新增缓存行为测试（`CategoryApplicationServiceTest` / `TagApplicationServiceTest` 补缓存命中/失效用例或独立 CacheTest）；既有测试核对缓存禁用后的行为不变
- **文档**：`docs/architecture.md`（缓存与 CORS 描述核对）、`CLAUDE.md`（Caffeine 声称此时兑现，描述核对）
