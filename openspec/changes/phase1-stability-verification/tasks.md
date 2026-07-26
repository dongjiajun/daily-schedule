# Tasks: Phase 1 稳定性验证 (M1.6)

通过 Playwright E2E 自动化 32 项 + 手动目视 3 项，验证 Phase 1 Go/No-Go 条件。

## 1. 日历功能 E2E

- [ ] 1.1 编写 `e2e/calendar-crud.spec.ts` — 创建日程 → 月视图可见 → 编辑标题 → 删除
- [ ] 1.2 测试拖拽改期 — `dragTo` 日程到不同日期 → 确认时间更新
- [ ] 1.3 测试状态流转 — COMPLETED 样式变化 → 恢复 PLANNED
- [ ] 1.4 测试标签筛选 — 点击 tag → 仅关联日程可见
- [ ] 1.5 测试 ICS 导出 — 点击导出 → 确认下载触发
- [ ] 1.6 测试视图切换 — 月/周/日/议程 → 每种渲染正确
- [ ] 1.7 测试分类管理 — 创建/修改/删除分类 → 下拉列表刷新

## 2. 宠物事件联动 E2E

- [ ] 2.1 编写 `e2e/pet-events.spec.ts` — 完成日程 → `page.evaluate` 读 petStore 确认 happy + particleTrigger
- [ ] 2.2 测试取消日程 — emotionState = sad + comboCount = 0
- [ ] 2.3 测试三连击 — 完成 3 次 → comboCount = 3 + emotionState = excited
- [ ] 2.4 测试任务完成 — 移任务到 DONE → 触发 task:completed 事件
- [ ] 2.5 测试点击宠物 — RoamingPet click → hearts 粒子触发
- [ ] 2.6 测试侧边栏宠物 — SidebarPet 渲染 + 状态指示点
- [ ] 2.7 手动目视: 粒子爆发动画效果 ⚠️

## 3. 看板功能 E2E

- [ ] 3.1 编写 `e2e/todo-crud.spec.ts` — 导航 /todo → 三列正确渲染
- [ ] 3.2 测试创建任务 — 默认 TODO + MEDIUM → 左列出现
- [ ] 3.3 测试创建完整任务 — 标题/描述/优先级/截止日期/标签
- [ ] 3.4 测试编辑任务 — 修改标题和优先级 → 卡片更新
- [ ] 3.5 测试跨列拖拽 — `dragTo` TODO → DONE → 刷新持久化
- [ ] 3.6 测试同列排序 — `dragTo` 调整顺序 → sortOrder 持久化
- [ ] 3.7 测试列表视图 — 切换 → 表格行展示 → 状态下拉框切换
- [ ] 3.8 测试标签筛选 — 选标签 → 仅关联任务可见
- [ ] 3.9 测试删除 — 任务 + task_tags 级联删除
- [ ] 3.10 测试逾期高亮 — dueDate < today → 红色 `.text-red-*`

## 4. 节日主题 E2E

- [ ] 4.1 编写 `e2e/holiday-theme.spec.ts` — 切换 effectIntensity off/low/full → 确认 EffectLayer 响应
- [ ] 4.2 手动目视: 节日主题 CSS 配色切换 ⚠️
- [ ] 4.3 手动目视: `prefers-reduced-motion` 特效降级 ⚠️

## 5. 边界条件 E2E

- [ ] 5.1 编写 `e2e/edge-cases.spec.ts` — 空数据状态 → 各页面友好空状态
- [ ] 5.2 测试超长标题 — 200 字符 → 不溢出
- [ ] 5.3 测试快速连续操作 — 连续创建 5 日程 → 状态一致
- [ ] 5.4 测试页面刷新 — 创建后 reload → 数据不丢
- [ ] 5.5 测试网络断连 — `page.route` mock → UI 不崩溃

## 6. 验证与收尾

- [ ] 6.1 `cd frontend && pnpm run test` — 167+ 单元测试全绿
- [ ] 6.2 `pnpm run test:e2e` — 全部 E2E 通过
- [ ] 6.3 产出 `docs/phase1-verification-report.md` — Go/No-Go 决策
- [ ] 6.4 更新 `docs/execution-plan.md` — M1.6 ✅
