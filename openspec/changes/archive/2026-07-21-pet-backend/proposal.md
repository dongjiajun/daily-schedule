# Proposal: 宠物养成系统后端 (Pet Backend v1)

## Why
日程管理系统 v3.1 是纯理性驱动的工具——用户"应该"管理日程，但缺少情感粘性。宠物养成是产品核心差异化卖点：将用户在所有模块的行为转化为养成资源（喂食、经验、货币），让宠物成为始终可见的"体验层"，驱动用户每天回来看看自己的伙伴。Phase 1 的第一步，先搭建宠物后端骨架——M1.1 是后续所有宠物前端、节日联动、跨模块互动的基础。

## What Changes
- 新增 DDD 完整四层：`domain/pet/`、`application/pet/`、`api/controller/PetController`、`api/assembler/PetAssembler`、`infrastructure/persistence/`（PO + Mapper + RepositoryImpl）
- specs/openapi.yaml 新增 3 组路径：`pets`、`pets/me/{petId}/interact`、`shop`
- Flyway V5 迁移：`pets` + `pet_accessories` + `pet_interactions` 三张新表
- 新增 React Query hooks 对应的 API 端点（宠物 CRUD、互动操作、商店）
- **BREAKING**: 无（纯新增，不影响现有 API）

## Capabilities

### New Capabilities
- `pet-profile`: 宠物档案 — 创建、查看、命名、选择物种（橘猫/柴犬初始二选一）
- `pet-interaction`: 宠物互动 — 喂食（消耗食物，恢复饱腹/心情）、玩耍（消耗精力，+心情+经验）
- `pet-shop`: 宠物商店 — 使用专注币购买食物、装饰（预留 accessory 表，v1 仅食物）
- `pet-status`: 宠物状态自动衰减 — 定时作业计算饱腹/心情随时间衰减

## API Contract Impact
需修改 specs/openapi.yaml，新增以下端点（均在 `/api/v1` 下，需 Bearer JWT）：

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/pets/me` | 创建当前用户的宠物（选择物种+命名） |
| `GET` | `/pets/me` | 获取当前用户的宠物详情（含状态、装备） |
| `PUT` | `/pets/me` | 更新宠物（命名等） |
| `POST` | `/pets/me/interact` | 互动操作（body: `{ type: "feed"|"play", quantity?: number }`） |
| `GET` | `/shop/items` | 获取商店物品列表 |
| `POST` | `/shop/purchase` | 购买物品（body: `{ itemId, quantity }`） |

新增 Schema：`PetProfile`、`PetStatus`、`InteractionRequest`、`InteractionResult`、`ShopItem`、`PurchaseRequest`、`PurchaseResult`

## DDD Layer Impact
- **API 层**: 新增 `PetController`（实现 `PetsApi`/`ShopApi` 生成接口）、`PetAssembler`（Pet ↔ PetProfile ↔ PetDTO）
- **应用层**: 新增 `PetApplicationService`（CRUD 编排、互动逻辑、商店购买、重名校验）
- **领域层**: 新增 `Pet`（实体 + `PetDomainService` — 属性衰减计算、进化规则）、`PetRepository`（仓储接口）、`PetStatus`/`PetMood`/`PetSpecies`/`InteractionType`（值对象/枚举）
- **基础设施层**: 新增 `PetPO` + `PetMapper` + `PetRepositoryImpl`；`PetInteractionPO` + `PetInteractionMapper`；`PetAccessoryPO` + `PetAccessoryMapper`；可选 `PetStatusScheduler`（定时衰减作业）

## Database Impact
Flyway V5 迁移，新增 3 张表：

**pets** — 宠物主表（一对一 user_id）:
| 列 | 类型 | 说明 |
|----|------|------|
| id | BIGINT PK | 自增主键 |
| user_id | BIGINT UNIQUE NOT NULL | 所属用户（唯一约束） |
| species | VARCHAR(20) NOT NULL | 物种：ORANGE_CAT / SHIBA_INU |
| name | VARCHAR(30) NOT NULL | 宠物昵称 |
| experience | INT DEFAULT 0 | 经验值（决定等级） |
| level | INT DEFAULT 1 | 等级（1-50） |
| mood | INT DEFAULT 100 | 心情（0-100） |
| hunger | INT DEFAULT 100 | 饱腹（0-100） |
| coins | INT DEFAULT 100 | 专注币 |
| current_accessory | BIGINT NULL | 当前佩戴装饰（FK → pet_accessories） |
| created_at / updated_at | DATETIME | 时间戳 |

**pet_interactions** — 互动记录:
| 列 | 类型 | 说明 |
|----|------|------|
| id | BIGINT PK | 自增 |
| pet_id | BIGINT FK | 关联宠物 |
| type | VARCHAR(20) NOT NULL | FEED / PLAY |
| quantity | INT DEFAULT 1 | 交互量 |
| mood_change | INT | 心情变化 |
| hunger_change | INT | 饱腹变化 |
| experience_gain | INT | 经验获得 |
| created_at | DATETIME | 交互时间 |

**pet_accessories** — 装扮目录（v1 建表，暂只含食物）:
| 列 | 类型 | 说明 |
|----|------|------|
| id | BIGINT PK | 自增 |
| name | VARCHAR(50) NOT NULL | 物品名称 |
| type | VARCHAR(20) NOT NULL | FOOD / ACCESSORY |
| price | INT NOT NULL | 价格（专注币） |
| effect_mood | INT DEFAULT 0 | 心情效果 |
| effect_hunger | INT DEFAULT 0 | 饱腹效果 |
| effect_experience | INT DEFAULT 0 | 经验效果 |
| created_at | DATETIME | 上架时间 |

## Impact
- **后端新增**: ~17-20 个 Java 文件（domain 5-6 + application 1 + api 2 + infrastructure 8-9 + test 5-6）
- **前端**: 本次 change 不涉及前端（M1.2 独立 change），但 API 变更后需重新 `generate:api` 刷新 SDK
- **日历模块**: 需补充 `eventBus.emit()` 调用（已验证：当前日历模块未实际 emit 事件）—— 独立 fix 或并入 M1.2
- **共享类型**: `packages/shared/src/types/` 可新增 Pet 类型（可选，M1.2 时再补）
- **文档更新**: `docs/database/schema.md`（新增 3 张表）、`docs/api/overview.md`（新增 6 端点）、`specs/CHANGELOG.md`（API 变更）、`docs/uml/README.md`（新实体）
- **版本号**: `specs/openapi.yaml` → `3.2.0`、`backend/pom.xml` → `3.2.0-SNAPSHOT`（MINOR bump，新增功能）
