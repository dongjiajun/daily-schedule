# Design: 小程序日历月视图（miniprogram-calendar）

<!-- 参考: docs/architecture.md + CLAUDE.md 技术约定 -->

## Context

小程序已有骨架（miniprogram-foundation）与登录态（wechat-auth：`lib/auth.ts` 的 wx.login → JWT → `STORAGE_KEYS` 持久化，`API_BASE_URL` 硬编码 localhost 带 TODO(domain)）。后端 `GET /api/v1/events` 已存在：`start`/`end`（date-time，必填）+ 可选过滤/分页，响应为**裸数组** `EventResponse[]`（无分页包装，size 无上限校验），查询语义为重叠（`start_time < end AND end_time > start`），按 `user_id` 隔离。

约束：
- 只读范围：不新建/编辑/删除/拖拽，点击事件不跳详情（Non-Goal）
- 小程序无 fetch（@hey-api SDK 不可用）、无 dayjs/Zustand/React Query 依赖
- Taro 4.2 + React 18 + NutUI 4.0.0-beta.5（组件级按需引入）
- 契约驱动：后端与 openapi.yaml 零变更，版本号不变

## Goals / Non-Goals

**Goals:**
- 日历月视图（42 格 + 跨月补位 + 切月 + 今天高亮 + 选中态）
- 「Bearer 鉴权 + 服务端数据」完整链路跑通（登录态首次被业务消费）
- 选中日期事件列表（只读），统一 API 层（config/api/events 三层）
- 纯函数可单测（vitest，仿 auth.test.ts 模式）

**Non-Goals:**
- 事件详情页 / 创建 / 编辑 / 拖拽（miniprogram-todo 等后续变更）
- 周视图 / 日视图（仅月视图）
- refresh token 预续签机制（后续变更；本次 401 走清态 + 静默重登）
- 真机合法域名（https + 微信后台白名单）配置——仍属发布阶段，保留 TODO

## Decisions

### Decision 1: 手写 typed API 层（Taro.request 封装），不为小程序生成 SDK
- **选择**: 新建 `lib/api.ts`（Taro.request 封装：BaseURL + Bearer 注入 + ≥400 抛后端 `message` + 401 特判）+ `lib/events.ts`（`fetchMonthEvents(start, end)`，手写 `EventSummary` 类型 = 后端 `EventResponse` 字段子集）
- **理由**: @hey-api/openapi-ts 生成的是 fetch 客户端，微信小程序环境无原生 fetch；wechat-auth 已确立 Taro.request 手写模式（`lib/auth.ts`）；月视图仅消费 1 个端点，手写类型成本极低
- **备选方案**: 为小程序单独配置 openapi-ts（hey-api 支持自定义 fetch 实现，但需把 Taro.request 适配成 fetch 签名 + 独立生成目录/构建步骤，配置面大增）——待业务端点增多（todo/pet）后再评估

### Decision 2: 日期纯函数手写，不引入 dayjs
- **选择**: 新建 `lib/calendar-date.ts` 纯函数：`buildMonthGrid(year, month)`（42 格，含跨月补位）、`monthRange(grid)`（首格 00:00 → 末格次日 00:00）、`dateKey(d)`、`formatMonthTitle(year, month)`、`formatTime(hhmm)`——全部基于字符串切片与 `getFullYear/getMonth/getDate`，**不对后端日期字符串 `new Date()`**
- **理由**: 小程序包体积敏感；月视图仅需固定 42 格生成 + 字符串格式化；**iOS JavaScriptCore 对 `YYYY-MM-DDTHH:mm:ss`（无时区偏移）的 `new Date()` 解析不可靠**（返回 Invalid Date），而后端 Jackson 序列化 LocalDateTime 正是该格式——字符串切片方案（日期键取前 10 位、时间取 11-16 位）完全绕开此坑
- **备选方案**: 引入 dayjs（与 Web 端一致、API 舒适，但新增依赖 + 包体积，且同样依赖解析层兼容性）；Taro 内置日期工具（无此 API）

### Decision 3: 页面内 React state，不引入 Zustand / React Query
- **选择**: `pages/calendar/index.tsx` 内 `useState`（月份游标 `{year, month}`、选中日期键、事件 map、loading/error 态）+ `useEffect` 拉取；不引入状态库
- **理由**: 单页只读场景，数据生命周期 = 页面生命周期；小程序目前无 Zustand/React Query 依赖，为此单页引入两个库收益为负
- **备选方案**: 移植 Web 端 Zustand + React Query 模式（依赖重、心智成本高；等 miniprogram-todo 出现跨页共享/缓存需求时再评估）

### Decision 4: 查询范围覆盖补位日——首格 00:00 → 末格次日 00:00
- **选择**: `GET /events?start=<网格首格 00:00:00>&end=<网格末格次日 00:00:00>`；事件按 `startTime` 日期键（前 10 位）分组，与补位格对齐
- **理由**: 后端重叠查询语义（`start_time < end AND end_time > start`）要求上界覆盖末格全天 → 末格次日 00:00 作为排他上界；补位格的事件也能显示（用户在月初看到上月最后几天的日程标记）
- **备选方案**: 仅月初~月末（补位格无事件标记，跨月体验断裂）；末格 23:59:59 上界（秒级边界易漏、字符串拼接丑）

### Decision 5: 401 处理——清态 + 静默重登，不做 refresh 预续签
- **选择**: `lib/api.ts` 收到 401 → 清除 `STORAGE_KEYS` 三项 → 抛特定 `UnauthorizedError`；日历页捕获后自动调 `wechatLogin()`（wx.login 无感重登）→ 重拉数据；失败才展示错误 + 手动重试按钮
- **理由**: access token 15 分钟过期，静默重登对用户无感（wx.login 不弹窗）；refresh 预续签（Web 端 authInterceptor 的 30s 提前刷新 + 单飞锁）是完整机制，独立成后续变更更稳妥——本次确保 401 不白屏、不循环
- **备选方案**: 本次实现 refresh 预续签——被否决：单飞锁 + 过期计时器 + 并发请求续签重试是独立复杂度，混入本变更（纯前端页面）会膨胀 scope；401 兜底链路已保证体验可接受

### Decision 6: TabBar 三 tab（首页 / 日历 / 我的），保留骨架首页
- **选择**: `app.config.ts` tabBar.list 插入 `pages/calendar/index`（text「日历」），与「首页/我的」并存
- **理由**: 日历是核心入口；首页承载 shared 复用演示与登录卡片（wechat-auth 验证面），删除会丢失回归锚点；「我的」页是后续设置/登出的落点
- **备选方案**: 用日历替换首页——被否决：登录失败重试、shared 演示等验证能力无处安放

### Decision 7: 单页拉取 size=100，不做分页
- **选择**: `fetchMonthEvents` 传 `size=100, page=1`
- **理由**: 个人月视图事件量 <100 概率极高；后端 size 无上限校验（`size > 0 ? size : 50`），传大值安全；分页 UI 在月视图无自然交互位
- **备选方案**: 默认 50（跨月补位 + 事件密集月份可能截断）；分页加载（交互复杂，收益低）

## DDD Layer Design

### 领域层 (domain/)
- 零变更

### 基础设施层 (infrastructure/)
- 零变更

### 应用层 (application/)
- 零变更

### API 层 (api/)
- 零变更（`GET /api/v1/events` 直接复用，无新端点、无契约/版本号变更）

### 小程序（apps/miniprogram/src/）
```
src/
├── lib/
│   ├── config.ts          # 新增: API_BASE_URL 单一来源（从 auth.ts 迁出，保留 TODO(domain)）
│   ├── api.ts             # 新增: Taro.request 封装（Bearer 注入 + ≥400 抛后端 message + 401 → UnauthorizedError）
│   ├── events.ts          # 新增: fetchMonthEvents(start, end) + EventSummary 类型 + 响应校验
│   ├── calendar-date.ts   # 新增: 月网格/范围/日期键纯函数（Decision 2）
│   └── auth.ts            # 修改: API_BASE_URL 引用改为 lib/config.ts
├── components/calendar/
│   ├── MonthGrid.tsx      # 新增: 42 格月网格（补位弱化/今天高亮/选中态/事件色点）
│   └── EventDayList.tsx   # 新增: 选中日事件列表（时间/全天/色点/分类名，只读）
└── pages/calendar/
    ├── index.tsx          # 新增: 页面编排（月份游标/选中日/加载态/401 静默重登）
    ├── index.config.ts    # 新增: 页面配置（导航标题「日历」）
    └── index.scss         # 新增: 页面样式
```
- 状态流转：`月份游标` → useEffect 触发 `fetchMonthEvents` → 成功构建 `Map<dateKey, EventSummary[]>`（按 startTime 升序）→ MonthGrid 取 map 渲染色点（每格最多 3 个 + 「+n」）→ 点击格更新选中日期键 → EventDayList 渲染该键事件
- `app.config.ts`：pages 加 `pages/calendar/index`，tabBar.list 插入「日历」

## API Design

复用现有 `GET /api/v1/events`（specs/openapi.yaml，无改动）：

- 请求：`start`/`end`（date-time，必填，Decision 4 范围）、`size=100&page=1`
- 响应 200：裸数组 `EventResponse[]`；本页面消费字段：`id`、`title`、`startTime`、`endTime`、`allDay`、`color`、`categoryName`（`EventSummary` 子集类型）
- 错误：400（参数非法）/ 401（token 失效 → Decision 5）
- 无契约变更 → 无 SDK 重新生成、无 CHANGELOG、无版本号变更

## Database Design

- 零变更（无新表/新列/新迁移）

## Risks / Trade-offs

- [iOS Date 解析兼容] → 全链路字符串切片（Decision 2），不对后端日期串 `new Date()`；「今天」判定用 `new Date()` + `getFullYear/getMonth/getDate` 本地拼 `YYYY-MM-DD`（该 API 小程序全端安全）
- [size=100 截断] → 极端密集月份可能漏 >100 条；记录于风险，后续若出现再做分页（Decision 7）
- [401 静默重登竞态] → 重登期间并发请求可能连环 401；本次页面串行请求（仅月视图一个数据流），`lib/api.ts` 内不加锁，后续引入续签机制时一并处理
- [NutUI 未用 Calendar 组件] → 手写网格需自测切换/选中交互；纯函数单测 + 开发者工具 smoke 覆盖
- [开发者工具 localhost] → 仅调试环境可用，真机需合法域名（TODO(domain) 保留至发布阶段变更）

## Migration Plan

1. 纯小程序前端变更：无后端部署、无数据库迁移；`pnpm run build`（taro build weapp）→ 微信开发者工具导入验证
2. 回滚：revert 小程序前端变更即可（TabBar 还原两 tab；auth.ts BaseURL 迁移为内部重构，行为不变）
3. 验证：miniprogram `pnpm run verify`（lint + vitest + build）→ `turbo run verify` → `pnpm run docs:check`（component-catalog / architecture 测试数字同步）→ 开发者工具 smoke（登录态 + 当月事件展示 + 切月）

## Open Questions

- 无（TabBar 顺序、默认选中页已在 Decision 6 定案；事件详情/编辑明确划出范围）
