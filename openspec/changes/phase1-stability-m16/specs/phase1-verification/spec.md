# Phase 1 Stability Verification

验证 Phase 1 M1.1-M1.5 实现的五项 Go/No-Go 条件，确认 v4.5（情感核心）就绪。

## ADDED Requirements

### Requirement: 自动化回归门禁
系统 SHALL 在每次提交前通过全部自动化测试（后端 257 用例 + 前端 96 用例），零容忍测试失败。

#### Scenario: 后端全量测试通过
- **WHEN** 执行 `cd backend && mvn test`
- **THEN** 257 个用例全部通过，BUILD SUCCESS

#### Scenario: 前端全量测试通过
- **WHEN** 执行 `cd frontend && pnpm run test`
- **THEN** 96 个用例全部通过，零失败

#### Scenario: Monorepo 构建通过
- **WHEN** 执行 `turbo run build`
- **THEN** shared → frontend 按序构建成功，exit 0

#### Scenario: CI 四道门禁通过
- **WHEN** 推送代码到 GitHub
- **THEN** version-check → backend test → frontend lint → frontend test → frontend build 全部通过

---

### Requirement: 宠物联动端到端
宠物模块 SHALL 正确响应日历和任务模块发出的系统事件，触发情绪变化、粒子特效和对话气泡。

#### Scenario: 完成日程触发宠物开心
- **WHEN** 用户将日程状态变更为 COMPLETED
- **THEN** `event:completed` 事件触发，宠物 emotionState 变为 `happy`，particleTrigger type 为 `stars`，bubbleMessage 包含日程标题

#### Scenario: 取消日程触发宠物失落
- **WHEN** 用户取消日程（CANCELLED）
- **THEN** `event:cancelled` 事件触发，宠物 emotionState 变为 `sad`，连击计数重置为 0

#### Scenario: 三连击触发 excited
- **WHEN** 用户连续完成 3 个日程或任务
- **THEN** comboCount 累积至 3，宠物 emotionState 变为 `excited`

#### Scenario: 点击宠物触发 hearts 粒子
- **WHEN** 用户点击漫游中的 RoamingPet
- **THEN** ParticleBurst 组件以 `hearts` 类型在点击位置爆发

#### Scenario: 取消注册后不再响应事件
- **WHEN** petEventBridge 已 unregister
- **THEN** 发射 `event:completed` 后宠物状态保持 idle，无粒子触发

#### Scenario: 侧边栏迷你宠物可见
- **WHEN** 用户登录后查看侧边栏
- **THEN** SidebarPet 组件渲染，显示当前宠物形象和状态指示点

---

### Requirement: 节日主题自动切换
节日引擎 SHALL 根据当前日期检测对应节日，自动切换主题配色和特效。

#### Scenario: 引擎返回当前节日状态
- **WHEN** 调用 holidayEngine 的节日检测方法（传入当前日期）
- **THEN** 返回匹配的节日对象（如有）或 `null`（非节日日）

#### Scenario: auto 主题根据节日切换
- **WHEN** settingsStore.theme 设为 `'auto'` 且当前日期匹配某节日
- **THEN** `document.documentElement.dataset.theme` 应用对应节日 CSS 变量

#### Scenario: 非节日日无特效渲染
- **WHEN** 当前日期不匹配任何节日
- **THEN** EffectLayer 不渲染任何特效子组件

#### Scenario: 特效强度分级
- **WHEN** settingsStore.effectIntensity 设为 `'off'`
- **THEN** EffectLayer 不渲染任何特效
- **WHEN** 设为 `'full'`
- **THEN** EffectLayer 完整渲染对应特效

#### Scenario: prefers-reduced-motion 自动降级
- **WHEN** 浏览器启用了 `prefers-reduced-motion: reduce`
- **THEN** EffectLayer 自动降级为静态或无动画模式

---

### Requirement: 看板全功能
任务看板模块 SHALL 支持完整 CRUD、三列看板拖拽排序、列表视图切换和标签筛选。

#### Scenario: 创建任务
- **WHEN** 用户点击新建任务按钮，填写标题和可选字段，提交
- **THEN** 任务以默认状态 TODO 和默认优先级 MEDIUM 出现在看板最左侧列

#### Scenario: 三列看板拖拽
- **WHEN** 用户将任务卡片从 TODO 列拖拽到 IN_PROGRESS 列
- **THEN** 任务 status 更新为 IN_PROGRESS，卡片出现在目标列

#### Scenario: 同列内排序
- **WHEN** 用户在同一列内上下拖拽任务卡片
- **THEN** sortOrder 更新并持久化，卡片顺序保持

#### Scenario: 列表视图切换
- **WHEN** 用户点击列表视图按钮
- **THEN** 看板列隐藏，任务以表格行形式展示，含状态下拉框

#### Scenario: 列表视图状态下切换
- **WHEN** 用户在列表视图中通过下拉框将任务状态从 TODO 改为 DONE
- **THEN** 任务行更新，切换回看板视图后卡片出现在 DONE 列

#### Scenario: 逾期日期标红
- **WHEN** 任务的 dueDate < today 且 status ≠ DONE
- **THEN** 截止日期以红色高亮显示

#### Scenario: 删除任务级联清理
- **WHEN** 用户删除一个带标签的任务
- **THEN** task 记录删除，task_tags 关联记录级联删除

#### Scenario: 按标签筛选
- **WHEN** 用户选择一个标签作为筛选条件
- **THEN** 看板仅显示关联该标签的任务

---

### Requirement: 日历功能零退化
Phase 0 的日历模块 SHALL 在 Phase 1 变更后保持全部原有功能正常运行。

#### Scenario: 日程 CRUD 正常
- **WHEN** 用户创建/编辑/删除日程
- **THEN** 操作结果正确反映在日历视图和数据库中

#### Scenario: 日历拖拽改期
- **WHEN** 用户拖拽日程到不同日期
- **THEN** 日程 startTime/endTime 更新，日历视图同步刷新

#### Scenario: 标签筛选
- **WHEN** 用户点击标签 chip 进行筛选
- **THEN** 日历仅显示关联该标签的日程，其他日程隐藏

#### Scenario: ICS 导出
- **WHEN** 用户点击 ICS 导出按钮
- **THEN** 生成合法的 .ics 文件并触发浏览器下载

#### Scenario: SSE 提醒推送
- **WHEN** 设置了 reminderMinutes 的日程即将开始
- **THEN** 浏览器收到 SSE 推送并触发桌面通知
