# Design: 宠物状态持久化（刷新不丢陪伴感）

## Context

`petStore` 是纯内存 Zustand store（`create<PetStore>((set, get) => ...)`，无任何中间件）。宠物游走引擎（RoamingPet rAF/tick）以 `store.position` 为唯一位置源，位置随游走持续积累；夜间回窝/休息态（`isResting`）是长时间行为状态。刷新页面后 store 重建，位置回到默认 (100,100)、休息态丢失——陪伴感断裂。宠物数值状态（mood/hunger/coins）已由后端 `pets` 表 + 30s 轮询承载，本变更不触碰。

约束：zustand v5（`zustand/middleware` 提供 persist）；jsdom 测试环境有 localStorage；store 单例在模块 import 时创建（rehydrate 在创建时同步完成，localStorage 同步读取）。

## Goals / Non-Goals

**Goals:**
- 刷新后恢复：position / facing / isResting / 稳定情绪（idle/idle_variant/hungry/sleepy）
- 瞬态情绪不残留（happy/sad/excited/surprised 归一 idle）
- 窗口尺寸变化后位置越界钳制，保证宠物始终可见

**Non-Goals:**
- 后端数值状态持久化（已有后端轮询）
- 跨设备同步 / IndexedDB 迁移
- 定时器恢复（瞬态情绪本身不持久化，stateTimer 不落盘）
- 瞬态 UI 状态恢复（action/粒子/气泡/连击——恢复即错乱，明确不持久化）

## Decisions

### Decision 1: 使用 zustand `persist` 中间件（而非手动 subscribe + localStorage）
- **选择**: `create<PetStore>()(persist((set, get) => ({...}), { name: 'pet-roaming-state', version: 1, partialize, merge }))`
- **理由**: zustand 官方方案——自动订阅写入、hydrate 恢复、版本管理内建；`partialize` 精确控制落盘子集（白名单/归一在入口一处）；手动 subscribe 需自写节流/恢复/版本代码，易与 setState 时机纠缠。
- **备选方案**: ① 手动 `store.subscribe` 全量序列化——瞬态字段误落盘 + 定时器句柄不可序列化会直接抛错；② RoamingPet 组件内 effect 保存/恢复——持久化逻辑与组件生命周期耦合，侧边栏/详情页不共享。

### Decision 2: 白名单 `partialize` + 情绪归一在 partialize 内完成
- **选择**: `partialize: (s) => ({ position: s.position, facing: s.facing, isResting: s.isResting, emotionState: STABLE_EMOTIONS.has(s.emotionState) ? s.emotionState : 'idle' })`，`STABLE_EMOTIONS = new Set(['idle','idle_variant','hungry','sleepy'])`
- **理由**: 归一在"写入侧"单点完成——恢复侧拿到的一定是合法稳定值，无需双端校验；白名单外字段（含 timer 句柄）天然不进序列化。
- **备选方案**: 恢复侧（merge）过滤——写入侧仍会尝试序列化瞬态情绪，且 merge 需处理非法值防御，双端逻辑分散。

### Decision 3: 恢复侧 `merge` 做视口钳制
- **选择**: `merge: (persisted, current) => { const p = persisted as Partial<...>; let pos = p.position ?? current.position; if (typeof window !== 'undefined') { pos = clampToViewport(pos) } return { ...current, ...p, position: pos } }`，钳制范围 `x ∈ [0, max(0, innerWidth - 90)]`、`y ∈ [0, max(0, innerHeight - 90)]`（宠物渲染尺寸 90px，与 RoamingPet 一致）。
- **理由**: 窗口缩放/换屏后旧位置可能越界，恢复即钳制保证可见；`window` 存在性守卫让 jsdom 测试与潜在 SSR 不炸。钳制只在恢复时一次，运行期边界逻辑仍由游走引擎的 Boundary avoidance 负责（职责不重叠）。
- **备选方案**: ① 不钳制——屏外宠物"消失"，用户只能等下一 tick 随机回界内；② RoamingPet 挂载时钳制——恢复后到挂载间有窗口期，且各消费方（SidebarPet 不消费 position，无冲突但语义分散）。

### Decision 4: 瞬态字段与版本策略
- **选择**: 瞬态字段（action/particleTrigger/feedbackTrigger/bubbleMessage/selectionOpen/timers/comboCount/lastInteractionTime）不进 partialize，刷新后回默认；`version: 1` 起步，未来字段结构变更时 `migrate` 升级。
- **理由**: timers 句柄无法 JSON 序列化（persist 会静默丢弃而非报错——白名单更明确）；动作/粒子恢复会造成"刷新即 eat/粒子残留"的错乱体验。
- **备选方案**: 全量持久化 + 自定义 replacer——复杂度无收益。

## DDD Layer Design

### 前端 (frontend/src/)
- `modules/pet/store/petStore.ts`：
  - import `persist` from `zustand/middleware`；`create<PetStore>()(persist(...))` 包裹现有实现
  - 新增模块级常量 `STABLE_EMOTIONS`、`clampPositionToViewport(pos): Position`（export 供测试）
  - `reset()` 保持现状（persist 会随后写入默认值，等效清空持久化）
- `RoamingPet` / `SidebarPet` / `PetPage` **零改动**（消费 store 位置/情绪的方式不变，恢复在 store 创建时已完成）
- 后端/API/数据库：无变更

## API Design
- 无（纯前端，无契约变更，三处版本号不动）

## Database Design
- 无（localStorage `pet-roaming-state`，不入库）

## Risks / Trade-offs

- [**多标签页写冲突**]（两个标签页各自写 localStorage，后写覆盖）→ 与 zustand persist 默认行为一致（单机单标签场景为主，可接受）；未来多标签同步再引入 storage 事件监听
- [**jsdom 测试间 localStorage 泄漏**]（persist 每次 setState 写入，同文件测试共享 jsdom localStorage）→ 既有测试在 beforeEach 显式 setState 重置，且 store 单例只在 import 时 rehydrate 一次，无跨测试恢复污染；新测试用例自行 `localStorage.clear()` 隔离
- [**持久化 schema 演进**]（未来新增字段）→ version + migrate 内建升级通道
- [**90px 钳制常量与渲染尺寸耦合**] → 与 RoamingPet `PetAvatar size={90}` 同步注释注明；若未来尺寸可变，钳制改读常量

## Migration Plan

1. 纯前端代码变更，`pnpm run verify` 通过后随下次前端发布上线
2. 老用户首访：无 `pet-roaming-state` 记录 → 走默认值，无感
3. 回滚：移除 persist 中间件即可；localStorage 残留无害（不被读取）
4. 清理：开发者可 `localStorage.removeItem('pet-roaming-state')`

## Open Questions

- 无（范围收敛，依赖 pet-roaming-system 的 Boundary avoidance 与 pet-store 现状均无冲突）
