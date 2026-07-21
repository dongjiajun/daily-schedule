# Proposal: 节日主题自动切换 + 特效层

## Why
v3.2 已建成国际节日引擎（holiday-engine），但尚未被任何前端模块消费。当前 5 套主题只能手动切换，无时间感知能力。M1.4 将节日引擎接入前端，实现"今天是春节→自动红色主题+烟花特效"的体验升级——这是宠物系统之外的第二大情感锚点。

## What Changes
- 前端消费 `HolidayEngine`：在 `useTheme` 中调用 `getActiveTheme()`，每日自动切换 CSS 变量
- `core/styles/holiday-themes.css`：16 个节日主题的 CSS 变量定义
- `core/components/effects/`：4 种特效组件（Snowfall / Firework / Petal / LanternFall）
- `settingsStore` 扩展：`themeMode`（manual/auto）、`effectIntensity`（off/low/full）、`autoDarkMode`
- 特效通过 `tsParticles` 实现（烟花/灯笼），纯 CSS 实现（雪花/花瓣）
- **BREAKING**: 无

## Capabilities

### New Capabilities
- `holiday-theme-auto`: 节日主题自动切换 — `useTheme` 中集成 `holidayEngine.getActiveTheme()`，按日期自动应用节日 CSS 变量
- `holiday-effects`: 特效渲染层 — 根据当前节日 `effectType` 激活对应特效组件（firework/snow/petal/lantern），支持强度分级
- `settings-theme-extension`: 设置扩展 — settingsStore 新增 `themeMode`、`effectIntensity`、`autoDarkMode` 字段，用户可关闭自动主题或调节特效强度

### Modified Capabilities
- 无

## API Contract Impact
无影响。纯前端变更，不涉及任何后端 API 或 `specs/openapi.yaml`。

## DDD Layer Impact
无影响。不涉及后端 Java 代码。

## Database Impact
无影响。设置项通过 localStorage 持久化（`settings.v1` key 扩展字段）。

## Impact
- **新增文件**: `core/styles/holiday-themes.css`、`core/components/effects/Snowfall.tsx`、`Firework.tsx`、`PetalFall.tsx`、`LanternFall.tsx`、`EffectLayer.tsx`
- **修改文件**: `core/hooks/useTheme.ts`（集成 HolidayEngine）、`core/store/settingsStore.ts`（扩展字段）
- **新增依赖**: `@tsparticles/react` + `tsparticles`（烟花/灯笼粒子特效）
- **消费者**: 用户在任意页面感知节日氛围，宠物装扮建议随节日变化
- **文档**: `docs/frontend/component-catalog.md` 新增特效组件条目
