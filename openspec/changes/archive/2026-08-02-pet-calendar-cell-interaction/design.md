# Design: pet-calendar-cell-interaction

## Context
区域感知机制已就位：`Zone` 类型含 `calendar-cell` 定义与完成度 payload 场景（spec 契约已写但无实现）、zoneRegistry（registerZone/updateZoneRect/removeZone）、RoamingPet 游走 tick（10-30s）+ 小窝进窝（pet-home-zone 交付）。calendar 模块月视图用 react-big-calendar 渲染（`.rbc-month-view` 容器、`.rbc-day-bg-cell` 日期格子，格子带 `data-date` 属性），`useEvents(date, 'month')` 提供当月事件列表（含 status），CalendarSidebar 已有按周 COMPLETED 占比的口径先例。

## Goals / Non-Goals

**Goals:**
- 月视图可见时，每个日期格子注册为 `calendar-cell` Zone（rect + 完成度 payload）
- 宠物进入格子 → 格内左右往返走动（快速节奏，独立于游走 tick）
- 完成度决定速度/情绪风格：≥50% 快+happy，<50% 慢+sad/懒散
- `Zone.payload` 类型收紧（calendar-cell 携带 `{date, completion}`）
- 进窝休息优先于格内互动

**Non-Goals:**
- 不做格子高亮/视觉反馈（宠物互动是唯一表现）
- 不做周/日/议程视图的格子互动（仅月视图有格子概念）
- 不新增 API 端点 / 数据库字段

## Decisions

### Decision 1: calendar-cell Zones 由 CalendarView 注册，视图切换注销
- **选择**: CalendarView 内 useEffect——`view === 'month'` 时 querySelectorAll `.rbc-day-bg-cell` 批量注册（id `calendar-cell-<data-date>`，payload 含完成度）；视图切换（useEffect 依赖 view）或卸载时 `removeZone` 全部注销
- **理由**: CalendarView 是日历 DOM 的唯一所有者（组件生命周期与格子存在期一致）；注册逻辑与视图状态（view）同源，切换视图自动清理；zoneRegistry 是 pet 模块 lib，calendar 模块直接 import（已有 SidebarPet 先例，非跨模块通信通道场景——注册表是数据发布不是事件）
- **备选方案**: pet 模块轮询读取日历 DOM——违反"事件驱动 rect 更新"与模块职责分离；通过 eventBus 广播格子数据——eventBus 是事件通道（一次性通知），Zone 是持续数据（rect+payload），不匹配

### Decision 2: 格子 rect 批量读取 + rAF 节流的事件驱动更新
- **选择**: 注册与更新共用 `refresh()`：一次 querySelectorAll + 批量 getBoundingClientRect（42 格以内，单次成本低）；scroll（capture）/resize 监听用 `requestAnimationFrame` 节流合并（高频滚动下每帧最多一次刷新）
- **理由**: 与 spec "Rect update is event-driven" 一致；42 格 rect 更新每帧一次可接受（纯读操作，无布局写入）；rAF 节流避免滚动事件风暴导致 layout thrash
- **备选方案**: 逐格 MutationObserver——spec 禁止；无节流直接刷新——滚动高频事件下 42 次 getBoundingClientRect 每事件触发，浪费

### Decision 3: 完成度口径 = 当天 COMPLETED 占比，注册时随 events 数据刷新
- **选择**: CalendarView 已有 `useEvents(currentDate, 'month')` 数据——按 `data-date` 对应的当天过滤事件，`COMPLETED / total`（total=全部状态）取整百分比；useEffect 依赖 events + view，事件列表变化（标记完成/新增）时重新注册（同 id 覆盖）
- **理由**: 与 spec "Zone with completion payload" 口径一致；复用组件已有数据（无新查询）；React Query 缓存更新（标记完成 → invalidate → refetch → events 变化）自动驱动重注册，完成度实时反映
- **备选方案**: 单独按天查询——引入 N 次 API 调用（42 格/月），成本高；从 CalendarSidebar 读——跨组件耦合

### Decision 4: 格内往返用独立快速 timer（2-4s），游走 tick 只负责进入/离开检测
- **选择**: RoamingPet 新增往返 timer：检测到 position 落入 calendar-cell Zone 时启动（每 2-4s 在格子内左/右交替点切换目标，y 保持格内固定行）；position 离开格子（任一游走 tick 检测）时停止并恢复游走循环
- **理由**: 游走 tick 10-30s 太慢，"往返走动"需要秒级节奏才有视觉感；独立 timer 与游走循环解耦，互不干扰（往返目标直接指定格子内坐标，不经过 soft 避让采样——往返是行为不是游走）
- **备选方案**: 复用游走 tick——10-30s 一次移动不像"往返"；framer-motion 自动循环动画——需要显式坐标控制（与 store position 同步），复杂且状态分散

### Decision 5: Zone.payload 类型收紧为按类型区分的泛型映射
- **选择**: shared 中 `Zone.payload` 从 `Record<string, unknown>` 改为按 ZoneType 映射的可选 payload：`user-interaction`/`pet-spot` 无 payload，`calendar-cell` 携带 `{ date: string; completion: number }`（completion 0-100 整数）
- **理由**: spec 要求完成度 payload 落地；编译期约束防止消费方拼错结构；shared 包 Web/小程序共用，类型安全双向受益；可选字段（`payload?`）保证现有注册（无 payload）零改动
- **备选方案**: 保持 `Record<string, unknown>` + 运行时断言——失去编译期约束，spec"类型收紧"落空；联合类型整体重写 Zone——破坏现有调用面

### Decision 6: 行为优先级 = 进窝休息 > 格内往返 > 普通游走
- **选择**: tick 检测顺序：先 pet-spot（进窝，含边沿守卫）→ 再 calendar-cell（进入往返）→ 否则正常游走；重叠区域（极小概率）进窝优先
- **理由**: spec "Rest behavior takes precedence"；与变更 B 的进窝逻辑正交（小窝在侧边栏，日历在主区域，实际不重叠，仅防御性排序）
- **备选方案**: 无优先级平铺处理——重叠时行为冲突（往返 vs 休息），需确定性规则

## DDD Layer Design

### 领域层 (domain/)
无后端变更。shared 包（`packages/shared/src/pet/roaming.ts`）类型调整：`ZonePayload` 泛型映射 + `Zone.payload` 可选类型（编译期收紧，运行行为不变）。

### 基础设施层 (infrastructure/)
无变更。

### 应用层 (application/)
无变更。

### API 层 (api/)
无变更。

### 前端 (frontend/src/)
- `modules/calendar/components/CalendarView.tsx`：新增 useEffect——view === 'month' 时注册 calendar-cell Zones（Decision 1/2/3）
- `modules/pet/components/RoamingPet.tsx`：游走 tick 扩展——calendar-cell 进入/离开检测 + 往返 timer 启停（Decision 4/6）
- `packages/shared/src/pet/roaming.ts` + `index.ts`：payload 类型收紧（Decision 5）

## API Design
无变更（不触碰 specs/openapi.yaml，无需重新生成 SDK）。

## Database Design
无需 Flyway 迁移。

## Risks / Trade-offs
- [42 格 rect 批量读取 + scroll 高频事件] → rAF 节流合并，每帧最多一次；纯读操作无布局写入
- [往返 timer 与游走 tick 双 timer 竞态] → 往返 timer 启动/停止仅由 tick 的进入/离开检测驱动（单点控制）；往返目标在格子内，不会触发新的 zone 检测
- [完成度刷新依赖 React Query refetch（标记完成 → invalidate → refetch 异步窗口）] → 注册依赖 events 变化（数据到达后自动重注册），窗口期使用旧完成度（瞬时，可接受）
- [格子 data-date 属性依赖 react-big-calendar 内部结构] → 已由 `.rbc-month-view` 避让区先例验证（RoamingPet 依赖同类 class）；升级 react-big-calendar 需回归验证
- [往返在 soft 避让区（日历网格）内进行] → 往返目标是行为指定坐标（不经 soft 采样），不冲突；游走吸引/采样逻辑不受影响

## Migration Plan
纯前端增量：无部署顺序要求；回滚 = 还原 CalendarView / RoamingPet / shared 类型三处改动即可，无数据迁移。

## Open Questions
- 完成度 0%（无事件当天）的表现：往返速度按"低完成度"处理（慢+懒散）——无事件当天宠物懒散，语义合理；如需区分"无事件"与"有事件未完成"可在 payload 加 total 字段（v2）
