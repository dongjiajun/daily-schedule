# Tasks: Phase 1 稳定性验证 (M1.6)

本变更不涉及 DDD 层/API/数据库/契约修改，任务聚焦于系统性验证。

## 1. 自动化回归验证

- [x] 1.1 运行 `cd backend && mvn test` — 确认 257 用例全绿，BUILD SUCCESS ✅
- [x] 1.2 运行 `cd frontend && pnpm run test` — 确认 96 用例全绿 ✅
- [x] 1.3 运行 `cd frontend && pnpm run lint` — 确认零 ESLint 错误 ✅
- [x] 1.4 运行 `cd frontend && pnpm run build` — 确认 tsc + Vite 构建通过 ✅
- [x] 1.5 运行 `turbo run build` — 确认 Monorepo 依赖链正确（shared → frontend，2 tasks） ✅
- [ ] 1.6 确认 CI 门禁全部通过（触发 push 或检查 Actions tab）

## 2. 日历功能零退化验证（手动冒烟）

- [ ] 2.1 创建日程 — 选择日期/时间，添加分类和标签，确认日历视图正确显示
- [ ] 2.2 编辑日程 — 修改标题/时间/地点，确认更新后日历刷新
- [ ] 2.3 删除日程 — 确认日历和数据库中均移除
- [ ] 2.4 拖拽改期 — 在月视图拖拽日程到不同日期，确认时间更新
- [ ] 2.5 状态流转 — PLANNED → COMPLETED → PLANNED，确认 UI 样式变化
- [ ] 2.6 标签筛选 — 点击标签 chip，确认日历仅显示关联日程
- [ ] 2.7 ICS 导出 — 点击导出按钮，确认生成合法 .ics 文件
- [ ] 2.8 视图切换 — 月/周/日/议程四种视图，确认日程正确渲染
- [ ] 2.9 分类/标签管理 — 创建/修改/删除分类和标签，确认下拉列表刷新

## 3. 宠物联动端到端验证（手动冒烟）

- [ ] 3.1 创建日程后观察宠物反应 — 确认 bubble 显示"新计划"
- [ ] 3.2 完成日程后观察粒子爆发 — 确认 stars 粒子 + emotionState 变为 happy
- [ ] 3.3 取消日程后观察情绪变化 — 确认 emotionState 变为 sad + comboCount 重置
- [ ] 3.4 连续完成 3 次触发 excited — 确认 comboCount=3 + emotionState=excited
- [ ] 3.5 任务看板中移动任务到 DONE — 确认触发 task:completed 粒子
- [ ] 3.6 点击 RoamingPet — 确认 hearts 粒子爆发
- [ ] 3.7 侧边栏 SidebarPet — 确认迷你宠物形象和状态指示点正常显示

## 4. 节日主题自切验证（手动冒烟）

- [ ] 4.1 启动应用，检查 EffectLayer 是否按当前节日渲染（参考：`packages/shared/src/holiday/` 节日数据）
- [ ] 4.2 settingsStore.theme 设为 `'auto'`，确认 document.dataset.theme 跟随节日变化
- [ ] 4.3 settingsStore.effectIntensity 切换 off/low/full — 确认特效响应
- [ ] 4.4 Chrome DevTools → Rendering → `prefers-reduced-motion: reduce` — 确认特效降级
- [ ] 4.5 非节日日期逻辑验证 — 确认 engine 返回 null 时无特效渲染

## 5. 看板全功能验证（手动冒烟）

- [ ] 5.1 导航到 /todo — 确认三列看板正确渲染（TODO | IN_PROGRESS | DONE）
- [ ] 5.2 创建任务（仅标题）— 确认默认 TODO + MEDIUM，卡片出现在左列
- [ ] 5.3 创建任务（完整字段）— 标题/描述/优先级/截止日期/标签，确认卡片信息完整
- [ ] 5.4 编辑任务 — 修改标题和优先级，确认卡片更新
- [ ] 5.5 拖拽 TODO → IN_PROGRESS → DONE — 确认状态持久化，刷新后不丢失
- [ ] 5.6 同列内拖拽排序 — 确认 sortOrder 更新，卡片顺序保持
- [ ] 5.7 切换到列表视图 — 确认信息展示完整，状态下拉框可切换
- [ ] 5.8 标签筛选 — 选择标签，确认看板仅显示关联任务
- [ ] 5.9 删除任务 — 确认任务和关联 task_tags 级联删除
- [ ] 5.10 逾期日期标红 — 设置 dueDate < today，确认红色高亮

## 6. 边界条件与容错验证

- [ ] 6.1 空数据状态 — 无日程/无任务/无宠物时，各页面展示友好空状态
- [ ] 6.2 超长标题（200 字符）— 确认 UI 不溢出/不截断异常
- [ ] 6.3 快速连续操作 — 连续创建 5 个日程，确认状态一致无重复
- [ ] 6.4 页面刷新 — 创建日程后刷新，确认数据不丢失
- [ ] 6.5 网络断连恢复 — DevTools Offline → Online，确认 UI 不崩溃

## 7. 缺陷修复（如发现）

- [ ] 7.1 记录所有发现的缺陷，按 P0/P1/P2 分级
- [ ] 7.2 修复 P0 级缺陷（阻断核心流程的），重新验证
- [ ] 7.3 P1 级缺陷根据影响评估决定是否在 M1.6 内修复或记录到 Phase 2 backlog

## 8. 产出验证报告

- [ ] 8.1 编写 `docs/phase1-verification-report.md` — 按 Go/No-Go 五项条件汇总验证结果
- [ ] 8.2 记录验证通过/失败的具体场景和证据
- [ ] 8.3 做出 Go/No-Go 决策

## 9. 文档同步

- [ ] 9.1 如有缺陷修复涉及代码变更，更新 `docs/frontend/component-catalog.md`
- [ ] 9.2 如有架构调整，更新 `docs/architecture.md` + `CLAUDE.md`
- [ ] 9.3 更新 `docs/execution-plan.md` — M1.6 状态从 "待执行" 改为 "✅ 完成"
