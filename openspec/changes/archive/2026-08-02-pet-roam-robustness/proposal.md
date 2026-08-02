# Proposal: pet-roam-robustness

## Why
宠物游走机制存在 3 个健壮性缺陷：兴趣区保鲜期（15s）短于最大游走 tick 间隔（30s）导致吸引经常失效；每次渲染（refetch/情绪变化）都会重排游走 timer 导致节奏被拉长；SVG 组件使用旧式 transform 格式产生 console 噪音。v3.3.3 已交付区域感知全部能力，现在收尾健壮性。

## What Changes
- **Zone 衰减时序匹配**：兴趣区（user-interaction）decayTime 15s → 45s（覆盖最大 tick 30s + 移动时长余量），衰减语义改为"读取时惰性过期"（getZones 按 createdAt + decayTime 过滤），移除 setTimeout 硬删——同时修复覆盖注册时旧 decay timer 误删新 Zone 的隐患
- **游走节奏不被渲染稀释**：游走 tick 回调改用 `usePetStore.getState()` 读取最新 position/交互时间/休息状态，`scheduleWander` 依赖收敛为空 → refetch/情绪/hover 等渲染不再重排游走 timer
- **SVG transform 格式清理**：OrangeCat/ShibaInu 的 `<g transform="rotate(...)">` 旧式格式改 React 19 兼容写法，消除 console 噪音

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `pet-zone-interaction`: Zone 衰减语义澄清（惰性过期 + 保鲜期覆盖最大游走间隔）
- `pet-roaming-system`: 游走节奏稳定性（渲染不得重置游走节奏）

## API Contract Impact
无影响（纯前端内部行为修正，不改 specs/openapi.yaml）

## DDD Layer Impact
无后端改动（前端 pet 模块 + shared 包 roam 引擎常量/测试）

## Database Impact
无需

## Impact
- `frontend/src/modules/pet/components/RoamingPet.tsx`：游走循环改造（getState 读取 + 依赖收敛）
- `frontend/src/modules/pet/lib/zoneRegistry.ts`：惰性过期实现
- `frontend/src/modules/pet/components/SvgAvatar.tsx` + `assets/svg/OrangeCat.tsx` + `ShibaInu.tsx`：transform 清理
- `packages/shared/src/pet/roaming.ts`：常量调整（如需）+ 测试
- 测试：RoamingPet.test.tsx（渲染不重排节奏）、zoneRegistry.test.ts（惰性过期）、SvgAvatar 相关（如有）
- 文档：CLAUDE.md 版本声明 v3.3.4
