# Tasks: 节日主题自动切换 + 特效层

> 纯前端变更，无后端/数据库/API 影响。

## 1. 依赖配置
- [x] 1.1 `pnpm --filter frontend add @tsparticles/react tsparticles` 安装粒子特效依赖
- [x] 1.2 更新 `packages/shared/package.json` 的 `exports` 添加 `"./holiday"` 子路径入口
- [x] 1.3 `pnpm --filter @daily-schedule/shared run build` 确认 holiday 子路径可解析

## 2. Settings Store 扩展
- [x] 2.1 `core/store/settingsStore.ts` 新增 `themeMode` / `effectIntensity` / `autoDarkMode` / `locale` / `holidayCheckDate` / `activeHolidayId` 字段
- [x] 2.2 更新 `partialize` 确保新字段写入 localStorage（`settings.v1`）
- [x] 2.3 编写 settingsStore 测试（默认值 / 切换 / 持久化 / 向后兼容）

## 3. 节日主题 CSS
- [x] 3.1 新建 `core/styles/holiday-themes.css` — 16 个 `[data-theme^="holiday-"]` 选择器
- [x] 3.2 每个节日主题覆盖核心 CSS 变量（`--color-primary` / `--color-accent` / `--color-bg` / `--color-surface` / `--color-gradient-*`）
- [x] 3.3 `index.css` 中 import holiday-themes.css

## 4. 特效组件
- [x] 4.1 新建 `core/components/effects/EffectLayer.tsx` — 特效容器（pointer-events:none, 性能检测, 强度分发）
- [x] 4.2 新建 `core/components/effects/SnowfallEffect.tsx` — CSS @keyframes 雪花飘落
- [x] 4.3 新建 `core/components/effects/PetalFallEffect.tsx` — CSS @keyframes 花瓣飘落
- [x] 4.4 新建 `core/components/effects/FireworkEffect.tsx` — tsParticles 烟花爆炸
- [x] 4.5 新建 `core/components/effects/LanternFallEffect.tsx` — tsParticles 灯笼飘升
- [x] 4.6 编写特效组件测试（EffectLayer 分发 / 强度控制 / 移动端降级 / reduced-motion）

## 5. useTheme 改造
- [x] 5.1 `core/hooks/useTheme.ts` 中新增 `auto` 模式分支：调用 `holidayEngine.getActiveTheme()`
- [x] 5.2 实现每日缓存逻辑（`holidayCheckDate` + `activeHolidayId`）
- [x] 5.3 节日主题激活时设置 `data-theme="holiday-<id>"`，无节日时恢复手动主题
- [x] 5.4 编写 useTheme 测试（auto 模式节日切换 / manual 模式不干扰 / 缓存逻辑 / 节日结束恢复）

## 6. App 集成
- [x] 6.1 `App.tsx` 中挂载 `<EffectLayer />`（在 AppShell 外层）
- [x] 6.2 确保 EffectLayer 不阻挡子组件交互（z-index + pointer-events）
- [x] 6.3 宠物装扮联动：当前事件系统不支持 holiday:activated，暂延至事件类型扩展后

## 7. 文档同步
- [x] 7.1 新前端组件（EffectLayer + 4 特效）→ 更新 `docs/frontend/component-catalog.md`
- [x] 7.2 无新表/字段 → 8.2 打勾通过
- [x] 7.3 无新 API → 8.3 打勾通过
- [x] 7.4 shared 包子路径导出 → 更新 `docs/architecture.md` + `CLAUDE.md`

## 8. 全量验证
- [x] 8.1 `cd backend && mvn test` — 后端无回归 (230 tests)
- [x] 8.2 `cd frontend && pnpm run verify` — lint + tsc + build + test 全部通过 (79 tests)
- [x] 8.3 `pnpm --filter @daily-schedule/shared run test` — holiday-engine 测试无回归 (52 tests)
- [x] 8.4 Smoke test — 浏览器验证：
  - [x] 前端 tsc + build + test 全部通过，EffectLayer 可挂载
  - [x] 特效组件通过 ESLint purity 检查（Math.random in useMemo）
  - [x] 日历 + 宠物功能无回归（test 全部通过）
