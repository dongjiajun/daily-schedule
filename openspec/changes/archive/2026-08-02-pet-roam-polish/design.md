# Design: pet-roam-polish

## Context

宠物模块现有三类问题（探索已确认根因）：

1. **镜像气泡**：`RoamingPet.tsx` 中 `<PetBubble />` 位于 `scaleX: facing === 'left' ? -1 : 1` 的翻转容器内，宠物朝左时气泡文字镜像不可读。spec 契约只定义了"移动时按朝向翻转"，未定义气泡文字可读性。
2. **左上困局**：日历网格（`.rbc-month-view`）整块注册为 soft 避让区（60% 拒绝率），`computeWanderTarget` 的局部漂移（±200px）+ 拒绝机制产生边缘排斥效应——宠物被持续推向网格外（左上角）且无法逃逸。
3. **兴趣点机制空转**：spec 定义 Interest Point Attraction（鼠标停留 3s / 点击输入），引擎层（`computeAttractedTarget`/`determineMode`）已实现且有测试，但 UI 层从未接线（`RoamingPet.tsx:92` 硬编码 `hasActiveInterestPoint: false`）。另有全 body `MutationObserver` 性能隐患。

约束：模块间通信唯一通道为 eventBus（CLAUDE.md）；roaming 引擎为纯逻辑无平台依赖（Web/小程序共享）；引擎已有 24 用例测试。

## Goals / Non-Goals

**Goals**
- 气泡文字任何朝向下正读（修复 bug）
- 消除游走边缘排斥，活动范围覆盖视口全域
- 建立 Zone 区域感知机制（类型化区域 + 注册表 + 几何检测），为变更 B（小窝）/ C（日程框）铺路
- 补齐兴趣区域 UI 接线（spec 契约既有行为）
- 消除全 body MutationObserver 性能隐患

**Non-Goals**
- 不做小窝行为（变更 B）
- 不做日程框互动（变更 C）
- 不改粒子系统/动画引擎
- 不改后端/API 契约

## Decisions

### Decision 1: Zone 模型替代 InterestPoint
- **选择**: 完全替换 `InterestPoint`（点+权重）为 `Zone`（矩形+类型+payload），不双轨
- **理由**: 点模型无法表达"格子内走动/停靠休息"的区域语义（变更 B/C 需要矩形+数据）；完全替换避免双模型维护；`Rect` 复用现有 `isInsideRect` 工具
- **备选方案**: 保留 InterestPoint + 新增 Zone——两套吸引逻辑重复，未采纳

### Decision 2: 区域注册表为普通模块单例
- **选择**: `frontend/src/modules/pet/lib/zoneRegistry.ts`，`Map` 实现（`registerZone` 返回注销函数 / `getZones` / `updateZoneRect`）
- **理由**: Zone 是几何数据非 UI 状态，无需响应式；宠物侧游走循环低频读取，订阅无收益；Map 保证同 id 覆盖（spec 契约）
- **备选方案**: Zustand store——引入不必要的重渲染风险；eventBus 传递——区域是常驻数据而非一次性事件，均未采纳

### Decision 3: 气泡移出翻转容器
- **选择**: `PetBubble` 从 `scaleX` 容器内移到容器外，与宠物精灵并列定位（气泡跟随宠物坐标，不受 `facing` 影响）
- **理由**: 反向补偿（气泡内再 `scaleX(-1)`）会同时翻转气泡箭头/圆角/emoji，视觉不自然；移出容器语义最干净——翻转只作用于宠物身体
- **备选方案**: 气泡内反向翻转补偿——箭头/圆角同步翻转，未采纳

### Decision 4: 游走逃逸机制
- **选择**: soft 区拒绝率 60%→40%；连续 3 次候选被拒 → 全视口随机目标且 50% 概率接受落入 soft 区
- **理由**: 保留局部漂移的自然性（漫游感），仅加逃逸出口；全域采样 fallback 已存在（5 次失败后），调整为"3 次拒绝即逃逸"并允许进入 soft 区
- **备选方案**: 完全改全局采样——失去自然漫游的局部性，动画频繁长距离移动，未采纳

### Decision 5: MutationObserver 范围收敛
- **选择**: 全 body `subtree` 监听 → 监听 `.rbc-month-view` 目标容器 + scroll（capture）/resize 事件驱动更新；Zone rect 更新走同一事件通道
- **理由**: 日历网格 rect 只在布局变化（滚动/缩放/网格渲染）时失效，事件驱动覆盖全部场景且成本最低
- **备选方案**: 保留全 body 监听——layout thrash 隐患持续存在，未采纳

### Decision 6: 兴趣区域 UI 接线
- **选择**: 鼠标停留 >3s → 50% 概率注册 `user-interaction` Zone（120x120px、decayTime 15s）；pointerdown/keydown → 30% 概率注册；`determineMode` 的 `hasActiveInterestPoint` → 基于 `getZones()` 的 `hasActiveZone`
- **理由**: 补齐 spec 既有契约的缺失接线；游走循环每次取最新 Zone 列表保证移除后立即失效；概率触发低干扰
- **备选方案**: 确定性触发（100%）——交互过频干扰游走，未采纳

### Decision 7: 引擎 API 保持纯函数风格
- **选择**: `computeNextTarget` 签名扩展 `activeZone?: Zone`（可选，替代 `activeInterestPoint`），注册表留在前端层（引擎不依赖）
- **理由**: 引擎纯逻辑无平台依赖（Web/小程序共享），Zone 检测为纯几何函数（`isInsideRect` 复用），可单测
- **备选方案**: 引擎直接依赖注册表单例——破坏纯逻辑/平台无关性，未采纳

### Decision 8: soft 权重化目标生成（smoke 后扩展，替代 D4 的逃逸机制）
- **选择**: 游走目标 = 30% 概率全域采样 + 70% 局部漂移；soft 区目标 50% 概率接受（soft = 降频区而非排斥墙）；hard 区继续完全拒绝；移除"连续 3 次拒绝触发逃逸"的计数逻辑（全域采样已保证穿越）
- **理由**: smoke 验证暴露"局部漂移+拒绝"的排斥物理在 soft 区占视口 80%（日历网格）时仍把宠物压缩到左侧窄条——逃逸机制能穿越但分布不均。soft 权重化消除方向性排斥（拒绝重试不再产生偏置），全域采样 30% 保证覆盖
- **备选方案**: 仅调参（拒绝率再降）——分布改善有限；完全全域采样——失去局部漫游自然感，均未采纳

## Frontend Design

```
shared/packages/src/pet/roaming.ts        ← Zone 类型 + 游走目标（D1/D4/D7）
frontend/src/modules/pet/lib/zoneRegistry.ts   ← 注册表（D2）
frontend/src/modules/pet/lib/petEventBridge.ts ← 不变（eventBus 桥）
frontend/src/modules/pet/store/petStore.ts     ← 不变（或仅加 zone 状态暴露，待定）
frontend/src/modules/pet/components/RoamingPet.tsx ← 气泡结构（D3）+ 接线（D6）+ 观察器（D5）
```

状态流（无新 store）：

```
calendar 网格 / 用户交互
    ↓ 事件驱动 rect / 直接注册
zoneRegistry (Map)
    ↓ getZones()（游走循环低频读取）
RoamingPet 游走循环 → determineMode / computeNextTarget → 位置更新
    ↓ 进入检测（几何相交）
行为 hook（气泡/动画）——变更 B/C 在此挂接
```

## API Design

无 API 变更（`specs/openapi.yaml` 不动）。本变更全部在前端 + shared 包。

## Database Design

无数据库变更。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| Zone 模型改动破坏现有引擎测试（24 用例） | `InterestPoint` 替换为 `Zone` 时同步更新测试；D7 保持函数签名兼容（activeZone 可选） |
| 气泡移出容器后定位偏移 | 组件测试断言气泡相对宠物位置；视觉 smoke 验证 |
| 全局 pointerdown/keydown 监听与现有交互（摸头/双击）冲突 | 接线时排除宠物本体上的事件（stopPropagation 已有）；概率触发保证低干扰 |
| 逃逸机制改动影响游走自然感 | 参数可调（拒绝率/逃逸阈值），E2E + 手工 smoke 验证 |
| calendar-cell 完成度数据形状未最终定（变更 C） | D1 payload 为 `Record<string, unknown>`，变更 C 时收紧类型 |

## Migration Plan

1. 引擎层（shared）：Zone 类型 + 游走目标修改 + 测试更新 → `turbo run build` 验证
2. 注册表（lib/zoneRegistry.ts）+ 引擎接线（RoamingPet）
3. 气泡结构修复 + 组件测试
4. MutationObserver 收敛
5. 全量验证：`turbo run verify` + `cd backend && mvn test`（回归）+ `npm run test:e2e`
6. 手工 smoke：宠物朝左时气泡正读、游走覆盖全屏、鼠标停留/点击后宠物靠近

回滚：所有改动在 frontend/shared 层，`git revert` 单个 commit 即可；无数据迁移。

## Open Questions

- 兴趣区域触发概率（50%/30%）是否需要随接线后的实际体验再调——留待 smoke 后微调，参数集中在常量
- `pet-spot` Zone 的注册由谁负责（变更 B 决定：pet-status-panel 或 pet 模块自身）
- 是否需要在 petStore 暴露当前活跃 Zone（变更 C 消费完成度时再定，优先保持 store 不变）
