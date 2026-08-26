# 小程序宠物互动（miniprogram-pet）

## ADDED Requirements

### Requirement: 宠物页（TabBar 入口 + 宠物状态展示）
小程序 SHALL 新增 `pages/pet/` 页面，TabBar SHALL 新增「宠物」入口（`pages/pet/index`，位于「任务」与「我的」之间，与「首页/日历/任务/我的」并存，共 5 项）。页面渲染当前宠物：`name`（名称）、`species`（物种中文标签：懒猫/柴犬）、`level`（等级）、`experience`（经验数值）、`mood`（心情值条）、`hunger`（饥饿值条）、`coins`（金币）。所有数值以进度条/数值形式展示；未创建宠物时页面 SHALL 进入创建引导状态（非错误态）。

#### Scenario: 进入页面展示宠物状态
- **WHEN** 用户从 TabBar 进入宠物页且已有宠物
- **THEN** 展示宠物名称、物种中文标签、等级、经验条、心情条、饥饿条与金币数值

#### Scenario: 数值条渲染
- **WHEN** `mood`/`hunger` 为 0-100 之间数值
- **THEN** 展示对应比例的进度条（颜色区分高/中/低值），数值变化时条宽同步更新

### Requirement: 宠物数据加载（Bearer 鉴权链路）
页面加载与刷新时 SHALL 调用 `GET /api/v1/pets/me`（复用现有端点），请求 SHALL 携带本地 accessToken（`Authorization: Bearer <token>`，复用 `lib/api.ts` 的 `apiRequest`）。SHALL 区分三种响应：200（有宠物，进入展示态）、404（无宠物，进入创建引导态——不是错误）、≥400 非 401（错误态 + 重试）。401 SHALL 清除本地登录态并静默重登（wx.login 无感）后重拉数据。

#### Scenario: 进入页面拉取宠物
- **WHEN** 登录态有效且页面加载，服务端返回 200
- **THEN** 按 PetProfile 字段渲染宠物展示（名称/等级/心情/饥饿等）

#### Scenario: 无宠物进入创建引导
- **WHEN** 服务端返回 404（当前用户尚未创建宠物）
- **THEN** 页面展示创建引导（物种选择 + 命名表单），不展示错误态

#### Scenario: 请求失败展示错误与重试
- **WHEN** 请求失败（网络错误或服务端 ≥400，且非 401、非 404）
- **THEN** 页面展示错误提示（后端 `message` 或兜底文案）与重试入口，不崩溃

#### Scenario: 401 未授权处理
- **WHEN** 服务端返回 401（token 失效）
- **THEN** 清除本地登录态（access/refresh/user），自动静默重登并重拉数据；重登失败才展示错误提示与重试入口

### Requirement: 宠物创建（无宠物引导）
当宠物不存在（404）时，页面 SHALL 提供创建表单：`species` 二选一（ORANGE_CAT / SHIBA_INU，中文标签对应懒猫/柴犬）+ `name`（必填，`CreatePetRequest.name` maxLength 30，缺失/超长时提示不提交）。提交调用 `POST /api/v1/pets/me`（请求体 `CreatePetRequest {species, name}`），201 成功后进入已养展示态；失败展示后端 `message` 或兜底文案。

#### Scenario: 物种二选一
- **WHEN** 用户打开创建引导
- **THEN** 提供懒猫（ORANGE_CAT）/柴犬（SHIBA_INU）两个互斥选项，可切换选择

#### Scenario: 命名校验
- **WHEN** 用户提交空名称或超 30 字的名称
- **THEN** 展示「名称不能为空」/长度提示，不发起创建请求

#### Scenario: 创建宠物成功
- **WHEN** 用户选择物种、填写名称并提交
- **THEN** 调用 `POST /pets/me`（201），成功后页面从创建引导切换为已养展示态（名称/物种/初始数值）

#### Scenario: 创建失败提示
- **WHEN** 创建请求失败（且非 401）
- **THEN** 展示错误提示（后端 `message` 或兜底文案），保持创建表单状态，可修改后重试

### Requirement: 喂食与玩耍互动
页面 SHALL 支持两种互动：喂食（`FEED`，使用默认最便宜食物，不指定 itemId/quantity）与玩耍（`PLAY`）。点击互动按钮调用 `POST /api/v1/pets/me/interact`（请求体 `InteractRequest {type}`），成功后以 `InteractionResult` 反馈展示变化（`moodChange`/`hungerChange`/`experienceGain`/`coinChange` 带符号数值，及 `newMood`/`newHunger`/`newExperience` 同步展示状态），并重新拉取宠物数据对账；失败展示错误提示并保持原状态，不产生假变化。

#### Scenario: 喂食互动
- **WHEN** 用户点击「喂食」
- **THEN** 调用 `POST /pets/me/interact`（body `{type: 'FEED'}`），成功后展示心情/饥饿/经验变化反馈与宠物反馈动画，状态数值更新

#### Scenario: 玩耍互动
- **WHEN** 用户点击「玩耍」
- **THEN** 调用 `POST /pets/me/interact`（body `{type: 'PLAY'}`），成功后展示互动结果反馈，状态数值更新

#### Scenario: 互动失败保持原状态
- **WHEN** 互动请求失败（网络错误或服务端 ≥400，且非 401）
- **THEN** 展示错误提示（后端 `message` 或兜底文案），宠物状态数值保持原值，不产生假变化

#### Scenario: 互动中防重复提交
- **WHEN** 互动请求进行中用户再次点击互动按钮
- **THEN** 不发起重复请求（按钮置忙/请求互斥），避免重复喂食

### Requirement: 游走动画（shared/pet 引擎复用）
宠物页 SHALL 复用 `@daily-schedule/shared/pet` roam engine 实现宠物游走动画：初始化时以视口尺寸调用 `createDefaultConfig(viewportW, viewportH)`，循环使用 `computeNextTarget`（`wandering` 模式）生成游走目标，宠物视图通过绝对定位移动 + 过渡动画实现位移，到达目标后按随机间隔（`randomWanderInterval`/`randomMoveDuration`）产生下一跳，全程受视口边界约束（wandering 目标计算内部 clamp，宠物不越界）。互动（喂食/玩耍）成功时 SHALL 播放反馈动画（缩放弹跳/气泡）。页面隐藏或卸载 SHALL 清理游走定时器，不产生内存泄漏。

#### Scenario: 进页面开始游走
- **WHEN** 宠物页加载完成且游走容器尺寸已知
- **THEN** 宠物从初始位置按 wandering 目标移动，到达后停留随机间隔再移动下一跳，移动过程平滑（过渡动画）

#### Scenario: 视口尺寸适配
- **WHEN** 游走容器尺寸小于实际视口或窗口尺寸变化
- **THEN** 游走目标受视口约束在容器内，宠物不越界

#### Scenario: 互动反馈动画
- **WHEN** 喂食或玩耍互动成功
- **THEN** 宠物播放反馈动画（缩放弹跳或气泡提示），动画结束后恢复游走

#### Scenario: 卸载清理定时器
- **WHEN** 页面隐藏或卸载
- **THEN** 游走定时器全部清理，无残留定时器（返回页面后游走正常恢复）

### Requirement: 小程序宠物 API 客户端封装
小程序 SHALL 新增 `lib/pet.ts`：宠物类型映射（`PetProfile`/`InteractionResult`）与响应校验（字段缺失/类型不符时抛「宠物数据格式异常」）、`fetchMyPet()`（200 返回宠物、404 返回 null——区分业务态与错误）、`createPet(input)`、`interactWithPet(type)` 封装（复用 `lib/api.ts` 的 `apiRequest`：Bearer 注入、≥400 抛后端 message、401 特判抛 `UnauthorizedError`）。数值换算 SHALL 以纯函数实现（如心情/饥饿值 → 展示标签与条宽比例）。宠物 API 的新增 SHALL NOT 重复实现错误处理逻辑。

#### Scenario: Bearer 注入与错误透传
- **WHEN** 本地存在 accessToken 且发起宠物请求
- **THEN** 请求头携带 `Authorization: Bearer <accessToken>`；服务端 ≥400 抛后端 `message` 的 `Error`，401 抛 `UnauthorizedError`

#### Scenario: 404 映射为无宠物
- **WHEN** `GET /pets/me` 返回 404
- **THEN** `fetchMyPet()` 返回 `null`（不抛错），页面据此进入创建引导态

#### Scenario: 响应校验
- **WHEN** 宠物响应含非法字段（如 name 非字符串/缺失、species 非枚举值）
- **THEN** 抛出「宠物数据格式异常」，不进入渲染

#### Scenario: 数值换算纯函数
- **WHEN** 输入 0-100 的心情/饥饿值
- **THEN** 返回对应的展示标签与条宽比例（0-100%），非法值安全兜底
