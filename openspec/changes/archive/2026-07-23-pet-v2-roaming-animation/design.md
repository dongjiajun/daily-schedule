# Design: 宠物系统 v2 — 角色化游走 & Lottie 动画引擎

## Context

Pet v1 核心骨架已完成（DDD 后端 + emoji 前端 + 事件桥接 + 主题化面板），但视觉表现力与交互情感化不足。路线图将宠物定位为"体验层"——所有模块的体验汇集点和反馈源。v2 目标是将宠物从"UI 组件"升级为"页面上的独立角色"。

约束: 无后端变更、无 API 变更、无数据库变更。微信小程序路径通畅（Phase 2）。

## Goals / Non-Goals

**Goals:**
- 宠物以独立角色精灵（非卡片）在页面自由漫步
- Lottie 动画引擎集成（SVG 插画为过渡）
- 情绪状态机驱动 8 种动画状态
- 触摸式交互（点击摸头/双击玩耍/拖拽喂食）
- 互动粒子爆发特效
- 侧边栏迷你宠物常驻

**Non-Goals:**
- 不改动后端 API / 数据库
- 不引入音效
- 不实现装扮/进化系统（那是宠物 v3）
- 不实现小程序端（Phase 2 独立实现）

## Decisions

### Decision 1: 动画引擎 — Lottie
- **选择**: `lottie-react` (Web) + 应用层状态机管理片段切换
- **理由**: 微信小程序 `lottie-miniprogram` 官方支持，跨平台路径畅通。LottieFiles 市场素材丰富降低设计师依赖。
- **备选方案**: Rive — 状态机原生支持更优，但小程序无官方运行时，需自建 Canvas 桥接 → 否决。

### Decision 2: 中间过渡 — SVG 插画先行
- **选择**: 先用 SVG 插画组件实现视觉升级，Lottie 动画文件后台制作
- **理由**: 动画资源制作周期长（需要设计师产出 `.json` 文件），SVG 可以在不依赖外部资源的情况下立即提升视觉质量。接口设计保持 `PetAvatar` 组件不变，内部切换渲染引擎。
- **备选方案**: 直接空降 Lottie → 否决（阻塞开发进度）

### Decision 3: 游走引擎 — framer-motion animate x/y
- **选择**: DOM 元素 + framer-motion `motion.div animate={{ x, y }}`
- **理由**: 项目已有依赖，`layout` 模式天然支持平滑插值。`pointer-events: none` 保证穿透。移动路径计算为纯逻辑（`packages/shared/` 可共享给小程序）。
- **备选方案**: CSS `transform` + `requestAnimationFrame` 轮询 → 否决（重复造轮子，framer-motion 已够用）

### Decision 4: 游走引擎在 shared 包中
- **选择**: 游走算法（坐标计算、边界避让、兴趣点吸引力）在 `packages/shared/src/pet/` 中实现
- **理由**: 算法纯逻辑无平台依赖，Web 和小程序共享。Web 端用 framer-motion 消费坐标，小程序端用 Canvas 消费坐标。
- **备选方案**: 各端独立实现 → 否决（维护两份逻辑，行为不一致风险）

### Decision 5: 粒子系统 — 独立轻量组件，不复用 EffectLayer
- **选择**: 新建 `ParticleBurst` 组件，局部队列模式
- **理由**: EffectLayer 是全屏层 + 节日驱动的持久特效。宠物粒子是局部 + 短暂的（<2s），两者架构不同。从已有 `@tsparticles/react` 中提取轻量实现。
- **备选方案**: 扩展 EffectLayer 统一管理 → 否决（复杂度无谓增加，节日特效和宠物粒子职责不同）

### Decision 6: 废弃 PetPanel + PetMenu，新建 RoamingPet
- **选择**: 新建 `RoamingPet` 组件整合宠物渲染 + 游走 + 交互 + 气泡 + 状态
- **理由**: PetPanel 是"固定卡片"架构，与新"游走角色"范式不可调和。PetMenu 是 Popover 菜单，与触摸式直接交互相悖。重写比修补更清晰。
- **备选方案**: 渐进式改造 PetPanel → 否决（死代码多、行为分裂）

## Frontend Design

### 组件树变更

```
Before (v1)                              After (v2)
────────────                             ────────────
AppShell                                 AppShell
├── Sidebar                              ├── Sidebar
│   ├── Logo                             │   ├── Logo
│   ├── Module Nav                       │   ├── Module Nav
│   ├── CalendarSidebar                  │   ├── CalendarSidebar
│   └── User Info                        │   ├── SidebarPet          ← NEW
│                                        │   └── User Info
├── <Outlet/>                            ├── <Outlet/>
├── ShortcutsDialog                      ├── ShortcutsDialog
├── ErrorBoundary                        ├── ErrorBoundary
│   └── PetPanel (fixed card)            └── RoamingPet (free)       ← REPLACES
│       ├── PetBubble                    │   ├── PetBubble
│       ├── PetAvatar                    │   ├── PetAvatar (Lottie)
│       ├── PetMenu (popover)            │   ├── PetStatus (hover)
│       └── PetStatus                    │   └── ParticleBurst       ← NEW
└── EffectLayer                          └── EffectLayer
```

### 文件清单

| 操作 | 路径 | 说明 |
|------|------|------|
| **NEW** | `core/lib/roamingEngine.ts` | 游走算法（纯逻辑 → shared 包） |
| **NEW** | `core/lib/particleBurst.ts` | 粒子发射工具函数 |
| **NEW** | `modules/pet/components/RoamingPet.tsx` | 游走宠物主体组件 |
| **NEW** | `modules/pet/components/ParticleBurst.tsx` | 粒子爆发组件 |
| **NEW** | `modules/pet/components/SidebarPet.tsx` | 侧边栏迷你宠物 |
| **NEW** | `modules/pet/components/SvgAvatar.tsx` | SVG 插画组件（各物种×情绪） |
| **NEW** | `modules/pet/assets/svg/` | SVG 插画资源目录 |
| **NEW** | `modules/pet/assets/lottie/` | Lottie JSON 资源目录（占位） |
| **MODIFY** | `modules/pet/components/PetAvatar.tsx` | 内部切换 SVG/Lottie 引擎 |
| **MODIFY** | `modules/pet/store/petStore.ts` | 扩展状态机、游走坐标、主动说话 |
| **MODIFY** | `modules/pet/lib/petEventBridge.ts` | 表演序列编排替代简单气泡 |
| **MODIFY** | `components/layout/Sidebar.tsx` | 底部插入 SidebarPet |
| **MODIFY** | `components/layout/AppShell.tsx` | PetPanel → RoamingPet |
| **DELETE** | `modules/pet/components/PetPanel.tsx` | 废弃 |
| **DELETE** | `modules/pet/components/PetMenu.tsx` | 废弃（逻辑融入 RoamingPet） |
| **MODIFY** | `docs/frontend/component-catalog.md` | 组件目录更新 |

### petStore 扩展

```typescript
interface PetStore {
  // 现有
  animationState: EmotionState
  bubbleMessage: string | null
  menuOpen: boolean
  selectionOpen: boolean

  // 新增 — 情绪状态机
  emotionState: EmotionState  // idle | idle_variant | happy | sad | hungry | sleepy | excited | surprised
  previousEmotion: EmotionState | null
  stateTimer: number | null

  // 新增 — 游走
  position: { x: number; y: number }
  targetPosition: { x: number; y: number } | null
  facing: 'left' | 'right'
  isResting: boolean

  // 新增 — 主动行为
  idleVariantTimer: number | null
  lastInteractionTime: number
  comboCount: number

  // Actions
  setEmotion: (state: EmotionState, duration?: number) => void
  setPosition: (pos: { x: number; y: number }) => void
  setFacing: (dir: 'left' | 'right') => void
  startResting: () => void
  wakeUp: () => void
}
```

### 游走引擎接口 (shared 包共享)

```typescript
// packages/shared/src/pet/roaming.ts

interface RoamingConfig {
  viewport: { width: number; height: number }
  avoidZones: DOMRect[]       // 日历网格等需避开的区域
  interestPoints: { x: number; y: number; weight: number }[]
  restingSpots: { x: number; y: number }[]
  speedMultiplier: number     // 情绪影响速度
}

function computeNextTarget(
  currentPos: Position,
  config: RoamingConfig,
  state: 'wandering' | 'attracted' | 'resting'
): Position

function clampToViewport(pos: Position, viewport: Size): Position

function avoidZones(pos: Position, zones: DOMRect[]): Position
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| Lottie JSON 文件制作周期长，阻塞 v2 发布 | SVG 插画先行，Lottie 异步跟进，架构支持无感切换 |
| 游走动画频繁触发 React re-render | 坐标用 `motion.div` 直接操作 style，不经过 React state；游走算法用 `requestAnimationFrame` 节流 |
| 移动端性能（Lottie + 粒子） | `effectIntensity` 分级 + `prefers-reduced-motion` 检测 + 小程序端 Canvas 独立优化 |
| SVG 插画资产制作 | 探索阶段确定用程序化 SVG（几何图形组合），不依赖设计师 |

## Migration Plan

1. 新增 `packages/shared/src/pet/roaming.ts` — 游走算法（纯逻辑）
2. 新增 `core/lib/particleBurst.ts` — 粒子工具函数
3. 新建 SVG 插画组件 + 资产
4. 扩展 `petStore` 状态机
5. 新建 `RoamingPet`、`SidebarPet`、`ParticleBurst` 组件
6. 重构 `petEventBridge` 为表演序列
7. 更新 `AppShell` + `Sidebar` 引用
8. 废弃 `PetPanel` + `PetMenu`
9. 运行 `pnpm run verify`
10. Smoke test 验证游走/交互/粒子/侧边栏

## Open Questions

1. SVG 插画设计由谁产出？先用程序化几何图形（圆形+色块组合成猫/狗形态），效果取决于实现
2. Lottie 动画文件来源？优先搜索 LottieFiles 免费素材，其次后期找设计师定制
3. 游走频率和速度的参数调优需要实际体验后迭代
