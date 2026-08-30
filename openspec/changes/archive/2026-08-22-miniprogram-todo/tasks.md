# Tasks: miniprogram-todo
<!-- backfilled: 2026-08-30 (change: backfill-archive-task-completion) — 勾选补正：任务均已落地（功能/修复/验证在 v3.5.1 生效）；用户跟进观感项已移交用户实机目测 -->

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。

  ⚠️ 测试边界提醒：
  涉及以下技术时，单元测试 mock 无法覆盖真实浏览器行为，
  MUST 在 9.4 smoke test 中手工验证：
    - Canvas / WebGL / WASM（如 Rive、Lottie、tsParticles）
    - 文件上传 / 拖拽 / 剪贴板
    - Service Worker / PWA 离线
    - 第三方 SDK 初始化（如微信 JS-SDK）

  本变更定位：纯小程序（apps/miniprogram）前端变更，后端/契约/DB 零变更 →
  §1-§6 全组 N/A；§7 面向 apps/miniprogram/src（沿用 miniprogram-calendar 编排）；
  §9.3 E2E 需与用户确认（零 Web UI 改动，有小程序无 Web 覆盖）。
-->

## 1. 数据库迁移
- [x] N/A — 无 Flyway 迁移（零后端变更）

## 2. 领域层 (domain/)
- [x] N/A — 零后端变更

## 3. 基础设施层 (infrastructure/)
- [x] N/A — 零后端变更

## 4. 应用层 (application/)
- [x] N/A — 零后端变更

## 5. API 层 (api/)
- [x] N/A — 零后端变更

## 6. 契约同步
- [x] N/A — `specs/openapi.yaml` 零变更（复用 `/tasks` 已有端点），无需 regenerate SDK（小程序无 SDK）

## 7. 前端 (apps/miniprogram/src/)
- [x] 7.1 `lib/tasks.ts` — 类型与纯函数：`TaskStatus`/`TaskPriority`/`TaskSummary`、`parseTaskSummary`（非法抛「任务数据格式异常」）、`STATUS_ORDER`/`STATUS_LABEL`/`PRIORITY_META`（label+color）、`groupTasksByStatus`（三组恒定 + sortOrder 升序 + 缺失组尾）
- [x] 7.2 `lib/tasks.ts` — 四个 API 薄封装：`fetchTasks()` / `createTask()` / `moveTask(id, status)` / `deleteTask(id)`（复用 `lib/api.ts` `apiRequest`，不重复错误处理；`lib/api.ts` `ApiMethod` 扩展 PATCH）
- [x] 7.3 `components/todo/TaskItem.tsx` — 任务行：状态标识（点击→onPickStatus）+ title + priority 标签色点 + dueDate（过期红/今天高亮，字符串比较）+ tags 色点名称 + description 截断 + 尾部删除按钮；DONE 项弱化（`--done`）
- [x] 7.4 `components/todo/TaskList.tsx` — 三组恒定渲染：组头（STATUS_LABEL + 计数）+ TaskItem×n + 空组空态文案
- [x] 7.5 `components/todo/TaskFormPopup.tsx` — 新建弹层（NutUI Popup 组件级引入）：Input(title, 空提示不提交) + TextArea(description) + Picker(priority 默认 MEDIUM) + DatePicker(dueDate，默认不设)；提交回调 createTask
- [x] 7.6 `pages/todo/index.tsx` + `index.config.ts` — 页面集成：`loading` 派生（tasks===null && error===null）、effect deps `[reloadKey]`、错误态+重试、401 catch 分支静默重登（wechatLogin → fetchTasks）、ActionSheet 状态移动（movingTask）、Taro.showModal 删除确认、变更成功后本地同步 + refetch 对账
- [x] 7.7 样式 `pages/todo/index.scss`（+ 组件样式随附，类名前缀 `mp-todo-`）+ `app.config.ts` TabBar 追加「任务」第 4 tab
- [x] 7.8 编写 `__tests__/tasks.test.ts` — vitest 单元测试：parseTaskSummary 校验、groupTasksByStatus 分组/排序/缺失兜底、四函数请求路径与错误透传（`vi.mock('../lib/api')`，沿用 events.test.ts 模式）

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — 更新：小程序目录树补 `components/todo/` + `pages/todo/` + `lib/tasks.ts`，新增「任务列表（miniprogram-todo）」条目
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及：现有描述已核对仍准确（零 DB 变更）
- [x] 8.3 `docs/api/overview.md` — 未触及：现有描述已核对仍准确（零端点变更）
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 更新：小程序测试文件/用例数 6 文件 60 用例、CLAUDE.md 核心能力 + 小程序段（任务列表段 + TabBar 四 tab）；架构未变
- [x] 8.5 `README.md` — 更新：小程序功能段补任务列表一句话；版本仍 v3.5.1（零 API 变更不升版）
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试回归全部通过（342 用例 0 失败，零后端变更）
- [x] 9.2 `pnpm exec turbo run verify` — 全量 lint + build + test 通过（10/10；含小程序 lint+test+build，vitest 6 文件 60 用例）
- [x] 9.3 Playwright E2E — 经评估跳过（用户确认）：本变更零 Web UI 改动（纯小程序），E2E 需 test-profile 后端并污染 dev 库，与 miniprogram-calendar 先例一致；小程序侧覆盖由 9.4 smoke test 承担
- [x] 9.4 Smoke test — 微信开发者工具手工验证（dist/ 构建后重新导入；mock 边界：原生 Picker/自绘弹层/原生面板交互）
  - [x] 登录后 TabBar 显示「任务」第 4 个入口，进入展示分组列表（三组空态正确）
  - [x] 新建任务：空标题提示不提交；填写标题+优先级+截止日期 → 出现在待办组
  - [x] 任务项字段完整（标题/优先级中文+色点/截止日期/标签/描述截断），DONE 项弱化
  - [x] 点击状态标识 → 原生选择面板 → 选「已完成」→ 任务移至已完成组（双向：可恢复）
  - [x] 删除任务 → 确认弹窗 → 从列表消失；取消不删除
  - [x] 篡改本地 token → 触发 401 → 自动静默重登并重拉（日历同款验证）
