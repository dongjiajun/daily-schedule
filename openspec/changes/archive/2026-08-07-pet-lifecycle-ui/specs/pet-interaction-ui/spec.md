# Pet Interaction UI（互动菜单）

## Purpose
提供宠物互动入口：喂食（消耗专注币）、玩耍（免费）和商店购买，所有操作即时反馈并刷新宠物状态。

## Requirements

## ADDED Requirements

### Requirement: 互动反馈浮动数值
互动与购买成功后 SHALL 从宠物位置显示浮动数值反馈（如 `+25 心情`、`+20 饱腹`、`-10 金币`），数值取变化量非零项，1.4s 内上飘淡出。

#### Scenario: 喂食后显示浮动数值
- **WHEN** 用户喂食成功，InteractionResult 返回 `moodChange=5, hungerChange=20, coinChange=-10`
- **THEN** 从宠物位置依次上飘 `+5 心情`、`+20 饱腹`、`-10 金币` 三个浮动数值，1.4s 后消失

#### Scenario: 玩耍后显示浮动数值
- **WHEN** 用户玩耍成功，InteractionResult 返回 `moodChange=25, hungerChange=-10, experienceGain=15`
- **THEN** 显示 `+25 心情`、`-10 饱腹`、`+15 经验` 浮动数值

#### Scenario: 购买后显示浮动数值
- **WHEN** 用户购买成功，PurchaseResult 返回 `totalCost=10, newCoins=90`
- **THEN** 显示 `-10 金币` 浮动数值

## MODIFIED Requirements

### Requirement: 互动菜单弹出
用户 SHALL 能通过宠物 hover 浮窗的"互动"按钮或宠物详情页打开互动菜单 Popover，包含"喂食"和"玩耍"两个操作；点击宠物形象本体 SHALL 保留摸头即时反馈（hearts 粒子 + 气泡），不弹菜单。

#### Scenario: 打开互动菜单
- **WHEN** 用户鼠标悬停宠物出现状态浮窗，点击浮窗内"互动"按钮
- **THEN** PetMenu Popover 弹出，展示"喂食"和"玩耍"按钮

#### Scenario: 点击宠物本体保持摸头反馈
- **WHEN** 用户单击宠物形象本体
- **THEN** 触发摸头反馈（hearts 粒子 + 心情气泡），不弹出互动菜单

#### Scenario: 喂食 — 选择食物
- **WHEN** 用户点击"喂食"，选择"小鱼干"（10 coins）
- **THEN** 调用 `POST /pets/me/interact { type: "FEED", itemId: 1 }`，浮动数值显示 `+20 饱腹 +5 心情`，专注币扣除

#### Scenario: 喂食 — 专注币不足
- **WHEN** 用户专注币 < 食物价格
- **THEN** "喂食"按钮 disabled，tooltip 显示"专注币不足"

#### Scenario: 玩耍
- **WHEN** 用户点击"玩耍"
- **THEN** 调用 `POST /pets/me/interact { type: "PLAY" }`，浮动数值显示 `+25 心情 -10 饱腹`，宠物动画 happy

#### Scenario: 互动后刷新状态
- **WHEN** 互动 mutation 成功
- **THEN** `invalidateQueries(['pet', 'me'])`，宠物状态实时更新

### Requirement: 商店购买
用户 SHALL 能在 PetMenu 中切换到"商店" tab，浏览食物列表并购买；宠物详情页 SHALL 提供同构的商店购买区。

#### Scenario: 浏览商店
- **WHEN** 用户点击 PetMenu 中的"商店" tab
- **THEN** 展示 ShopItem 列表（名称/价格/效果），可点击购买

#### Scenario: 购买成功
- **WHEN** 用户购买成功（`POST /shop/purchase` 返回 success）
- **THEN** 浮动数值显示 `-N 金币`，宠物状态刷新

#### Scenario: 专注币不足
- **WHEN** 用户专注币 < 物品价格
- **THEN** 购买按钮 disabled，tooltip 显示"专注币不足"
