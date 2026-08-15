# Proposal: 宠物装扮装备语义 + SVG 分层 + 节日配饰

## Why
装扮系统半实现：`pets.current_accessory` 字段存在但从未写入，`purchase(ACCESSORY)` 走"即时消费加数值"路径（线4 #2）；`themeMapping.ts` 声明了 11 个节日 petAccessory 名称但全库零消费（线4 #3）。M2.4 换装功能没有可用的装备底座。同时 `PetApplicationService.purchase` 手工钳制 mood/hunger（线1 O8 重复域逻辑）。

## What Changes
- 后端 purchase 语义分流：FOOD 即时消费（效果即时应用），ACCESSORY 购买即装备（写入 `pets.current_accessory`，覆盖旧装备，quantity 固定 1）
- 钳制逻辑移入 domain（吸收线1 O8）：`PetDomainService.purchase(Pet, ShopItem, quantity)` 产出 `InteractionResult`，复用 `Pet.applyInteraction()` 钳制/等级链路，删除应用层手工 `Math.min`/`setCoins` 重复
- V8 迁移：种子 11 个 ACCESSORY 物品，名称与 `themeMapping.petAccessory` 逐一对齐（年兽皮肤/麋鹿角/巫师帽/玉兔皮肤/粽子背包/新年帽/火鸡帽/绿帽子/樱花发饰/印度象皮肤/兔耳朵）
- 新增取下端点 `DELETE /pets/me/accessory`（置 NULL，204）
- `PurchaseResult` 新增可选 `equippedAccessoryId` 字段（装备购买回传），版本 v3.4.0 → **v3.5.0**
- 前端装扮渲染层：`AccessoryOverlay` 组件（帽子/角/耳/背包四类 SVG 叠加层 + 皮肤三类 CSS filter）；`SvgAvatar` 增加 `accessory` prop（PetAvatar/RoamingPet/PetPage/SidebarPet 全场景生效）
- 商店 UI：ACCESSORY 物品显示"装备"操作（购买即装备 + toast），已装备物品标记，PetPage 增加"取下"按钮

## Capabilities

### New Capabilities
- `pet-accessory-equip`: 装备语义（购买即装备/覆盖/取下）、装扮渲染层（叠加层 + 皮肤滤镜）、节日配饰种子与商店呈现

### Modified Capabilities
- `pet-shop`: 购买语义按物品类型分流（FOOD 即时消费 / ACCESSORY 装备）；商店物品列表覆盖两类物品
- `pet-avatar`: SvgAvatar 增加装扮层渲染能力

## API Contract Impact
- **新增端点**：`DELETE /pets/me/accessory`（取下当前配饰，204）
- **修改 schema**：`PurchaseResult` 新增可选 `equippedAccessoryId`（integer/int64，仅装备购买时回传）——向后兼容
- `specs/openapi.yaml` version: v3.4.0 → **v3.5.0**（新增可选字段 + 新端点，非 BREAKING）
- `specs/CHANGELOG.md` 记录

## DDD Layer Impact
- **API 层**：`PetController` 实现 `unequipAccessory`；`PetAssembler` 增补 equippedAccessoryId 转换
- **应用层**：`PetApplicationService.purchase` 语义分流 + 手工钳制移除；新增 `unequip()`
- **领域层**：`PetDomainService.purchase()` 新增
- **基础设施层**：V8 种子迁移（无新表）

## Database Impact
- **需要新 Flyway 迁移**：`V8__seed_pet_accessories.sql` — 仅 INSERT 种子数据（11 个 ACCESSORY 物品，不改变表结构）
- `schema-h2.sql` 同步种子数据

## Impact
- **后端**：`application/pet/PetApplicationService.java`、`domain/pet/PetDomainService.java`、`api/controller/PetController.java`、`api/assembler/PetAssembler.java`；测试更新 `PetApplicationServiceTest`、`PetControllerTest`
- **前端**：`modules/pet/components/`（新增 AccessoryOverlay、SvgAvatar/PetAvatar/SidebarPet/PetPage/FoodActionList 修改）、`modules/pet/hooks/usePet.ts`；SDK 重新生成
- **文档**：`docs/database/schema.md`（种子物品）、`docs/api/overview.md`、`docs/uml/README.md`、`docs/frontend/component-catalog.md`、`docs/architecture.md`、`CLAUDE.md`、`README.md`
- **版本号**：三处同步 v3.5.0
- **明确不做**：节日自动穿戴（需物品持有/库存概念，M2.4 决定）；皮肤为 CSS filter 近似（非逐图层重绘，M2.4 需要时再升级）
