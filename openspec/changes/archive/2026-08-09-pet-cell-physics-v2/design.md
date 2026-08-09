# Design: pet-cell-physics-v2

## Context
格内物理状态机横跨两处：纯逻辑在 `packages/shared/src/pet/cellPhysics.ts`（吸附点采样/绕边扫描/重力/跳跃，Web 与小程序共享），帧循环在 `frontend/src/modules/pet/components/RoamingPet.tsx`（rAF，`cellPhysicsRef` 状态机 enter→cling→walk→hop）。

已知缺陷（用户验收反馈）：
1. **cling 每帧执行 `applyGravity`** → 顶边/侧边停留期间被持续拖向底部，顶部行走几乎不可见
2. **吸附点路径跨边**：`bottom(3)→right(2)→top(3)→left(2)` 相邻点不在同一边，4/9 段为对角线穿越
3. **`snapToEdge` 从未被调用**：walk 到达硬插值，无吸附感
4. **会话超时（10s）< 绕圈耗时（~12s）**：经常走不完一圈被踢出
5. 贴壁旋转在斜线移动途中就切换（目标 edge 与移动方向错配）

约束：React Compiler lint（rAF 自引用须用 ref pattern）；shared 包纯函数（无平台依赖）；现有 `cellPhysics.test.ts`（8 组）与 `RoamingPet.test.tsx` 用例须保持或同步更新。

## Goals / Non-Goals

**Goals:**
- 宠物沿格子四边**连续绕行**（底→右→顶→左），每段移动都在边上，转角平滑衔接
- 顶边/侧边停留位置不漂移（cling 不执行重力）
- 吸附有"接近→滑入→落定"的过程感；enter 落地有重力下落 + 小弹跳
- 会话按圈数退出（绕 1.5 圈），不被超时中途踢出
- 贴壁旋转与实际移动方向一致

**Non-Goals:**
- 不改动游走（roaming.ts）、兴趣区、小窝逻辑
- 不引入外部物理引擎（matter.js 等）
- 不改变格内风格配置接口（`createCellStyle` 签名不变）
- 不做新物种/装扮（蓝图功能）

## Decisions

### Decision 1: cling 去除重力（重力仅 enter 落地阶段）
- **选择**: `cling` 状态位置完全静止；`enter` 阶段用重力 + 落点 snap 实现"空中落地"。`applyGravity` 保留但仅被 enter 调用
- **理由**: 贴边 = 边提供支撑力抵消重力；cling 期间漂移是"顶部不可见"的直接根因。重力作为"落地过程"保留在 enter，符合物理直觉
- **备选方案**: 每边设置方向性支撑（bottom 向下压、top 向上托）——复杂且违背"贴边"直觉，否决

### Decision 2: 吸附点路径加四角转角点
- **选择**: `cellEdges` 输出顺时针 `bottom(3) + 右下角 + right(2) + 右上角 + top(3) + 左上角 + left(2) + 左下角`（14 点）。角点位于边内缩 margin 处（如右下角 = (right-marginX, bottom-marginY)），相邻点必在同一边或紧邻角点，任何两段之间不再有斜线
- **理由**: 斜线穿越是"不自然"主因；角点让转弯有明确的几何锚点，`nextClingPoint` 环形扫描无需改逻辑（路径顺序即绕边顺序）
- **备选方案**: 每边 3 点用角部重叠点衔接（点数翻倍）——过于密集、绕圈过久；保持 14 点

### Decision 3: walk 连续沿边 + 概率停留
- **选择**: walk 到达点后不再必然 cling：`40% hop / 30% 短暂 cling(300-600ms) / 30% 直接续走下一段`；hop 落地后进入"继续走"而非 cling
- **理由**: 旧行为"每点必停 600-1200ms"把连续移动切成碎片，配合斜线是"不自然"的另一主因；连续沿边 + 偶发停顿才像活的
- **备选方案**: 移除 cling 全部停留——丢失"走走停停"的观察感，保留概率化停留

### Decision 4: 吸附滑入 + 落定
- **选择**: walk 距目标 <12px 时速度 ×1.6（滑入）；到位后位置精确 snap（复用 `snapToEdge` 的吸附判定阈值语义）；落定瞬间做 2px 下沉 + 回弹（`ph.current.y` 偏移 1-2 帧，视觉"哒"一声吸住）
- **理由**: `snapToEdge` 已有测试与实现，复用其阈值常量；滑入+落定是用户能感知的"吸附"过程
- **备选方案**: 到达后静止（旧行为）——无吸附感知；CSS transition 弹跳——与 rAF 位置驱动叠加易抖动

### Decision 5: enter 落向底边吸附点
- **选择**: enter 目标 = 最近底边吸附点正上方（x = 最近 bottom 点.x，y = 格中心偏下）→ 重力下落至底边线 → 落定小弹跳 → 进入 cling。落点与吸附点精确对齐，不再出现"沉到 65% 中心再飘到底边"
- **理由**: 旧落点（65% 高度中心）与吸附点脱节；对齐后 enter→cling→walk 转换自然
- **备选方案**: 保留 65% 中心落点——落点与边点不一致，否决

### Decision 6: 会话退出按圈数
- **选择**: `cellPhysicsRef` 增加 `lapAnchor: CellClingPoint`（起点锚点）；walk 到达与锚点同边且为绕边第二圈时计 1.5 圈，退出；上限 25s 兜底（防止路径退化卡死）
- **理由**: 绕圈耗时与格子尺寸/速度耦合，固定秒数必然误杀；按圈数保证"完整互动体验"
- **备选方案**: 固定 15s——大格子走不完，小格子又太长

### Decision 7: 贴壁旋转与移动方向一致
- **选择**: `setClingEdge` 仅在 walk 段开始时设置（目标 edge 即移动方向）；角点（bottom↔right、top↔left）处旋转在到达角点后的下一段切换；cling/hop 保持当前 edge。旋转切换加 0.15s `transition`（CSS）避免跳变
- **理由**: 修路径后目标 edge 与移动方向一致，旋转自然；斜线途中横过来的错配随之消失
- **备选方案**: 按位置象限动态旋转——复杂且无必要

### Decision 8: 锚点与姿态模型（本轮验收暴露的补强）
- **选择**: 明确三层几何模型并强制测试契约：
  1. **位置语义**：`position` = 宠物盒子（motion.div）左上角（translate 锚点），非脚底
  2. **视觉锚点**（实测 90px 宠物）：脚底 = 盒子 + (0, 64)；阴影 = 盒子 + (0, 87)；旋转 ±90° 后脚底偏移盒子中心 ±19px
  3. **转换**：`cellEdges` 生成"脚底接触点"（贴在边线上的点）→ `toPetBox` 按边转换为盒子坐标（bottom: y-64 / right: x-19,y-45 / top: y-19 / left: x+19,y-45）——**toPetBox 必须保留 `edge` 属性**（贴壁旋转的唯依据，曾因返回 `Position` 丢 edge 导致 rotate 全部失效）
- **理由**: 锚点错位（盒子左上角贴线 → 脚悬空 64px）是"贴边不自然"的直接根因；edge 丢失是"姿态永不旋转"的直接根因——两者都是可测试契约，必须进测试
- **备选方案**: 布局层把脚底对齐盒子底部（统一偏移）——改动 PetAvatar 布局与阴影定位，影响面大；选择状态机层转换
- **测试契约**: 格内绕行 DOM 断言出现 rotate(90/-90/180) 三种姿态 + 落地 y = 底边线 - 64

## DDD Layer Design

### 领域层 (domain/)
无后端变更。

### 基础设施层 (infrastructure/)
无。

### 应用层 (application/)
无。

### API 层 (api/)
无。

### 前端 (frontend/src/)
- `packages/shared/src/pet/cellPhysics.ts`
  - `cellEdges`：新增四角转角点（14 点顺时针），`bottomOnly` 分支保持 5 点不变
  - `nextClingPoint`：逻辑不变（路径顺序即绕边顺序）；补充"锚点同边"辅助（`sameEdgeOf`）
  - `cellSessionDuration`：改为 `cellLapCount(1.5)` + 25s 兜底常量导出
  - 新增：`landSnap(pos, edges)`（enter 落地吸附）、`slideInSpeed(baseSpeed, dist)`（吸附滑入速度）
- `frontend/src/modules/pet/components/RoamingPet.tsx`
  - cling 分支：删除 `applyGravity` 调用，位置静止
  - walk 分支：到达点概率分流（hop / 短暂 cling / 续走）；滑入加速 + 落定弹跳
  - enter 分支：目标改为最近底边吸附点上方 + 重力下落 + 落定
  - 帧循环：`lapAnchor` 计数 1.5 圈退出；`setClingEdge` 时序调整
  - 贴壁旋转容器加 0.15s transition

## API Design
无（不涉及 specs/openapi.yaml）。

## Database Design
无。

## Risks / Trade-offs
- [角点旋转切换抖动] → 旋转容器加 0.15s transition；`clingEdge` 状态按 walk 段粒度更新
- [1.5 圈 + 25s 兜底仍可能过长（超大格子）] → 快风格 walkSpeed 60px/s 下限；25s 兜底确保不卡死
- [概率分流引入随机性，测试不稳定] → 测试用 `Math.random` mock（既有模式）；纯函数分流逻辑独立测试
- [路径点数变化影响既有 cellPhysics 测试] → 同步更新 `cellPhysics.test.ts`（点数 10→14、顺序断言含角点）

## Migration Plan
1. shared 包改造 → 重建 dist（`pnpm --filter @daily-schedule/shared run build`）
2. 前端接线 + 测试更新 → `pnpm run verify`
3. 部署：纯前端热更新，无迁移；回滚 = revert 提交

## Open Questions
- 月视图格子顶部含日期数字区域，宠物贴顶边（内缩 15% 高度）行走是否会遮挡日期 → 视觉验证后如需可单独调 margin
- 角点转弯是否需要加"转身停顿"（半秒）以增强存在感 → 视觉验证后定
