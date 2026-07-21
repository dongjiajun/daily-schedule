# Pet Interaction UI（互动菜单）

## Purpose
提供宠物互动入口：喂食（消耗专注币）、玩耍（免费）和商店购买，所有操作即时反馈并刷新宠物状态。

## Requirements

### Requirement: 互动菜单弹出
用户 SHALL 能点击宠物形象或专用按钮打开互动菜单 Popover，包含"喂食"和"玩耍"两个操作。

#### Scenario: 打开互动菜单
- **WHEN** 用户点击宠物形象
- **THEN** PetMenu Popover 弹出，展示"喂食"和"玩耍"按钮

#### Scenario: 喂食 — 选择食物
- **WHEN** 用户点击"喂食"，选择"小鱼干"（10 coins）
- **THEN** 调用 `POST /pets/me/interact { type: "FEED", itemId: 1 }`，toast 显示 `+20 饱腹 +5 心情`，专注币扣除

#### Scenario: 喂食 — 专注币不足
- **WHEN** 用户专注币 < 食物价格
- **THEN** "喂食"按钮 disabled，tooltip 显示"专注币不足"

#### Scenario: 玩耍
- **WHEN** 用户点击"玩耍"
- **THEN** 调用 `POST /pets/me/interact { type: "PLAY" }`，toast 显示 `+25 心情 -10 饱腹`，宠物动画 happy

#### Scenario: 互动后刷新状态
- **WHEN** 互动 mutation 成功
- **THEN** `invalidateQueries(['pet', 'me'])`，宠物状态实时更新

### Requirement: 商店购买
用户 SHALL 能在 PetMenu 中切换到"商店" tab，浏览食物列表并购买。

#### Scenario: 浏览商店
- **WHEN** 用户点击 PetMenu 中的"商店" tab
- **THEN** 展示 ShopItem 列表（名称/价格/效果），可点击购买
