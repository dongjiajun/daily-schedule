# Design: 宠物养成系统后端

## Context
日程管理系统 v3.1，DDD 四层架构（Spring Boot 3.4 + MyBatis-Plus 3.5 + Flyway）。当前有 4 个聚合根（User / Event / Category / Tag），通过 `CurrentUserService` 强制多用户数据隔离。宠物系统是 Phase 1 情感核心的起点——作为"体验层"贯穿所有模块，依赖事件总线（`eventBus.emit`）与日历/任务/习惯模块联动。

**约束**:
- 所有业务表含 `user_id`，查询强制按当前用户过滤
- API 变更从 `specs/openapi.yaml` 开始，`mvn compile` 生成 Java 接口
- Controller 必须实现生成的接口
- Flyway 迁移不可回退，新表用 V5 序号

## Goals / Non-Goals

**Goals:**
- 用户可创建唯一宠物（橘猫/柴犬二选一），命名
- 喂食/玩耍互动，影响 mood / hunger / experience / coins
- 商店购买食物（用专注币）
- 定时衰减：mood 和 hunger 随时间自然下降
- 宠物状态查询 API（供前端轮询或 SSE 推送）

**Non-Goals:**
- 多宠物（Phase 2+）
- 宠物进化（蛋→幼崽→成年→传说）、装扮穿戴（Phase 2+）
- 事件总线联动（日历 emit 补丁随 M1.2 做）
- 前端实现（M1.2 独立 change）
- 小程序适配（Phase 2）

## Decisions

### Decision 1: 宠物与用户一对一
- **选择**: `pets.user_id` 加 UNIQUE 约束，`POST /pets/me` 仅当用户无宠物时成功
- **理由**: Phase 1 聚焦单只深度养成，降低复杂度；多宠物可延后到 Phase 2，届时移除 UNIQUE 约束即可
- **备选方案**: 一对多——需要额外 `pet_slots` 表管理槽位、`active_pet` 切换，v1 过度设计

### Decision 2: 属性衰减由定时任务驱动
- **选择**: `@Scheduled` 每 10 分钟扫描所有宠物，按 `lastInteractedAt`（最近互动时间）计算衰减量：`mood -= elapsedHours * 2`, `hunger -= elapsedHours * 3`，下限 0
- **理由**: 简单可控，与现有 `ReminderScheduler` 模式一致（`@Scheduled` + `@SchedulerLock` 可选）；不需要消息队列
- **备选方案**: 实时懒计算（查询时按 `lastInteractedAt` 推算）——无定时任务，但状态不实时，前端需额外处理；不适合"宠物状态始终可见"的场景

### Decision 3: 互动逻辑在 PetDomainService 中
- **选择**: `PetDomainService.interact(pet, type, quantity)` 计算 mood/hunger/experience/coins 变化，Application 层只负责取实体、调领域服务、保存
- **理由**: 与 `EventDomainService.hasTimeConflict` 一致——领域逻辑不泄露到应用层
- **备选方案**: 逻辑全放 ApplicationService——领域对象变成贫血模型，违背现有架构约定

### Decision 4: 商店物品硬编码种子数据
- **选择**: Flyway V5 中 INSERT 5-8 条初始物品（鱼干、猫粮、狗粮、玩具球、磨牙棒、高级罐头等），无后台管理 UI
- **理由**: v1 不需要 CMS；物品可通过后续迁移增减；前端只读 `GET /shop/items`
- **备选方案**: 建 `shop_items` 表 + CRUD 管理端点——v1 过度设计

## DDD Layer Design

### 领域层 (domain/pet/)

**Pet.java** — 聚合根:
```java
public class Pet {
    Long id; Long userId; PetSpecies species; String name;
    int experience; int level;        // 经验 + 等级 (1-50)
    int mood; int hunger;             // 心情 + 饱腹 (0-100)
    int coins;                        // 专注币
    Long currentAccessory;            // 当前佩戴 FK (v1 NULL)
    LocalDateTime lastInteractedAt;   // 最近互动时间（衰减计算基准）
    LocalDateTime createdAt; LocalDateTime updatedAt;

    public boolean isValid() { /* name 非空、长度 <= 30 */ }
    public void applyInteraction(InteractionResult result) { /* 加减 mood/hunger/exp/coins */ }
    public void applyDecay(int moodDelta, int hungerDelta) { /* 衰减，下限 0 */ }
}
```

**PetSpecies.java** — 枚举: `ORANGE_CAT`, `SHIBA_INU`（v1 二选一）

**PetRepository.java** — 仓储接口:
```java
public interface PetRepository {
    Optional<Pet> findByUserId(Long userId);
    Optional<Pet> findById(Long id);
    Pet save(Pet pet);
    List<Pet> findAllForDecay();  // 衰减作业用
}
```

**PetDomainService.java** — 领域服务:
```java
@Component
public class PetDomainService {
    // 喂食: +hunger(30) +mood(10) +exp(5), -coins(food.price)
    // 玩耍: -hunger(10) +mood(25) +exp(15), 不消耗 coins
    public InteractionResult interact(Pet pet, InteractionType type, ShopItem food);
    // 衰减: mood -= hours*2, hunger -= hours*3
    public void decay(Pet pet);
    // 等级: level = f(experience), 公式 level = min(50, sqrt(exp/100) + 1)
    public int calculateLevel(int experience);
}
```

**值对象**: `InteractionType` (FEED / PLAY), `InteractionResult` (moodChange, hungerChange, expGain, coinChange), `ShopItem` (id, name, type, price, effects)

### 基础设施层 (infrastructure/persistence/)

**PetPO.java** — 与 `Pet` 字段一一映射，`@TableName("pets")`:
- `@TableField("user_id")`, `@TableField("last_interacted_at")`, `@TableField("current_accessory")`
- `createdAt` / `updatedAt` 使用 `FieldFill.INSERT / INSERT_UPDATE` 自动填充

**PetMapper.java** — `BaseMapper<PetPO>`，新增:
- `@Select("SELECT * FROM pets WHERE user_id = #{userId}")` → `selectByUserId`

**PetRepositoryImpl.java** — `@Repository`，实现 `PetRepository`:
- `findByUserId` → `petMapper.selectByUserId`
- `findById` → `petMapper.selectById`
- `save` → insert/update + 写回 ID
- `findAllForDecay` → `petMapper.selectList(null)`（全表扫描，预期数据量小）

**PetInteractionPO.java / PetInteractionMapper.java**:
- PO 映射 `pet_interactions` 表，字段: id, petId, type, quantity, moodChange, hungerChange, expGain, createdAt
- Mapper 仅用 `BaseMapper`，互动记录只插不查（v1 不做历史回溯）

**PetAccessoryPO.java / PetAccessoryMapper.java**:
- PO 映射 `pet_accessories` 表，字段: id, name, type, price, effectMood, effectHunger, effectExp, createdAt
- Mapper: `@Select("SELECT * FROM pet_accessories")` → `selectAllShopItems`

**PetStatusScheduler.java**（可选，建议放在 `infrastructure/scheduled/`）:
```java
@Component
public class PetStatusScheduler {
    @Scheduled(fixedRate = 600_000)  // 每 10 分钟
    public void decayPets() {
        List<Pet> pets = petRepository.findAllForDecay();
        for (Pet pet : pets) {
            domainService.decay(pet);
            petRepository.save(pet);
        }
    }
}
```

### 应用层 (application/pet/)

**PetApplicationService.java**:
```java
@Service
@Transactional
public class PetApplicationService {
    // create(userId, species, name):
    //   1. 校验无已有宠物 (findByUserId 为空)
    //   2. 校验 name 非空、长度 <= 30
    //   3. new Pet(), 初始化 mood=100, hunger=100, coins=100, level=1, exp=0
    //   4. petRepository.save(pet)

    // getMyPet(userId):
    //   1. petRepository.findByUserId(userId)
    //   2. 不存在 → 抛 ResourceNotFoundException("请先创建宠物")

    // update(userId, data):
    //   1. getMyPet → 只允许修改 name
    //   2. petRepository.save

    // interact(userId, type, quantity):
    //   1. getMyPet(userId)
    //   2. 根据 type 查找 ShopItem (feed 消耗食物)
    //   3. domainService.interact(pet, type, item)
    //   4. 保存 Pet + 写入 PetInteraction 记录
    //   5. 返回 InteractionResult

    // getShopItems():
    //   1. petAccessoryMapper.selectAllShopItems()
    //   2. 过滤 type=FOOD（v1 仅食物）

    // purchase(userId, itemId, quantity):
    //   1. getMyPet(userId)
    //   2. 校验 coins 足够
    //   3. 扣 coins，写入库存（v1 简化：无 inventory 表，消耗类直接使用）
    //   4. petRepository.save
}
```

### API 层 (api/)

**PetController.java** — 实现 `PetsApi` / `ShopApi`（由 openapi-generator 生成）:
- `POST /api/v1/pets/me` → `createPet`
- `GET /api/v1/pets/me` → `getMyPet`
- `PUT /api/v1/pets/me` → `updatePet`
- `POST /api/v1/pets/me/interact` → `interact`
- `GET /api/v1/shop/items` → `getShopItems`
- `POST /api/v1/shop/purchase` → `purchase`

**PetAssembler.java**:
- `Pet → PetProfile`（DTO）: 映射所有字段
- `CreatePetRequest → Pet`（name + species）
- `InteractionRequest → type + quantity`
- `InteractionResult → InteractionResponse`

每个方法注入 `CurrentUserService`（`autowired`），手动传入 userId。

## API Design

### OpenAPI 新增路径

```yaml
# specs/openapi.yaml 新增三段

paths:
  /pets/me:
    post:
      summary: 创建宠物
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [species, name]
              properties:
                species: { type: string, enum: [ORANGE_CAT, SHIBA_INU] }
                name: { type: string, maxLength: 30 }
      responses:
        '201': { $ref: '#/components/schemas/PetProfile' }
        '409': { description: 已有宠物 }
    get:
      summary: 获取我的宠物
      responses:
        '200': { $ref: '#/components/schemas/PetProfile' }
        '404': { description: 未创建宠物 }
    put:
      summary: 更新宠物（命名）
      requestBody: { ... }
      responses:
        '200': { $ref: '#/components/schemas/PetProfile' }

  /pets/me/interact:
    post:
      summary: 互动操作
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [type]
              properties:
                type: { type: string, enum: [FEED, PLAY] }
                quantity: { type: integer, default: 1, minimum: 1, maximum: 10 }
      responses:
        '200': { $ref: '#/components/schemas/InteractionResult' }
        '400': { description: 资源不足/参数非法 }
        '404': { description: 未创建宠物 }

  /shop/items:
    get:
      summary: 获取商店物品
      responses:
        '200':
          type: array
          items: { $ref: '#/components/schemas/ShopItem' }

  /shop/purchase:
    post:
      summary: 购买物品
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [itemId]
              properties:
                itemId: { type: integer }
                quantity: { type: integer, default: 1 }
      responses:
        '200': { $ref: '#/components/schemas/PurchaseResult' }
        '400': { description: 专注币不足/物品不存在 }
```

### 新增 Schema

**PetProfile**: `{ id, species, name, experience, level, mood, hunger, coins, currentAccessory, lastInteractedAt, createdAt }`
**InteractionResult**: `{ moodChange, hungerChange, expGain, coinChange, newMood, newHunger, newExp, newCoins }`
**ShopItem**: `{ id, name, type, price, effects: { mood, hunger, experience } }`
**PurchaseResult**: `{ success, item, newCoins }`

### 错误码约定
| HTTP | 场景 |
|------|------|
| 201 | 创建成功 |
| 200 | 查询/更新/互动成功 |
| 400 | 参数非法、货币不足、已达上限 |
| 404 | 宠物不存在（`ResourceNotFoundException`） |
| 409 | 已有宠物，不可再创建 |

## Database Design

### Flyway V5__create_pet_tables.sql

**pets** — 宠物主表:
| Column | Type | Constraint | Default |
|--------|------|------------|---------|
| id | BIGINT AUTO_INCREMENT | PRIMARY KEY | |
| user_id | BIGINT NOT NULL | UNIQUE | |
| species | VARCHAR(20) NOT NULL | | |
| name | VARCHAR(30) NOT NULL | | |
| experience | INT NOT NULL | | 0 |
| level | INT NOT NULL | | 1 |
| mood | INT NOT NULL | CHECK 0-100 | 100 |
| hunger | INT NOT NULL | CHECK 0-100 | 100 |
| coins | INT NOT NULL | | 100 |
| current_accessory | BIGINT | NULL, FK→pet_accessories(id) | NULL |
| last_interacted_at | DATETIME NOT NULL | | CURRENT_TIMESTAMP |
| created_at | DATETIME NOT NULL | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME NOT NULL | DEFAULT CURRENT_TIMESTAMP ON UPDATE | |

**pet_accessories** — 物品目录:
| Column | Type | Constraint | Default |
|--------|------|------------|---------|
| id | BIGINT AUTO_INCREMENT | PRIMARY KEY | |
| name | VARCHAR(50) NOT NULL | | |
| type | VARCHAR(20) NOT NULL | FOOD / ACCESSORY | |
| price | INT NOT NULL | > 0 | |
| effect_mood | INT NOT NULL | | 0 |
| effect_hunger | INT NOT NULL | | 0 |
| effect_experience | INT NOT NULL | | 0 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

**pet_interactions** — 互动记录:
| Column | Type | Constraint | Default |
|--------|------|------------|---------|
| id | BIGINT AUTO_INCREMENT | PRIMARY KEY | |
| pet_id | BIGINT NOT NULL | FK→pets(id) ON DELETE CASCADE | |
| type | VARCHAR(20) NOT NULL | FEED / PLAY | |
| quantity | INT NOT NULL | | 1 |
| mood_change | INT NOT NULL | | 0 |
| hunger_change | INT NOT NULL | | 0 | (corrected from `exp_gain`)
| experience_gain | INT NOT NULL | | 0 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

**索引**: `idx_pet_user (user_id)` UNIQUE, `idx_interaction_pet (pet_id)`, `idx_interaction_time (pet_id, created_at)`

**种子数据** — 插入 6 种初始商品:
| name | type | price | mood | hunger | exp |
|------|------|-------|------|--------|-----|
| 小鱼干 | FOOD | 10 | 5 | 20 | 3 |
| 高级猫粮 | FOOD | 25 | 10 | 40 | 8 |
| 狗粮 | FOOD | 15 | 8 | 30 | 5 |
| 磨牙棒 | FOOD | 20 | 8 | 25 | 6 |
| 优质罐头 | FOOD | 35 | 15 | 50 | 10 |
| 玩具球 | FOOD | 5 | 15 | 0 | 5 |

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 定时衰减扫描全表，宠物量增长后性能问题 | 当前预期 < 1000 条，每 10 分钟扫描可接受；Phase 2 加索引 `idx_last_interacted` + 分批处理 |
| 衰减与互动并发（用户在衰减保存前互动） | 乐观锁：`updated_at` 比较，或 MyBatis-Plus `@Version`；数据量小的情况下 `@Transactional` 行锁足够 |
| H2 测试与 MySQL 的 CHECK/MODIFY 语法差异 | Flyway 只在 MySQL 运行时执行；H2 测试用 `application-test.yml` 的 `schema-h2.sql` 初始化相同结构（无 CHECK 约束） |
| `pet_accessories` 表 v1 只有 FOOD，ACCESSORY 类型为空 | 表结构已预留 type 字段，Phase 2 增加装扮时无需改表 |
| openapi-generator 生成代码可能与手写 Controller 冲突 | 先生成接口，再写 Controller；每步 `mvn compile` 验证 |

## Migration Plan

1. **部署前**:
   - 确保 V4 迁移已全部执行
   - `specs/openapi.yaml` 已更新并 merge
2. **部署步骤**:
   - 应用启动 → Flyway 自动执行 V5 → 创建 3 张表 + 插入种子数据
   - `mvn compile` → openapi-generator 生成 `PetsApi` / `ShopApi` 接口 + DTO
3. **回滚**: 无自动回滚——V5 是纯新增表，不影响现有功能；如需撤销，手动 `DROP TABLE pet_interactions, pet_accessories, pets` 并删除 `flyway_schema_history` 中 V5 记录
4. **版本号**: `specs/openapi.yaml` 3.1.0 → 3.2.0、`backend/pom.xml` 同步 → `3.2.0-SNAPSHOT`、`frontend/package.json` 暂不更新（前端无变动）

## Open Questions

1. **宠物状态变更是否需要 SSE 推送？** 当前设计是前端轮询 `GET /pets/me`。如果后续需要实时推送（如衰减触发宠物表情变化），可在 `PetStatusScheduler` 中复用 `SseEmitterManager`。v1 先不做。
2. **每日互动次数上限？** 计划未提及。v1 暂不加限制（消耗 coins 本身就是软限制——无 coins 无法喂食）。可在 M1.2 前端阶段加体验限制。
3. **`lastInteractedAt` 初始值**：创建宠物时设为 `now()`，避免新宠物被立即衰减。
