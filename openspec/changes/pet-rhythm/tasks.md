# Tasks: pet-rhythm

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

## 7. 前端 (frontend/src/ + packages/shared)
- [ ] 7.1 `roaming.ts` — `determineMode` 增加 `hour` 输入与 `period` 输出（night ≥23 或 <5 / morning 7-9 / afternoon 12-14 / daytime），纯函数化（clock injection）
- [ ] 7.2 更新 `roaming.test.ts` — 时段边界（22/23/5/7/9/12/14）+ period 输出断言
- [ ] 7.3 `RoamingPet.tsx` 节律接线：
  - 夜间（≥23 且未休息）→ 复用回窝路径立即进窝（不原地硬切）
  - 早晨（7-9 且睡眠中，每日一次）→ `wakeUp` + 气泡"早上好~ ☀️"（`lastMorningGreetRef` 日期守卫）
  - 午后（12-14，~5% 概率）→ 小憩 `rest` 90s（`smallNapUntilRef`）
  - 深夜未睡（≥23 未休息，~10% 概率，冷却 10 分钟）→ `yawn` 1.8s + 气泡"夜深啦，该睡觉了~ 😴"（`yawnCooldownRef`）
- [ ] 7.4 更新 `RoamingPet.test.tsx` — 夜间回窝/早晨唤醒/小憩/打哈欠接线（fake Date 或注入 hour）
- [ ] 7.5 重建 shared dist（`pnpm --filter @daily-schedule/shared run build`）
- [ ] 7.6 E2E 核对 — `e2e/pet.spec.ts` 既有场景保持通过；节律行为强依赖真实时间，由 9.4 smoke（Playwright clock 注入）验证

## 8. 文档同步
- [ ] 8.1 `docs/frontend/component-catalog.md` — RoamingPet 描述更新（昼夜节律接线）
- [ ] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 现有描述已核对仍准确（无表/模型变更）
- [ ] 8.3 `docs/api/overview.md` — 现有描述已核对仍准确（无端点变更）
- [ ] 8.4 `docs/architecture.md` + `CLAUDE.md` — 宠物行为能力描述同步（作息节律）
- [ ] 8.5 `README.md` — 现有描述已核对仍准确（版本/功能清单未变）
- [ ] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 N/A — 后端零改动（CI 覆盖）
- [ ] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [ ] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过（需先起前后端）
- [ ] 9.4 Smoke test — 启动前后端，浏览器手工验证（Playwright `page.clock` 注入时间或临时改系统时间）：
  - [ ] 时钟拨到 23:30 → 宠物走向小窝进窝睡觉（蜷缩 + Zzz），不再原地硬切
  - [ ] 时钟拨到 8:00 → 睡着的宠物醒来 + "早上好~ ☀️"气泡（当日不重复）
  - [ ] 时钟拨到 13:00 → 宠物偶尔小憩（rest 动作，90s 后恢复游走）
  - [ ] 时钟拨到 23:30 且未睡 → 打哈欠 + "夜深啦"气泡（不强制回窝）
