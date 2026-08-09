# Proposal: leaf-heart-fall-effects

## Why
共享包 `THEME_MAP` 声明了 5 个节日使用 `leaf`/`heart` 特效（情人节→heart；感恩节/圣帕特里克节/清明节/世界环境日→leaf），但前端没有任何对应实现组件，且 `EffectLayer` 维护的第二份硬编码映射表也未覆盖这些节日——运行时这些节日**实际无动态特效**，数据声明与行为不一致。同时双份映射存在漂移风险，与"shared 包为唯一真相源"的架构约束相悖。

## What Changes
- 新增 `LeafFallEffect` / `HeartFallEffect` 飘落特效组件（复用 `PetalFallEffect` 纯 CSS emoji 模式）
- `EffectLayer.getEffectType()` 删除本地硬编码映射表，改为消费共享包 `getThemeForHoliday(activeHolidayId).effectType`（唯一真相源）
- 修正 `EffectLayer` 中 "heart/leaf effects are handled by CSS gradient overlay" 的错误注释（CSS 仅提供配色渐变，无心形/叶子元素）
- `holiday-effects` spec 补全 `leaf`/`heart` 与组件的映射需求

## Capabilities

### New Capabilities
- 无（无全新需求，均为现有 `holiday-effects` 能力的实现补全）

### Modified Capabilities
- `holiday-effects`: 补全 `leaf` → `LeafFallEffect`、`heart` → `HeartFallEffect` 映射；特效类型解析统一由共享包 `THEME_MAP` 提供，消除 EffectLayer 本地硬编码副本

## API Contract Impact
无（纯前端 + shared 包类型消费，不触碰 `specs/openapi.yaml`）

## DDD Layer Impact
无（不涉及后端任何层）

## Database Impact
无需新 Flyway 迁移

## Impact
- `frontend/src/core/components/effects/`：新增 `LeafFallEffect.tsx`、`HeartFallEffect.tsx`；修改 `EffectLayer.tsx`
- 测试：`EffectLayer.test.tsx` 更新（覆盖 leaf/heart 渲染 + 单一真相源），新增组件测试
- 文档：`docs/frontend/component-catalog.md`（新增组件条目）、`docs/architecture.md`（特效系统描述核对）、`openspec/specs/holiday-effects/spec.md`（同步映射）
