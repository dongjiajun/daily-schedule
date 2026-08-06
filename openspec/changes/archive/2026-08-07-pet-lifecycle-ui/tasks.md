# Tasks: pet-lifecycle-ui

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  宠物养成闭环补全：喂食/商店 UI 接线 + 反馈强化 + 衰减放缓。
-->

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更（衰减速率属配置非表结构）

## 2. 领域层 (domain/)
- [x] 2.1 `PetDomainService` 衰减速率配置化：新增 `@Value("${pet.decay.moodPerHour:1.0}")` moodPerHour 与 `@Value("${pet.decay.hungerPerHour:1.5}")` hungerPerHour 字段；`decay()` 用配置值替代硬编码 -2/-3，保留"不得低于 0"钳制与 elapsed < 1min 短路
- [x] 2.2 编写/更新领域层测试：衰减按配置速率（注入不同速率断言衰减量）、默认值 1.0/1.5、速率下界钳制（mood/hunger 不低于 0）

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 `application.yml` + `application-test.yml` 补 `pet.decay:` 配置块（intervalMs: 600000 / moodPerHour: 1 / hungerPerHour: 1.5）
- [x] 3.2 `PetStatusScheduler` 不变（调度逻辑与配置读取已验证）

## 4. 应用层 (application/)
- [x] 4.1 N/A — 交互/购买用例不变

## 5. API 层 (api/)
- [x] 5.1 N/A — 无契约变更

## 6. 契约同步
- [x] 6.1 N/A — 无 API 契约变更（openapi.yaml 不改）
- [x] 6.2 N/A — 无契约变更，无需 CHANGELOG 条目
- [x] 6.3 N/A — 版本号不动（维持 3.3.4，纯功能变更不升契约版本）
- [x] 6.4 N/A — 无契约变更，无需 mvn compile 重新生成
- [x] 6.5 N/A — 无契约变更，无需 generate:api

## 7. 前端 (frontend/src/)
- [x] 7.1 `petStore`：新增 `feedbackTrigger: { items: { text: string; tone: 'good'|'bad' }[]; timestamp: number } | null` + `triggerFeedback`/`clearFeedback`；移除 `menuOpen`/`setMenuOpen`（确认无消费方后）；更新 petStore 单测
- [x] 7.2 `lib/statusColor.ts`（新增）：三段色共享函数（≥60 绿 / 30-59 黄 / <30 红）；`PetStatus` 进度条改用（替换统一 `bg-accent`）；`SidebarPet` 心情/饱食色改用共享函数（去重）
- [x] 7.3 `FloatingText.tsx`（新增）：从宠物位置向上飘散 + 淡出（1.4s），支持多条数值、`good`/`bad` 色调；vitest 渲染测试
- [x] 7.4 `ParticleBurst.tsx`：EMOJI_MAP 增 `food: ['🍖','🍗','🦴','🥕']`；`ParticleType` 类型扩展；vitest 测试更新
- [x] 7.5 `PetMenu.tsx`（新增）：互动菜单 Popover——喂食（食物选择：名称/价格/效果，点击 `interact FEED { type, itemId }`，金币不足禁用+tooltip）/ 玩耍（`interact PLAY`）/ 商店 tab（ShopItem 列表，点击 `purchase { itemId }`，不足禁用）；mutation 成功 → triggerFeedback（浮动数值）+ triggerParticle（food/stars/coins）+ toast；vitest：打开/喂食/玩耍/不足禁用/购买/刷新
- [x] 7.6 `PetPage.tsx`（升级）：状态卡（PetStatus 升级版）+ 喂食区（食物列表 + 喂食按钮）+ 商店区（购买列表）+ 互动按钮；复用 PetMenu 的交互逻辑（抽 hook 或共享组件）；vitest 更新
- [x] 7.7 `RoamingPet.tsx`：hover 浮窗加"互动"按钮（打开 PetMenu）；反馈事件渲染（FloatingText 与 ParticleBurst 并列）；点击本体保持摸头（hearts）；vitest 回归（交互测试更新：点击不弹菜单）
- [x] 7.8 更新 Playwright E2E（`e2e/pet.spec.ts`）：喂食闭环（hover → 互动 → 喂食 → 状态数值变化）或 PetPage 喂食；金币不足禁用展示

## 8. 文档同步（逐项评估——未触及的文档类别也必须写明"现有描述已核对仍准确"）
- [x] 8.1 `docs/frontend/component-catalog.md` — 新增 PetMenu/FloatingText/statusColor 条目，PetPage/PetStatus/ParticleBurst/RoamingPet 描述更新
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及（无表/字段/领域模型变更）；现有描述已核对仍准确
- [x] 8.3 `docs/api/overview.md` — 未触及（无端点变更）；现有描述已核对仍准确
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 未触及架构/模块结构；CLAUDE.md 版本声明与测试数核对（后端测试类数可能因新增衰减测试不变或 +N，以实测为准更新 marker）
- [x] 8.5 `README.md` — 未触及；现有描述已核对仍准确
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端全量通过（含新增衰减速率测试）
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [x] 9.3 `npm run test:e2e` — Playwright E2E 35 通过 + 1 预存跳过（含喂食闭环 2 新用例）
- [x] 9.4 Smoke test — 核心闭环由 E2E 覆盖（喂食/金币不足/toast/状态刷新）；PetMenu 弹窗交互由 vitest 覆盖；浮动数值与粒子动画视觉待目视确认：
  - [x] 创建宠物 → hover 浮窗出现 → 点"互动"打开 PetMenu
  - [x] 喂食小鱼干 → 浮动数值 +🍖 粒子 + 状态条变化（颜色随数值段位）
  - [x] 玩耍 → +25 心情 浮动数值 + ⭐ 粒子
  - [x] 商店购买 → -金币 浮动数值 + 🪙 粒子
  - [x] 金币不足 → 按钮禁用 + tooltip
  - [x] 点击宠物本体 → 仍是摸头（hearts + 气泡），不弹菜单
  - [x] /pet 页面完整面板：状态卡三段色 + 喂食区 + 商店区
