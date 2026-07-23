# Lottie Animation Engine

Lottie 动画运行时集成，管理动画片段切换与情绪状态映射。

## Requirements

### Requirement: Lottie Runtime Integration
系统 SHALL 集成 `lottie-react` 作为宠物动画引擎，替代 emoji 占位。

#### Scenario: Load and play Lottie animation
- **WHEN** RoamingPet 渲染且 `animationState` 为 `idle`
- **THEN** 加载对应物种的 `idle.json` Lottie 文件并循环播放
- **THEN** 动画以 `pointer-events: none` 渲染，不阻挡用户交互

#### Scenario: Switch animation on state change
- **WHEN** `animationState` 从 `idle` 变为 `happy`
- **THEN** 动画片段切换为 `happy.json`，使用 crossfade 过渡（如有），否则 instant 切换
- **THEN** 播放完成后回退到 `idle`

#### Scenario: Fallback to SVG sprite on load failure
- **WHEN** Lottie JSON 加载失败或 `lottie-react` 不可用
- **THEN** 降级为 SVG 插画 + CSS animation（物种×情绪对应不同 SVG）

### Requirement: Lottie File Organization
宠物动画文件 SHALL 按物种和情绪组织。

#### Scenario: Animation file structure
- **WHEN** 需要播放 `ORANGE_CAT` 的 `happy` 动画
- **THEN** 加载路径为 `modules/pet/assets/lottie/orange_cat/idle.json`
- **THEN** 支持的情绪片段: `idle`, `happy`, `sad`, `hungry`, `sleepy`, `excited`, `idle_variant`

### Requirement: SVG Illustration Fallback
系统 SHALL 提供 SVG 插画作为 Lottie 加载前的过渡视觉。

#### Scenario: SVG rendering for each emotion
- **WHEN** Lottie 动画尚未准备好或加载中
- **THEN** 渲染对应物种+情绪的 SVG 插画组件
- **THEN** SVG 插画支持 CSS animation 实现基础动效（呼吸/摇摆）
