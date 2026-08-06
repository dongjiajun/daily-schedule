# Proposal: pet-vivid-engine

## Why
宠物形象与活动"感知为零"：SVG 插画是**纯静态**的（情绪切换只改嘴型/眼睛/尾巴角度参数，无呼吸、无眨眼、无走路循环）；游走移动是直线缓动无步伐起伏；**进窝休息时视觉上=原地静止**（用户从未"见过"宠物睡觉）；`pet-avatar` spec 仍描述已废弃的 Rive 动画方案（实现早已迁移至 SVG，spec 未同步）。根因是缺少"动作维度"：行为（走/停/睡）与表情（8 种情绪）耦合在单一 emotionState 里，动画无处安放。

## What Changes
- **Action/Emotion 双维状态机**：petStore 新增 `action` 维度（`idle` / `walk` / `pace` / `rest` / `sleep` / `jump`），与 8 种 emotion 正交——"走路时开心的猫"从不可表达到可表达
- **SVG 动画层**：OrangeCat/ShibaInu 内嵌 CSS 动画响应 action：idle→呼吸循环+周期性眨眼（3-5s）、walk→步伐摆动+身体起伏、rest→下坐+尾巴慢摆、**sleep→闭眼+蜷缩+Zzz 循环气泡**、jump→抛物线；情绪仍切换脸部参数（嘴/眼/耳）
- **影子**：地面椭圆随 y 高度缩放（低成本高灵动）
- **行为接线**：RoamingPet 移动中设 walk、进窝/无交互 resting 设 sleep（含 Zzz）、到达目标后短暂"到达小动作"；`pet-avatar` spec 修正为 SVG 动画层方案（废弃 Rive 描述）

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `pet-avatar`: 渲染引擎从"Rive 动画"修正为"SVG 插画 + CSS 动画层"（spec 落后于实现的勘误性需求变更）；新增连续动画要求（呼吸/眨眼/走路循环/睡眠表现）
- `pet-emotion-state-machine`: 新增 Action 维度（与 Emotion 正交的动作状态机）
- `pet-roaming-system`: 移动时 walk 动作联动 + resting 时 sleep 表现（进窝睡觉可视化）

## API Contract Impact
无（不改 specs/openapi.yaml；纯前端表现层变更）。

## DDD Layer Impact
无后端代码变更（API / 应用 / 领域 / 基础设施 均不触碰）。

## Database Impact
无（不需要新 Flyway 迁移）。

## Impact
- 前端：`petStore`（action 维度）、`OrangeCat.tsx` / `ShibaInu.tsx`（CSS 动画层 + 影子）、`RoamingPet.tsx`（action 接线）、`SvgAvatar.tsx`（透传 action）
- 测试：petStore action 单测、SvgAvatar action 渲染测试（aria-label 扩展）、RoamingPet action 接线测试回归
- 文档：component-catalog（SvgAvatar/RoamingPet 描述）；docs-check 全绿
- 注：工作区已有 pet-lifecycle-ui 的 25 个未提交文件，本变更实施时只触碰上述宠物表现文件，提交时两组变更各自独立
