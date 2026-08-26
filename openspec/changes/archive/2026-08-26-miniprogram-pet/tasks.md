# Tasks: miniprogram-pet

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  本变更零后端变更：复用既有 /pets/me 系列端点（PetController 已交付），
  仅小程序前端 + 文档。1-6 组标记 N/A。
-->

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无领域变更（后端零变更）

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 N/A — 无基础设施变更

## 4. 应用层 (application/)
- [x] 4.1 N/A — 无应用层变更

## 5. API 层 (api/)
- [x] 5.1 N/A — 无 API 层变更（复用既有端点）

## 6. 契约同步
- [x] 6.1 N/A — specs/openapi.yaml 无变更（存根：`GET /pets/me`、`POST /pets/me`、`POST /pets/me/interact` 均为既有契约，字段核对无漂移）
- [x] 6.2 N/A — specs/CHANGELOG.md 无新增 API 变更
- [x] 6.3 N/A — 版本号三处一致，无变更
- [x] 6.4 N/A — 后端接口无需重新生成
- [x] 6.5 N/A — 前端 SDK 无需重新生成（小程序 lib 手动封装，不经 @hey-api 生成器）

## 7. 前端 (apps/miniprogram/src/)
- [x] 7.1 `lib/pet.ts` — PetProfile/InteractionResult 类型 + `parsePetProfile` 响应校验（非法字段抛「宠物数据格式异常」）+ 数值换算纯函数（心情/饥饿 → 标签 + 条宽比例 clamp）+ `fetchMyPet()`（200 返回宠物 / 404 返回 null）/ `createPet(input)` / `interactWithPet(type)` 封装（复用 `lib/api.ts` apiRequest）
- [x] 7.2 组件开发（components/pet/）— `PetAvatar.tsx`（emoji 形象 + 颜色圈底 + 弹跳 class）/ `PetStatus.tsx`（等级/经验条/心情条/饥饿条/金币）/ `PetInteractBar.tsx`（喂食/玩耍按钮 + 互动中置忙）/ `PetCreateForm.tsx`（物种二选一 chips + 命名 + 提交 + 空名提示）
- [x] 7.3 页面集成 — `pages/pet/index.tsx`（数据三态舵手：加载/展示/创建引导/错误重试 + 401 静默重登 + 游走循环宿主（setTimeout 链 + onHide/onUnload 清理）+ 互动编排（本地同步 InteractionResult + refetch 对账））+ `app.config.ts` tabBar 新增「宠物」第 5 入口（任务/我的之间）
- [x] 7.4 样式与动画 — `pages/pet/index.scss` 且 tsx 中 `import './index.scss'`（防 wxss 404）：游走容器 + 宠物绝对定位过渡、状态条、弹跳/反馈动画（互动成功浮动数值）、创建表单样式
- [x] 7.5 编写 vitest 单元测试 — `__tests__/pet.test.ts`（对齐 tasks.test.ts 模式：parsePetProfile 校验 / 换算纯函数 / fetchMyPet 404→null + 错误透传 / createPet / interactWithPet 请求路径与 body）；组件无渲染级测试（小程序渲染测试基础设施待后续引入，同 todo 结论）
- [x] 7.6 N/A — Playwright E2E 不适用（小程序 target，无 `e2e/*.spec.ts`；Web 端 E2E 不受本变更影响——后端零变更）
- [x] 7.7 N/A — 同 7.6（小程序 E2E 缺失为既定结论，随 9.4 smoke 覆盖）

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — 更新：目录树补 `pages/pet/` + `components/pet/*` + `lib/pet.ts`，新增「小程序宠物互动」bullet（含 emoji 形象与游走动画方案要点）
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及：零后端变更，现有表/字段/领域模型描述已核对仍准确
- [x] 8.3 `docs/api/overview.md` — 未触及：复用既有端点，契约描述已核对仍准确
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 更新：小程序测试规模（6→7 文件、60→N 用例）、小程序模块列表加宠物互动、CLAUDE.md 核心能力段加「宠物互动」文案
- [x] 8.5 `README.md` — 更新：小程序段加宠物互动说明
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过（含 specs-count / phase2-changes / 测试计数 marker）

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端 342 用例回归通过（零变更确认）
- [x] 9.2 `turbo run verify`（或 `cd apps/miniprogram && pnpm run verify`）— 小程序 lint + tsc + build + vitest 全部通过
- [x] 9.3 E2E — 经评估跳过（小程序定位，miniprogram-calendar/todo 同惯例，用户确认后记录）
- [x] 9.4 Smoke test — 微信开发者工具手工验证（需先 `cd apps/miniprogram && pnpm run build` 导入 dist/，注意清缓存→清除全部缓存→编译）：
  - [ ] 无宠物 → 宠物页展示创建引导 → 选物种/命名 → 创建成功进入展示态
  - [ ] 宠物游走动画：wandering 目标驱动 + 平滑移动 + 视口内不越界
  - [ ] 喂食/玩耍 → 反馈动画 + 数值变化（+情绪/饥饿/经验）+ 互动中按钮置忙
  - [ ] 互动失败/网络断开 → 错误提示，状态保持原值
  - [ ] 401 静默重登：token 失效后操作自动无感重登并重拉
  - [ ] TabBar 5 入口：首页/日历/任务/宠物/我的 可切换，宠物页入口正常
