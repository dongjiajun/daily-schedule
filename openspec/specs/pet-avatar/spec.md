# Pet Avatar（宠物形象展示）

## Purpose
宠物形象是宠物模块的核心视觉组件，使用 Rive 动画引擎渲染，根据 petStore 状态切换情绪（idle/happy/sad/hungry）。

## Requirements

### Requirement: Rive 动画渲染
系统 SHALL 使用 `@rive-app/react-canvas` 的 `useRive` hook 渲染宠物动画。根据 petStore 的 `animationState` 切换 Rive 状态机（idle / happy / sad / hungry）。

#### Scenario: 正常状态展示 idle 动画
- **WHEN** 宠物 mood ≥ 60 且 hunger ≥ 50，且无事件触发
- **THEN** Rive 动画状态为 idle，宠物在 Canvas 中正常展示

#### Scenario: 饥饿状态
- **WHEN** 宠物 hunger < 30
- **THEN** Rive 动画状态切换为 hungry

#### Scenario: 事件触发 happy
- **WHEN** 收到 `event:completed` 或 `event:created` 事件
- **THEN** Rive 动画状态切换为 happy，5 秒后恢复 idle

#### Scenario: Rive 加载失败 fallback
- **WHEN** `.riv` 文件加载失败或无动画文件
- **THEN** 展示静态 emoji 占位（🐱/🐶），不报错崩溃

### Requirement: 响应式尺寸
宠物形象 SHALL 在悬浮面板中为 100×100px，在详情页（PetPage）中为 200×200px。

#### Scenario: 悬浮面板小尺寸
- **WHEN** 在 PetPanel 中渲染 PetAvatar
- **THEN** Canvas 尺寸为 100×100px
