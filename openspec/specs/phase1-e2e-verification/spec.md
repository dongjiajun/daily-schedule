# Phase 1 E2E Verification

编写 Playwright E2E 用例验证 Phase 1 Go/No-Go 五项条件，替代手动冒烟 checklist。

## ADDED Requirements

### Requirement: 日历 CRUD E2E
系统 SHALL 通过 Playwright E2E 验证日历日程的创建、编辑、删除、拖拽、状态流转、标签筛选、ICS 导出、视图切换、分类管理。

#### Scenario: 创建日程后在月视图中可见
- **WHEN** 登录后通过日历 UI 创建带分类和标签的日程
- **THEN** 月视图中出现该日程，标题/时间/分类颜色正确

#### Scenario: 拖拽日程改期
- **WHEN** 在月视图中将日程从日期 A 拖到日期 B
- **THEN** 日程 startTime 更新为日期 B，日历视图刷新

#### Scenario: 状态流转 UI 变化
- **WHEN** 将日程标记为 COMPLETED 再恢复为 PLANNED
- **THEN** DOM 样式反映对应状态（完成=删除线或灰色）

---

### Requirement: 宠物事件联动 E2E
系统 SHALL 通过 Playwright E2E 验证日程/任务事件触发宠物反应的正确性。

#### Scenario: 完成日程触发宠物反应
- **WHEN** 完成一个日程
- **THEN** petStore emotionState 变为 `happy`，particleTrigger 非空

#### Scenario: 三连击触发 excited
- **WHEN** 连续完成 3 个日程
- **THEN** comboCount = 3，emotionState = `excited`

#### Scenario: 取消日程重置连击
- **WHEN** 连击 > 0 时取消一个日程
- **THEN** comboCount 重置为 0，emotionState 变为 `sad`

---

### Requirement: 看板 CRUD E2E
系统 SHALL 通过 Playwright E2E 验证任务看板的创建、编辑、拖拽排序、视图切换、标签筛选、删除。

#### Scenario: 创建任务默认状态
- **WHEN** 在看板中创建仅含标题的任务
- **THEN** 任务以 TODO 状态、MEDIUM 优先级出现在左列

#### Scenario: 跨列拖拽持久化
- **WHEN** 将任务卡片从 TODO 拖到 DONE，刷新页面
- **THEN** 任务仍在 DONE 列

#### Scenario: 逾期日期红色高亮
- **WHEN** 任务 dueDate < today 且 status ≠ DONE
- **THEN** 截止日期以红色样式渲染

---

### Requirement: 边界条件 E2E
系统 SHALL 通过 Playwright E2E 验证空数据、超长输入、快速操作、页面刷新等边界场景的容错表现。

#### Scenario: 空数据友好展示
- **WHEN** 新注册用户无日程/无任务/无宠物
- **THEN** 各页面展示空状态提示，无 JS 异常

#### Scenario: 页面刷新数据不丢失
- **WHEN** 创建日程后刷新页面
- **THEN** 日程仍在日历中显示

---

### Requirement: 手动目视验证
系统 SHALL 通过手动目视确认粒子动画、节日主题视觉效果等无法可靠自动化的场景。

#### Scenario: 粒子爆发动画
- **WHEN** 完成日程触发粒子效果
- **THEN** 肉眼可见 stars/hearts 粒子从触发点扩散

#### Scenario: 节日主题自动切换
- **WHEN** 当前日期匹配某节日且 theme 设为 `auto`
- **THEN** 页面配色切换为对应节日主题
