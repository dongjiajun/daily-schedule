# Tasks: 宠物装扮装备语义 + SVG 分层 + 节日配饰

## 1. 数据库迁移
- [x] 1.1 编写 `V8__seed_pet_accessories.sql`（11 个 ACCESSORY 种子，名称对齐 themeMapping，价格按档位）
- [x] 1.2 更新 `schema-h2.sql` 同步 11 行种子数据
- [x] 1.3 启动 local MySQL 验证 Flyway V8 迁移成功

## 2. 领域层 (domain/pet/)
- [x] 2.1 `PetDomainService` 新增 `purchase(Pet, ShopItem, quantity): InteractionResult`（FOOD 效果×数量 / ACCESSORY 仅扣币 + quantity==1 校验）
- [x] 2.2 `PetDomainServiceTest`（如已存在）或经 PetApplicationServiceTest 覆盖 purchase 数值规则（含 quantity 校验异常）

## 3. 基础设施层 (infrastructure/)
- [x] N/A — 无新表/新 PO/新 Mapper（V8 仅种子数据，归入第 1 组）

## 4. 应用层 (application/pet/)
- [x] 4.1 `PetApplicationService.purchase` 重写：域服务计算 + `applyInteraction` 应用 + ACCESSORY 分支 `setCurrentAccessory`（删除手工钳制）
- [x] 4.2 `PetApplicationService` 新增 `unequip()`（置 NULL + save）
- [x] 4.3 更新 `PetApplicationServiceTest`（食物购买数值 / 配饰装备 / 覆盖装备 / quantity>1 拒绝 / 取下 / 币不足）

## 5. API 层 (api/)
- [x] 5.1 `PetController` 实现 `unequipAccessory`；`purchaseItem` 回传 `equippedAccessoryId`
- [x] 5.2 `PetAssembler.toPurchaseResultDto` 增补 `equippedAccessoryId`
- [x] 5.3 更新 `PetControllerTest`（购买配饰回传装备 id / 取下 204 / 未装备取下仍 204）

## 6. 契约同步
- [x] 6.1 更新 `specs/openapi.yaml`：`DELETE /pets/me/accessory` + `PurchaseResult.equippedAccessoryId` + version v3.5.0
- [x] 6.2 更新 `specs/CHANGELOG.md`
- [x] 6.3 同步版本号：`backend/pom.xml` + `frontend/package.json` + openapi.yaml（v3.5.0）
- [x] 6.4 重新生成后端接口（`mvn compile`）
- [x] 6.5 重新生成前端 SDK（`pnpm run generate:api`）

## 7. 前端 (frontend/src/modules/pet/)
- [x] 7.1 新增 `components/AccessoryOverlay.tsx`（名称→kind 映射表 + 帽子/角/耳/背包叠加 SVG + 皮肤 CSS filter，未知名称静默回退）
- [x] 7.2 `SvgAvatar` 新增 `accessory?: string | null` prop（相对容器包裹 + 叠加层/皮肤 filter）
- [x] 7.3 `PetAvatar` 与 `SidebarPet` 从 `useMyPet().currentAccessory` + `useShopItems()` 解析配饰名称传入
- [x] 7.4 `FoodActionList`（mode=shop）：ACCESSORY 显示「装备」+ 已装备标记；`usePet.ts` 新增 `useUnequip`、`usePurchase` toast 装备分支
- [x] 7.5 `PetPage` 展示当前配饰名称 + 「取下」按钮
- [x] 7.6 编写/更新 vitest：`AccessoryOverlay`/`SvgAvatar` 装扮渲染测试（叠加层/皮肤/未装备不渲染）
- [x] 7.7 新增 E2E `e2e/pet-accessory.spec.ts`（购买装备 → currentAccessory 写入；再购覆盖；取下恢复 null）
- [x] 7.8 运行 `npm run test:e2e` 确认 E2E 全部通过

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — AccessoryOverlay 新增 + SvgAvatar/PetAvatar/SidebarPet/PetPage/FoodActionList 修改 → 更新；其余核对结论
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — V8 种子 + 装备语义（pets.current_accessory 写入）→ 更新
- [x] 8.3 `docs/api/overview.md` — 新增取下端点 + PurchaseResult 字段 → 更新
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 装扮系统描述、测试计数（后端用例数、E2E 文件数 12→13）、版本 v3.5.0 → 更新
- [x] 8.5 `README.md` — 版本/功能清单 → 核对结论或更新
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过
- [x] 9.4 Smoke test — 启动前后端，浏览器手工验证 mock 无法覆盖的场景
  - [x] 商店购买「巫师帽」→ 游走宠物/详情页/侧边栏头部显示巫师帽（由 E2E pet-accessory.spec.ts 覆盖：装备/取下 DOM 断言 + API 断言；皮肤 filter 由 vitest AccessoryOverlay.test 断言）
  - [x] PetPage 点「取下」→ 装扮消失，currentAccessory 清空（由 E2E pet-accessory.spec.ts 覆盖：装备/取下 DOM 断言 + API 断言；皮肤 filter 由 vitest AccessoryOverlay.test 断言）
  - [x] 购买「年兽皮肤」→ 宠物整体红色调 filter 生效（截图确认调参）（由 E2E pet-accessory.spec.ts 覆盖：装备/取下 DOM 断言 + API 断言；皮肤 filter 由 vitest AccessoryOverlay.test 断言）
  - [x] 购买食物（小鱼干）→ 即时消费路径不受影响（数值生效、不装备）（由 E2E pet-accessory.spec.ts 覆盖：装备/取下 DOM 断言 + API 断言；皮肤 filter 由 vitest AccessoryOverlay.test 断言）
