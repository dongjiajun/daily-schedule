# Design: 后端缓存补齐与 CORS 配置收敛（backend-cache-cors）

## Context

**现状**（线1 调查确认）：
- 缓存：`DailyScheduleApplication` 已标 `@EnableCaching`，pom 已有 `spring-boot-starter-cache` + `caffeine`，dev profile 已配 `spring.cache.type: caffeine` + `expireAfterWrite=5m`——但全库零 `@Cacheable`，6 处 `@CacheEvict(allEntries = true)` 空转（`CategoryApplicationService.java:36,48,63`、`TagApplicationService.java:35,47,61`），CLAUDE.md「Caffeine 缓存」声明名不副实。
- CORS：双轨并存——`WebConfig.addCorsMappings`（读 `${cors.allowed-origin-patterns:http://localhost:*}`，仅 `http://localhost:*`）与 `SecurityConfig.corsConfigurationSource()`（硬编码 `http://localhost:*` + `https://localhost:*`）。`http.cors()` 启用后 Spring Security 的 CORS 过滤器在过滤器链中优先处理，WebConfig 侧对 `/api/**` 实际失效；两轨默认值不一致，是漂移源。
- 约束：多用户数据隔离（所有业务查询按 user_id 过滤，缓存键必须含 userId）；测试为 H2 + `@SpringBootTest`/`@MockitoBean` 先例；不触碰 API 契约（openapi.yaml 唯一真相源）。

## Goals / Non-Goals

**Goals:**
- 分类/标签列表查询接入 Caffeine 缓存，兑现架构声明；写操作按 userId 精确失效，不跨用户误伤
- CORS 收敛为 `SecurityConfig` 单一配置点，配置项环境化（prod 环境变量注入保留）
- 测试环境禁用缓存，防测试间缓存残留

**Non-Goals:**
- 不改 API 契约/数据库/版本号（纯后端内部行为变更）
- 不做 Redis 集中缓存（单机部署，Caffeine 本地缓存足够；多实例场景再引入）
- 不缓存事件/任务查询（范围查询、数据量大且变更频繁，本轮仅 category/tag 两个低变高频读列表）
- 不做 CORS 动态运行时配置（启动时环境变量注入即可满足现状）

## Decisions

### Decision 1: 补齐缓存（而非移除空转注解）
- **选择**: `listAll` 补 `@Cacheable`，6 处 `@CacheEvict` 由空转转为真实失效
- **理由**: 依赖与配置已全部就位（starter-cache/caffeine/dev spec），补齐只需注解级改动；分类/标签是低变高频读数据（前端每次进入相关页面经 React Query 拉取），本地缓存收益明确且兑现 CLAUDE.md 声明
- **备选方案**: 移除 6 处空转 `@CacheEvict` 与 `@EnableCaching`——成本更低，但放弃已声明的能力，架构文档需反向修订；Redis 集中缓存——多实例才有意义，当前单机部署无必要

### Decision 2: 缓存键按 userId 隔离 + 精确失效（弃 allEntries）
- **选择**: `@Cacheable(cacheNames = "categories"/"tags", key = "#userId")`；create 的 evict key 取 `#category.userId`/`#tag.userId`，update/delete 取 `#userId`
- **理由**: 多用户隔离是系统硬性约定（multi-user-isolation capability）；`allEntries = true` 清空全部用户缓存既降低其他用户命中率，又是跨用户耦合
- **备选方案**: 保持 `allEntries = true`——实现最简（现状），但违背隔离原则且失效粒度粗

### Decision 3: CORS 单轨收敛到 SecurityConfig（删 WebConfig）
- **选择**: 删除 `WebConfig.java`，`SecurityConfig.corsConfigurationSource()` 注入 `@Value("${cors.allowed-origin-patterns:http://localhost:*}")` 并 `split(",")` 为 allowedOriginPatterns
- **理由**: Spring Security 启用 `http.cors()` 后其 CorsFilter 先于 WebMvc 层处理预检与 CORS 头，WebConfig 侧是死配置；收敛到生效侧并统一默认值
- **备选方案**: 删 SecurityConfig bean 保留 WebConfig——WebMvc 层 CORS 无法处理 Security 过滤器链内的预检，不成立；保留双轨——漂移源继续存在

### Decision 4: 主配置声明 Caffeine，测试禁用缓存
- **选择**: `application.yml` 声明 `spring.cache.type: caffeine` + `spring.cache.caffeine.spec: expireAfterWrite=5m`；删除 `application-dev.yml` 中重复的 cache 配置；`application-test.yml` 声明 `spring.cache.type: none`
- **理由**: 主配置统一默认值，profile 只覆盖差异，消除双处配置漂移；测试禁用防缓存残留导致的顺序依赖与假阳性
- **备选方案**: dev 保留重复覆盖——漂移源；测试保留 caffeine——测试污染风险真实存在（create 测试后 listAll 可能命中旧缓存）

### Decision 5: prod CORS 环境变量补默认值
- **选择**: `application-prod.yml` 改为 `cors.allowed-origin-patterns: ${CORS_ORIGINS:http://localhost:*}`
- **理由**: 现状 `${CORS_ORIGINS}` 未设置时 Spring 注入字面量字符串，CORS 全拒且难排查；补默认值后与 `@Value` 默认一致，漏配时退化到本地开发默认而非静默失败
- **备选方案**: 不补默认——prod 漏配 CORS_ORIGINS 时前端全部跨域失败，运维易踩

### Decision 6: 缓存/CORS 行为用 Spring 上下文测试验证
- **选择**: 新增 `ServiceCacheTest`（`@SpringBootTest` + `@MockitoBean` 两个 Repository + `@TestPropertySource(spring.cache.type=caffeine)`），以 `verify(repository).findAll(...)` 调用次数断言缓存命中/失效/隔离；CORS 用 `@SpringBootTest` + `@AutoConfigureMockMvc`（保留 filter 链）断言 OPTIONS 预检响应头与非预检 401
- **理由**: `@Cacheable` 依赖 Spring 代理，纯 Mockito 单测（既有 `CategoryApplicationServiceTest` 风格）无法覆盖；项目已有 `@SpringBootTest` + `@MockitoBean` + `@AutoConfigureMockMvc` 先例（`AuthControllerTest`）
- **备选方案**: 反射断言注解存在性——脆弱且不验证行为；H2 真实库集成——断言命中需删除底层数据制造差异，复杂且慢

## DDD Layer Design

### 领域层 (domain/)
无变更。

### 基础设施层 (infrastructure/)
- `config/WebConfig.java`：**删除**（CORS 双轨失效侧）
- `security/SecurityConfig.java`：`corsConfigurationSource()` bean 增加 `@Value` 注入 `cors.allowed-origin-patterns`，`split(",")` 替换硬编码列表；其余（filterChain/密码编码器）不动
- `src/main/resources/application.yml`：补 `spring.cache.type: caffeine` + `spring.cache.caffeine.spec: expireAfterWrite=5m`
- `src/main/resources/application-dev.yml`：删除重复的 cache 配置段
- `src/main/resources/application-prod.yml`：`cors.allowed-origin-patterns` 补 `:http://localhost:*` 默认
- `src/test/resources/application-test.yml`：补 `spring.cache.type: none`

### 应用层 (application/)
- `CategoryApplicationService`：
  - `listAll` → `@Cacheable(cacheNames = "categories", key = "#userId")`
  - `create` → `@CacheEvict(cacheNames = "categories", key = "#category.userId")`
  - `update` / `delete` → `@CacheEvict(cacheNames = "categories", key = "#userId")`
- `TagApplicationService`：同构，cache name `tags`
- 事务边界不变（evict 默认在事务提交后执行，Spring Cache 拦截顺序默认 advisor 在事务 advisor 之后——创建失败不回滚缓存污染）；SpEL 参数名依赖 Spring Boot 3.4 默认编译参数 `-parameters`

### API 层 (api/)
无变更（Controller/Assembler/异常映射不动）。

### 前端 (frontend/src/)
无变更（后端行为透明；React Query 层缓存策略不变）。

## API Design
无契约变更——`specs/openapi.yaml`、`specs/CHANGELOG.md`、三处版本号均不动。

## Database Design
无数据库变更。

## Risks / Trade-offs
- **[缓存可变 domain 对象（List<Category>/List<Tag> 直存）]** → 写路径经 `findById` 获取独立实例（`CategoryRepositoryImpl.findById` 每次 toDomain 新建），不共享缓存引用；service 层无原地修改列表场景。spec 已声明「缓存值不被写路径复用篡改」约束；后续需要可加防御性拷贝（本次不做）
- **[5 分钟窗口内缓存与数据库短暂不一致]** → 单机部署 + 同实例全部写路径 evict，窗口仅覆盖外部直接改库（本系统无）；`expireAfterWrite=5m` 可配
- **[精确 key 拼写与 @Cacheable 不一致导致脏读]** → `ServiceCacheTest` 覆盖 create/update/delete 三路径失效断言；key 表达式与 cache name 双处核对
- **[@SpringBootTest 全上下文测试变慢]** → 缓存测试与 CORS 测试各共享一个上下文（同配置组合合并到一个测试类或同 profile），避免上下文碎片化
- **[删除 WebConfig 影响其他 addCorsMappings 依赖]** → 全库唯一 addCorsMappings 即 WebConfig（已确认），SSE 等端点均在 `/api/**` 注册范围内由 Security CorsFilter 覆盖
- **[evict 时机与事务]** → `@CacheEvict` 默认 `beforeInvocation=false`（方法成功返回后执行），事务回滚时不清缓存——缓存与库同向旧数据，5 分钟窗口内无害

## Migration Plan
- **部署**: 纯注解+配置变更，无数据迁移；应用重启生效
- **回滚**: git revert 单变更即可；缓存与 CORS 无持久化副作用
- **验证顺序**: `mvn test`（ServiceCacheTest + CORS 测试 + 既有 297 用例）→ 本地启动 dev 观察缓存日志与跨域 → `docs:check`

## Open Questions
无。缓存 spec（5m）沿用 dev 现状值；如需调参通过配置覆盖即可。
