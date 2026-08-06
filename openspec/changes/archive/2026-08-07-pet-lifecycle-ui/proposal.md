# Proposal: pet-lifecycle-ui

## Why
宠物养成闭环断裂：后端持续衰减（mood -2/h、hunger -3/h，约 33 小时归零）但**喂食/商店 UI 从未接线**——`pet-interaction-ui` spec 已完整定义互动菜单（喂食/玩耍/商店），代码中只有残留的 `menuOpen` 状态；`useInteract`/`usePurchase`/`useShopItems` hooks 无任何组件调用。用户宠物 mood/hunger 归零且无法补充（感知为"生命值 0 死狗"）。同时互动反馈感知弱（仅小粒子，无数值呈现），`pet-status-panel` 的三段颜色编码（绿/黄/红）也未在 PetStatus 落地。

## What Changes
- 实现 `pet-interaction-ui` spec 定义的互动菜单（PetMenu Popover：喂食 / 玩耍 / 商店 tab）——点击宠物弹出，操作即时反馈 + 刷新状态
- 升级 `PetPage`（/pet 页面）为完整宠物面板：状态卡（mood/hunger/coins/level+exp，三段颜色编码）+ 喂食区 + 商店购买区
- 互动/购买反馈强化：浮动数值（`+25 心情` `+20 饱腹` `-10 金币`）+ 粒子类型与行为对应（喂食→食物、购买→金币、玩耍→星星）
- PetStatus 颜色编码对齐 `pet-status-panel` spec（绿 ≥60 / 黄 30-59 / 红 <30）
- 清理 petStore 残留的 `menuOpen`/旧 API（如无消费方）

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `pet-interaction-ui`: 互动菜单入口调整（hover 浮窗按钮，保留点击摸头）；新增浮动数值反馈场景
- `pet-interaction-particle`: 粒子类型与互动行为对应调整（喂食→食物粒子，购买→金币粒子）
- 注：`pet-status-panel` 的三段颜色编码为 spec 已定义未实现（需求不变，实现归入本变更 tasks，不做需求级变更）

## API Contract Impact
无契约变更。复用现有端点：`GET /shop/items`、`POST /shop/purchase`、`POST /pets/me/interact`（FEED 指定 itemId 可选，默认最便宜食物；PLAY 免费）——均为 v3.2 已发布端点。

## DDD Layer Impact
- 领域层（domain/pet/PetDomainService）：衰减速率从硬编码（mood -2/h、hunger -3/h）改为可配置参数，默认放缓（mood -1/h、hunger -1.5/h，约 66h 归零）
- 基础设施层（infrastructure/scheduled/PetStatusScheduler）：读取配置（`pet.decay.*`），调度逻辑不变
- 其余层不触碰（API / 应用层不变；交互/购买逻辑已验证可用）

## Database Impact
无（不需要新 Flyway 迁移；`pet_accessories` 种子数据已就位：6 种 FOOD；衰减速率属配置非表结构）。

## Impact
- 前端组件：新增 `PetMenu`（互动菜单 Popover）；升级 `PetPage`、`PetStatus`（颜色编码）、`ParticleBurst`（类型映射扩展 + 浮动数值）；`RoamingPet` 点击交互接入 PetMenu
- 前端状态：`petStore`（浮动数值反馈事件；清理 `menuOpen` 残留）
- hooks：`useInteract`/`useShopItems`/`usePurchase` 首次获得调用方
- 测试：新增 PetMenu/PetPage 组件测试 + 浮动数值测试；更新既有 RoamingPet 交互测试
- 文档：component-catalog.md（新组件 PetMenu + PetPage 描述）；docs-check 全绿
- 待决策：衰减速率是否放缓（当前 hunger 33h 归零；可选放缓至 ~66h）
