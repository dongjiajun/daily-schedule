# Pet Accessory Equip（宠物装扮装备）

## ADDED Requirements

### Requirement: 购买语义按物品类型分流
`PetApplicationService.purchase(itemId, quantity)` SHALL 按物品 `type` 分流：
- **FOOD**：即时消费——效果（mood/hunger/experience）× quantity 立即应用，支持 `quantity ≥ 1` 批量购买
- **ACCESSORY**：购买即装备——写入 `pets.current_accessory = itemId`（覆盖旧装备，无库存概念）；`quantity` 必须为 1（否则 400「配饰每次只能购买一件」）；效果数值 SHALL 为 0（纯外观，不改变 mood/hunger/experience）
- 专注币不足 SHALL 返回 400「专注币不足」；无宠物 SHALL 返回 404

数值应用 SHALL 下沉到领域层：`PetDomainService.purchase(Pet, ShopItem, quantity)` 产出 `InteractionResult`（FOOD：coins -价格×数量 + 效果×数量；ACCESSORY：仅 coins -价格），由 `Pet.applyInteraction()` 统一钳制（mood/hunger 0-100、等级重算），应用层 SHALL NOT 手工 `Math.min`/`setCoins` 重复钳制（吸收线1 O8）。

#### Scenario: 购买配饰即装备
- **WHEN** 拥有宠物的用户以 `{ itemId: 配饰id, quantity: 1 }` 购买 ACCESSORY 物品且专注币充足
- **THEN** 返回 200，`pets.current_accessory = 配饰id`，宠物 mood/hunger/experience 不变，专注币扣减价格

#### Scenario: 已装备再购买新配饰覆盖
- **WHEN** 宠物已装备配饰 A，购买配饰 B 成功
- **THEN** `current_accessory` 更新为 B（覆盖，A 不保留）

#### Scenario: 配饰批量购买拒绝
- **WHEN** 购买 ACCESSORY 物品且 `quantity > 1`
- **THEN** 返回 400「配饰每次只能购买一件」，不扣币、不装备

#### Scenario: 购买食物仍即时消费
- **WHEN** 购买 FOOD 物品 `quantity = 2`
- **THEN** 效果 × 2 立即应用，专注币扣减价格 × 2，`current_accessory` 不变

### Requirement: 取下配饰
系统 SHALL 新增端点 `DELETE /api/v1/pets/me/accessory`（OpenAPI operationId: `unequipAccessory`），将当前用户宠物的 `current_accessory` 置为 NULL，返回 204。未装备任何配饰时请求 SHALL 同样返回 204（幂等）。无宠物 SHALL 返回 404。

#### Scenario: 取下已装备配饰
- **WHEN** 宠物已装备配饰，发送 `DELETE /api/v1/pets/me/accessory`
- **THEN** 返回 204，`current_accessory` 置为 NULL

#### Scenario: 未装备时取下幂等
- **WHEN** 宠物未装备任何配饰，发送 `DELETE /api/v1/pets/me/accessory`
- **THEN** 返回 204，状态不变

### Requirement: PurchaseResult 装备字段
OpenAPI `PurchaseResult` schema SHALL 新增可选字段 `equippedAccessoryId`（integer, int64）：装备购买成功时回传所装备配饰 id；FOOD 购买时 SHALL NOT 回传（null/缺省）。

#### Scenario: 装备购买回传配饰 id
- **WHEN** 购买 ACCESSORY 成功
- **THEN** 响应 `PurchaseResult.equippedAccessoryId` 等于所购配饰 id

#### Scenario: 食物购买不回传
- **WHEN** 购买 FOOD 成功
- **THEN** 响应中 `equippedAccessoryId` 为 null（或缺省）

### Requirement: 节日配饰种子
数据库 SHALL 新增 11 个 ACCESSORY 类型物品（Flyway `V8__seed_pet_accessories.sql`），名称与 `packages/shared/src/holiday/themeMapping.ts` 的 `petAccessory` 声明逐一对齐，`effect_mood`/`effect_hunger`/`effect_experience` 均为 0：

| 名称 | 价格 | 对应节日 |
|------|------|----------|
| 年兽皮肤 | 80 | spring-festival |
| 麋鹿角 | 30 | christmas |
| 巫师帽 | 40 | halloween |
| 玉兔皮肤 | 80 | mid-autumn |
| 粽子背包 | 50 | dragon-boat |
| 新年帽 | 40 | new-year |
| 火鸡帽 | 40 | thanksgiving |
| 绿帽子 | 30 | st-patricks |
| 樱花发饰 | 30 | sakura |
| 印度象皮肤 | 80 | diwali |
| 兔耳朵 | 30 | easter |

#### Scenario: 商店包含节日配饰
- **WHEN** 发送 `GET /api/v1/shop/items`
- **THEN** 返回列表包含上述 11 个 `type="ACCESSORY"` 物品，名称与 themeMapping 一致

### Requirement: 装扮渲染层
前端 SHALL 新增 `AccessoryOverlay` 组件渲染宠物装扮，与基础 SVG 同 `viewBox`（0 0 100 100）叠放：

- **叠加层类**（帽子/角/耳/背包）：独立 SVG 图形层覆盖在宠物形象之上（巫师帽/新年帽/火鸡帽/绿帽子/樱花发饰 → 头部上方；麋鹿角/兔耳朵 → 头顶两侧；粽子背包 → 背部）
- **皮肤类**（年兽皮肤/玉兔皮肤/印度象皮肤）：对基础 SVG 应用 CSS filter 近似（年兽 = 红色调 hue-rotate，玉兔 = 提亮去饱和，印度象 = 灰调），不逐图层重绘

`SvgAvatar` SHALL 新增 `accessory?: string | null` prop；`PetAvatar`（RoamingPet/PetPage）与 `SidebarPet` SHALL 从 `useMyPet().currentAccessory` + `useShopItems()` 解析出配饰名称并传入，使装扮在游走宠物/详情页/侧边栏迷你宠物全场景生效。

#### Scenario: 装备后展示配饰
- **WHEN** 宠物装备了「巫师帽」且在页面任意场景渲染
- **THEN** 宠物形象头部上方显示巫师帽叠加层（游走/详情页/侧边栏一致）

#### Scenario: 皮肤滤镜生效
- **WHEN** 宠物装备「年兽皮肤」
- **THEN** 基础 SVG 应用红色调 filter，无叠加层

#### Scenario: 未装备不渲染装扮
- **WHEN** 宠物 `currentAccessory` 为 null
- **THEN** 不渲染任何装扮层，形象与既有表现完全一致

### Requirement: 商店装备交互
商店 UI（FoodActionList/PetPage 的 mode=shop）SHALL 对 ACCESSORY 物品显示「装备」操作（购买即装备，成功 toast「已装备 {名称}」+ 装备刷新）；已装备物品 SHALL 显示装备中标记。PetPage SHALL 展示当前配饰名称并提供「取下」按钮（调 `DELETE /pets/me/accessory`，成功后刷新宠物数据）。

#### Scenario: 商店中配饰显示装备按钮
- **WHEN** 用户打开商店查看 ACCESSORY 物品
- **THEN** 显示「装备」按钮（区别于 FOOD 的「购买」），点击后购买成功并弹出「已装备」toast

#### Scenario: 已装备物品标记
- **WHEN** 宠物已装备配饰 X，打开商店
- **THEN** 物品 X 显示「已装备」标记，其余配饰正常显示「装备」

#### Scenario: 详情页取下配饰
- **WHEN** 用户在 PetPage 点击「取下」
- **THEN** 调取下端点成功后宠物形象恢复无装扮状态，当前配饰名称清空
