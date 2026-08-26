# Tasks: 小程序日历月视图（miniprogram-calendar）

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。

  ⚠️ 测试边界提醒：
  本变更主体是小程序端（Taro 运行时 + 微信开发者工具），vitest 只能覆盖纯函数与 mock 行为，
  Taro 渲染/微信运行时行为 MUST 在 9.4 smoke test 中手工验证。
-->

## 1. 数据库迁移
- [x] N/A — 后端与数据库零变更（design 定案：无新表/新列/新迁移）

## 2. 领域层 (domain/)
- [x] N/A — 后端零变更

## 3. 基础设施层 (infrastructure/)
- [x] N/A — 后端零变更

## 4. 应用层 (application/)
- [x] N/A — 后端零变更

## 5. API 层 (api/)
- [x] N/A — 复用现有 `GET /api/v1/events`，无新端点/无实现变更

## 6. 契约同步
- [x] N/A — `specs/openapi.yaml` / `specs/CHANGELOG.md` / 三处版本号均无变更（纯小程序前端）

## 7. 小程序前端 (apps/miniprogram/src/)
- [x] 7.1 `lib/config.ts` — `API_BASE_URL` 单一来源（从 `lib/auth.ts` 迁出，保留 TODO(domain) 注释）；`lib/auth.ts` 引用改向 config
- [x] 7.2 `lib/calendar-date.ts` — 纯函数：`buildMonthGrid(year, month)`（42 格含跨月补位）、`monthRange(grid)`（首格 00:00 → 末格次日 00:00）、`dateKey`、`formatMonthTitle`、`formatTime`（字符串切片方案，不对后端日期串 `new Date()`）
- [x] 7.3 `lib/api.ts` — Taro.request 封装：Bearer 注入、`statusCode >= 400` 抛后端 `message`、401 → 清除 `STORAGE_KEYS` 三项 + 抛 `UnauthorizedError`
- [x] 7.4 `lib/events.ts` — `fetchMonthEvents(start, end)`（`size=100&page=1`）+ `EventSummary` 类型（id/title/startTime/endTime/allDay/color/categoryName）+ 响应数组校验
- [x] 7.5 `components/calendar/MonthGrid.tsx` — 42 格月网格：补位弱化 / 今天高亮 / 选中态 / 事件色点（每格 ≤3 个 + 「+n」）
- [x] 7.6 `components/calendar/EventDayList.tsx` — 选中日事件列表：startTime 升序 / 全天显示「全天」/ HH:mm / 色点 / 分类名；只读 + 空态文案
- [x] 7.7 `pages/calendar/index.tsx` + `index.config.ts` + `index.scss` — 页面编排（月份游标 / 选中日期键 / loading/error 态 / 401 静默重登重拉 / 手动重试）；`app.config.ts` 注册页面 + TabBar 插入「日历」
- [x] 7.8 vitest 单测：`calendar-date.test.ts`（月网格/范围/日期键全分支）、`events.test.ts`（响应解析/错误上抛）、`api.test.ts`（Bearer 注入/401 清态/错误映射，mock Taro.request）——5 文件 40 用例全绿
- [x] 7.9 运行 miniprogram `pnpm run verify`（lint + vitest + taro build）通过

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — 小程序目录树新增 `pages/calendar/`、`components/calendar/`、`lib/{config,api,events,calendar-date}.ts`，补日历页说明；现有登录说明核对保持准确
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 无表/字段变更：现有描述已核对仍准确（V1-V10 迁移、user.openid 等均未触及）
- [x] 8.3 `docs/api/overview.md` — 无端点/契约变更：现有描述已核对仍准确（复用 GET /events，未新增/修改任何端点）
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 小程序模块章节补日历页与组件；小程序测试规模数字更新（2 文件 10 用例 → 5 文件 40 用例）
- [x] 8.5 `README.md` — 小程序功能清单补日历月视图（无版本号变更）
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端零变更，342 用例全绿（首次运行 62 个 ApplicationContext 加载错误为与 spring-boot:run 并发编译冲突，串行重跑确认非代码问题）
- [x] 9.2 `cd frontend && pnpm run verify` — turbo run verify（shared + frontend + miniprogram）exit 0 全绿
- [x] 9.3 `cd frontend && npm run test:e2e` — 经评估跳过（用户确认）：本变更零 Web UI 改动，回归风险为零；8080 被 dev 后端占用，不污染 dev 库
- [x] 9.4 Smoke test — 微信开发者工具手工验证（Taro 运行时 + 真实后端，mock 无法覆盖）：
  - [x] 打开小程序 → 静默登录成功 → TabBar 出现「日历」→ 进入月视图，网格正确（当前月 + 补位日期弱化 + 今天高亮）
  - [x] 切上月/下月 → 网格与事件色点更新；点选有事件日期 → 下方列表显示标题/时间/色点；点选无事件日期 → 空态
  - [x] 手工篡改本地 storage 的 accessToken 为非法值 → 请求 401 → 自动静默重登并恢复数据
  - [x] 停掉后端 → 错误提示 + 重试按钮可用，不白屏
