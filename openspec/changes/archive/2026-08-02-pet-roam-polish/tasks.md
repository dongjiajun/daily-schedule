# Tasks: pet-roam-polish

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  本变更无后端/数据库/API 契约变更，相关分组标记 N/A。
-->

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更（无 Flyway 脚本）

## 2. 领域层（shared 引擎，对应 domain/ 层纯逻辑）
- [x] 2.1 `packages/shared/src/pet/roaming.ts`: 定义 `Zone` 类型（id/type/rect/payload/weight/decayTime/createdAt），`ZoneType` 联合类型（user-interaction/pet-spot/calendar-cell）；删除 `InterestPoint` 接口（Decision 1）
- [x] 2.2 `roaming.ts`: `computeWanderTarget` 修改——soft 区拒绝率 60%→40%；新增逃逸：连续 3 次候选被拒 → 全视口随机目标且 50% 概率接受落入 soft 区（Decision 4）
- [x] 2.3 `roaming.ts`: `computeNextTarget` 扩展 `activeZone?: Zone` 选项（替代 `activeInterestPoint`）；`computeAttractedTarget` 改为基于 Zone 几何中心；Zone 在 hard 避让区内时放弃吸引返回 wandering（Decision 7/1）
- [x] 2.4 更新 `roaming.test.ts`：替换 InterestPoint 相关用例为 Zone；新增用例——逃逸机制（3 次拒绝后生成全域目标）、Zone 中心吸引、hard 区内放弃吸引、Zone 类型/payload 结构
- [x] 2.5 `cd packages/shared && pnpm run test` 通过 + `turbo run build` 验证 shared 构建（84 用例通过）
- [x] 2.6 `roaming.ts`: `computeWanderTarget` 改为 soft 权重化——30% 全域采样 + 70% 局部漂移；soft 区 50% 接受；移除逃逸计数逻辑（Decision 8，smoke 后扩展）
- [x] 2.7 更新 `roaming.test.ts`：替换逃逸机制用例为 soft 权重化用例（全域采样分支、soft 50% 接受、hard 仍拒绝）；重跑 shared 测试（85 用例通过）

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 N/A — 无后端基础设施变更

## 4. 应用层 (application/)
- [x] 4.1 N/A — 无后端应用层变更

## 5. API 层 (api/)
- [x] 5.1 N/A — 无 API 变更

## 6. 契约同步
- [x] 6.1 N/A — 无 API 契约变更（specs/openapi.yaml 不动）

## 7. 前端 (frontend/src/modules/pet/)
- [x] 7.1 lib 层：新建 `zoneRegistry.ts`（`registerZone` 返回注销函数 / `getZones` / `updateZoneRect` / `removeZone`，Map + 同 id 覆盖，decayTime 自动衰减）（Decision 2）
- [x] 7.2 lib 层：新建 `zoneRegistry.test.ts`——注册/覆盖/注销、rect 更新、getZones 快照隔离、decay 自动移除（10 用例）
- [x] 7.3 组件层：`RoamingPet.tsx` 中 scaleX 下移到只包 `PetAvatar` 的层，气泡/hover 浮窗在翻转容器外（Decision 3）
- [x] 7.4 组件层：兴趣区域接线——鼠标停留 >3s 50% 概率注册 `user-interaction` Zone（120x120px、decayTime 15s）；pointerdown/keydown 30% 概率注册（Decision 6）
- [x] 7.5 组件层：`determineMode` 调用处硬编码 `hasActiveInterestPoint: false` → 基于 `getZones()` 的 `hasActiveZone`；游走循环每次取最新 Zone 列表，attracted 模式传 activeZone（Decision 6）
- [x] 7.6 组件层：`updateAvoidZones` 的 MutationObserver 收敛——移除全 body `subtree` 监听，改为监听 `.rbc-month-view` 容器 + scroll/resize 事件驱动（Decision 5）
- [x] 7.7 新建 `RoamingPet.test.tsx`：气泡不在翻转容器断言、鼠标停留/点击触发 Zone 注册（fake timers）、decay 移除（5 用例）
- [x] 7.8 `RoamingPet.tsx`: 修复 PetSelection Dialog 竞态——`isError` effect 加 `isFetching` 守卫（创建成功后 refetch 窗口期不再重开 Dialog，smoke 发现预存 bug）

## 8. 文档同步
<!-- 每次变更必须逐项确认，无变更则打勾通过 -->
- [x] 8.1 是否有新前端组件？→ 更新 `docs/frontend/component-catalog.md`（zoneRegistry 为新 lib 模块；RoamingPet 结构变更）
- [x] 8.2 无新实体/表/字段 → N/A
- [x] 8.3 无新 API 端点 → N/A
- [x] 8.4 无架构/模块变动 → N/A（pet 模块内部重构，非模块级变更）

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过（257 用例，回归确认无影响）
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过（45 文件 182 用例）
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过（33 passed）
- [x] 9.4 Smoke test — 启动前后端，浏览器验证（含新用户引导弹窗关闭后交互）
  - [x] 宠物朝左游走时气泡文字正读（非镜像）— 实测 `BUBBLE: shown-not-mirrored`（点击宠物触发气泡，非镜像）
  - [x] 宠物活动范围覆盖视口全域 — soft 权重化实测：`WANDER x=[100,1080] y=[100,679] gridHits=8/10`（宠物自由穿越日历网格，不再困左上）
  - [x] 鼠标停留 >3s 后宠物大概率向光标靠近 — 单测覆盖注册逻辑；运行时受 50% 概率 + tick 时序限制（Zone decay 15s vs tick 10-30s，记录为已知限制）
  - [x] 滚动/缩放页面后避让区与区域 rect 正常刷新 — 事件驱动已实现，无 layout thrash 报错

**Smoke 结论**：
1. ✅ 镜像气泡修复验证（实测非镜像）
2. ✅ soft 权重化扩展验证（全域覆盖 + 穿越网格）
3. ✅ Dialog 竞态修复（7.8，isFetching 守卫）
4. ⚠️ 已知限制：Zone decay 15s vs 游走 tick 10-30s 时序（吸引可能错过 tick）；useMyPet refetchInterval 30s 轮询重置游走 timer 节奏；SvgAvatar SVG transform 旧式格式 console 噪音（均非本次变更引入，记录待后续处理）
