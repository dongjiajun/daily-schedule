# Design: pet-rhythm

## Context
作息判定在 `packages/shared/src/pet/roaming.ts` 的 `determineMode`（纯函数）+ `RoamingPet.tsx` 消费：
- 当前仅 `isNightTime = getHours() >= 23` → `resting` 模式：宠物原地休息（在窝外则走向小窝）
- 睡觉无"进窝"步骤：23 点后 resting 在任意位置原地休息（rest 动作），回窝只靠进窝边沿检测
- 无早晨唤醒、无午后小憩、无深夜提示

约束：`determineMode` 是 shared 纯函数（Web + 小程序共享，须可测）；`handleReturnHome`（回窝：定位小窝→startResting→sleep 动作→气泡）已存在可复用；React Compiler lint 定时器 ref pattern。

## Goals / Non-Goals

**Goals:**
- 夜间（23 点后）宠物自动走向小窝进窝睡觉（不原地硬切）
- 早晨（7-9 点）醒来：sleep→idle 过渡 + 伸懒腰 + 气泡"早上好~"
- 午后（12-14 点）低概率短暂打盹（1-2 分钟，与夜间睡眠区分——rest 而非 sleep）
- 深夜未睡时（23 点后未休息）随机打哈欠 + 气泡"该睡觉啦~"（反哺机制首个落地）
- 全部逻辑可测（determineMode 纯函数扩展 + 组件接线）

**Non-Goals:**
- 不做后端/数据库变更（作息是纯前端行为决策）
- 不改变兴趣区/格内物理/游走算法
- 不做"久不登录→无精打采"（依赖登录时长数据，留待大版本）

## Decisions

### Decision 1: determineMode 节律判定扩展（时段枚举）
- **选择**: `determineMode` 输入增加 `hour`（替代内部 `new Date().getHours()`），输出节律维度：`period: 'night' | 'morning' | 'afternoon' | 'daytime'` + 既有 mode。时段划分：night ≥ 23 或 < 5；morning 7-9；afternoon 12-14；其余 daytime。纯函数化使时段判定可单测（clock injection 模式，与现有 `random` 注入一致）
- **理由**: 既有 `determineMode` 已接受注入参数（`lastInteractionAt` 等），加 `hour` 保持纯函数契约；小程序端可直接复用
- **备选方案**: 在 RoamingPet 用 `Date` 硬编码分支——不可测、小程序不可复用，否决

### Decision 2: 夜间回窝（复用 handleReturnHome 逻辑）
- **选择**: RoamingPet 的 wander tick 中：`mode === 'resting' && isNightTime && 有 pet-spot zone` 时 → 调用回窝路径（走到小窝中心 → `startResting` → `setAction('sleep')`）；无小窝时 fallback 原地休息。与现有"2 分钟无交互走向小窝"逻辑合并：夜间优先级更高（立即回窝而非先原地休息 2 分钟）
- **理由**: `handleReturnHome` 已验证（回窝按钮），复用其状态路径；去掉"23 点硬切原地休息"的突兀
- **备选方案**: 单独实现夜间回窝状态机——重复逻辑，否决

### Decision 3: 早晨醒来（睡醒动作 + 气泡）
- **选择**: 每 tick 检测 `morning` 时段 && 正在睡眠（`isResting`）→ 唤醒（`wakeUp()` + `setAction('idle')`）+ 气泡"早上好~ ☀️"（每日一次，`lastMorningGreetRef` 记日期防重复）
- **理由**: 唤醒是既有 `wakeUp`；气泡是既有 `showBubble`；仅需"时段 + 日期守卫"
- **备选方案**: 后端定时推送——过度，前端 tick 足够

### Decision 4: 午后小憩（区分于夜间睡眠）
- **选择**: `afternoon` 时段且非 resting 时，每 tick 低概率（~5%）进入小憩：`setAction('rest')` + 短暂 resting（90s，`smallNapUntilRef` 记到期时间）；到期恢复游走。小憩用 `rest` 动作（区别于夜间 `sleep`）
- **理由**: 与夜间睡眠视觉区分（rest = 下坐打盹 vs sleep = 蜷缩 Zzz）；概率化避免每天固定打扰
- **备选方案**: 固定 13 点整小憩——过于机械

### Decision 5: 深夜打哈欠提示（反哺首个落地）
- **选择**: `night` 时段且未 resting 时，每 tick 低概率（~10%）`setAction('yawn', 1800)` + 气泡"夜深啦，该睡觉了~ 😴"（10 分钟冷却防刷屏，`yawnCooldownRef`）
- **理由**: 蓝图"深夜使用→打哈欠提示休息"最小落地；yawn 动作由 pet-vivid-polish 提供（变更依赖：pet-vivid-polish 先行）
- **备选方案**: 强制回窝——剥夺用户控制权，否决

## DDD Layer Design

### 领域层 (domain/)
无。

### 基础设施层 (infrastructure/)
无。

### 应用层 (application/)
无。

### API 层 (api/)
无。

### 前端 (frontend/src/)
- `packages/shared/src/pet/roaming.ts` — `determineMode` 增加 `hour` 输入与 `period` 输出（night/morning/afternoon/daytime）
- `frontend/src/modules/pet/components/RoamingPet.tsx`
  - 夜间回窝分支（复用 handleReturnHome 状态路径）
  - 早晨唤醒（lastMorningGreetRef 日期守卫）
  - 午后小憩（smallNapUntilRef）
  - 深夜打哈欠（yawnCooldownRef + yawn 动作）

## API Design
无。

## Database Design
无。

## Risks / Trade-offs
- [时段判定与用户本地时区] → 使用 `new Date().getHours()`（浏览器本地时区，与现有行为一致）；服务端无关
- [小憩/打哈欠打断用户操作] → 均为低概率 + 短动作 + 气泡不阻塞；打断用 `setAction` 幂等覆盖
- [与 pet-vivid-polish 的 yawn 动作依赖] → 变更顺序：vivid-polish 先行交付（或 rhythm 延后至其归档）
- [测试注入 hour] → `determineMode` 纯函数测试覆盖各时段边界（22/23/5/7/9/12/14）

## Migration Plan
1. `roaming.ts` 扩展 + 测试 → 重建 shared dist
2. RoamingPet 接线（四个节律分支）
3. 部署：纯前端热更新；回滚 = revert 提交

## Open Questions
- 时段边界（23 点入夜、7 点晨醒）是否做成配置项 → 先常量，后续设置面板暴露
- 小憩是否需要在移动端（小程序）同样启用 → shared 纯函数已支持，UI 接线留小程序阶段
