# Pet Roaming System（宠物游走系统）

## Purpose
宠物在页面内随机漫步与休息行为的规格。本次变更量化休息/夜间回窝的移动时长上限，保证用户等待感知与自动化测试的确定性。

## MODIFIED Requirements

### Requirement: Resting Behavior
宠物 SHALL 依据昼夜节律与空闲状态进入休息；夜间（23 点后）自动走向小窝进窝睡觉，早晨（7-9 点）醒来并问候；休息 SHALL 呈现可见的睡眠表现（蜷缩 + Zzz 循环气泡），替代静止不动。

#### Scenario: Move to resting spot
- **WHEN** 无用户交互 > 2 分钟且无事件触发
- **THEN** 宠物走向宠物小窝（`pet-spot` Zone 区域，右侧边栏底部附近）休息
- **THEN** 到达后触发 `sleepy` 表情 + `sleep` 动作（蜷缩 + Zzz 气泡循环）

#### Scenario: 夜间自动回窝
- **WHEN** 本地时间 ≥ 23 点且宠物未在休息
- **THEN** 宠物 SHALL 立即走向小窝进窝睡觉（不原地硬切休息），到达后 `sleep` 动作 + 蜷缩 + Zzz

#### Scenario: 早晨醒来问候
- **WHEN** 本地时间处于 7-9 点且宠物正在睡眠中（每日首次）
- **THEN** 宠物 SHALL 唤醒（回 idle）+ 气泡"早上好~ ☀️"，当日不重复

#### Scenario: Resume roaming on activity
- **WHEN** 宠物在休息中且用户产生交互
- **THEN** 宠物唤醒，恢复 `idle` 状态，重新开始漫步

#### Scenario: Enter home spot to rest
- **WHEN** 宠物游走进入小窝（`pet-spot` Zone）区域
- **THEN** 宠物 SHALL 自动进窝休息（触发 `sleepy` 表情 + `sleep` 动作），无需等待无交互 2 分钟计时
- **THEN** 宠物 SHALL 停留在小窝内不再随机漫步，直到用户交互唤醒

#### Scenario: 回窝移动时长上限（本次新增）
- **WHEN** 宠物处于休息/夜间回窝的移动中（目标为小窝中心）
- **THEN** 单次移动动画时长 SHALL ≤ 11s（休息档约 4-11s，慢于正常档 3-8s 但可感知），保证用户等待体验与自动化测试断言的确定性

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| Move to resting spot | RoamingPet.test.tsx | 2 分钟无交互 resting 时目标 = 小窝中心（zoneCenter） | ✅ |
| 夜间自动回窝 | RoamingPet.test.tsx | 夜间（23 点）自动走向小窝进窝睡觉（不原地硬切、不等 2 分钟） | ✅ |
| 回窝移动时长上限（单测） | RoamingPet.test.tsx | 无时长档位断言（store 状态断言与动画时长解耦，核对结论：无需新增） | ⚠️ |
| 回窝移动时长上限（E2E） | e2e/rhythm-smoke.spec.ts | 夜间 23:30 → 自动走向小窝进窝睡觉（sleep 动作出现）＋ 早晨 8:00 睡眠中 → 唤醒（resume 后真实动画完成 + timeout 20s/40s） | ✅ |
