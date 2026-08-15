# Tasks: 后端缓存补齐与 CORS 配置收敛（backend-cache-cors）

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更（无 Flyway 迁移、无表/列变动）

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无领域层变更（缓存/CORS 均为基础设施与应用层关注点）

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 `SecurityConfig.corsConfigurationSource()` 注入 `@Value("${cors.allowed-origin-patterns:http://localhost:*}")`，`split(",")` 替换硬编码源列表（`http://localhost:*`, `https://localhost:*`）
- [x] 3.2 删除 `infrastructure/config/WebConfig.java`（CORS 双轨失效侧，全库唯一 addCorsMappings）
- [x] 3.3 `application.yml` 补 `spring.cache.type: caffeine` + `spring.cache.caffeine.spec: expireAfterWrite=5m`；删除 `application-dev.yml` 中重复的 cache 配置段
- [x] 3.4 `application-prod.yml` cors 配置补默认值 `${CORS_ORIGINS:http://localhost:*}`；`application-test.yml` 补 `spring.cache.type: none`
- [x] 3.5 编写 CORS 行为测试 `CorsConfigTest`（`@SpringBootTest` + `@AutoConfigureMockMvc` 保留 filter 链）：匹配源预检放行头、未认证非预检 401、不匹配源无放行头

## 4. 应用层 (application/)
- [x] 4.1 `CategoryApplicationService`：`listAll` 补 `@Cacheable(cacheNames = "categories", key = "#userId")`；`create`/`update`/`delete` 的 `@CacheEvict` 由 `allEntries = true` 改为精确 key（create 取 `#category.userId`，update/delete 取 `#userId`）
- [x] 4.2 `TagApplicationService` 同构改造（cache name `tags`）
- [x] 4.3 编写缓存行为测试 `ServiceCacheTest`（`@SpringBootTest` + `@MockitoBean` + `@TestPropertySource(spring.cache.type=caffeine)`）：首次查询写缓存/再次命中（verify findAll 调用次数）、create/update/delete 三路径失效、不同 userId 隔离与不跨用户失效
- [x] 4.4 核对既有 `CategoryApplicationServiceTest` / `TagApplicationServiceTest` / Controller 测试在缓存注解下行为不变（纯 Mockito 构造无 Spring 代理；`@SpringBootTest` 测试在 `type: none` 下无缓存干扰）

## 5. API 层 (api/)
- [x] 5.1 N/A — 无 API 层变更（端点/Assembler/异常映射不动）

## 6. 契约同步
- [x] 6.1 N/A — 无契约变更（specs/openapi.yaml、CHANGELOG、版本号均不动）

## 7. 前端 (frontend/src/)
- [x] 7.1 N/A — 无前端变更（缓存/CORS 对前端透明，React Query 层策略不变）

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — 无组件/目录变动 → 核对结论："现有描述已核对仍准确"
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 无表/字段/领域模型变动 → 核对结论："现有描述已核对仍准确"
- [x] 8.3 `docs/api/overview.md` — 无端点/契约变动 → 核对结论："现有描述已核对仍准确"（143/154 行 Caffeine 描述本次兑现后保持准确）
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 已更新：缓存节补 userId 隔离/精确失效/测试禁用 + CORS 单轨条目；backend-test-classes 39→41、用例 297→308
- [x] 8.5 `README.md` — 版本/功能清单无变动 → 核对结论："现有描述已核对仍准确"
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过（含新增 ServiceCacheTest + CorsConfigTest，308 用例 0 失败）
- [x] 9.2 N/A — 前端零变更（无需 `pnpm run verify`）
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 56 过；rhythm-smoke 时钟注入为已知 flaky（重跑 4/4 过），与本次变更无关
- [x] 9.4 Smoke test — 启动 dev 后端手工验证 mock 无法覆盖的场景：
  - [x] curl 模拟预检：`OPTIONS /api/v1/events` + `Origin: http://localhost:5173` → 200 + `Access-Control-Allow-Origin` 回显；不匹配源 403 无放行头
  - [x] 分类/标签列表二次加载：连续请求零新增 SELECT（缓存命中，SQL 日志计数不变）
