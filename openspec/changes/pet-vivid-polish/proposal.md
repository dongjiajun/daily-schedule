# Proposal: pet-vivid-polish

## Why
宠物表现层静态化：喂食/购买时宠物全程无动作（只有粒子+数字）；idle 状态仅微呼吸+眨眼+尾巴慢摆，用户 80% 时间看到的是"静止蜡像"；情绪切换瞬间换脸、无过渡。

## What Changes
- 新增 `eat` 动作：喂食/购买成功后宠物低头张嘴咀嚼 1.5s（复用 actionTimer 自动回 idle），吃完开心尾巴快摆
- idle 小动作系统：把现有"15-30s 换一次表情"升级为随机动作序列（伸懒腰 / 打哈欠 / 挠耳朵 / 东张西望），每个为播放一次的 keyframe 组，播放时宠物"活了"
- 情绪切换过渡：表情切换经一次眨眼（50ms 闭眼瞬间换脸），消除换脸感
- 移动质感：walk 时身体前倾 5°（与步伐摆动叠加）

## Capabilities

### New Capabilities
无（本变更为既有宠物形象能力的增强，无全新能力）

### Modified Capabilities
- `pet-avatar`: SVG 动画层扩展——新增 eat 进食动作、idle 随机小动作系统（伸懒腰/打哈欠/挠耳/张望）、情绪切换眨眼过渡、walk 前倾

## API Contract Impact
无影响（纯前端表现层；喂食接口不变）

## DDD Layer Impact
无（后端不涉及）

## Database Impact
无

## Impact
- `frontend/src/modules/pet/assets/svg/animations.ts` — 新增 eat / idle 小动作 / 过渡 keyframes
- `frontend/src/modules/pet/assets/svg/OrangeCat.tsx` + `ShibaInu.tsx` — 动作渲染接入
- `frontend/src/modules/pet/store/petStore.ts` — `PetAction` 联合类型扩展
- `frontend/src/modules/pet/components/FoodActionList.tsx` — 喂食/购买触发 eat 动作
- `frontend/src/modules/pet/components/RoamingPet.tsx` — idle 小动作定时器改造
- `docs/frontend/component-catalog.md` — 动画层/SvgAvatar 描述
