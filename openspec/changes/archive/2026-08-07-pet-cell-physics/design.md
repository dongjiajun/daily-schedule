# Design: pet-cell-physics

## Context
格内互动现状：`startPacing` 用 setTimeout 链驱动"左右两点横移"（0.3s 动画 + 1.2-4.2s 静止），无物理质感。期望：贴边行走 + 重力下沉 + 吸附落定 + 偶尔跳跃的"格内小活动场"。前置资产（pet-vivid-engine 已交付）：`action` 维度（`pace` 类型定义未接线）、walk/jump 动画、地面影子、`displayEmotion` 表情覆盖。

约束：
- 纯前端；无契约/DB 变更
- 普通游走保持低功耗（rAF 只在格内激活）
- 替换现有 pacing timer 实现，不保留双轨
- 状态机逻辑放 React 侧（RoamingPet），几何纯函数放 shared（可单测）

## Goals / Non-Goals

**Goals:**
- 格内物理状态机：enter → walk（贴边）→ cling（吸附）→ hop（跳跃）→ exit
- rAF 帧循环驱动（贴边/重力/吸附的手感来源）
- 完成度风格：快（绕圈+跳跃+happy）/ 慢（贴底边+蜷缩）
- `pace` action 落地接线

**Non-Goals:**
- 不做碰撞检测/多宠物交互（单宠物，格内无其他物体）
- 不做完整物理引擎（无质量/速度/摩擦力，用 lerp+曲线近似"手感"）
- 不改日历格子注册机制（calendar-cell Zone 既有）
- 不做格内粒子/特效（反馈系统已由 pet-lifecycle-ui 交付）

## Decisions

### Decision 1: 格内状态机用 rAF 帧循环替换 setTimeout 链
- **选择**: 宠物进入 calendar-cell Zone 后启用一个 `requestAnimationFrame` 循环（仅格内激活）；帧循环按状态机推进：`enter → cling → walk → cling → (hop) → ... → exit`；每帧用 `performance.now()` 差值做位置插值（easeInOut）；状态机超时（总时长 8-15s）或离开格子自动退出并恢复游走 tick
- **理由**: 贴边/重力/吸附的本质是"连续运动 + 落定"，只有帧级驱动才有手感；setTimeout 链只能表达"跳点"，且无法做吸附的减速接近；rAF 生命周期与组件卸载/离开格子耦合（cancel 清理）
- **备选方案**: (a) framer-motion 逐段动画链——每段都要新 transition 配置，吸附减速难表达；(b) 保持 timer 链 + 更多中间点——伪连续，代码复杂且仍无手感

### Decision 2: 贴边路径 = 四边吸附点采样 + 绕边行走
- **选择**: shared 纯函数 `cellEdges(rect, margin)` 生成四边吸附点（上边 3 点/下边 3 点/左右边各 2 点，共 10 点，均匀分布、留 margin）；`nextClingPoint(current, edges, visited)` 选"未被刚访问过的最近未访问点"（绕边不回头）；walk 状态在相邻吸附点间匀速移动（速度由风格决定）
- **理由**: 吸附点采样让"贴边走"有明确的"落定点"（吸附感来源）；绕边不回头保证路径连续不抖动；纯函数放 shared 可单测
- **备选方案**: (a) 逐像素沿边移动——无落定点，无吸附感；(b) 随机边内点——路径跳跃感强

### Decision 3: 重力 = 帧循环内 y 向底部 lerp + 贴边吸附
- **选择**: 非 walk 状态（cling/enter/hop 落地后）下，y 以 `lerp(y, bottom - bodyRadius, 0.08)` 缓慢下沉贴底边（重力感）；x 保持吸附点；walk 到吸附点后 snap（位置直接设为边线目标 + 停留 0.8-1.5s）
- **理由**: lerp 下沉模拟重力且无物理引擎复杂度；snap + 停留是"吸附落定"的视觉语义（从移动到静止的骤停感）
- **备选方案**: 真实重力加速度积分——过度（单宠物格内无碰撞需求）

### Decision 4: hop 跳跃 = sin 抛物线 y 偏移，复用 jump 动画
- **选择**: cling 后 30% 概率（快风格）进入 hop：位置沿边保持 x 不动，y 按 `sin(π·t)` 曲线偏移 -8~-12px，0.6s 后落回原吸附点；期间 `setAction('jump')`（复用 vivid-engine 的跳跃动画 + 影子缩小）
- **理由**: sin 抛物线是跳跃的标准近似；复用 jump action 让影子/动画零新增
- **备选方案**: 独立 hop 动画——重复实现

### Decision 5: 完成度风格参数化（单配置对象）
- **选择**: shared 导出 `createCellStyle(completion)`：`{ walkSpeed, hopChance, clingDuration: [min,max], bottomOnly, emotion }`——completion ≥ 50 → `{ walkSpeed: 60, hopChance: 0.4, cling: [0.6,1.2], bottomOnly: false, emotion: 'happy' }`；< 50 → `{ walkSpeed: 25, hopChance: 0, cling: [1.2,2], bottomOnly: true, emotion: 'idle_variant' }`（bottomOnly 时只采样底边+侧边下半吸附点，表现"提不起劲贴地走"）
- **理由**: 风格集中为可测配置，快慢差异一目了然；与 spec 的"完成度决定速度/情绪"对齐
- **备选方案**: 散落常量——难测难调

### Decision 6: 状态机生命周期与游走 tick 解耦
- **选择**: 格内 rAF 循环独立于游走 tick（参照 pet-roam-robustness 的"往返 timer 与渲染解耦"经验）：进入格子启动 rAF + `setAction('pace')`；离开格子（position 出 rect）/ 状态机完成 / 组件卸载 → cancel rAF + 恢复游走；游走 tick 在格内期间暂停（跳过调度，格内结束后由 exit 重新调度）
- **理由**: 帧循环与 tick 双驱动会互相覆盖位置；解耦保证格内行为不被 refetch/渲染打断
- **备选方案**: 格内仍走 tick——回到"慢速跳点"老路

### Decision 7: 情绪与表情在格内由状态机驱动
- **选择**: walk/cling 期间 `setEmotion(style.emotion, 持续)`（快 happy / 慢 idle_variant）；hop 时 `setAction('jump')` 触发跳跃动画；其余时间 `setAction('pace')`（pace 在 animations.ts 无独立动画，回退 idle 呼吸——格内"轻快站立"姿态）
- **理由**: pace 作为格内基底动作（无动画=站立呼吸），walk/jump 覆盖具体运动；表情由完成度风格决定（对齐 spec）
- **备选方案**: pace 也加独立动画——范围外（vivid-engine 的 pace 定义为"格内往返"，本变更将其落地为格内活动基底）

## DDD Layer Design
无后端代码变更（DDD 四层均不触碰）。

### 前端 (frontend/src/)
```
packages/shared/src/pet/
├── cellPhysics.ts        (新增) 纯函数：cellEdges / nextClingPoint / hopOffset / createCellStyle / snapToEdge
└── index.ts              (扩展) 导出

frontend/src/modules/pet/components/RoamingPet.tsx
└── 格内物理状态机（替换 startPacing/stopPacing timer 链）：
    ├── 进入 cell Zone → startCellPhysics(zone)：rAF 循环 + 状态机 + setAction('pace')
    ├── 状态推进：enter → cling → walk → cling → (hop) → ... → exit
    ├── 离开格子 / 完成 / 卸载 → cancel rAF + 恢复游走
```

## API Design
无契约变更。

## Database Design
无（无 Flyway 变更）。

## Risks / Trade-offs
- [rAF 与 framer-motion 移动冲突] → 格内期间不设游走 tick 的 position 目标（游走暂停）；framer-motion 的 animate x/y 与 rAF setPosition 竞争——格内用 rAF 直接 setPosition，motion.div 的 animate 目标同步更新（position 驱动一致）
- [状态机复杂度过高] → 拆纯函数进 shared（几何/风格可单测），RoamingPet 只做状态推进与 rAF 调度
- [低完成度"贴底边"被误认为 bug] → bottomOnly 时仍沿底边移动（非静止），cling 停留让节奏可见
- [格内超时未退出卡死] → 状态机总时长上限（fast 10s / slow 15s）强制 exit；exit 后无论位置恢复游走
- [性能] → rAF 仅格内激活（单宠物单循环）；帧内只做数值计算 + setPosition，无 DOM 查询（rect 进入时缓存，scroll/resize 由既有 Zone 更新机制驱动）

## Migration Plan
1. shared `cellPhysics.ts` 纯函数 + 单测（edges 采样/绕边/跳跃曲线/风格参数）
2. RoamingPet 状态机替换 pacing timer（rAF 调度 + 状态推进 + 生命周期）
3. 接线：进入格子启动 / 离开退出 / action pace+jump / 情绪驱动
4. 测试：RoamingPet 格内状态机接线测试（进格启动 rAF 风格/离开退出/超时强制退出）；既有格内往返测试更新
5. 文档：component-catalog（RoamingPet 格内描述）；docs-check
6. 全量验证：vitest + lint/build + E2E 回归 + smoke（目视：贴边走/吸附/跳跃/快慢风格）
7. **`/opsx:verify`** 后归档

回滚策略：纯前端；`startPacing` 旧实现已在 git 历史，文件级还原即可。

## Open Questions
- 格内停留时长与用户观察窗口的平衡（快 10s / 慢 15s 是否足够用户看清交互）——smoke 后按反馈调
