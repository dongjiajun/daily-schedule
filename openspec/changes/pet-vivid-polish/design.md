# Design: pet-vivid-polish

## Context
表现层现状（`animations.ts` + `OrangeCat/ShibaInu.tsx` + `petStore.ts`）：
- `PetAction = idle|walk|pace|rest|sleep|jump`，由 `data-action` 属性驱动 CSS 动画层，`actionTimer`（duration 到期自动回 idle）已支持临时动作
- idle 只有呼吸（scaleY 1.02）+ 4s 眨眼 + 尾巴 ±8°；`idleVariantTimer` 每 15-30s 把表情切到 `idle_variant` 2.5s（仅换脸）
- 喂食/购买（`FoodActionList`）只触发粒子 + 浮动数字，宠物形象零动作
- 情绪由 SVG 表情参数表达，切换瞬间完成

约束：`PetAction` 是联合类型（petStore + 两 SVG 组件 + 测试引用）；动画全部 CSS keyframes；React Compiler lint 对自引用定时器要求 ref pattern（既有模式）。

## Goals / Non-Goals

**Goals:**
- 喂食/购买时宠物做出"吃"的动作（低头张嘴咀嚼 1.5s），吃完开心尾巴快摆
- idle 状态周期性出现随机小动作（伸懒腰/打哈欠/挠耳朵/东张西望），每次播放约 1-2s
- 情绪切换经一次眨眼过渡（约 50ms），消除"换脸"感
- walk 时身体前倾 5°（与步伐摆动叠加）

**Non-Goals:**
- 不新增后端接口/字段（喂食行为沿用 `interact FEED` / `purchase`）
- 不引入帧动画（Lottie/视频）——保持 CSS 动画层
- 不做作息节律（pet-rhythm 独立变更）
- 不做新物种/装扮

## Decisions

### Decision 1: 新增 `eat` 动作（有限状态，不引入状态机改造）
- **选择**: `PetAction` 增加 `'eat'`；`FoodActionList` 喂食/购买成功回调后 `setAction('eat', 1500)`（actionTimer 自动回 idle）。`animations.ts` 新增 `[data-action="eat"]` keyframes：身体低头（rotate 8°）+ 嘴部开合（scaleY 交替）+ 尾巴快摆；咀嚼期间耳朵微动
- **理由**: actionTimer 机制已存在，零状态机改造；eat 是"临时动作"的自然用例
- **备选方案**: 复用 `rest`/`pace` 加表情——没有咀嚼视觉，不成立

### Decision 2: idle 小动作系统（动作序列 keyframes + 随机定时器）
- **选择**: `animations.ts` 定义 4 个"播放一次"的小动作 keyframes 组（`pet-stretch` 伸懒腰 1.6s、`pet-yawn` 打哈欠 1.8s、`pet-scratch` 挠耳 1.2s、`pet-look` 东张西望 1.4s，`animation-iteration-count: 1`，各带 `forwards` 结束态）。`RoamingPet` 的 `idleVariantTimer` 改造：每 8-18s 随机选一个动作 → `setAction` 加 `actionSeq`（或复用现有 `action` 位：用小动作 action 名 + duration）
- **选择细化**: 扩展 `PetAction` 为 `idle|walk|pace|rest|sleep|jump|eat|stretch|yawn|scratch|look` 使 CSS 选择器直通；duration 由调用方给（1500-2000ms）。播放条件：`emotionState === 'idle' && !isResting && !cellPhysicsRef.current`
- **理由**: 小动作是"播放一次的动画"，与状态机正交；用 action 位承载最简单，CSS 选择器天然支持
- **备选方案**: 独立 `microAction` 字段与 action 并行——双状态源易失同步；独立组件叠加动画——过度设计

### Decision 3: 情绪切换眨眼过渡
- **选择**: `SvgAvatar` 渲染时维护 `prevEmotion` ref；emotion 变化时先强制眨眼（`.pet-eyes` 加 `pet-blink-now 50ms` 一次性动画），50ms 后再切表情参数（`requestAnimationFrame` 双层保证两帧后切换）。实现为 `useEffect` 监听 emotion 变化
- **理由**: 眨眼是 SVG 已有动画能力（pet-blink），50ms 过渡几乎零成本；切换时用户看到"闭眼换脸再睁开"
- **备选方案**: CSS transition 表情参数——SVG path 参数不可插值，否决；framer-motion 交叉淡化——两套 SVG 叠加成本高

### Decision 4: walk 身体前倾
- **选择**: `[data-action="walk"] .pet-body` 动画 `pet-bob` 增加 rotate 偏移（-4deg 前倾基准 + ±2deg 摆动）
- **理由**: 一行 keyframes 改动；移动方向感增强
- **备选方案**: 按 facing 动态前倾（JS 驱动）——与 scaleX 翻转叠加符号问题，成本不值

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
- `modules/pet/store/petStore.ts` — `PetAction` 扩展 + `actionTimer` 机制复用（`setAction(action, duration)` 已有）
- `modules/pet/assets/svg/animations.ts` — eat / stretch / yawn / scratch / look / blink-now keyframes
- `modules/pet/assets/svg/OrangeCat.tsx` + `ShibaInu.tsx` — 动作渲染接入（数据属性 + 动画类名）
- `modules/pet/components/FoodActionList.tsx` — 成功后 `setAction('eat', 1500)`
- `modules/pet/components/SvgAvatar.tsx` — 情绪切换眨眼过渡
- `modules/pet/components/RoamingPet.tsx` — `idleVariantTimer` 改造为小动作调度器（含格内/休息守卫）

## API Design
无。

## Database Design
无。

## Risks / Trade-offs
- [PetAction 联合类型扩展波及测试/组件] → 联合类型新增是向后兼容的加法，现有 `switch` 兜底分支已处理；更新引用的测试
- [小动作播放被打断（用户点击/格内互动）] → 动作短（1-2s）且定时器在格内/休息时不调度；`setAction` 幂等覆盖即可
- [眨眼过渡在情绪高频变化时抖动] → 50ms 一次性动画，过渡前取消上次（ref 存 timer）
- [eat 与格内状态机 action 冲突] → eat 仅由用户喂食触发，格内期间不喂食（交互路径互斥）；若发生，actionTimer 自然收敛

## Migration Plan
1. `petStore` 类型扩展 → `animations.ts` + 两 SVG 组件 → `FoodActionList`/`RoamingPet` 接线
2. 测试更新（petStore action 类型、PetAvatar 渲染、FoodActionList 触发）→ `pnpm run verify`
3. 部署：纯前端热更新；回滚 = revert 提交

## Open Questions
- 小动作的触发概率与间隔（8-18s）是否需要用户可感知的调节入口 → 先固定常量，后续设置面板再暴露
- 橘猫与柴犬的"挠耳朵"动画是否需要物种差异（猫用前爪、狗用后爪）→ v1 统一共用，物种差异留给形象大版本
