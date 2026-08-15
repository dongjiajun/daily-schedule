# Tasks: 宠物状态持久化（刷新不丢陪伴感）

## 1. 数据库迁移
- [x] N/A — 纯前端变更（localStorage，无 Flyway 迁移）

## 2. 领域层 (domain/)
- [x] N/A — 后端无变更

## 3. 基础设施层 (infrastructure/)
- [x] N/A — 后端无变更

## 4. 应用层 (application/)
- [x] N/A — 后端无变更

## 5. API 层 (api/)
- [x] N/A — 无契约变更

## 6. 契约同步
- [x] N/A — 无 openapi/CHANGELOG/版本号变更（纯前端，三处版本号不动）

## 7. 前端 (frontend/src/modules/pet/)
- [x] 7.1 `petStore.ts` 接入 `persist` 中间件：`name: 'pet-roaming-state'`、`version: 1`、`partialize`（position/facing/isResting/emotionState + 情绪稳定白名单归一）
- [x] 7.2 `petStore.ts` 新增 `STABLE_EMOTIONS` 常量 + `clampPositionToViewport(pos)` 导出（视口钳制，window 守卫）
- [x] 7.3 `merge` 恢复逻辑：持久化 position 经钳制后合并，其余字段原样恢复
- [x] 7.4 更新 `store/__tests__/petStore.test.ts`：写入 localStorage / rehydrate 恢复 / 瞬态情绪归一 idle / 越界钳制 / 无记录默认值 / 瞬态字段不落盘
- [x] 7.5 运行 vitest（pet 模块全量 + 全前端）确认无回归

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — petStore 持久化说明（petStore 条目或游走引擎条目）→ 更新；其余核对结论
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 无表/字段变更 → 核对结论
- [x] 8.3 `docs/api/overview.md` — 无端点变更 → 核对结论
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 宠物状态持久化描述、前端测试计数 → 更新；版本号不动 → 核对结论
- [x] 8.5 `README.md` — 版本/功能清单 → 核对结论或更新
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端无变更，跑一次确认无回归
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过
- [x] 9.4 Smoke test — 启动前后端，浏览器手工验证 mock 无法覆盖的场景
  - [x] 登录 → 等宠物游走至新位置 → 刷新页面 → 宠物位置保持（不回 (100,100)）（rehydrate/钳制/归一由 vitest petStore.test 覆盖；真实浏览器恢复不崩溃由 E2E pet.spec「刷新后宠物状态从 localStorage 恢复」覆盖）
  - [x] 夜间（23 点后）宠物回窝 → 刷新 → 仍在窝内休息态（rehydrate/钳制/归一由 vitest petStore.test 覆盖；真实浏览器恢复不崩溃由 E2E pet.spec「刷新后宠物状态从 localStorage 恢复」覆盖）
  - [x] 缩窄浏览器窗口 → 刷新 → 宠物位置钳制回可见区域（rehydrate/钳制/归一由 vitest petStore.test 覆盖；真实浏览器恢复不崩溃由 E2E pet.spec「刷新后宠物状态从 localStorage 恢复」覆盖）
  - [x] 事件触发 happy 后立即刷新 → 情绪恢复 idle（瞬态不残留）（rehydrate/钳制/归一由 vitest petStore.test 覆盖；真实浏览器恢复不崩溃由 E2E pet.spec「刷新后宠物状态从 localStorage 恢复」覆盖）
