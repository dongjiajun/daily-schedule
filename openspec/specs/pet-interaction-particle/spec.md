# Pet Interaction Particle

互动粒子爆发系统 — 短暂局部特效（爱心/星星/金币/火花）。

## Purpose

互动粒子爆发系统 — 短暂局部特效（爱心/星星/金币/火花）。

## Requirements

### Requirement: Particle Burst on Interaction
宠物互动 SHALL 触发短暂粒子爆发特效，从宠物位置发射。

#### Scenario: Heart particles on pet click
- **WHEN** 用户点击宠物（摸头）
- **THEN** 从宠物位置发射 5-8 个 ❤️ 粒子，向上飘散
- **THEN** 粒子 1.5s 后消失

#### Scenario: Star particles on completion
- **WHEN** 宠物触发 `happy`/`excited` 状态
- **THEN** 发射 8-12 个 ⭐ 粒子，向四周散开
- **THEN** 粒子持续 2s

#### Scenario: Coin particles on feed
- **WHEN** 用户喂食宠物
- **THEN** 发射 3-5 个 🪙 粒子，从食物位置飞向宠物
- **THEN** 粒子持续 1s

### Requirement: Particle Performance Budget
粒子系统 SHALL 遵守性能预算，不阻塞主线程。

#### Scenario: Particle count limits
- **WHEN** 粒子系统触发
- **THEN** Web 端同时存在粒子数 ≤ 15
- **THEN** 小程序端同时存在粒子数 ≤ 8
- **THEN** 超出上限时丢弃最早的粒子

#### Scenario: Reduced motion
- **WHEN** 系统 `prefers-reduced-motion` 或 `effectIntensity === 'off'`
- **THEN** 不渲染任何粒子特效

### Requirement: Reusable Particle Component
粒子系统 SHALL 封装为可复用的 `ParticleBurst` 组件。

#### Scenario: Declarative particle trigger
- **WHEN** 调用 `<ParticleBurst origin={pos} type="hearts" count={8} />`
- **THEN** 在 `origin` 位置发射指定类型和数量的粒子
- **THEN** 粒子动画由 framer-motion `animate` 驱动（从原点向随机方向移动+淡出）
