# Design: pet-lifecycle-ui

## Context
宠物养成闭环断裂：`pet-interaction-ui` spec 定义了互动菜单（喂食/玩耍/商店）但代码从未实现；`useInteract`/`useShopItems`/`usePurchase` hooks 无调用方；后端衰减（mood -2/h、hunger -3/h，33h 归零）持续运行，用户宠物归零后无法补充。`pet-status-panel` spec 要求的三段颜色编码未在 PetStatus 落地（统一 `bg-accent`）。

复用现有资产：后端交互/购买/商店 API（v3.2 已验证）、6 种 FOOD 种子数据、hooks + 测试、`ParticleBurst`（4 种粒子类型）、PetStatus/SidebarPet/PetPage 组件、`petStore`（含残留 `menuOpen`）。

约束：
- 无 API 契约变更（复用 `GET /shop/items`、`POST /shop/purchase`、`POST /pets/me/interact`）
- 后端仅动衰减速率配置化（领域层 + 配置文件），不碰业务逻辑
- 不破坏现有交互语义（点击摸头保留；菜单从 hover 浮窗进入）

## Goals / Non-Goals

**Goals:**
- 落地互动菜单（spec 已定义）：喂食（interact FEED）/ 玩耍（interact PLAY）/ 商店（purchase）
- PetPage 升级为完整宠物面板（状态卡 + 喂食 + 商店）
- 互动/购买反馈强化：浮动数值 + 粒子类型对应
- PetStatus 三段颜色编码对齐 spec
- 衰减速率配置化并放缓（mood -1/h、hunger -1.5/h）
- 清理 petStore `menuOpen` 残留

**Non-Goals:**
- 不做库存/背包系统（v1 即时消费模型不变）
- 不新增 API 端点或 schema
- 不做宠物 v2 功能（进化/装扮/限时皮肤）
- 不重写 ParticleBurst 引擎（仅扩展类型映射与数值反馈）
- 不做音效

## Decisions

### Decision 1: 互动菜单入口走 hover 浮窗按钮，点击摸头语义保留
- **选择**: RoamingPet 点击仍为摸头（hearts 粒子 + 气泡即时反馈）；`PetMenu` Popover 从 hover 浮窗（已含 PetStatus）底部"互动"按钮打开；PetPage 提供完整面板（菜单 + 状态 + 商店）
- **理由**: 单击摸头已是用户习惯的即时反馈（v2 语义），菜单是低频操作；把"低频菜单"挂在"高频互动"上会让摸头失去即时性。hover 浮窗按钮 + PetPage 面板两条入口覆盖所有场景
- **备选方案**: (a) 单击弹菜单——破坏摸头语义；(b) 只做 PetPage——页外无法喂食；(c) 全局悬浮按钮——侵入式 UI
- **spec 影响**: `pet-interaction-ui` 的"打开互动菜单 WHEN 点击宠物"场景需 MODIFIED 为"hover 浮窗互动按钮"（需求级调整，delta 中记录）

### Decision 2: 喂食与购买两个端点分别落"喂食区"与"商店区"
- **选择**: 喂食区（`POST /pets/me/interact` type=FEED + itemId）与商店区（`POST /shop/purchase`）在 UI 上并存——PetMenu 商店 tab 与 PetPage 商店区用 purchase；PetMenu 喂食按钮与 PetPage 喂食区用 interact。两者均即时消费、即时反馈
- **理由**: 两个端点契约都有效且效果等价（扣 coins + 加属性），但交互语义不同（喂食=宠物行为，购买=消费行为）；UI 双入口各自满足既有 spec（pet-interaction / pet-shop）的场景，不产生 spec 冲突
- **备选方案**: (a) 统一走 interact——pet-shop 的"购买"场景无 UI 落点，spec 不符；(b) 统一走 purchase——interact FEED 的 itemId 语义闲置

### Decision 3: 反馈强化 = 浮动数值（FloatingText）+ 粒子类型映射扩展
- **选择**: petStore 新增 `feedbackTrigger: { items: { text: string; tone: 'good'|'bad' }[]; timestamp: number } | null`；`FloatingText` 组件从宠物位置向上飘散 + 淡出（1.4s）；数值来自 InteractionResult/PurchaseResult（moodChange/hungerChange/experienceGain/coinChange/totalCost）。ParticleType 增 `'food'`（🍖🍗🦴🥕）映射；互动反馈矩阵：FEED→food 粒子、PLAY→stars、purchase 成功→coins、不足→无粒子仅 toast
- **理由**: 数值反馈是"感知养成"的最短路径（用户立刻看到 +25 饱腹）；复用现有 particleTrigger 触发链，FloatingText 与 ParticleBurst 并列渲染，零侵入
- **备选方案**: (a) toast 扩展——已有 toast 但无位置感；(b) 数值画在宠物头顶静态——无动画感知弱

### Decision 4: PetStatus 三段颜色编码（对齐 pet-status-panel spec）
- **选择**: mood/hunger 进度条按阈值染色：≥60 绿（`bg-emerald-500`）、30-59 黄（`bg-amber-500`）、<30 红（`bg-red-500`），替代统一 `bg-accent`；SidebarPet 已有的三段色逻辑抽为共享函数（`statusColor(value)`）避免双份实现
- **理由**: spec 已定义该行为，SidebarPet 已有实现（证明可行），统一后视觉一致
- **备选方案**: 保持统一色——spec 不符；CSS 变量主题化——超出范围

### Decision 5: 衰减速率配置化 + 放缓
- **选择**: `PetDomainService` 注入 `@Value("${pet.decay.moodPerHour:1.0}")` / `@Value("${pet.decay.hungerPerHour:1.5}")`；`decay()` 用配置值替代硬编码（保留"不得低于 0"钳制）；`application.yml`（dev/test）与 `application-test.yml` 补 `pet.decay.*` 块（显式声明，非仅默认值）；PetStatusScheduler 不动
- **理由**: 速率成为配置后后续调优无需改代码；放缓至 66h 归零配合喂食 UI 降低"必须盯着喂"压力；`@Value` 默认值保证 prod（无配置块）也生效
- **备选方案**: (a) 硬编码改常量——不可调优；(b) 环境变量注入——过度设计

### Decision 6: petStore 清理 `menuOpen` 残留
- **选择**: 移除 `menuOpen`/`setMenuOpen`（无消费方，PetMenu 用本地 useState）；保留 `selectionOpen`（PetSelection 使用）
- **理由**: 清理死状态，避免后续误用；PetMenu 是低频 Popover，本地状态足够
- **备选方案**: 保留——死代码累积

## DDD Layer Design

### 领域层 (domain/pet/)
- `PetDomainService`：新增 `moodPerHour` / `hungerPerHour` 字段（`@Value` 注入，默认 1.0 / 1.5）；`decay()` 计算改用配置值；`interact()`/`play` 逻辑不变

### 基础设施层 (infrastructure/)
- `PetStatusScheduler`：不变（`fixedRateString` 已配置化）
- 配置：`application.yml` + `application-test.yml` 补 `pet.decay:` 块（intervalMs/moodPerHour/hungerPerHour）

### 应用层 (application/pet/)
- 不变（`PetApplicationService` 交互/购买用例已验证）

### API 层 (api/)
- 不变（无契约变更）

### 前端 (frontend/src/)
```
modules/pet/
├── components/
│   ├── PetMenu.tsx          (新增) 互动菜单 Popover：喂食/玩耍 + 商店 tab
│   ├── FloatingText.tsx     (新增) 浮动数值（从宠物位置向上飘 + 淡出）
│   ├── PetPage.tsx          (升级) 状态卡 + 喂食区 + 商店区
│   ├── PetStatus.tsx        (升级) 三段颜色编码
│   ├── ParticleBurst.tsx    (扩展) EMOJI_MAP 增 food；支持数值反馈联动
│   └── RoamingPet.tsx       (接入) hover 浮窗加"互动"按钮 → PetMenu；反馈事件渲染
├── store/petStore.ts        (扩展) feedbackTrigger + triggerFeedback/clearFeedback；删 menuOpen
├── hooks/usePet.ts          (无改动，首次获得调用方)
└── lib/statusColor.ts       (新增) 三段色共享函数（PetStatus/SidebarPet 复用）
```

## API Design
无契约变更。消费现有端点：
- `GET /shop/items` → ShopItem[]（6 种 FOOD：小鱼干 10 / 狗粮 15 / 磨牙棒 20 / 高级猫粮 25 / 优质罐头 35 / 玩具球 5）
- `POST /pets/me/interact` → InteractionResult（FEED：`{ type, itemId, quantity }`；PLAY：`{ type }`）
- `POST /shop/purchase` → PurchaseResult（`{ itemId, quantity }`）
- 错误处理：专注币不足 400 → toast + 按钮禁用；无宠物 404 → PetSelection

## Database Design
无（无 Flyway 变更；速率是配置非表结构）。

## Risks / Trade-offs
- [互动菜单低频入口可能不够显眼] → PetPage 完整面板兜底 + hover 浮窗按钮 + PetStatus 悬停提示；smoke 验证用户路径可达
- [两个购买语义（interact/purchase）用户困惑] → 文案区分：喂食区"喂饱 Ta"、商店区"补充食物"; v1 即时消费下两者效果等价，风险低
- [浮动数值过多打扰] → 只显示变化量非零项，1.4s 自动消失；数量上限 4 条
- [衰减配置改动影响既有测试] → PetDomainService 测试改用显式速率断言（注入值或默认值验证）；回归 pet 后端测试
- [PetMenu 与 hover 浮窗 z-index/事件冲突] → PetMenu 用 portal（Dialog 同款）渲染，独立 z-index

## Migration Plan
1. 后端：PetDomainService 速率配置化 + application.yml/test 配置块 → `mvn test`（pet 相关测试回归 + 新增衰减速率测试）
2. 前端状态：petStore feedbackTrigger + 清理 menuOpen → 单测
3. 组件：FloatingText → PetStatus 颜色 → ParticleBurst 扩展 → PetMenu → PetPage → RoamingPet 接线
4. 测试：组件测试（PetMenu 打开/喂食/不足禁用/购买）+ FloatingText 渲染 + PetStatus 三段色 + RoamingPet 反馈接线回归
5. 文档：component-catalog（PetMenu/FloatingText/PetPage 描述）；docs-check 全绿
6. 全量验证：mvn test + pnpm verify + E2E 回归（pet.spec 扩展：喂食闭环 smoke）

回滚策略：UI 组件独立文件可整体还原；后端仅配置 + @Value，回滚无迁移。

## Open Questions
- PetMenu 商店 tab 与 PetPage 商店区的信息架构是否重复（两个入口展示同一列表）——倾向保留（入口场景不同），smoke 后按用户反馈收敛
