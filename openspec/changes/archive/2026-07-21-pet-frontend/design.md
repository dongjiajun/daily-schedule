# Design: 宠物前端 v1 (Pet Frontend)

## Context
M1.1 后端已就绪（6 个 API 端点），日历模块已 emit 事件（`event:completed`/`created`/`cancelled`），Rive Spike 已验证（React 19 + Vite 8 兼容）。当前前端仅有 calendar 模块，宠物模块作为第二个可插拔模块，验证模块化架构的扩展性。

**约束**:
- 必须通过 EventBus 与日历模块通信（不直接 import calendar store/组件）
- 必须符合 ModuleDefinition 规范（id / name / icon / order / routes / sidebarComponent）
- API 调用经过 `unwrap()` 包裹，遵循 SDK 错误处理约定
- JWT 认证由 authInterceptor 自动处理

## Goals / Non-Goals

**Goals:**
- 无宠物用户看到选择界面（橘猫/柴犬二选一 + 命名）
- 有宠物用户始终可见宠物形象（Rive 动画）+ 状态栏（mood/hunger/coins/level）
- 喂食/玩耍互动，带效果反馈（数值变化 + toast）
- 商店购买食物
- 监听日历事件：完成日程→宠物开心、取消/删除→宠物失落
- 注册为独立模块，侧边栏/路由自动装配

**Non-Goals:**
- 宠物进化、装扮、多宠物（Phase 2+）
- Rive 动画文件（美术资产，v1 用 placeholder / 简单动画）
- 移动端专属布局（v1 复用桌面端布局，响应式适配）
- 宠物状态 SSE 实时推送（v1 用 React Query 轮询 `GET /pets/me`）

## Decisions

### Decision 1: 宠物常驻区域 — AppShell 右下角浮动面板
- **选择**: 在 `AppShell.tsx` 中渲染 `<PetPanel />`，固定定位在右下角（`fixed bottom-4 right-4`），类似聊天机器人悬浮窗
- **理由**: 宠物作为"体验层"需要始终可见，不应被路由切换隐藏。悬浮面板不占用侧边栏/主内容区空间
- **备选方案**: 侧边栏底部 — 会被日历侧边栏内容遮挡，且非日历模块无侧边栏

### Decision 2: Rive 动画状态驱动
- **选择**: `useRive` hook + `stateMachine` 参数，通过 petStore 的 `animationState`（`idle` / `happy` / `sad` / `hungry`）切换
- **理由**: Rive 状态机原生支持情绪切换，无需手动管理帧动画。`useRive({ stateMachines: 'PetStateMachine' })` 根据 mood/hunger 阈值自动切换
- **备选方案**: Lottie — 需手动切换动画文件，不支持交互式状态机；Framer Motion SVG — 开发成本高

### Decision 3: 状态管理两层分离
- **选择**: 
  - **petStore**（Zustand）：UI 状态 — `animationState` / `bubbleMessage` / `menuOpen` / `selectionOpen`
  - **usePet**（React Query）：服务端数据 — `GET/POST /pets/me` / `POST interact` / `GET/POST shop`
- **理由**: 遵循现有约定（calendarStore + useEvents），职责清晰
- **备选方案**: 全部放 React Query — 缺少 UI 状态（气泡/菜单/动画切换）

### Decision 4: 事件桥接在模块 `onInit` 中注册
- **选择**: `petModule.onInit` 中调用 `eventBus.on('event:completed', handler)` 等，`onDestroy` 中注销
- **理由**: 模块生命周期清晰，卸载时自动清理监听器。与 calendar `petActions` 声明形成闭环
- **备选方案**: 在 PetPanel 组件 `useEffect` 中注册 — 组件卸载/重挂会导致监听器丢失

## 前端设计

### 组件树

```
AppShell.tsx
├── Sidebar
│   └── NavItem("宠物")        ← moduleRegistry 自动生成
└── <Outlet />  (路由内容)
    └── PetPanel (fixed 右下角) ← AppShell 直接渲染，不随路由切换
        ├── PetAvatar           ← Rive canvas（100×100）
        │   └── 气泡提示（浮动）  ← PetBubble（Framer Motion spring）
        ├── PetStatus           ← mood/hunger/coins/level 状态条
        ├── PetMenu             ← 弹出菜单（喂食/玩耍/商店）
        │   ├── FeedOptions     ← 食物列表（价格+效果）
        │   └── PlayButton
        ├── PetSelection        ← 首次选择（Dialog）
        │   ├── SpeciesCard（橘猫）
        │   └── SpeciesCard（柴犬）
        └── routes.tsx
            └── PetPage         ← 宠物详情页（full view）
```

### 文件清单

```
modules/pet/
├── index.ts              # ModuleDefinition（id: 'pet', order: 2）
├── routes.tsx            # lazy(() => import PetPage)
├── components/
│   ├── PetPanel.tsx       # 悬浮面板容器（auth guard + 无宠物→选择/有宠物→形象）
│   ├── PetAvatar.tsx      # useRive Canvas + 动画状态切换
│   ├── PetBubble.tsx      # 对话气泡（Framer Motion AnimatePresence）
│   ├── PetMenu.tsx        # 互动菜单 Popover（喂食/玩耍/商店）
│   ├── PetStatus.tsx      # 状态条：mood(心形)/hunger(骨头)/coins(币)/level(⭐)
│   ├── PetSelection.tsx   # 初次选择 Dialog（物种+命名）
│   └── PetPage.tsx        # 详情页（路由目标）
├── hooks/
│   └── usePet.ts          # React Query hooks（useMyPet / useCreatePet / useInteract / useShopItems / usePurchase）
├── store/
│   └── petStore.ts        # Zustand（animationState / bubbleMessage / menuOpen）
└── lib/
    └── petEventBridge.ts  # 事件监听注册（eventBus.on）
```

### 状态管理

**petStore**（Zustand，仅 UI 状态）:
```typescript
interface PetStore {
  animationState: 'idle' | 'happy' | 'sad' | 'hungry'
  bubbleMessage: string | null
  menuOpen: boolean
  selectionOpen: boolean // 无宠物时自动打开
  triggerAnimation: (state: string) => void
  showBubble: (msg: string, duration?: number) => void
  setMenuOpen: (open: boolean) => void
}
```

**usePet**（React Query hooks）:
```typescript
// 查询
useMyPet()              → useQuery(['pet', 'me'], () => getMyPet())
// 创建
useCreatePet()          → useMutation(createPet)
// 互动
useInteract()           → useMutation(interactWithPet)
// 商店
useShopItems()          → useQuery(['shop', 'items'], () => getShopItems())
usePurchase()           → useMutation(purchaseItem)
```

### 事件桥接（petEventBridge.ts）

```typescript
import { eventBus } from '@/core/lib/eventBus'
import { usePetStore } from '../store/petStore'

export function registerPetEventListeners() {
  const store = usePetStore.getState()

  eventBus.on('event:completed', ({ payload }) => {
    store.triggerAnimation('happy')
    store.showBubble(`太棒了！「${payload.title}」已完成！🎉`)
  })

  eventBus.on('event:created', ({ payload }) => {
    store.triggerAnimation('happy')
    store.showBubble(`新日程「${payload.title}」已安排 📅`)
  })

  eventBus.on('event:cancelled', ({ payload }) => {
    store.triggerAnimation('sad')
    store.showBubble(`「${payload.title}」取消了… 😿`)
  })
}
```

### 路由

```
/pet → PetPage（lazy loaded）  — 宠物详情页（全屏，含大号 Rive 动画+完整状态+互动历史）
```

### 模块注册（main.tsx）

```typescript
import { petModule } from '@/modules/pet'
// ... 在 calendarModule 之后注册
moduleRegistry.register(petModule)
```

### 动画阈值（mood/hunger → animationState 映射）

| 条件 | animationState | 说明 |
|------|---------------|------|
| mood ≥ 60 && hunger ≥ 50 | `idle` | 正常状态 |
| hunger < 30 | `hungry` | 饥饿——头顶冒食物气泡 |
| mood < 30 | `sad` | 不开心——耷拉耳朵 |
| mood ≥ 60 && hunger < 30 | `hungry` | 饥饿优先于正常 |
| 事件触发 | `happy` | 完成日程/创建日程（5s 后恢复 idle） |
| 事件触发 | `sad` | 取消日程（5s 后恢复 idle） |

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| Rive `.riv` 文件暂无（需美术或购买） | v1 用内置简单动画或 Rive Community 免费资源 |
| `useRive` 加载空 src 可能报错 | catch + fallback 到静态 PNG emoji |
| 宠物面板遮挡日历操作 | 添加最小化/收起按钮；拖拽调整位置 |
| React Query cache 不一致（互动后宠物状态变了但 GET 未刷新） | 互动/购买 mutation onSuccess 中 `invalidateQueries(['pet', 'me'])` |
| `onDestroy` 注销事件时机 | 在 petModule.onDestroy 中调用 `eventBus.off()` |

## Open Questions

1. **Rive 动画文件来源？** v1 可从 [Rive Community](https://rive.app/community) 下载免费猫/狗动画，或使用静态 emoji 占位。建议 M1.2 完成后安排设计资源。
2. **宠物面板位置是否可拖拽？** v1 固定在右下角，v2 可加拖拽（Framer Motion drag）。
3. **宠物状态轮询频率？** `useMyPet` 使用 `refetchInterval: 30000`（30 秒），配合互动后的 `invalidateQueries`。
