# Design: pet-roam-robustness

## Context
v3.3.3 已交付宠物区域感知全部能力（Zone 模型/注册表/小窝进窝/日程框往返），但游走机制存在 3 个健壮性缺陷：

1. **Zone 衰减时序不匹配**：`RoamingPet.tsx` 兴趣区 `decayTime: 15_000`（毫秒），而游走 tick 间隔 `WANDER_INTERVAL_MIN/MAX = 10-30s`（`shared/roaming.ts:77-78`）。tick 间隔超过 15s 时兴趣区在宠物感知前已被 `setTimeout` 硬删 → 吸引经常失效。
2. **渲染稀释**：`scheduleWander` useCallback 依赖 `[position, lastInteractionTime, isResting, ...]`，tick 内 `setPosition` → 组件重渲染 → useCallback 重建 → effect `[pet, scheduleWander]` 重跑 → cleanup 清游走 timer 重排 → 间隔被拉长且不稳定（`useMyPet` refetch 30s 同样触发）。
3. **SVG console 噪音**：`OrangeCat.tsx` / `ShibaInu.tsx` 使用 `<g transform="rotate(angle, cx, cy)">` SVG1 旧式逗号格式，触发 console 警告。

另发现隐患：`registerZone` 覆盖注册（同 id）时，旧条目的 decay `setTimeout` 未被清除，到期会误删新注册的 Zone（当前 id 唯一未触发，属潜在 bug）。

**约束**：纯前端变更（pet 模块 + shared 包），无后端/API/数据库改动；行为语义（10-30s 游走节奏、兴趣吸引、进窝、往返）保持不变，仅修正时序与稳定性。

## Goals / Non-Goals

**Goals:**
- 兴趣区保鲜期覆盖最大游走间隔（30s + 余量），吸引不再失效
- 游走节奏与 React 渲染解耦——refetch/情绪/hover 等渲染不重置游走 timer
- 消除 SVG transform console 噪音
- 修复覆盖注册时旧 decay timer 误删新 Zone 的隐患
- 现有行为（进窝/往返/兴趣吸引）零回归

**Non-Goals:**
- 不重构游走引擎为模块级单例（RoamingEngine）——超出本次范围
- 不改动游走节奏参数本身（10-30s / 移动 3-8s 语义不变）
- 不涉及后端 DDD 层、API 契约、数据库
- 不处理已知行为"新用户引导弹窗遮挡宠物交互"（正常行为）

## Decisions

### Decision 1: Zone 衰减改为惰性过期（读取时过滤），保鲜期 15s → 45s
- **选择**: `zoneRegistry` 移除 decay `setTimeout`；`getZones()` 读取时按 `createdAt + decayTime` 过滤过期条目（过滤时同步删除，防 Map 滞留）；兴趣区 `decayTime` 15s → 45s（> 30s 最大 tick + 8s 移动余量）。`registerZone` 返回注销函数签名不变（无 timer 可清，但保持 API 兼容）。
- **理由**: 衰减语义是"宠物感知不到已过期的兴趣区"——感知发生在 tick（10-30s），判定应与感知时刻统一，而非与创建时刻的定时器耦合。45s 保鲜期保证宠物任何 tick 都能感知到兴趣区（30s 内必然 tick 一次）；到期后下一 tick 自动消失，行为与 spec"到期自动移除并恢复 wandering"完全一致。同时天然修复覆盖注册时旧 timer 误删的隐患（不再有 timer）。无 decayTime 的 Zone（pet-spot / calendar-cell）不受影响。
- **备选方案**: 仅将 decayTime 调大到 45s、保留 setTimeout——改动最小但未修 timer 误删隐患，且定时器精度与 tick 无耦合（过期判定时点语义不统一）；Zone 到期主动发事件通知宠物——宠物是低频轮询模型，推式通知过度设计。

### Decision 2: 游走 tick 回调改用 `usePetStore.getState()` 读取状态，`scheduleWander` 依赖收敛
- **选择**: tick 回调内（含进窝边沿判定、mode 判定、attracted/wandering/resting 分支）一律通过 `usePetStore.getState()` 读取最新 `position` / `lastInteractionTime` / `isResting`；`scheduleWander` useCallback 依赖收敛为空数组（store actions 稳定）；渲染 effect 仅在 `pet` 首次就绪时启动游走。`moveDuration` 用 `useMemo` 按 `[isResting, pacingCellId]` 固定（同一状态区间内移动时长稳定，不再每次渲染重随机）。
- **理由**: 游走循环的"事实来源"是 Zustand store（非 React props）——tick 执行时刻的闭包值天然滞后，`getState()` 读的是实时值，与渲染完全解耦。依赖收敛后 `scheduleWander` 引用稳定 → effect 不重跑 → 任何渲染（refetch 30s / idleVariant 22.5s / hover / 情绪）都不会清掉重排游走 timer，节奏恢复为纯 10-30s 随机间隔。`startPacing`/`stopPacing` 已是 `useCallback([])` 稳定且内部用 `getState()`，保持不变。
- **备选方案**: 用 `useMemo` 缓存 scheduleWander——仍是渲染依赖链（position 变化即重建），治标不治本；游走循环迁到模块级单例引擎——wasInHomeRef/pacing refs/定时器全部外迁，架构更重，风险面扩大（列为 Non-Goal）。

### Decision 3: SVG transform 改 SVG2 空格分隔格式
- **选择**: `<g transform={`rotate(${angle}, ${cx}, ${cy})`}>` → `<g transform={`rotate(${angle} ${cx} ${cy})`}>`（OrangeCat.tsx 3 处、ShibaInu.tsx 3 处；`style.transform: scale(...)` 已是合法 CSS 写法不动）。
- **理由**: `rotate(a, x, y)` 逗号格式为 SVG1 旧式，现代浏览器/React 19 产生 console 警告噪音；SVG2 标准为空格分隔 `rotate(a x y)`，语义完全等价，一行级改动零行为影响。
- **备选方案**: 改用 style matrix/translate 组合——g 元素 transform attribute 本就支持，无需引入 style；整体重绘 SVG——超出范围。

## DDD Layer Design

### 领域层 (domain/)
无后端改动。

### 基础设施层 (infrastructure/)
无后端改动。

### 应用层 (application/)
无后端改动。

### API 层 (api/)
无后端改动。

### 前端 (frontend/src/)
- **`modules/pet/lib/zoneRegistry.ts`**（Decision 1）：`registerZone` 去掉 decay setTimeout；`getZones()` 惰性过滤 + 过期条目同步删除；注销函数保持签名。
- **`modules/pet/components/RoamingPet.tsx`**（Decision 2）：兴趣区 `decayTime: 15_000 → 45_000`；tick 回调改 `getState()` 读取；`scheduleWander` 依赖收敛 `[]`；`moveDuration` 改 useMemo。
- **`modules/pet/components/SvgAvatar.tsx` + `assets/svg/OrangeCat.tsx` + `ShibaInu.tsx`**（Decision 3）：rotate 格式清理。

### 共享包 (packages/shared/)
- 无代码变更（游走常量、Zone 类型不变）；若惰性过期语义需要 shared 侧配合（如 Zone 类型注释），仅文档级调整。

## API Design
无 API 变更（specs/openapi.yaml 不动）。

## Database Design
无数据库变更。

## Risks / Trade-offs
- [游走循环改造引入行为回归（getState 读取时机错误）] → 现有测试全量回归（进窝/往返/边沿守卫/兴趣吸引 5 用例）+ 新增"渲染不重排节奏"用例 + dev 环境 smoke（宠物 3 分钟内完成 tick、进窝、往返观察）
- [惰性过期后 Map 滞留过期条目] → getZones 过滤时同步 delete，读取即清理
- [moveDuration useMemo 后情绪速度变化（happy 快 / sad 慢）失效] → 依赖数组含 isResting/pacingCellId，情绪仍由 setEmotion 覆盖——实际 speedMultiplier 由 `randomMoveDuration(speedMultiplier)` 参数决定，情绪映射在调用处（`isResting ? 0.5 : pacingCellId ? 0.3 : 1`）不变
- [45s 保鲜期使兴趣区"过时吸引"概率升高（用户已离开）] → 原有 50%/30% 概率门槛不变，且到达后停留 5-10s 自动恢复漫步，过时 Zone 最坏情况是多走一次目标点

## Migration Plan
1. 按 tasks.md 实施前端 + 测试改动
2. 单测 + lint + build 通过；dev 环境启动验证 console 无 SVG 警告、宠物游走节奏稳定
3. 版本 v3.3.3 → v3.3.4（specs/openapi.yaml + backend/pom.xml + frontend/package.json + specs/CHANGELOG.md）
4. 回滚：git revert 即可（无数据/契约影响）

## Open Questions
无。
