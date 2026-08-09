# Tasks: pet-vivid-polish

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无后端变更

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 N/A — 无后端变更

## 4. 应用层 (application/)
- [x] 4.1 N/A — 无后端变更

## 5. API 层 (api/)
- [x] 5.1 N/A — 无 API 变更

## 6. 契约同步
- [x] 6.1 N/A — 无契约变更

## 7. 前端 (frontend/src/)
- [ ] 7.1 `petStore.ts` — `PetAction` 联合类型扩展 `eat | stretch | yawn | scratch | look`（复用现有 `setAction(action, duration)` 自动回 idle）
- [ ] 7.2 `animations.ts` — 新增 keyframes：eat（低头 8° + 嘴部开合咀嚼 + 尾巴快摆）、stretch（伸懒腰 1.6s）、yawn（打哈欠 1.8s）、scratch（挠耳 1.2s）、look（东张西望 1.4s，均 `iteration-count: 1` + forwards）；walk 前倾 5°；眨眼过渡 `pet-blink-now`（50ms）
- [ ] 7.3 `OrangeCat.tsx` + `ShibaInu.tsx` — 新动作接入（动画元素类名 + 数据属性），eat 状态张嘴元素可复用现有嘴部 path
- [ ] 7.4 `FoodActionList.tsx` — 喂食/购买成功回调后 `setAction('eat', 1500)`
- [ ] 7.5 `SvgAvatar.tsx` — 情绪切换眨眼过渡（prevEmotion ref + 50ms 一次性眨眼后切表情）
- [ ] 7.6 `RoamingPet.tsx` — `idleVariantTimer` 改造为小动作调度器（8-18s 随机选 stretch/yawn/scratch/look，守卫：仅 idle 且非休息非格内）
- [ ] 7.7 更新 vitest — petStore（新 action 类型）、PetAvatar/SvgAvatar 渲染（eat/小动作 data-action）、FoodActionList（eat 触发）、RoamingPet（小动作调度）
- [ ] 7.8 E2E 更新 — `e2e/pet.spec.ts` 喂食闭环断言补充：喂食后出现 `data-action="eat"`

## 8. 文档同步
- [ ] 8.1 `docs/frontend/component-catalog.md` — SvgAvatar/PetAvatar/animations 描述更新（eat + 小动作 + 过渡）
- [ ] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 现有描述已核对仍准确（无表/模型变更）
- [ ] 8.3 `docs/api/overview.md` — 现有描述已核对仍准确（无端点变更）
- [ ] 8.4 `docs/architecture.md` + `CLAUDE.md` — 宠物表现层能力描述同步（动作维度扩展）
- [ ] 8.5 `README.md` — 现有描述已核对仍准确（版本/功能清单未变）
- [ ] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 N/A — 后端零改动（CI 覆盖）
- [ ] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [ ] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过（需先起前后端）
- [ ] 9.4 Smoke test — 启动前后端，浏览器手工验证：
  - [ ] 喂食/购买 → 宠物低头张嘴咀嚼 1.5s 后回 idle，吃完尾巴快摆
  - [ ] 宠物静止 8-18s → 随机出现伸懒腰/打哈欠/挠耳/张望（播放一次回 idle）
  - [ ] 摸头/喂食等情绪变化 → 眨眼过渡换脸（无闪帧）
  - [ ] 移动中身体前倾 5°（与步伐摆动叠加自然）
