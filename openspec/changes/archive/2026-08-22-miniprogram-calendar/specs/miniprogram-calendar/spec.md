# 小程序日历月视图（miniprogram-calendar）

## ADDED Requirements

### Requirement: 日历月视图页面（月网格渲染）
小程序 SHALL 新增 `pages/calendar/` 页面，渲染月视图：星期表头（周一至周日）+ 6 行 × 7 列月网格。网格首格为该月 1 日所在周的周一，不足 6 行以相邻月日期补齐；补位日期视觉弱化（次月/上月灰显）。TabBar SHALL 增加「日历」入口（`pages/calendar/index`），与现有「首页/我的」并存。

#### Scenario: 进入页面展示当月网格
- **WHEN** 用户从 TabBar 进入日历页
- **THEN** 按当前月份渲染月网格：星期表头为周一至周日，首格为 1 日所在周的周一，共 6 行 42 格

#### Scenario: 跨月补位弱化显示
- **WHEN** 某月 1 日不是周一，或该月 6 行放不下（月末后仍有空格）
- **THEN** 网格以相邻月日期补齐至 42 格，补位日期以弱化样式（灰显）与当月日期区分

### Requirement: 月份导航与日期选择
页面 SHALL 提供上月/下月切换（导航栏左右箭头或按钮），并支持点选日期：被选中的日期格有选中态；视图中包含今天时，今天格有独立高亮标记（与选中态区分）。

#### Scenario: 切换月份
- **WHEN** 用户点击「上月」或「下月」
- **THEN** 网格切换到对应月份（含跨月补位重算），并重新加载该月事件数据

#### Scenario: 今天标记
- **WHEN** 当前展示的月份包含今天
- **THEN** 今天格显示独立高亮样式；若今天同时为选中日期，选中态优先

#### Scenario: 选中日期
- **WHEN** 用户点选网格中某一格
- **THEN** 该格进入选中态，页面下方事件列表切换为该日期的事件

### Requirement: 当月事件数据加载（Bearer 鉴权链路）
页面加载与切换月份时 SHALL 调用 `GET /api/v1/events`（复用现有端点，参数 `start`/`end` 为 date-time 字符串）：范围 SHALL 为月网格首格 00:00:00 至末格次日 00:00:00（覆盖全部补位日；后端语义为 `start_time < end AND end_time > start` 重叠查询）。请求 SHALL 携带本地 accessToken（`Authorization: Bearer <token>`）。响应事件按日期键（`YYYY-MM-DD`，取事件 `startTime` 所在日期）分组；有事件的日期格显示事件标记点（取事件 `color`，无 color 用默认色）。

#### Scenario: 进入页面拉取当月事件
- **WHEN** 登录态有效且页面加载
- **THEN** 请求携带 Bearer token，事件按 `startTime` 所在日期分到对应格，有事件的格显示标记点

#### Scenario: 切月重新拉取
- **WHEN** 用户切换月份
- **THEN** 以新月份网格范围（首格 00:00 至末格次日 00:00）重新请求 `GET /events`，网格标记与选中日列表随之更新

#### Scenario: 请求失败展示错误与重试
- **WHEN** 请求失败（网络错误或服务端 ≥400，且非 401）
- **THEN** 页面展示错误提示（后端 `message` 或兜底文案）与重试入口，不崩溃、不进入已加载状态

#### Scenario: 401 未授权处理
- **WHEN** 服务端返回 401（token 失效）
- **THEN** 清除本地登录态（access/refresh/user），自动静默重登（wx.login 无感）并重拉数据；重登失败才展示错误提示与重试入口

### Requirement: 选中日期事件列表（只读）
页面下方 SHALL 展示选中日期的事件列表：按 `startTime` 升序；每项展示 `title`、时间（`allDay=true` 显示「全天」，否则显示开始时间 HH:mm）、`color` 色点、`categoryName`（有则展示）。本页面只读：SHALL NOT 提供新建/编辑/删除入口，点击事件不跳转详情。

#### Scenario: 当日事件列表
- **WHEN** 选中日期有事件
- **THEN** 列表按开始时间升序展示各事件的标题、时间、颜色点、分类名

#### Scenario: 当日无事件空态
- **WHEN** 选中日期无事件
- **THEN** 显示空态文案（如「当天暂无日程」）

#### Scenario: 全天事件展示
- **WHEN** 事件 `allDay` 为 true
- **THEN** 该事件时间显示为「全天」

### Requirement: 小程序 API 客户端封装
小程序 SHALL 新增统一 API 层：`lib/config.ts`（`API_BASE_URL` 单一来源）、`lib/api.ts`（Taro.request 封装：注入 Bearer、`statusCode >= 400` 抛出后端 `message` 的 `Error`、401 特判）、`lib/events.ts`（`fetchMonthEvents(start, end)` 返回 `EventResponse[]`）。`lib/auth.ts` 的 BaseURL 引用 SHALL 迁移到 `lib/config.ts`，消除硬编码分散。

#### Scenario: Bearer 注入
- **WHEN** 本地存在 accessToken 且发起业务请求
- **THEN** 请求头携带 `Authorization: Bearer <accessToken>`

#### Scenario: 后端错误 message 上抛
- **WHEN** 服务端返回 ≥400
- **THEN** 抛出 `Error`，`message` 为后端响应中的 `message` 字段（缺失时用兜底文案）

#### Scenario: BaseURL 单一来源
- **WHEN** 查看 `lib/auth.ts` 与 `lib/events.ts` 的请求地址
- **THEN** 两者均引用 `lib/config.ts` 的 `API_BASE_URL`，无各自硬编码；真实合法域名（https + 微信后台白名单）仍保留 TODO 至发布阶段

## Test Coverage

| Scenario | 测试 | 状态 |
|----------|------|------|
| 月网格渲染（42 格/周一起始/跨月补位/今天标记/键连续） | calendar-date.test.ts buildMonthGrid 6 用例 | ✅ |
| 查询范围（首格 00:00 → 末格次日 00:00，含跨年） | calendar-date.test.ts monthRange 2 用例 | ✅ |
| 日期键/时间格式化（字符串切片，不 new Date） | calendar-date.test.ts 日期键与格式化 4 用例 | ✅ |
| Bearer 注入 / 无 token / 401 清态 / 错误 message 上抛 | api.test.ts 7 用例（mock Taro.request） | ✅ |
| 事件响应校验 / 日期分组排序 / 请求层错误透传 | events.test.ts 10 用例 | ✅ |
| 选中日列表（全天/时间/空态）与错误提示重试 UI | 无渲染级测试（小程序渲染测试基础设施待后续变更引入）→ 9.4 smoke test 四场景手工覆盖 | ✅ |

