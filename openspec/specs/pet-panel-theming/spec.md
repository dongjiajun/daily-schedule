# Pet Panel Theming

## Purpose

宠物面板视觉风格统一为应用主题（毛玻璃 + 主题色），替代硬编码白色小卡片。

## Requirements

### Requirement: Themed Pet Panel Container
PetPanel 容器 SHALL 使用与应用 Shell 一致的主题化视觉风格。

#### Scenario: Glassmorphism background
- **WHEN** PetPanel 渲染
- **THEN** 容器使用 `bg-surface/90 backdrop-blur` 半透明毛玻璃背景
- **THEN** 容器使用 `rounded-2xl shadow-lg border border-border-subtle` 统一边框阴影
- **THEN** 容器尺寸不小于 180px × auto（从当前 140px 增大）

#### Scenario: Fixed positioning with theme integration
- **WHEN** PetPanel 可见
- **THEN** 固定在视口右下角 `fixed bottom-4 right-4 z-40`
- **THEN** 背景色随当前主题动态变化（通过 CSS 变量 `--color-surface` 驱动）

### Requirement: Themed Pet Status Bars
PetStatus 状态条 SHALL 使用主题渐变色替代硬编码颜色。

#### Scenario: Mood and hunger progress bars
- **WHEN** 宠物数据加载完成
- **THEN** 心情/饱食度进度条颜色通过 CSS 变量 `--color-accent` 驱动（而非硬编码 `#22c55e`/`#eab308`/`#ef4444`）
- **THEN** 进度条使用 `transition-all duration-500` 平滑过渡

#### Scenario: Coins and level display
- **WHEN** 渲染宠物代币与等级
- **THEN** 文字颜色使用 `text-foreground-secondary`（主题化），而非硬编码灰色

### Requirement: Themed Pet Bubble
PetBubble 气泡 SHALL 继承应用主题的毛玻璃风格。

#### Scenario: Themed bubble background
- **WHEN** `bubbleMessage` 非空
- **THEN** 气泡使用 `bg-surface/95 backdrop-blur` 代替硬编码 `#fff`
- **THEN** 文字颜色使用 `text-foreground` 代替硬编码 `#333`
- **THEN** 阴影使用 `shadow-lg` 统一系统阴影

### Requirement: Enhanced Pet Avatar Display
PetAvatar SHALL 提供更丰富的视觉呈现，即使使用 emoji 占位符。

#### Scenario: Avatar sizing and animation
- **WHEN** PetPanel 中渲染 PetAvatar
- **THEN** 默认尺寸从 80px 增大至 120px
- **THEN** 添加微妙的浮动动画（framer-motion `animate`），增强生命力

#### Scenario: Animation state-driven emoji
- **WHEN** `animationState` 变化（idle/happy/sad/hungry）
- **THEN** emoji 即时切换并伴有过渡效果
