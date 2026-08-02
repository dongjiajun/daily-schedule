# Design: pet-home-zone

## Context
宠物游走系统已有完整区域感知基础设施（pet-roam-polish 交付）：`Zone` 类型含 `pet-spot` 类型定义、zoneRegistry（registerZone/updateZoneRect/removeZone，decayTime 自动衰减）、RoamingPet 游走循环（10-30s tick，几何检测基于缓存矩形）。但 `pet-spot` 类型目前无实际注册方——宠物没有"家"。

物理位置现状：Sidebar 底部常驻 `SidebarPet`（迷你精灵 + 状态摘要，点击跳转 /pet），是页面上唯一常驻的宠物专属区域，天然适合作为小窝。SidebarPet 属于 pet 模块（`modules/pet/components/`），直接 import pet 模块的 zoneRegistry 无跨模块耦合。

## Goals / Non-Goals

**Goals:**
- SidebarPet 区域注册为 `pet-spot` Zone，宠物游走到此自动进窝休息
- 进窝检测复用游走循环 tick 的几何检测节奏，不引入逐帧 DOM 查询
- 进窝后停留（不继续随机漫步），用户交互唤醒后恢复游走
- 2 分钟无交互的既有 resting 行为升级为"走向小窝"而非随机角落

**Non-Goals:**
- 不新增 API 端点 / 数据库字段（纯前端）
- 不做小窝外观渲染（窝棚/垫子 UI）——SidebarPet 自身即小窝视觉
- 不做小窝内多宠物 / 宠物可饲养进窝交互

## Decisions

### Decision 1: pet-spot Zone 由 SidebarPet 组件自注册
- **选择**: SidebarPet 挂载时（useEffect）读取自身 DOM 矩形注册 `pet-spot` Zone（id `pet-home-spot`），返回注销函数在卸载时调用；scroll（capture）/resize 事件驱动 `updateZoneRect` 刷新矩形
- **理由**: SidebarPet 拥有小窝 DOM 位置，组件生命周期天然映射 Zone 生命周期（挂载=注册、卸载=注销）；属于 pet 模块，直接使用模块内 zoneRegistry，不引入跨模块通信；与 spec "Rect update is event-driven"（禁止全 body MutationObserver）一致
- **备选方案**: 由 RoamingPet 全局注册——需跨组件拿 DOM 引用，且 SidebarPet 卸载后需额外清理逻辑，生命周期不内聚；由 layout 模块（Sidebar.tsx）注册——layout 非 pet 模块，引入跨模块 import 耦合

### Decision 2: 进窝检测挂在游走循环 tick，需"进入边沿"防重复触发
- **选择**: 游走循环每个 tick 开头检测 `position`（目标位置）是否落入 `pet-spot` Zone 缓存矩形（纯数学相交）；用 `wasInHomeRef` 记录上一 tick 是否在窝内，仅当 `!wasInHomeRef && inHomeNow`（进入边沿）才 `startResting()`。resting 中目标保持在小窝中心附近（`zoneCenter`），不再排程全域 wandering 目标
- **理由**: 与 spec "Enter detection follows roam cadence" 的节奏约束一致；基于 position（动画终点）检测语义稳定（动画到达即在该处）；边沿检测解决"唤醒后 position 仍在窝内 → 下一 tick 立即再次进窝"的抖动（用户交互唤醒后，宠物先移动离开窝区，`wasInHomeRef` 重置为 false 后才可再次进窝）
- **备选方案**: 独立高频检测器——违反性能约束（禁止逐帧 DOM 查询）；framer-motion `onAnimationComplete` 钩子——仅覆盖单次动画，游走循环每 tick 的目标变化都需独立处理，状态分散

### Decision 3: 既有 resting 模式目标升级为小窝中心
- **选择**: 无交互 2 分钟触发的 resting 分支（`computeNextTarget(..., 'resting')`）改为：存在 `pet-spot` Zone 时目标 = `zoneCenter(pet-spot)`（接近小窝，到达即触发进窝休息），不存在时 fallback 现有 resting 目标
- **理由**: 与 spec "Move to resting spot" 场景一致（休息点 = 宠物小窝区域）；复用已就位的 `zoneCenter` 与 attracted 目标逻辑，改动最小
- **备选方案**: 单独维护 resting 预设点列表——与 zoneRegistry 机制重复，两套休息点来源易漂移

## DDD Layer Design

### 领域层 (domain/)
无变更（纯前端行为）。

### 基础设施层 (infrastructure/)
无变更。

### 应用层 (application/)
无变更。

### API 层 (api/)
无变更。

### 前端 (frontend/src/)
- `modules/pet/components/SidebarPet.tsx`：新增 useEffect——宠物存在时读取按钮区域 `getBoundingClientRect()` 注册 `pet-spot` Zone（id `pet-home-spot`，weight 1，无 decayTime 常驻）；返回注销函数；监听 window scroll（capture）+ resize 更新 rect（复用 RoamingPet 日历网格同一模式）
- `modules/pet/components/RoamingPet.tsx` 游走循环：
  - tick 开头取 `getZones().filter(z => z.type === 'pet-spot')`，计算 `inHomeNow`（position 落入矩形）
  - 边沿检测（`wasInHomeRef` 守卫）→ `startResting()`；resting 时目标 = `zoneCenter(homeZone)` 或当前位置小幅漂移（moveDuration 0.5s 快速到位）
  - resting 分支目标改造（Decision 3）
- `modules/pet/store/petStore.ts`：无新增状态（复用 `isResting` / `startResting` / `wakeUp`）
- `packages/shared/src/pet/`：无引擎变更（Zone 模型 / zoneCenter / computeNextTarget 已就位）

## API Design
无变更（不触碰 specs/openapi.yaml，无需重新生成 SDK）。

## Database Design
无需 Flyway 迁移。

## Risks / Trade-offs
- [进窝检测基于 position（动画终点），宠物动画途中与最终位置瞬时不同步] → resting 时 moveDuration 0.5s 快速到位；检测语义以"目标已确定"为准，行为一致
- [移动端 Sidebar 收起时小窝 rect 失效] → scroll/resize 事件驱动 rect 更新；收起后 rect 不在视口，宠物无法进入（自然不可达）
- [宠物在窝内休息时用户长按交互，wakeUp 与进窝边沿竞态] → 边沿守卫保证唤醒后须先离开窝区才可再进窝，无抖动循环
- [小窝 Zone 与日历网格 soft 避让区不重叠（侧边栏 vs 主区域），无冲突] → 无需处理

## Migration Plan
纯前端增量：无部署顺序要求；回滚 = 还原 SidebarPet / RoamingPet 两文件改动即可，无数据迁移。

## Open Questions
- 进窝休息是否要气泡提示（如"回家休息啦~"）？——默认不加，保持最小行为改动，apply 后按体验反馈再补
