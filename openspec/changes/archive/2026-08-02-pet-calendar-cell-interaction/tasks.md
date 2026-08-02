# Tasks: pet-calendar-cell-interaction

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更（纯前端）
- [x] 1.2 N/A — 无 H2 schema 变更
- [x] 1.3 N/A — 无需 Flyway 验证

## 2. 领域层 (domain/)
- [x] 2.1 `packages/shared/src/pet/roaming.ts` — `Zone.payload` 类型收紧：`ZonePayload` 按 ZoneType 泛型映射（`calendar-cell` → `{ date: string; completion: number }`，其余无 payload）；`index.ts` 导出更新

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 N/A
- [x] 3.2 N/A
- [x] 3.3 N/A — 无后端代码

## 4. 应用层 (application/)
- [x] 4.1 N/A
- [x] 4.2 N/A — 无后端代码

## 5. API 层 (api/)
- [x] 5.1 N/A
- [x] 5.2 N/A
- [x] 5.3 N/A — 无后端代码

## 6. 契约同步
- [x] 6.1 N/A — openapi.yaml 无变更（纯前端行为）
- [x] 6.2 更新 specs/CHANGELOG.md — 新增 3.3.3 条目（无 API 契约变更，版本号随前端发布同步）
- [x] 6.3 同步版本号: pom.xml + package.json + openapi.yaml → 3.3.3
- [x] 6.4 N/A — 无契约变更，无需 mvn compile 重新生成
- [x] 6.5 N/A — 无契约变更，无需 generate:api

## 7. 前端 (frontend/src/)
- [x] 7.1 `modules/calendar/components/CalendarView.tsx` — 新增 useEffect：view === 'month' 时 querySelectorAll `.rbc-day-bg-cell` 批量注册 calendar-cell Zones（id `calendar-cell-<data-date>`，payload 完成度）；视图切换/卸载注销；scroll(capture)/resize + rAF 节流更新 rect；events 变化时重注册（完成度刷新）
- [x] 7.2 `modules/pet/components/RoamingPet.tsx` — 游走 tick 检测进入 calendar-cell Zone → 启动往返 timer（2-4s 格内左右交替）；离开格子停止往返恢复游走；完成度 ≥50% → happy+快、<50% → sad/懒散+慢；进窝休息优先（pet-spot 检测先行）
- [x] 7.3 N/A — 无页面集成变更（CalendarView/RoamingPet 内改动）
- [x] 7.4 N/A — 无新样式（复用既有情绪动画与移动时长）
- [x] 7.5 编写/更新 vitest 单元测试：
  - shared 类型测试（roaming.test.ts）— payload 类型映射编译期验证 + 完成度结构
  - RoamingPet.test.tsx — 进入 calendar-cell 启动往返、完成度决定情绪/速度、离开停止、进窝优先
- [x] 7.6 N/A — 往返为时间敏感的游走行为（2-4s timer + 10-30s tick 随机性），不适合 E2E 稳定断言；由 7.5 vitest + 9.4 smoke 覆盖
- [x] 7.7 运行 `npm run test:e2e` 确认既有 E2E 全部通过（33 passed + 1 skipped）

## 8. 文档同步
- [x] 8.1 N/A — 无新前端组件（CalendarView/RoamingPet 为既有组件，行为变更不入组件清单；如新增 lib 文件则补）
- [x] 8.2 N/A — 无新实体/表/字段
- [x] 8.3 N/A — 无新 API 端点
- [x] 8.4 核心能力描述补充"日程框互动" → `CLAUDE.md`

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过（45 文件 191 用例）
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过（33 passed + 1 skipped）
- [x] 9.4 Smoke test — Playwright 浏览器实测日程框互动（全部通过）：
  - [x] 月视图 42 格注册 + 日期索引映射正确（今天格子 payload.date 与系统日期一致）
  - [x] 创建日程并标记完成 → 格子完成度实时刷新为 100
  - [x] 注入高完成度格子 → 格内左右往返（位置在格内边缘交替）+ happy 情绪
  - [x] 注入低完成度/无事件格子 → 懒散（idle_variant）情绪
  - [x] 注入小窝 → 进窝休息优先于格内互动
