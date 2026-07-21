# Tasks: 宠物养成系统后端

## 1. 数据库迁移
- [x] 1.1 编写 V5__create_pet_tables.sql（pets + pet_accessories + pet_interactions 三张表 + 6 条种子数据）
- [x] 1.2 编写 H2 测试兼容表结构（`src/test/resources/schema-h2.sql` 追加 pets/pet_accessories/pet_interactions 建表语句，无 CHECK 约束）
- [x] 1.3 启动 local MySQL 验证 Flyway V5 迁移成功

## 2. 领域层 (domain/pet/)
- [x] 2.1 新建 `PetSpecies.java` — 枚举 ORANGE_CAT / SHIBA_INU
- [x] 2.2 新建 `InteractionType.java` — 枚举 FEED / PLAY
- [x] 2.3 新建 `InteractionResult.java` — 值对象 moodChange / hungerChange / expGain / coinChange / newMood / newHunger / newExp / newCoins
- [x] 2.4 新建 `ShopItem.java` — 值对象 id / name / type / price / effectMood / effectHunger / effectExp
- [x] 2.5 新建 `Pet.java` — 聚合根（字段 + isValid / applyInteraction / applyDecay + getter/setter）
- [x] 2.6 新建 `PetRepository.java` — 仓储接口（findByUserId / findById / save / findAllForDecay）
- [x] 2.7 新建 `PetDomainService.java` — 领域服务（interact 互动计算 / decay 衰减计算 / calculateLevel 等级公式）
- [x] 2.8 编写领域层单元测试 `PetTest.java`（isValid / applyInteraction / applyDecay）
- [x] 2.9 编写领域服务测试 `PetDomainServiceTest.java`（喂食计算 / 玩耍计算 / 衰减 / 上下限 / 等级公式）

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 新建 `PetPO.java` — MyBatis-Plus PO（@TableName("pets")，含 user_id / lastInteractedAt / currentAccessory 字段）
- [x] 3.2 新建 `PetMapper.java` — `BaseMapper<PetPO>` + selectByUserId 自定义查询
- [x] 3.3 新建 `PetInteractionPO.java` — 映射 pet_interactions 表
- [x] 3.4 新建 `PetInteractionMapper.java` — `BaseMapper<PetInteractionPO>`
- [x] 3.5 新建 `PetAccessoryPO.java` — 映射 pet_accessories 表
- [x] 3.6 新建 `PetAccessoryMapper.java` — `BaseMapper<PetAccessoryPO>` + selectAllShopItems 自定义查询
- [x] 3.7 新建 `PetRepositoryImpl.java` — `@Repository`，实现 PetRepository（findByUserId / findById / save PO↔Domain 转换 / findAllForDecay）
- [x] 3.8 新建 `PetStatusScheduler.java` — `@Scheduled` 定时衰减作业（每 10 分钟，支持 `pet.decay.intervalMs` 配置）
- [x] 3.9 编写仓储层测试 `PetRepositoryImplTest.java`（CRUD / userId 隔离 / PO↔Domain 转换）
- [x] 3.10 编写定时作业测试 `PetStatusSchedulerTest.java`（衰减触发 / 无宠物用户 / 间歇配置）

## 4. 应用层 (application/pet/)
- [x] 4.1 新建 `PetApplicationService.java` — @Service + @Transactional（create / getMyPet / update / interact / getShopItems / purchase）
- [x] 4.2 编写应用层测试 `PetApplicationServiceTest.java`（创建宠物 / 重复创建拒绝 / 互动流程 / 购买 / 专注币不足 / 无宠物异常）

## 5. API 层 (api/)
- [x] 5.1 新建 `PetController.java` — 实现生成接口（PetsApi / ShopApi），注入 CurrentUserService
- [x] 5.2 新建 `PetAssembler.java` — Pet↔PetProfile↔PetDTO 转换
- [x] 5.3 如有新增异常类型，在 `api/exception/` 下新建或复用 `ResourceNotFoundException`
- [x] 5.4 编写 Controller 测试 `PetControllerTest.java`（6 个端点 + 参数校验 + 错误响应）
- [x] 5.5 编写 Assembler 测试 `PetAssemblerTest.java`（Domain↔DTO 转换正确性）

## 6. 契约同步
- [x] 6.1 更新 `specs/openapi.yaml` — 新增 `/pets/me`、`/pets/me/interact`、`/shop/items`、`/shop/purchase` 路径 + PetProfile / InteractionResult / ShopItem / PurchaseResult schema
- [x] 6.2 更新 `specs/CHANGELOG.md` — 记录 API 变更（6 个新端点，v3.1→v3.2）
- [x] 6.3 同步版本号：`specs/openapi.yaml` version → 3.2.0；`backend/pom.xml` version → 3.2.0-SNAPSHOT
- [x] 6.4 `mvn compile` 触发 openapi-generator，确认生成 PetsApi / ShopApi 接口 + DTO 成功
- [x] 6.5 `npm run generate:api` 重新生成前端 SDK（虽然本次无前端改动，但保持 SDK 与契约同步）

## 7. 文档同步（必须检查）
- [x] 8.1 新实体/表/字段 → 更新 `docs/database/schema.md`（新增 3 张表：pets / pet_accessories / pet_interactions）+ `docs/uml/README.md`（新增 Pet 聚合根）
- [x] 8.2 新 API 端点 → 更新 `docs/api/overview.md`（新增 6 端点：pets CRUD + interact + shop）
- [x] 8.3 架构/模块变动 → 更新 `docs/architecture.md`（新增 pet BC，DDD 四层）+ `CLAUDE.md`（如需更新版本号引用）
- [x] 8.4 全量验证：`cd backend && mvn test`（确保全部 185+ 已有用例 + 新增用例通过）+ `cd frontend && pnpm run verify`（确保 Phase 0 无回归）
