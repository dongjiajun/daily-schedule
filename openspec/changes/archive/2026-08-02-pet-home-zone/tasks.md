# Tasks: pet-home-zone

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更（纯前端）
- [x] 1.2 N/A — 无 H2 schema 变更
- [x] 1.3 N/A — 无需 Flyway 验证

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无后端变更（shared 引擎 Zone 模型已就位，无需改动）

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
- [x] 6.2 更新 specs/CHANGELOG.md — 新增 3.3.2 条目（无 API 契约变更，版本号随前端发布同步）
- [x] 6.3 同步版本号: pom.xml + package.json + openapi.yaml → 3.3.2
- [x] 6.4 N/A — 无契约变更，无需 mvn compile 重新生成
- [x] 6.5 N/A — 无契约变更，无需 generate:api

## 7. 前端 (frontend/src/)
- [x] 7.1 N/A — petStore 无新增状态（复用现有 isResting/startResting/wakeUp）
- [x] 7.2 SidebarPet.tsx 挂载时注册 `pet-spot` Zone（id `pet-home-spot`，自身 DOM rect + weight 1，无 decay 常驻）；卸载注销；scroll(capture)/resize 事件驱动 updateZoneRect
- [x] 7.3 RoamingPet.tsx 游走循环：tick 检测 position 是否落入 pet-spot Zone 矩形（`wasInHomeRef` 进入边沿守卫 → startResting）；resting 目标优先 = zoneCenter(pet-spot)，不存在时 fallback 现有 resting 目标
- [x] 7.4 N/A — 无新样式/动画（复用现有 sleepy 情绪与 resting 移动时长）
- [x] 7.5 编写/更新 vitest 单元测试：
  - SidebarPet.test.tsx — 注册/注销/rect 更新断言
  - RoamingPet.test.tsx — 进窝边沿检测、唤醒后离开再进窝、resting 目标 zoneCenter 优先
- [x] 7.6 N/A — 游走行为时间敏感（10-30s tick 随机性），不适合 E2E 稳定断言；由 7.5 vitest + 9.4 smoke 覆盖
- [x] 7.7 运行 `npm run test:e2e` 确认既有 E2E 全部通过（33 passed + 1 skipped）

## 8. 文档同步
- [x] 8.1 SidebarPet 组件描述更新（注册宠物小窝 Zone）→ `docs/frontend/component-catalog.md`
- [x] 8.2 N/A — 无新实体/表/字段
- [x] 8.3 N/A — 无新 API 端点
- [x] 8.4 核心能力描述补充"小窝进窝休息" → `CLAUDE.md`

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过（45 文件 187 用例）
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过（33 passed + 1 skipped）
- [x] 9.4 Smoke test — Playwright 浏览器实测进窝闭环（3 项全部通过）：
  - [x] 注入宠物到小窝中心 → 自动进窝休息（isResting=true，位置稳定）
  - [x] 点击宠物 → 唤醒恢复游走（位置变化）
  - [x] 离开小窝后再次回到小窝 → 再次进窝休息
  - [x] 无交互 2 分钟 resting 目标 = 小窝中心（由 vitest 用例覆盖：zoneCenter 断言）
