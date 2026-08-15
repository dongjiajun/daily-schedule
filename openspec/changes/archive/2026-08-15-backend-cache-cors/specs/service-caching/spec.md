# Service Caching（服务层查询缓存）

## Purpose
分类/标签列表查询接入 Caffeine 本地缓存，兑现架构声明（CLAUDE.md「Caffeine 缓存」）；缓存键与失效均按 userId 隔离，写操作精确失效不跨用户误伤；测试环境禁用缓存防测试污染。

## ADDED Requirements

### Requirement: 分类/标签列表按用户缓存
`CategoryApplicationService.listAll(userId)` 与 `TagApplicationService.listAll(userId)` SHALL 标注 `@Cacheable`（cache name 分别为 `categories` / `tags`，key 为 `#userId`），首次查询走数据库并写入缓存，同用户后续查询直接命中缓存不查库。缓存 SHALL 由 Caffeine 承载（`expireAfterWrite=5m` 默认，dev profile 可覆盖）。

#### Scenario: 首次查询写缓存
- **WHEN** 用户 42 首次调用 `listAll(42L)`，缓存中无 `categories::42` 条目
- **THEN** 查询数据库（`CategoryMapper.selectList`），结果写入 Caffeine 缓存 key `categories::42`

#### Scenario: 同用户再次查询命中缓存
- **WHEN** 用户 42 再次调用 `listAll(42L)` 且缓存未过期（5 分钟内）
- **THEN** 直接返回缓存结果，不执行数据库查询

#### Scenario: 缓存按用户隔离
- **WHEN** 用户 42 与用户 7 各自调用 `listAll`
- **THEN** 缓存条目 key 分别为 `categories::42` 与 `categories::7`，互不可见、互不覆盖

#### Scenario: 缓存到期自动失效
- **WHEN** 缓存条目超过 `expireAfterWrite=5m` 未更新
- **THEN** Caffeine 自动逐出条目，下次查询重新走数据库并写回缓存

### Requirement: 写操作按 userId 精确失效
分类/标签的 create / update / delete SHALL 使用 `@CacheEvict` 按 userId 精确清空对应缓存条目（key 与 `@Cacheable` 一致），SHALL NOT 使用 `allEntries = true` 清空全部用户缓存。create 的 key 取 `#category.userId` / `#tag.userId`，update/delete 的 key 取方法参数 `#userId`。

#### Scenario: create 后该用户缓存失效
- **WHEN** 用户 42 创建新分类成功
- **THEN** 缓存条目 `categories::42` 被逐出，下次 `listAll(42L)` 返回含新分类的结果

#### Scenario: update 后该用户缓存失效
- **WHEN** 用户 42 更新分类名称成功
- **THEN** 缓存条目 `categories::42` 被逐出，下次 `listAll(42L)` 返回更新后的数据

#### Scenario: delete 后该用户缓存失效
- **WHEN** 用户 42 删除标签成功
- **THEN** 缓存条目 `tags::42` 被逐出，下次 `listAll(42L)` 不含已删除标签

#### Scenario: 失效不跨用户
- **WHEN** 用户 7 创建/更新/删除自己的分类或标签
- **THEN** 用户 42 的缓存条目（`categories::42` / `tags::42`）不受影响，保持命中

### Requirement: 缓存值不被写路径复用篡改
缓存 SHALL 只缓存查询路径返回的列表快照；写路径（create/update/delete）读取的实体 SHALL 来自 `findById` 的独立实例，SHALL NOT 复用或修改缓存中的对象。缓存列表中的对象 SHALL NOT 被调用方原地修改后污染后续命中。

#### Scenario: update 不污染缓存对象
- **WHEN** `update()` 通过 `findById` 获取独立实例并修改其字段
- **THEN** 缓存列表中的同名分类对象不被改动（缓存命中返回的数据与数据库一致）

### Requirement: 测试环境禁用缓存
`src/test/resources/application-test.yml` SHALL 声明 `spring.cache.type: none`，H2 单元/集成测试 SHALL NOT 启用缓存——避免测试间缓存残留导致的顺序依赖与假阳性。

#### Scenario: 测试间无缓存残留
- **WHEN** 测试 A 创建分类后，测试 B 调用 `listAll`
- **THEN** 测试 B 直接查询数据库获得最新数据（无缓存干扰）

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 首次查询写缓存 / 同用户再次查询命中缓存 | CacheConfigTest | （新增） | ➕ |
| 缓存按用户隔离 / 失效不跨用户 | CacheConfigTest | （新增） | ➕ |
| create/update/delete 后缓存失效 | CacheConfigTest | （新增） | ➕ |
| 测试间无缓存残留 | 既有全量测试套件（application-test.yml 生效） | — | ✅ |
