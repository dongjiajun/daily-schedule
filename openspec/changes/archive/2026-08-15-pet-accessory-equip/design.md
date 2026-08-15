# Design: 宠物装扮装备语义 + SVG 分层 + 节日配饰

## Context

`pets.current_accessory` 列自 v3.2（V5 迁移）存在但从未写入；`purchase()` 对所有物品一律"即时消费加数值"（`PetApplicationService.java:132-169` 手工 `Math.min` 钳制）；`themeMapping.ts` 的 11 个 `petAccessory` 名称前端零消费。M2.4 换装（佩戴/取下/节日装扮）无装备底座。上一变更（pet-economy-loop）已补齐奖励收入与 pet 仓储端口，本变更直接消费这些基础：`PetAccessoryRepository` 端口可用、`RewardSource` 数值模式可参照、`applyInteraction` 钳制链路可复用。

约束：DDD 依赖方向（应用层不手工钳制领域数值——线1 O8）；API 契约驱动；SvgAvatar 被 RoamingPet/PetPage/SidebarPet 三处消费，装扮必须零侵入地全场景生效；`current_accessory` FK → pet_accessories(id) 已就位。

## Goals / Non-Goals

**Goals:**
- purchase 语义分流：FOOD 即时消费 / ACCESSORY 购买即装备（覆盖旧装备）
- 钳制逻辑下沉领域层（吸收线1 O8），应用层不再手工 `Math.min`
- 11 个节日配饰成为真实商店物品（名称与 themeMapping 对齐），可购买可装备可取下
- 装扮在游走宠物/详情页/侧边栏全场景渲染（叠加层 + 皮肤 filter）

**Non-Goals:**
- 节日自动穿戴（需物品持有/库存概念，M2.4 决定）
- 配饰逐图层重绘皮肤（CSS filter 近似；M2.4 需要时升级）
- 库存/多件持有（即时消费模型延续）
- 配饰特效数值（纯外观，effect_*=0）

## Decisions

### Decision 1: 装备存储——直接复用 `pets.current_accessory`（不建新表）
- **选择**: 装备 = 写 `current_accessory = itemId`，覆盖旧装备；取下 = 置 NULL。V8 迁移仅 INSERT 种子，不改变表结构。
- **理由**: 字段、FK、PetPO/PetProfile 全链路自 v3.2 已就位（只差写入）；M2.4 若引入库存/多配饰持有再建 `pet_owned_accessories` 表（迁移路径清晰：current_accessory 仍指向"当前佩戴"）。
- **备选方案**: ① 新表 `pet_owned_accessories` 持有 + 装备引用——库存概念本变更明确不做，提前建表徒增复杂度；② 装备状态放前端 localStorage——跨设备/换端即失，且后端字段形同虚设。

### Decision 2: 钳制下沉——`PetDomainService.purchase` 产出 `InteractionResult`
- **选择**: 新增 `PetDomainService.purchase(Pet pet, ShopItem item, int quantity)`：FOOD → `InteractionResult(coins=-price×qty, mood/hunger/exp=+effect×qty)`；ACCESSORY → 校验 quantity==1（抛 `IllegalArgumentException("配饰每次只能购买一件")`）+ `InteractionResult(coins=-price, 其余 0)`。应用层调用 `pet.applyInteraction(result)` 应用数值，删除手工钳制；ACCESSORY 分支额外 `pet.setCurrentAccessory(item.getId())`。
- **理由**: 与上一变更 `grant(pet, source)` 同一模式——"域服务算数值、实体应用钳制"，钳制/等级重算唯一实现点在 `Pet.applyInteraction`（线1 O8 要消灭的正是 purchase 里的第二份钳制）。
- **备选方案**: ① 应用层继续手工钳制——O8 原样保留，违背本变更目标；② 新建 `Pet.applyPurchase` 专用方法——与 applyInteraction 逻辑重复（仅 hunger 差异），无收益。

### Decision 3: 渲染层——独立叠加 SVG + CSS filter（不重构基础插画）
- **选择**: 新增 `AccessoryOverlay` 组件：同 `viewBox="0 0 100 100"` 的独立 `<svg>` 绝对定位叠放在基础插画之上（`position:absolute; inset:0`）；皮肤类对基础 SVG 应用 CSS filter（年兽 `hue-rotate(140deg) saturate(1.3)`、玉兔 `brightness(1.5) saturate(0.25)`、印度象 `grayscale(0.75) brightness(0.7)`）。`SvgAvatar` 增加 `accessory?: string | null`，内部包裹相对容器。
- **理由**: 基础插画（OrangeCat/ShibaInu）是"程序化几何图形组合"单体组件，无图层边界；10 种配饰全部位于形象最上层（帽/角/耳/背包都在头部或背部上方），z-order 叠加完全够用——**无需**为它们重构图层。皮肤用 filter 近似是明确记录的取舍（Non-Goals），避免 3 个皮肤 × 2 物种 × 8 表情 × 11 动作的插画矩阵爆炸。
- **备选方案**: ① 重构 OrangeCat/ShibaInu 为图层化（body/head/ears 分层 + accessory slot）——工作量 10 倍于叠加层，且 skin 仍要处理调色板注入，收益仅"背包藏到身体后面"这种细节；② 每种配饰做成完整插画组件——3 皮肤 × 2 物种全矩阵无法维护。

### Decision 4: 配饰名称 → 渲染映射表（单一来源）
- **选择**: `AccessoryOverlay` 内定义 `ACCESSORY_RENDER_MAP: Record<string, { kind: 'hat'|'antler'|'ear'|'backpack'|'skin', ... }>`，按名称映射渲染；未知名称 → 不渲染（静默回退）。
- **理由**: 名称即身份（themeMapping 与 DB 种子同名字符串），无 id→name→kind 的多级映射需求；新配饰 = 加一行映射。静默回退保证旧数据/未来配饰不炸渲染。
- **备选方案**: 按 id 映射——种子 id 不稳定（H2 与 MySQL 可能不同），名称是稳定契约。

### Decision 5: 取下端点幂等 204
- **选择**: `DELETE /pets/me/accessory`：有宠物 → `setCurrentAccessory(null)` + save + 204；未装备时同样 204（幂等）；无宠物 404。
- **理由**: DELETE 幂等语义（RFC 7231），前端"取下"按钮无需先查状态；无宠物 404 与 `getMyPet` 语义一致。
- **备选方案**: 未装备时返回 404/409——前端需区分"没穿"与"没宠物"，徒增分支；204 幂等最简单。

### Decision 6: PurchaseResult 扩展 `equippedAccessoryId`（可选字段）
- **选择**: openapi `PurchaseResult` 新增可选 `equippedAccessoryId`（int64），装备购买回传；FOOD 购买为 null。版本 v3.5.0（新增可选字段 + 新端点 = MINOR）。
- **理由**: 前端装备成功后立即更新本地装备态，无需再轮询 getMyPet；可选字段向后兼容（旧客户端忽略）。
- **备选方案**: 前端购买后直接 invalidate + 重新拉 pet profile——多一次往返，且 toast 文案需二次请求才知道装备名；`equippedAccessoryId` 让一次响应闭环。

### Decision 7: 配饰价格档位
- **选择**: 皮肤 80 / 背包 50 / 帽子 40 / 角·耳·发饰 30（专注币）。
- **理由**: 经济闭环上线后（任务 +10/日程 +20），30-80 对应 2-8 次完成行为，激励可感知；皮肤最高档符合稀有度直觉。M2.4 定价时可统一调参。
- **备选方案**: 全 10 币——装备零门槛但无收藏梯度；全 100+——新用户首件配饰获取周期过长。

## DDD Layer Design

### 领域层 (domain/pet/)
- `PetDomainService` 新增 `purchase(Pet pet, ShopItem item, int quantity): InteractionResult`（FOOD/ACCESSORY 分支 + quantity 校验）
- `Pet` 不变（applyInteraction/setCurrentAccessory 已存在）

### 基础设施层 (infrastructure/persistence/)
- Flyway `V8__seed_pet_accessories.sql`：11 行 INSERT（type='ACCESSORY'，effect_*=0，价格按 Decision 7）
- `schema-h2.sql` 同步 11 行种子
- 无新表/新 PO/新 Mapper

### 应用层 (application/pet/)
- `PetApplicationService.purchase` 重写：
  ```
  item = accessoryRepository.findById(itemId).orElseThrow(...)
  if (coins < price*qty) → 400 专注币不足
  result = domainService.purchase(pet, item, quantity)   // 可能抛 quantity 校验异常
  if (ACCESSORY) pet.setCurrentAccessory(item.getId())
  pet.applyInteraction(result)                            // 钳制/等级/回填
  petRepository.save(pet)
  → PurchaseResult(+equippedAccessoryId)
  ```
- 新增 `unequip()`：getMyPet → setCurrentAccessory(null) → save

### API 层 (api/)
- `PetController` 实现 `unequipAccessory`（生成的 ShopApi 新方法）；`purchaseItem` 回传 equippedAccessoryId
- `PetAssembler.toPurchaseResultDto` 增补字段
- 错误：400（专注币不足/配饰 quantity>1）、404（物品不存在/无宠物）

### 前端 (frontend/src/)
- 新增 `modules/pet/components/AccessoryOverlay.tsx`（4 类叠加 SVG + 3 类 skin filter + 名称映射表）
- `SvgAvatar` 加 `accessory` prop → 相对容器包裹 + overlay/skin filter
- `PetAvatar`/`SidebarPet`：`useMyPet().currentAccessory` + `useShopItems()` → id→名称 → 传入
- `FoodActionList`（mode=shop）：ACCESSORY 显示「装备」+ 已装备标记；usePurchase toast 分支「已装备 {名称}」
- `PetPage`：当前配饰名称 + 「取下」按钮（`useUnequip` hook：`DELETE /pets/me/accessory` → invalidate pet query + toast）

## API Design

`specs/openapi.yaml`（version v3.5.0）：

```yaml
/pets/me/accessory:
  delete:
    operationId: unequipAccessory
    tags: [Pet]
    summary: 取下当前配饰（幂等）
    responses:
      '204': { description: 取下成功（未装备时同样返回） }
      '401': { $ref: '#/components/responses/Unauthorized' }
      '404': { $ref: '#/components/responses/NotFound' }

PurchaseResult:          # 修改
  properties:
    ...（原字段）
    equippedAccessoryId: { type: integer, format: int64, description: 装备购买时回传所装备配饰 id }
```

同步：`specs/CHANGELOG.md` + 三处版本号 v3.5.0。

## Database Design

`V8__seed_pet_accessories.sql`（仅种子，表结构不变）：

```sql
INSERT INTO pet_accessories (name, type, price, effect_mood, effect_hunger, effect_experience) VALUES
('年兽皮肤',   'ACCESSORY', 80, 0, 0, 0),
('麋鹿角',     'ACCESSORY', 30, 0, 0, 0),
('巫师帽',     'ACCESSORY', 40, 0, 0, 0),
('玉兔皮肤',   'ACCESSORY', 80, 0, 0, 0),
('粽子背包',   'ACCESSORY', 50, 0, 0, 0),
('新年帽',     'ACCESSORY', 40, 0, 0, 0),
('火鸡帽',     'ACCESSORY', 40, 0, 0, 0),
('绿帽子',     'ACCESSORY', 30, 0, 0, 0),
('樱花发饰',   'ACCESSORY', 30, 0, 0, 0),
('印度象皮肤', 'ACCESSORY', 80, 0, 0, 0),
('兔耳朵',     'ACCESSORY', 30, 0, 0, 0);
```

`schema-h2.sql` 同步同批 INSERT（H2 兼容语法）。

## Risks / Trade-offs

- [**皮肤为 filter 近似**]（年兽=红调/玉兔=白亮/印度象=灰调，非真正皮肤插画）→ 已在 spec 中明确声明为近似方案；M2.4 如需高质量皮肤再逐图层重绘
- [**覆盖装备不可逆**]（购买 B 即失去 A 的穿戴，无库存退回）→ 即时消费模型延续；toast 文案「已装备 B」暗示覆盖语义；M2.4 库存概念解决
- [**购买后宠物 30s 轮询延迟**]（装备态立即在 usePurchase onSuccess 中 invalidate，无需等轮询）→ 购买流程内 invalidate pet query 即时刷新
- [**ACCESSORY quantity>1 校验位置**]（在域服务而非 DTO 层——openapi PurchaseRequest quantity 有 minimum:1 无 per-type 限制）→ 域服务校验是最终防线，400 错误信息明确
- [**装备与数值变更同事务**]（装备 + 扣币一次提交，无中间态）→ 与 purchase 现有 @Transactional 一致

## Migration Plan

1. `V8__seed_pet_accessories.sql` Flyway 启动自动执行（仅 INSERT，幂等由 Flyway 版本表保证）
2. 契约生成：`mvn compile` + `pnpm run generate:api`
3. 部署顺序：后端先行（前端 SDK 已含新字段但旧后端不回传 → 前端按 null 处理，无感）
4. 回滚：代码回滚即可；种子数据保留无害（若需清理 `DELETE FROM pet_accessories WHERE type='ACCESSORY'`）
5. 存量用户：`current_accessory` 为 NULL（从未写入），上线后从"未装备"起步，无迁移数据

## Open Questions

- 节日自动穿戴（themeMapping → 自动装备对应配饰）是否列入 M2.4？本变更仅让配饰可购买可装备，自动穿戴需库存/持有概念
- 皮肤 filter 近似效果是否符合产品预期？（可在 smoke 阶段截图确认调参）
