# Design: pet-vivid-engine

## Context
宠物感知质量为零的根因：SVG 插画纯静态（情绪=参数快照，无连续动画）；游走=直线缓动无步伐；进窝休息=原地静止（无睡眠表现）。`pet-avatar` spec 描述 Rive 方案（已废弃，实现为 SVG）。约束：纯前端表现层变更，不动后端/契约；复用现有 emotion 8 种状态与事件链路；动画必须低成本（CSS 为主，零新增依赖）。

## Goals / Non-Goals

**Goals:**
- Action/Emotion 双维状态机（动作与表情正交）
- SVG 动画层：呼吸/眨眼/尾巴摆动/走路步伐/睡眠（蜷缩+Zzz）/影子
- 行为接线：移动→walk、休息→sleep、到达→短动作、双击→jump
- `pet-avatar` spec 修正（Rive → SVG 动画层）

**Non-Goals:**
- 不做格内物理场（变更 ③ pet-cell-physics 范畴；pace 类型仅定义不接线）
- 不引入 Lottie/Rive 运行时（维持零动画库依赖）
- 不改 shared/pet 引擎（行为决策逻辑不变，仅表现接线）
- 不做粒子/音效增强（变更 ① 已交付粒子矩阵）

## Decisions

### Decision 1: Action 维度 = petStore 顶层状态 + setAction（带 duration 自动回退）
- **选择**: petStore 新增 `action: PetAction`（`'idle' | 'walk' | 'pace' | 'rest' | 'sleep' | 'jump'`）与 `setAction(action, duration?)`；duration 模式与 setEmotion 同构（stateTimer 到期回 idle）；`reset()` 清理
- **理由**: 与 emotion 正交的第二个维度，行为决策者（RoamingPet）设置动作、SVG 消费动作；duration 自动回退避免动作卡死（如 jump 0.6s 后回 idle）；与既有 setEmotion 模式一致，学习成本为零
- **备选方案**: (a) action 并入 emotionState 联合类型——丢失正交性（"走路时开心"不可表达）；(b) 独立 context/ref——状态分散

### Decision 2: SVG 动画层用组件内嵌 `<style>` + data-action 属性驱动
- **选择**: `OrangeCat.tsx`/`ShibaInu.tsx` 文件顶部渲染一个 `<style>{CSS 字符串}</style>`（keyframes + 类选择器），SVG 根元素挂 `data-action={action}` 属性；CSS 类如 `[data-action="walk"] .pet-leg { animation: leg-swing 0.4s infinite }`。动画元素按需加 className：`pet-body`（呼吸）、`pet-eyes`（眨眼）、`pet-tail`（尾巴摆动）、`pet-legs`（步伐）、`pet-sleep-bubble`（Zzz）
- **理由**: 组件自包含（无全局 CSS 污染，主题隔离）；`data-action` 属性驱动让动画完全由 action 决定（emotion 仍管脸部参数）；重复注入的 `<style>` 由浏览器按内容去重，多实例无性能损失；零新依赖
- **备选方案**: (a) 全局 pet-animations.css——需要模块注册/加载链路；(b) framer-motion 驱动 SVG 内部动画——每元素一个 motion 组件，复杂且重；(c) `<animate>` SMIL——兼容性与 React 控制差

### Decision 3: 眨眼/呼吸作为 idle 基底动画，walk/sleep 覆盖
- **选择**: idle 基底 = 呼吸（body scaleY 1→1.02，3s ease-in-out infinite）+ 眨眼（eyes 眼睛椭圆 scaleY 1→0.1→1，4s 周期 0.15s 眨眼）。walk 时呼吸让位给步伐（body 左右摆动 rotate ±2deg + legs 交替）；sleep 时 body 蜷缩（scaleY 0.92）+ 闭眼（沿用 sleepy 眼睛参数）+ Zzz 气泡（`pet-sleep-bubble` 文本元素从头部左上循环上飘淡出，2.4s）；rest 时尾巴慢摆（rotate ±8deg，2s）
- **理由**: 层级明确（基底呼吸眨眼 → 动作覆盖），动画元素各自独立不影响表情参数；Zzz 用 `<text>` 元素 + CSS animation（opacity/translate 循环）零 JS
- **备选方案**: 每情绪单独整套动画——组合爆炸；JS 驱动 rAF 眨眼——过度

### Decision 4: 影子 = SVG 外 div 椭圆，随 action/高度微调
- **选择**: `PetAvatar` 渲染宠物 SVG 时在其下方叠加地面阴影 div（`pet-shadow`：radial-gradient 椭圆，宽 = 宠物宽 60%）；CSS 动画 `[data-action="jump"]` 时阴影缩小+变淡（模拟离地），其余动作常驻
- **理由**: 低成本高感知（任何动作都"落地"）；jump 时阴影变化强化离地感，为变更 ③ 的格内跳跃预演
- **备选方案**: SVG 内 `<ellipse>` 阴影——受 SVG transform 影响抖动；canvas 阴影——重

### Decision 5: action 接线点 = RoamingPet（行为决策者唯一入口）
- **选择**: 接线点：(1) framer-motion `motion.div` 加 `onAnimationComplete`——移动完成回 idle（resting 时回 sleep）；(2) 移动发起处（tick 设置 target 后）设 `walk`；(3) resting 分支设 `sleep`（进窝即睡，Zzz 可见）；(4) 双击玩耍设 `jump`（0.6s）；(5) 格内往返（pacing）设 `walk`（pace 类型定义留给变更 ③）。`onAnimationComplete` 与渲染解耦（依赖收敛，不重排 timer——复用 pet-roam-robustness 的 getState 模式）
- **理由**: 全部接线集中在 RoamingPet（唯一知道行为语义的组件）；framer-motion 的 onAnimationComplete 是移动结束的自然钩子，无新 timer
- **备选方案**: shared 引擎返回 action——引擎是纯逻辑（不知渲染），职责错位

### Decision 6: pet-avatar spec 修正为 SVG 方案
- **选择**: `openspec/specs/pet-avatar/spec.md` 需求级重写：删除 Rive（`@rive-app/react-canvas`）描述，改为"SVG 插画 + CSS 动画层"（PetAvatar → SvgAvatar → species 资产），保留响应式尺寸需求，新增连续动画需求（呼吸/眨眼/走路/睡眠）
- **理由**: spec 落后实现两代（Rive → Lottie 计划 → SVG 落地），本次借变更同步；修正后 spec 成为后续动画增强的真实基线
- **备选方案**: 只加场景不删 Rive——保留错误信息

## DDD Layer Design
无后端代码变更（DDD 四层均不触碰）。

### 前端 (frontend/src/)
```
modules/pet/
├── store/petStore.ts            (扩展) action: PetAction + setAction/reset 清理
├── components/
│   ├── PetAvatar.tsx            (扩展) 传 action 给 SvgAvatar + 影子 div
│   ├── SvgAvatar.tsx            (扩展) 透传 action + data-action 属性
│   ├── assets/svg/OrangeCat.tsx (核心) <style> 动画层 + 动画元素 className + 尾巴/腿/身体结构调整
│   ├── assets/svg/ShibaInu.tsx  (核心) 同上（柴犬版本）
│   └── RoamingPet.tsx           (接线) walk/sleep/jump/onAnimationComplete
```

## API Design
无契约变更。

## Database Design
无（无 Flyway 变更）。

## Risks / Trade-offs
- [CSS 动画与 framer-motion 移动叠加抖动] → 走路动画幅度小（±2deg/±2px），移动是整体 translate（framer-motion），互不干扰；smoke 目视验证
- [onAnimationComplete 触发时机与渲染竞态] → 回调只设 action（getState 模式），不读旧闭包；对 timer 无影响（pet-roam-robustness 已验证解耦）
- [style 重复注入] → 浏览器按内容去重；PetPage/SidebarPet/RoamingPet 三实例各注入一次可接受
- [动画过多耗电（性能）] → 全部 CSS animation（GPU 合成），无 JS rAF；prefers-reduced-motion 媒体查询降级（仅保留呼吸）

## Migration Plan
1. petStore action 维度 + 单测
2. OrangeCat/ShibaInu 动画层（style + 元素 className）+ SvgAvatar/PetAvatar 透传 + 影子
3. RoamingPet 接线（walk/sleep/jump/onAnimationComplete）
4. 测试：SvgAvatar action 渲染（data-action 属性断言）、petStore action 单测、RoamingPet 接线回归
5. `pet-avatar` spec 同步（Rive → SVG）+ component-catalog 更新 + docs-check
6. 全量验证：vitest + lint/build + E2E 回归 + smoke（目视：呼吸/眨眼/走路/进窝 Zzz/双击跳）

回滚策略：纯前端表现层，文件级还原即可；spec 修正可一并回滚。

## Open Questions
- ShibaInu 的动画元素结构与 OrangeCat 差异（柴犬耳朵垂/尾巴卷）——实现时按物种微调动画参数，不做独立设计
