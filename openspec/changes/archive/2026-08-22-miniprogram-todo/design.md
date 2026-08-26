# Design: 小程序任务列表（miniprogram-todo）

## Context
- 背景：Phase 2 主链第 4 个变更（M2.1-2.2）。Web 端任务看板已交付并归档（task-crud，三列看板 + 列表 + 拖拽 + 状态闭环 + 宠物联动），后端 `GET/POST/PUT/DELETE /api/v1/tasks` + `PATCH /api/v1/tasks/{id}/move` 契约齐备（specs/openapi.yaml v3.5.1）。
- 当前状态：miniprogram-calendar 已交付小程序前端基建——`lib/api.ts`（`apiRequest`：Bearer 注入 / `≥400` 抛后端 message / 401 清态 + `UnauthorizedError`）、`lib/config.ts`（`API_BASE_URL` 单一来源 + `DEFAULT_EVENT_COLOR`）、`lib/calendar-date.ts`（字符串切片日期纯函数，iOS JSC 兼容）、`pages/calendar/`（页内错误态 + 重试模式、`loading` 派生规避 `react-hooks/set-state-in-effect`）。
- 约束：小程序无 fetch SDK / dayjs / Zustand / React Query；NutUI 必须组件级按需引入（`dist/es/packages/<name>` + `style/css`，禁 barrel）；日期只做字符串处理（不 `new Date` 解析无时区串）；错误处理只在 `lib/api.ts` 一层实现，业务层不重复。

## Goals / Non-Goals

**Goals:**
- TabBar 第 4 tab「任务」+ 三段分组列表（TODO/IN_PROGRESS/DONE，组内 sortOrder 升序）
- 状态移动（ActionSheet 三选项）→ `PATCH /move`；新建（标题必填）→ `POST`；删除（确认弹窗）→ `DELETE`
- 复用 `lib/api.ts` 统一错误处理；401 静默重登链路复用（lib/auth.ts `wechatLogin`）
- 纯函数分组/排序/日期判定，vitest 可测（1 个新测试文件）

**Non-Goals:**
- 任务编辑（PUT 字段级修改，后续变更）、看板/拖拽、标签选择与筛选栏（标签仅展示）
- 宠物联动（Web 端 `emitTaskCompleted` 事件，小程序无订阅通道）
- 渲染级组件测试（小程序渲染测试基础设施留待后续变更，与 miniprogram-calendar 一致 — 9.x smoke 覆盖）
- 后端/契约/数据库任何变更

## Decisions

### Decision 1: 复用现有 /tasks 四端点，零后端变更
- **选择**：仅消费 `GET /tasks`（全量，无过滤参数）、`POST /tasks`、`PATCH /tasks/{id}/move`、`DELETE /tasks/{id}`；不使用 `PUT /tasks/{id}`（编辑超出范围）。
- **理由**：契约驱动管道下，任何后端改动都需 openapi.yaml + 版本号三处同步 + 全量回归；本变更目标是最小成本补齐小程序核心动作，四端点已足够。与 miniprogram-calendar「复用 GET /events」路径一致。
- **备选方案**：新增 `/api/v1/tasks/digest` 聚合端点（一次请求带分组统计）——被否：移动/新建/删除后仍需全量刷新的成本收益差，且破坏「零契约变更」约束。

### Decision 2: 列表数据流 — API 成功后本地同步 + refetch 对账
- **选择**：变更操作（move/create/delete）成功 → 先本地更新 tasks 状态（值来自 API 响应，非乐观猜测）→ 再 `refetch()` 对账（失败仅 toast「列表刷新失败」，本地已是服务端确认结果，无数据分歧）。首次加载失败（tasks === null）→ 页内错误态 + 重试（与日历同模式）。
- **理由**：spec 要求「不依赖本地乐观更新」——本地同步的值是 API 已确认的事实；refetch 兜底服务端 side effect（如排序变化）。移动成功但 refetch 失败时，旧列表若保留会显示过期状态且用户无法再手动刷新（无下拉刷新），体验断裂。
- **备选方案**：成功仅 refetch——移动成功后到刷新完成前 UI 仍显示旧状态，且 refetch 失败时无对账（弊端如上）；乐观更新先行——若 API 失败需回滚，复杂度不值得。

### Decision 3: 状态移动用 Taro.showActionSheet 原生 API（显式三选），非点击循环切换
- **选择**：点击任务项状态标识 → `Taro.showActionSheet`（「待办/进行中/已完成」，点击当前态或取消均无副作用）→ 选择后 `PATCH /move`（`status` + `sortOrder` 保留现值）。
- **理由**：三态循环点击（TODO→IN_PROGRESS→DONE→TODO）易误触中间态；显式选择可双向移动（DONE 恢复）。**为何非 NutUI ActionSheet**：NutUI 预编译 css 含 CSS 变量嵌套 calc（`calc(...*var(--nut-scale-f, 1))*7` 等），微信 wxss 不支持 var()，开发者工具编译报错（本变更实测：webpack 仅 postcss warning 放行 → 工具编译红错），故改原生 API（零样式依赖，字符串/itemList 语义简单）。
- **备选方案**：NutUI ActionSheet——css wxss 不兼容（root cause 如上）；点击即循环移动——误触成本高且无法一键恢复完成态；长按弹菜单——可发现性差。

### Decision 4: 删除确认用 Taro.showModal 原生弹窗（不复刻 Web 端撤销 toast）
- **选择**：任务项提供删除按钮（TaskItem 尾部「删除」操作）→ `Taro.showModal`（title「删除任务」/ content「将删除《<标题>》，无法恢复」/ confirmText 删除）→ DELETE 成功本地移除 + refetch；取消不请求。
- **理由**：小程序 toast 不支持 action（sonner 撤销无法移植）；`showModal` 是原生确认弹窗零依赖；Web 端删除+撤销需要 `POST` 重建任务（含恢复原列两次请求），小程序不值得。
- **备选方案**：右滑删除 + 撤销 —— 需自定义手势 + toast 撤销链，复杂度/收益差；长按删除 —— 可发现性差。

### Decision 5: 新建表单 — 自绘底部弹层 + Taro 原生 Input/TextArea/Picker，title 必填
- **选择**：页面「新建任务」按钮 → `components/todo/TaskFormPopup`（自绘遮罩 `mp-todo-mask` + 底部卡片 `mp-todo-form`，零 NutUI 弹层）：Taro `Input`（title，空提交 → `Taro.showToast('标题不能为空')` 不发起，maxLength 200）、Taro `TextArea`（description 选填，maxLength 500）、自绘优先级 chips（默认 MEDIUM）、Taro `Picker mode='date'` 选 dueDate（可选，默认不设 + 「清除」恢复；onChange 直接返回 `YYYY-MM-DD` 字符串——与 calendar-date 字符串方案一致，无需 Date 对象转换）。提交 → `POST /tasks`（201）→ 本地追加到 TODO 组 + refetch → 关闭弹层。
- **理由**：与 Web 端 TaskForm 语义对齐（title/priority/dueDate/description），去掉 tagIds（Non-Goal）。**为何非 NutUI Popup/Input/Textarea/DatePicker**：同 Decision 3——NutUI 组件预编译 css（popup/input/textarea/datepicker 均含）的 `calc(...*var(--nut-scale-f, 1))` 嵌套表达式不被微信 wxss 支持（开发者工具编译红错，构建侧仅 postcss warning）；自绘弹层 + 原生组件零样式负担、行为完全可控，Picker mode='date' 为微信原生选择器。
- **备选方案**：NutUI Popup 套件 —— css wxss 不兼容（root cause 如上）；独立页面表单 —— TabBar 页内导航栈开销大，且输入量为 4 字段，弹层足够。

### Decision 6: 校验与分组纯函数集中在 lib/tasks.ts，展示元数据同文件导出
- **选择**：`lib/tasks.ts` 单文件：`TaskStatus`/`TaskPriority` 类型、`TaskSummary`（id/title/description?/status/priority?/sortOrder?/dueDate?/tags[{id,name,color}]）、`parseTaskSummary`（字段类型校验，非法抛「任务数据格式异常」）、`STATUS_ORDER`/`STATUS_LABEL`/`PRIORITY_META`（label + color，URGENT `#f5222d` / HIGH `#fa8c16` / MEDIUM `#4f7cff` / LOW `#8c8c8c`）、`groupTasksByStatus(tasks)`（三组恒定，组内 `sortOrder ?? Number.MAX_SAFE_INTEGER` 升序）、`fetchTasks()` / `createTask()` / `moveTask()` / `deleteTask()`（薄封装 `lib/api.ts` `apiRequest`）。
- **理由**：无渲染测试基础设施时，纯函数是唯一可靠测试面孔（vitest 直接测）；元数据一并导出避免 config/tasks 循环；与 calendar 的 `events.ts`（parse/group/fetch 同构）模式一致。
- **备选方案**：元数据放 `lib/config.ts` —— config.ts 只放全局单一来源常量（API_BASE_URL/色值），任务元数据就近内聚于 tasks.ts，避免 config 倒挂。

### Decision 7: 日期判定复用 calendar-date 字符串模式，零 Date 解析
- **选择**：`dueDate`（`YYYY-MM-DD`）展示与过期/今天判定用字符串比较：`dueDate === todayKey()` 今天、`dueDate < todayKey()` 已过期（localeCompare 或直接 `<`，ISO 字典序即时间序，iOS JSC 安全）；组件只渲染字符串，不格式化。
- **理由**：后端 date 序列化为 `YYYY-MM-DD`（无时区），`new Date('2026-08-22')` 在 iOS JSC 解析为 UTC 会时差偏移；字符串比较零风险（miniprogram-calendar 已验证该模式）。
- **备选方案**：dayjs/mini-dayjs —— 新依赖且 iOS 时区语义仍要特判，不值。

## DDD Layer Design
本变更为纯小程序前端变更——后端四层（领域/基础设施/应用/API）零改动，无新依赖。以下仅前端设计。

### 前端（apps/miniprogram/src/）

**组件树：**
```
pages/todo/index.tsx            # 状态舵手：tasks/loading/error/reloadKey + movingTask(状态面板) + showForm(新建弹层)
  ├─ TaskList (components/todo/TaskList.tsx)      # 三组恒定渲染：组头 + TaskItem×n + 空组空态
  │    └─ TaskItem (components/todo/TaskItem.tsx)  # 单行：状态标识(点击→onPickStatus) + title + priority 标签色点
  │                                               #  + dueDate(过期红/今天高亮) + tags 色点名称 + description 截断
  │                                               #  + 尾部「删除」按钮(点击→confirmDelete)；DONE 项 --done 弱化
  ├─ TaskFormPopup (components/todo/TaskFormPopup.tsx)  # 新建弹层（NutUI Popup+Input+TextArea+Picker+DatePicker）
  └─ (状态面板/删除确认：页面内 ActionSheet + Taro.showModal，不拆组件)
```

**数据流：** 单页 `useState`（不做全局 store——日历先例）：`tasks: TaskSummary[] | null` + `error: string | null`；`loading = tasks === null && error === null` 派生（规避 `react-hooks/set-state-in-effect`）；effect deps `[reloadKey]` 首次加载；`apiRequest` 401 → `UnauthorizedError` → catch 分支 `wechatLogin().then(fetchTasks)` 静默重登（复用 calendar 模式）。

**样式：** `pages/todo/index.scss` + 组件同文件（TaskList/TaskItem/TaskFormPopup 各自 scss 或公共 `todo` scss）；类名前缀 `mp-todo-`（对齐 `mp-cal-` 惯例）。

**配置：** `app.config.ts` pages 追加 `pages/todo/index` + tabBar list 追加 `{ pagePath: 'pages/todo/index', text: '任务' }`（4 tab，未超 5 上限）；`index.config.ts` `navigationBarTitleText: '任务'`。

## API Design
复用现有端点（引用 specs/openapi.yaml，无变更、无需 regenerate SDK——小程序无 SDK）：

| 端点 | 请求 | 响应 | 错误 |
|------|------|------|------|
| `GET /api/v1/tasks` | 无查询参数（全量，服务端按用户隔离 + 默认排序） | `TaskProfile[]`（裸数组） | 401 |
| `POST /api/v1/tasks` | `CreateTaskRequest`：`title`(string, maxLength 200, required) `priority`(enum LOW/MEDIUM/HIGH/URGENT) `dueDate`(date `YYYY-MM-DD`) `description`(string) `tagIds`(int64[]) | `TaskProfile` | 400 / 401 |
| `PATCH /api/v1/tasks/{id}/move` | `MoveTaskRequest`：`status`(enum TODO/IN_PROGRESS/DONE, required) `sortOrder`(integer，传现值) | `TaskProfile` | 400 / 401 / 404 |
| `DELETE /api/v1/tasks/{id}` | — | 204 | 401 / 404 |

- Bearer 注入 / `≥400` 抛后端 `message` / 401 特判全部由 `lib/api.ts` `apiRequest` 承担（本变更零新增错误处理代码）。
- 401 处理统一：清 `STORAGE_KEYS` 三项 → `wechatLogin()` 静默重登 → 重拉；重登失败才页内错误态（日历先例）。

## Database Design
无。无 Flyway 迁移，无表/列变更（任务表 `task` 及其 user_id 隔离已由 task-crud 交付）。

## Risks / Trade-offs
- [NutUI 组件 css 与微信 wxss 的 var() 不兼容（已发生并修复）] → 根因：NutUI 预编译 css 用 `calc(...*var(--nut-scale-f, 1))`（webpack postcss 仅 warning 不拦截，微信开发者工具编译才红错）。修复：todo 涉及组件（popup/input/textarea/actionsheet/datepicker）全部改 Taro 原生（Input/TextArea/Picker/showActionSheet/showModal）+ 自绘弹层，wxss 复查 var()=0；后续变更引入其他 NutUI 组件时须以此为先例核查 wxss（smoke 验证 + `grep -c 'var(' dist/**/*.wxss` 防呆）。
- [变更成功但 refetch 失败的对账] → Decision 2 本地同步兜底（值来自 API 响应），无假数据；失败 toast 不阻断。
- [TabBar 增项后「我的」页 icon 间距/样式] → TabBar 无自定义 icon 时期（现为纯文本 tab），无样式回归面；smoke 检查四 tab 布局。
- [小程序 tab 页数上限 5] → 当前 4，后续 miniprogram-pet 需并入现有 tab 或改入口（留待该变更决策，新增一条约束记录）。

## Migration Plan
- 部署顺序：无后端部署（零后端变更）→ `pnpm exec turbo build`（apps/miniprogram）→ dist/ 重新导入微信开发者工具 → smoke。
- 回滚：移除 app.config.ts 两处变更即可回退入口（功能页独立无耦合）；无数据迁移。
- 文档同步（提交前）：`docs/frontend/component-catalog.md`（目录树 + 任务页条目）、`docs/architecture.md`（小程序测试文件/用例数）、`CLAUDE.md`（核心能力 + 测试覆盖 + 小程序段）、`README.md`、`docs/planning/phase2-execution-plan.md`（归档时 `phase2-changes` 3→4）。

## Open Questions
- 新建表单的 dueDate 默认值：当前设计「默认不设」（DatePicker 需用户主动确认）——是否应默认今天？倾向默认不设（产品上「无截止期限」是合法状态），如有更好默认在实现时以 smoke 反馈调整。
- 任务较多（>50）时的首屏性能：`GET /tasks` 全量无分页（后端无 size 参数——openapi.yaml 中仅 status/priority/tagId 过滤，无分页字段）。本变更接受全量；若用户任务量大，后续 miniprogram-todo 增强或后端分页变更再评估。
