# Design: leaf-heart-fall-effects

<!-- 参考: docs/architecture.md + CLAUDE.md 技术约定 -->

## Context
共享包 `THEME_MAP`（`packages/shared/src/holiday/themeMapping.ts`）已声明 5 个节日使用 `leaf`/`heart` 特效（情人节→heart；感恩节/圣帕特里克节/清明节/世界环境日→leaf），但前端 `core/components/effects/` 仅有 4 个特效组件（firework/snow/petal/lantern），且 `EffectLayer.tsx` 的 `getEffectType()` 维护一份**独立于共享包的硬编码映射表**，未覆盖上述 5 个节日 → 运行时这些节日实际无动态特效。`EffectLayer.tsx:43` 注释声称 "heart/leaf handled by CSS gradient overlay" 与事实不符（CSS 仅配色渐变）。

现有特效组件均为独立实现、纯 CSS @keyframes + emoji（`PetalFallEffect`：emoji 数组 + rotate 摇摆；`SnowfallEffect`：文本 + linear 下落），`useMemo` 包裹随机、`intensity: 'low' | 'full'` 控制数量。共享包 `@daily-schedule/shared/holiday` 已导出 `getThemeForHoliday`，可直接消费。

## Goals / Non-Goals

**Goals:**
- 为 `leaf`/`heart` 提供实际飘落特效组件，5 个节日在运行时获得与 THEME_MAP 声明一致的特效
- `EffectLayer` 的 effectType 解析统一到共享包 `getThemeForHoliday()` 唯一真相源，删除本地硬编码副本
- 修正 `EffectLayer` 误导性注释
- `holiday-effects` spec 同步映射需求（delta 已写入）

**Non-Goals:**
- 不重构现有 4 个特效组件为公共基座/抽离公共飘落引擎（独立组件模式是既有架构事实，重构超出本次范围）
- 不新增 `EffectType` 枚举值、不修改 `THEME_MAP` 数据（本次是让实现跟上既有声明）
- 不触碰后端任何层 / API 契约 / 数据库
- 不为 `dragon-boat` 等 `effectType: 'none'` 的节日补特效

## Decisions

### Decision 1: 新特效组件实现方式 — 独立组件复制现有模式
- **选择**: 新增独立 `LeafFallEffect.tsx` / `HeartFallEffect.tsx`，完全复用 `PetalFallEffect` 的组件形态（emoji 数组、`useMemo` 随机、`intensity` 分级、内联 `<style>` keyframes、`pointer-events-none` + `aria-hidden`），各 ~60 行。
- **理由**: 现有 4 个组件都是独立文件、彼此无共享抽象（雪花是文本 + `linear`，花瓣是 emoji + rotate 摇摆），一致性要求是"形态一致"而非"代码共享"。新增组件照抄模式，零改动现有组件，风险最小，符合 karpathy 准则的 surgical change。
- **备选方案**: 抽公共 `FallEffect` 基座组件（props: emojis/keyframesName/count）。否决：需要同时重构现有 4 个组件，扩大回归面；现有测试断言直接针对各组件行为，重构收益（~60 行重复）不足以抵消风险，留待未来"特效引擎统一"变更。

### Decision 2: effectType 解析统一到共享包
- **选择**: 删除 `EffectLayer.tsx` 的 `effectMap` 硬编码表，改为 `import { getThemeForHoliday } from '@daily-schedule/shared/holiday'`，以 `getThemeForHoliday(activeHolidayId).effectType` 解析，返回类型收敛为 `EffectType` 联合类型（非 `string`）。
- **理由**: `packages/shared/src/holiday/themeMapping.ts` 是节日主题的唯一真相源（CLAUDE.md 契约），本次缺口正是双份数据源漂移的直接后果——本地映射漏了 5 个节日。统一后新增节日主题无需再改 `EffectLayer`。
- **备选方案**: 仅在本地 `effectMap` 补 5 个条目。否决：治标不治本，双份映射继续存在，下次新增节日主题仍可能漏改。

### Decision 3: leaf/heart 的视觉元素与强度分级
- **选择**: `LeafFallEffect` 使用落叶 emoji 集 `['🍂', '🍁', '🌿', '🍃']`，`HeartFallEffect` 使用 `['💖', '💕', '❤️', '💘']`；数量沿用既有惯例（full 40 / low 20，与花瓣一致）；keyframes 命名 `leaffall` / `heartfall`（避免与既有 `petalfall`/`snowfall` 冲突）。
- **理由**: 与 `PetalFallEffect` 强度语义一致（spec: low 数量减半），emoji 与既有组件同构（零图片资源）；keyframes 内联于组件但属全局 CSS 命名空间，新名字避免冲突。
- **备选方案**: 纯 CSS 绘制叶子/心形（border-radius 组合）。否决：emoji 与现有组件一致、跨平台渲染简单，绘制方案增加复杂度和维护成本。

## DDD Layer Design

### 领域层 (domain/)
无变更（不触碰后端）。

### 基础设施层 (infrastructure/)
无变更（无 persistence/security/scheduled/notification 改动，无 Flyway 迁移）。

### 应用层 (application/)
无变更。

### API 层 (api/)
无变更（无 Controller/Assembler/异常映射改动，不涉及 `specs/openapi.yaml`）。

### 前端 (frontend/src/)

```
core/components/effects/
├── EffectLayer.tsx          [修改] getEffectType() 删除本地映射，消费共享包 getThemeForHoliday()；修正注释
├── LeafFallEffect.tsx       [新增] 落叶飘落（emoji: 🍂🍁🌿🍃，keyframes: leaffall，count: full 40 / low 20）
├── HeartFallEffect.tsx      [新增] 爱心飘落（emoji: 💖💕❤️💘，keyframes: heartfall，count: full 40 / low 20）
└── __tests__/
    ├── EffectLayer.test.tsx [修改] 新增情人节/感恩节场景断言；现有断言不变
    └── LeafFallEffect.test.tsx / HeartFallEffect.test.tsx  [新增] 或并入 EffectLayer 场景
```

- `EffectLayer` 渲染分支追加 `{effectType === 'leaf' && <LeafFallEffect intensity={intensity} />}`、`{effectType === 'heart' && <HeartFallEffect intensity={intensity} />}`
- 消费 shared 包需先构建 `packages/shared`（turbo 依赖顺序自动处理；`pnpm run dev` 时 shared 有 watch）
- 无 Zustand store / React Query / 路由变更

## API Design
无变更（不涉及 `specs/openapi.yaml`，无需重新生成 SDK）。

## Database Design
无变更（无新表/列，无 Flyway 迁移脚本）。

## Risks / Trade-offs
- [keyframes 命名冲突] → 新组件使用 `leaffall`/`heartfall` 独有命名，已核对现有 `petalfall`/`snowfall`/烟花/灯笼无同名
- [shared 包未构建导致前端解析失败] → 走 `turbo run build` 或先构建 shared；`EffectLayer` 的 import 需与 `@daily-schedule/shared/holiday` 出口对齐（`getThemeForHoliday` 已导出）
- [EffectLayer 测试 mock 依赖] → 现有测试用真实 `useSettingsStore` + 组件断言，新增场景沿用同模式；`getThemeForHoliday` 为纯函数，无需 mock
- [emoji 跨平台渲染差异] → 与现有花瓣/雪花组件同风险等级，可接受（windows/mac 主流平台均渲染）

## Migration Plan
1. 新增 `LeafFallEffect.tsx`、`HeartFallEffect.tsx`
2. 修改 `EffectLayer.tsx`（解析源 + 渲染分支 + 注释）
3. 更新/新增测试，跑 `pnpm run verify`（lint + tsc + build + vitest）
4. 更新 `docs/frontend/component-catalog.md`（新增组件条目）、核对 `docs/architecture.md` 特效描述
5. `/opsx:verify` → `/opsx:sync`（同步 holiday-effects 主 spec）→ `/opsx:archive`
- 回滚：纯前端小改动，撤销相关文件即可，无数据迁移

## Open Questions
- 无阻塞问题。备注：`dragon-boat`（端午，'none'）等节日本次维持现状；圣帕特里克节/清明/世界环境日的 leaf 与感恩节共用同一组件，无需按节日区分配色（emoji 已含绿色系）。
