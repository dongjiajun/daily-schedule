# Proposal: 小程序日历月视图（miniprogram-calendar）

## Why

小程序已有登录态（wechat-auth：wx.login → JWT → 本地持久化），但还没有任何业务页面。日历是日程管理系统的核心入口，小程序第一个业务变更做「日历月视图只读」：打通「Bearer 鉴权 + 服务端数据」的完整链路（登录态首次被真实业务消费），验证后端现有 `GET /api/v1/events` 的多端复用。范围收窄为只读（不新建/不编辑/不拖拽），把复杂度压到最低，为后续 miniprogram-todo / miniprogram-pet 打样。

## What Changes

- 小程序新增 `pages/calendar/`：月视图页面（星期表头 + 月网格 + 上/下月切换 + 今天高亮 + 每日事件标记 + 选中日期下方事件列表），只读
- 新增 `lib/api.ts`：Taro.request 封装（BaseURL + Bearer token 注入 + 401 处理 + 错误 unwrap 风格，后端 message 上抛）；`lib/events.ts`：`fetchMonthEvents` 调 `GET /events`（月初~月末范围，跨月补位日覆盖）
- 新增 `lib/calendar-date.ts` 纯函数：月网格生成（含跨月补位）、月份范围计算、日期键（`YYYY-MM-DD`）——不引入新依赖
- `app.config.ts` TabBar 调整：加入「日历」页入口
- `lib/auth.ts` 的 `API_BASE_URL` 抽取到共享配置（`lib/config.ts`），消除页面/库分散硬编码；真实合法域名（https + 微信后台白名单）仍属发布阶段事项，保留 TODO

## Capabilities

### New Capabilities

- `miniprogram-calendar`: 小程序日历月视图只读——月网格 + 当月事件展示 + Bearer 鉴权数据链路（登录态首次消费）

### Modified Capabilities

- （无）

## API Contract Impact

- 无影响（复用现有 `GET /api/v1/events`，start/end 必填 + 分页参数，无新端点/字段变更，版本号不变）

## DDD Layer Impact

- 后端零变更（API / 应用 / 领域 / 基础设施均不触碰）

## Database Impact

- 无需 Flyway 迁移

## Impact

- **小程序**：新增 `pages/calendar/`（页面 + config）、`lib/api.ts`、`lib/events.ts`、`lib/calendar-date.ts`、`lib/config.ts`；修改 `lib/auth.ts`（BaseURL 引用抽取）、`app.config.ts`（TabBar）
- **测试**：vitest 新增 `calendar-date.test.ts`（纯函数）+ `events.test.ts`（响应解析/错误处理），仿 auth.test.ts 模式
- **文档**：`docs/frontend/component-catalog.md`（小程序目录树 + 日历页说明）、`docs/architecture.md`（小程序模块章节 + 测试规模数字）
- **规划同步**：`docs/planning/phase2-execution-plan.md` 任务行 [x] + `phase2-changes` marker +1（归档时）
- **依赖**：无新增（复用 @tarojs/components + NutUI，日期纯函数手写）
