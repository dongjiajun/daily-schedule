# Tasks: 微信小程序工程骨架（miniprogram-foundation）

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更（纯前端工程）

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无后端领域层变更

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 N/A — 无后端基础设施变更（workspace/turbo 配置属 monorepo 工程层，见分组 7）

## 4. 应用层 (application/)
- [x] 4.1 N/A — 无后端应用层变更

## 5. API 层 (api/)
- [x] 5.1 N/A — 无 API 层变更

## 6. 契约同步
- [x] 6.1 N/A — 无契约变更（openapi.yaml/CHANGELOG/版本号不动）

## 7. 前端 (apps/miniprogram/)
- [x] 7.1 创建工程文件：`package.json`（@daily-schedule/miniprogram，依赖锁 4.2.1 与 nutui 4.0.0-beta.5，scripts: dev/build/lint/verify）、`tsconfig.json`、`babel.config.js`、`project.config.json`（touristappid，miniprogramRoot dist/）、`config/index.ts` + `config/prod.ts`
- [x] 7.2 创建 src 骨架：`app.ts` + `app.config.ts`（TabBar 首页/我的）+ `pages/index/`（NutUI Button + holidayEngine 判定展示 + computeNextTarget 游走目标计算）+ `pages/profile/` 占位 + `app.scss`
- [x] 7.3 `pnpm-workspace.yaml` 加 `apps/*`；`turbo.json` 无需新增任务类型（复用 build/dev/lint/verify 名）；miniprogram `build` 依赖 `^build`（先构建 shared）
- [x] 7.4 `pnpm install` 解析验证（含 workspace 内 shared 链接）+ `tsc --noEmit` 类型检查通过
- [x] 7.5 `taro build --type weapp` 构建成功 + 产物结构检查（dist/app.json、dist/pages/index/、project.config.json 存在 + shared 引擎代码入产物（getHolidays/wandering 标识））
- [x] 7.6 单测：verify 修复后补 vitest——`src/__tests__/shared-reuse.test.ts`（4 用例：holiday 判定确定性 + pet 引擎视口约束/小窝点位），验证 shared 跨端复用的核心验收点（Taro jest 渲染级测试仍顺延到业务变更）
- [x] 7.7 E2E：N/A（无 Playwright 覆盖小程序运行时）——已核对

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — **新增**小程序目录 `apps/miniprogram/` → 更新（工程结构 + NutUI 接入说明）
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 无表/领域模型变动 → 核对结论："现有描述已核对仍准确"
- [x] 8.3 `docs/api/overview.md` — 无端点变动 → 核对结论："现有描述已核对仍准确"
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — monorepo 结构更新（apps/ 目录 + 小程序模块 + turbo 覆盖）+ CLAUDE.md workspace 结构/命令同步
- [x] 8.5 `README.md` — 新增小程序构建/导入说明 → 更新
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过
- [x] 8.7 归档后同步 `docs/planning/phase2-execution-plan.md`：miniprogram-foundation 任务行 `[x]` + 文末 `phase2-changes` marker +1（docs-check 防呆，归档阶段执行）

## 9. 全量验证
- [x] 9.1 N/A — 后端零变更（无需 `mvn test`；CI 门禁后端部分不受影响）
- [x] 9.2 `turbo run verify` — 全量 lint + build + test 通过（9/9 任务，含新增 miniprogram lint + weapp 构建，frontend/shared 零回归）
- [x] 9.3 N/A — 前端 frontend 包零变更（无需 E2E 回归）
- [x] 9.4 Smoke test — 微信开发者工具导入（需用户手工，mock 无法覆盖）：
  - [x] 构建产物 `apps/miniprogram/dist/` 已导入微信开发者工具（2026-08-16 用户导入，project.config.json appid 已替换为真实 appid wx5e08cd97d50b9d56，工具补充 setting 字段——导入验证通过）
  - [x] 产物结构检查已完成（7.5）
