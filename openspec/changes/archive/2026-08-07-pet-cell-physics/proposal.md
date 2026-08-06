# Proposal: pet-cell-physics

## Why
格内互动（calendar-cell pacing）当前是"两点一线慢速横移"：0.3s 动画 + 1.2-4.2s 静止，用户感知为"几乎看不出特殊交互"。期望的是有**物理质感**的格内行为：贴边行走、重力感、吸附落定、偶尔跳跃——让格子成为宠物的小型活动场而非一条线。`pet-vivid-engine` 已交付 action 维度（`pace` 类型已定义未接线）与 jump/影子动画，本变更在此基础上实现格内物理场。

## What Changes
- **格内物理状态机**（替换现有"左右横移 timer"）：`enter`（从格中心落地）→ `walk`（沿四边行走，随机边序）→ `cling`（贴边吸附落定 + 短暂停留）→ `hop`（偶尔贴边跳跃）→ `exit`（离开格子）
- **rAF 帧循环**：格内模式启用连续帧驱动位置插值（贴边/重力/吸附的手感来源）；普通游走保持低功耗（无 rAF）
- **重力与吸附**：格内垂直方向缓慢下沉贴底边；走到边线时位置吸附到边 + 短停留
- **完成度风格**：≥50% 欢快（绕圈 + 跳跃 + happy）、<50% 懒散（贴底边慢行 + 蜷缩姿态）
- **action 接线**：`pace` 动作激活（格内行为期间），复用 walk/jump 动画与影子
- 替换现有 `startPacing`/`stopPacing` timer 实现（RoamingPet 内）

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `pet-roaming-system`: 格内互动从"左右往返"升级为"物理状态机（贴边/重力/吸附/跳跃）"
- `pet-vivid-engine` 的 `pace` 动作从"类型定义"落地为"格内活动动画"

## API Contract Impact
无（不改 specs/openapi.yaml；纯前端表现层）。

## DDD Layer Impact
无后端代码变更。

## Database Impact
无（不需要新 Flyway 迁移）。

## Impact
- 前端：`RoamingPet.tsx`（格内物理状态机替换 pacing timer）、`petStore`（pace action 接线，无需改类型）、`shared/pet/roaming.ts`（格内目标计算纯函数：贴边路径/吸附点/跳跃，可单测）
- 测试：shared 格内算法单测（贴边路径/吸附/跳跃/完成度风格）+ RoamingPet 接线测试 + E2E 回归
- 文档：component-catalog（RoamingPet 描述）；docs-check 全绿
- 注：工作区已有两组未提交变更（pet-lifecycle-ui / pet-vivid-engine），本变更只触碰上述文件；`pace` 类型在 pet-vivid-engine 中已定义
