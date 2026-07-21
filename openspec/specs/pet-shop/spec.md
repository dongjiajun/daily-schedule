# Pet Shop（宠物商店）

## Purpose
用户可查看商店物品列表并用专注币购买食物。v1 为即时消费模型——购买后效果立即应用到宠物（无库存），专注币余额不足时拒绝。

## Requirements

### Requirement: 查看商店物品
用户 SHALL 能查看所有可购买的物品列表（v1 仅食物类型），每个物品包含名称、类型、价格、效果（心情/饱腹/经验增益）。

#### Scenario: 获取商店物品列表
- **WHEN** 发送 `GET /api/v1/shop/items`
- **THEN** 服务器返回 200，响应体为 ShopItem 数组，每条包含 `id`, `name`, `type`, `price`, `effects: { mood, hunger, experience }`

#### Scenario: 商店为空（无种子数据）
- **WHEN** 数据库 `pet_accessories` 表为空
- **THEN** 服务器返回 200，空数组 `[]`

### Requirement: 购买物品
用户 SHALL 能用自己的专注币购买商店物品。v1 为即时消费模型——购买后效果立即应用到宠物（无库存），专注币余额不足时拒绝。

#### Scenario: 成功购买食物
- **WHEN** 专注币 >= 物品价格（如"小鱼干"10 coins），发送 `POST /api/v1/shop/purchase`，body: `{ itemId: 1, quantity: 1 }`
- **THEN** 服务器返回 200：`success = true`, `item.name = "小鱼干"`, `newCoins = 原coins - 10`，宠物的 hunger/mood/exp 按物品效果增加

#### Scenario: 专注币不足
- **WHEN** 专注币 < 物品价格，发送购买请求
- **THEN** 服务器返回 400 Bad Request，错误信息包含"专注币不足"

#### Scenario: 物品不存在
- **WHEN** `itemId` 在 `pet_accessories` 表中不存在
- **THEN** 服务器返回 400 Bad Request，错误信息包含"物品不存在"

#### Scenario: 批量购买
- **WHEN** `quantity > 1`（如 quantity=3），专注币足够
- **THEN** 效果 × quantity 倍，coins 扣减 = price × quantity

#### Scenario: 无宠物时购买
- **WHEN** 当前用户无宠物，发送购买请求
- **THEN** 服务器返回 404 Not Found
