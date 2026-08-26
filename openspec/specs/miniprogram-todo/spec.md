# 小程序任务列表（miniprogram-todo）

## Purpose
Phase 2 主链（M2.1-2.2）第四个能力：小程序任务页「任务列表」——TabBar 第 4 入口 + 恒定三组分组（待办/进行中/已完成）+ 状态移动 + 新建/删除，复用后端现有 `/tasks` 四端点（list/create/move/delete，API 契约零变更）。Bearer 鉴权链路复用 `lib/api.ts`（401 清态 + 静默重登）；`dueDate` 为字符串切片比较（iOS JSC 兼容）。交互组件全部采用 Taro 原生方案（自绘弹层 + 原生 Picker/面板/弹窗）——NutUI 组件 css 含 `var()` 嵌套 calc 不被微信 wxss 支持（实测根因）。

## Requirements

### Requirement: 任务列表页（TabBar 入口 + 状态分组）
小程序 SHALL 新增 `pages/todo/` 页面，TabBar SHALL 增加「任务」入口（`pages/todo/index`，第 4 个 tab，与「首页/日历/我的」并存）。页面渲染任务列表：按状态恒定三组分组展示——「待办」（TODO）/「进行中」（IN_PROGRESS）/「已完成」（DONE），组头为中文状态标签，组内任务按 `sortOrder` 升序；每项展示 `title`、`priority`（中文标签 + 区分色点）、`dueDate`（有则展示，date 格式）、`tags`（每个标签色点 + 名称）、`description`（有则展示，超出截断）。`status = DONE` 的任务项使用弱化样式（灰显/划线），与未完成项视觉区分。

#### Scenario: 进入页面展示分组列表
- **WHEN** 用户从 TabBar 进入任务页
- **THEN** 按状态三组展示任务：待办（TODO）/进行中（IN_PROGRESS）/已完成（DONE），组内按 sortOrder 升序

#### Scenario: 任务项字段展示
- **WHEN** 任务存在 title/priority/dueDate/tags/description 字段
- **THEN** 每项展示标题、优先级中文标签与色点、截止日期（含日期存在性判断）、标签色点与名称、描述截断文本

#### Scenario: 已完成任务弱化显示
- **WHEN** 任务 status 为 DONE
- **THEN** 该项以弱化样式展示（灰显/划线），与待办、进行中视觉区分

#### Scenario: 空分组展示
- **WHEN** 某状态分组下无任务
- **THEN** 该组展示空态文案（如「暂无待办」），不整体隐藏分组

### Requirement: 任务数据加载（Bearer 鉴权链路）
页面加载与刷新时 SHALL 调用 `GET /api/v1/tasks`（复用现有端点，不限过滤参数，返回 `TaskProfile[]`），请求 SHALL 携带本地 accessToken（`Authorization: Bearer <token>`）。列表数据变更（移动/新建/删除成功）后 SHALL 重新拉取，保证分组与展示与后端一致。

#### Scenario: 进入页面拉取任务
- **WHEN** 登录态有效且页面加载
- **THEN** 请求携带 Bearer token，响应按状态分组渲染；无任务的组显示空态

#### Scenario: 变更后重新拉取
- **WHEN** 状态移动、新建或删除成功
- **THEN** 重新调用 `GET /tasks` 刷新列表（不依赖本地乐观更新）

#### Scenario: 请求失败展示错误与重试
- **WHEN** 请求失败（网络错误或服务端 ≥400，且非 401）
- **THEN** 页面展示错误提示（后端 `message` 或兜底文案）与重试入口，不崩溃、不进入已加载状态

#### Scenario: 401 未授权处理
- **WHEN** 服务端返回 401（token 失效）
- **THEN** 清除本地登录态（access/refresh/user），自动静默重登（wx.login 无感）并重拉数据；重登失败才展示错误提示与重试入口

### Requirement: 任务状态移动
页面 SHALL 支持修改任务状态：点击任务项的状态标识弹出状态选择（三选项：待办/进行中/已完成），确认选择后调用 `PATCH /api/v1/tasks/{id}/move`（请求体 `MoveTaskRequest {status, sortOrder}`，`sortOrder` 保留任务当前值）。成功后重新拉取列表，任务出现在新状态分组；失败展示错误提示并保持原状态。

#### Scenario: 打开状态选择
- **WHEN** 用户点击任务项的状态标识
- **THEN** 弹出状态选择面板（`Taro.showActionSheet` 原生三选），展示三个状态选项；选择当前状态或取消均无副作用

#### Scenario: 移动任务到新状态
- **WHEN** 用户选择新状态并确认
- **THEN** 调用 `PATCH /tasks/{id}/move`（status + 当前 sortOrder），成功后重新拉取列表，任务出现在对应分组

#### Scenario: 移动失败保持原状态
- **WHEN** 移动请求失败（网络错误或服务端 ≥400，且非 401）
- **THEN** 展示错误提示，任务保持在原状态分组，不产生假变化

### Requirement: 新建与删除任务
页面 SHALL 支持新建任务（标题必填，提交 `POST /api/v1/tasks`，请求体 `CreateTaskRequest`）与删除任务（确认后调用 `DELETE /api/v1/tasks/{id}`）。新建表单含 `title`（必填，OpenAPI `maxLength: 200`，缺失时提示不提交）、`priority`（可选，默认 MEDIUM）、`dueDate`（可选，date 格式，YYYY-MM-DD）、`description`（可选）。删除 SHALL 有确认弹窗（替代 Web 端撤销 toast），确认后删除并重新拉取列表。新建与删除失败均展示错误提示（后端 `message` 或兜底文案）。

#### Scenario: 新建任务表单校验
- **WHEN** 用户打开新建表单并提交空标题
- **THEN** 展示「标题不能为空」提示，不发起创建请求

#### Scenario: 新建任务成功
- **WHEN** 用户填写标题（及可选的优先级/截止日期/描述）并提交
- **THEN** 调用 `POST /tasks`（201），成功后重新拉取列表，新任务出现在「待办」分组

#### Scenario: 删除任务确认
- **WHEN** 用户触发某任务的删除操作
- **THEN** 弹出确认弹窗；确认后调用 `DELETE /tasks/{id}`（204），成功后重新拉取列表，任务从分组消失

#### Scenario: 删除取消
- **WHEN** 用户在确认弹窗取消
- **THEN** 不发起请求，任务保持原状态

#### Scenario: 新建/删除失败提示
- **WHEN** 新建或删除请求失败（且非 401）
- **THEN** 展示错误提示（后端 `message` 或兜底文案），列表保持原状态

### Requirement: 小程序任务 API 客户端封装
小程序 SHALL 新增 `lib/tasks.ts`：任务类型映射与响应校验（字段缺失/类型不符时抛「任务数据格式异常」）、`fetchTasks()` / `createTask()` / `moveTask()` / `deleteTask()` 封装（复用 `lib/api.ts` 的 `apiRequest`：Bearer 注入、`≥400` 抛后端 message、401 特判抛 `UnauthorizedError`）、分组排序纯函数 `groupTasksByStatus`（按状态三组，组内 `sortOrder` 升序，缺失 sortOrder 视为最大即组尾）。任务 API 的新增 SHALL NOT 重复实现错误处理逻辑。

#### Scenario: Bearer 注入与错误透传
- **WHEN** 本地存在 accessToken 且发起任务请求
- **THEN** 请求头携带 `Authorization: Bearer <accessToken>`；服务端 ≥400 抛后端 `message` 的 `Error`，401 抛 `UnauthorizedError`

#### Scenario: 响应校验
- **WHEN** 任务列表响应含非法字段（如 title 非字符串/缺失）
- **THEN** 抛出「任务数据格式异常」，不进入渲染

#### Scenario: 分组排序纯函数
- **WHEN** 输入任务数组与状态
- **THEN** 返回三组（待办/进行中/已完成），组内按 sortOrder 升序；sortOrder 缺失的任务位于组尾

## Test Coverage

| Scenario | 测试 | 状态 |
|----------|------|------|
| 响应校验（字段/枚举/非法值抛「任务数据格式异常」） | tasks.test.ts parseTaskSummary 8 用例 | ✅ |
| 分组排序（恒定三组/sortOrder 升序/缺失组尾/空组） | tasks.test.ts groupTasksByStatus 3 用例 | ✅ |
| Bearer 注入 / 无 token / 401 清态 / 错误 message 上抛 | api.test.ts 7 用例（请求封装，calendar 交付） | ✅ |
| 四函数请求路径与 body / 响应解析 / 错误透传 | tasks.test.ts fetchTasks/createTask/moveTask/deleteTask 9 用例 | ✅ |
| 分组渲染（字段/DONE 弱化/空态）与状态选择/新建弹层/删除确认 UI | 无渲染级测试（小程序渲染测试基础设施待后续变更引入）→ 9.4 smoke test 6 场景手工覆盖 | ✅ |
