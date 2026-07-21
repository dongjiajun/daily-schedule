# Design: 节日主题自动切换 + 特效层

## Context
v3.2 已建成 `HolidayEngine`（`packages/shared/src/holiday/`），提供 `getHolidays()` + `getActiveTheme()` API 和 16 套节日→主题映射。HolidayEngine 尚未被任何前端代码消费——它只存在于 shared 包中，需要通过 Vite 导入到浏览器运行时。

**关键约束**:
- HolidayEngine 依赖 `lunar-typescript`（CJS/Node 库，约 200KB）
- shared 包的 barrel export (`dist/index.js`) 已经移除了 holiday 模块的 re-export，避免 `import { EventBus }` 被迫加载 `lunar-typescript`
- 前端消费 holiday 时，必须通过独立路径导入，不能通过 barrel

**当前前端主题架构**: `useTheme` hook 读取 `settingsStore.theme`（5 个预设之一），设置 `document.documentElement.dataset.theme`，CSS 变量在 `core/styles/themes.css` 中定义。无时间感知。

## Goals / Non-Goals

**Goals:**
- 每日首次加载时调用 `holidayEngine.getActiveTheme()`，自动切换节日 CSS 变量
- 4 种特效渲染（雪花 CSS / 烟花 tsParticles / 花瓣 CSS / 灯笼 tsParticles）
- settingsStore 新增 `themeMode`（manual/auto）、`effectIntensity`（off/low/full）、`autoDarkMode`（boolean）
- 移动端自动降级 + `prefers-reduced-motion` 支持
- 用户可关闭自动主题或调节特效强度

**Non-Goals:**
- 后端 API 变更
- 节日特效音的效（v1 无音频）
- 主题编辑器/CMS（节日主题硬编码）
- 节日倒计时/预告（v1 不做）

## Decisions

### Decision 1: HolidayEngine 导入方式 — shared 子路径
- **选择**: 通过 `@daily-schedule/shared/holiday` 子路径导入，禁用 barrel export
- **理由**: HolidayEngine 依赖 `lunar-typescript`（~200KB CJS 库），barrel export 会导致所有 `import { EventBus }` 的消费者被迫加载 lunar-typescript。子路径导入实现按需加载。
- **实现**: 在 `packages/shared/package.json` 的 `exports` 中新增 `"./holiday"` entry，指向 `./dist/holiday/index.js`
- **前端导入**: `import { holidayEngine } from '@daily-schedule/shared/holiday'`
- **备选方案**: 动态 `import()` 懒加载 — 增加复杂度，延迟首屏主题切换；直接 barrel — 已验证会导致日历模块崩溃

### Decision 2: 特效引擎选型 — tsParticles + CSS 混合
- **选择**: 烟花/灯笼用 `@tsparticles/react` + `tsparticles`，雪花/花瓣用 CSS `@keyframes`
- **理由**: 烟花和灯笼需要粒子系统（爆炸、螺旋、发光），纯 CSS 做不到；雪花和花瓣是简单匀速下落，CSS 更轻量（零 JS 开销，GPU 合成）
- **tsParticles**: ~45KB gzip，支持 Canvas/SVG 双渲染器、粒子交互、预设库
- **备选方案**: 全 tsParticles — 雪花/花瓣用粒子系统过度设计，增加 bundle；全 CSS — 灯笼爆炸效果无法实现；Canvas 手写 — 开发成本高

### Decision 3: 主题切换策略 — data-theme 属性 + CSS 变量
- **选择**: 复用现有 `data-theme` 机制，节日主题用 `data-theme="holiday-<id>"` 属性
- **理由**: 与现有 5 套预设主题同一机制，`useTheme` 中增加一个 `auto` 分支即可，不引入新的 CSS 注入方式
- **CSS 文件**: `core/styles/holiday-themes.css` — 16 个 `[data-theme^="holiday-"]` 选择器，覆盖 `--color-primary` / `--color-accent` / `--color-bg` / `--color-surface` 等核心变量

### Decision 4: 特效强度分级
- **选择**: 三级 — `off`（无特效）、`low`（低粒子数 ~15 烟花/~30 雪花/花瓣）、`full`（全量 ~60/~100）
- **理由**: 移动端性能保护 + 用户偏好。low 模式在移动端仍可用（GPU 合成），full 仅桌面端
- **默认值**: `low`（性能优先）

### Decision 5: 节日检测频率 — 每日一次
- **选择**: `useTheme` 中按日期缓存检测结果，`localStorage` 存 `holiday_check_date` 避免同一天反复调用
- **理由**: 引擎调用是纯计算（~1ms），但依赖 lunar-typescript 初始化（~5ms）。每天仅需一次。
- **备选方案**: 每次页面加载都调用 — 无必要消耗

## Frontend Design

### 组件树

```
App
 ├── EffectLayer              ← 新增：特效容器 (pointer-events: none, z-index: 1)
 │    ├── FireworkEffect      ← tsParticles 烟花
 │    ├── SnowfallEffect      ← CSS 雪花
 │    ├── PetalFallEffect     ← CSS 花瓣
 │    └── LanternFallEffect   ← tsParticles 灯笼
 │
 └── AppShell (现有)
      ├── Sidebar
      ├── <Outlet /> (日历等)
      ├── ShortcutsDialog
      └── PetPanel
```

### 状态管理扩展

```typescript
// core/store/settingsStore.ts 新增字段
interface SettingsState {
  // 现有字段
  theme: ThemePreset           // 手动选择的主题
  // 新增字段
  themeMode: 'manual' | 'auto' // 默认 'manual'
  effectIntensity: 'off' | 'low' | 'full' // 默认 'low'
  autoDarkMode: boolean        // 默认 false
  locale: string               // 默认 'CN'，用于地区性节日
  holidayCheckDate: string     // 上次检测节日的日期 (YYYY-MM-DD)
  activeHolidayId: string | null // 当前活跃节日 id
}
```

### useTheme 改造

```
useTheme()
  ├─ 读取 themeMode
  │   ├─ 'manual' → 使用 settings.theme（现有逻辑）
  │   └─ 'auto'  → 检查 holidayCheckDate
  │        ├─ 今天已检测 → 使用缓存的 activeHolidayId
  │        └─ 今天未检测 → holidayEngine.getActiveTheme(new Date(), { locale })
  │             ├─ 有节日 → 应用 holiday-<id> CSS / 存储 activeHolidayId
  │             └─ 无节日 → 回退到 settings.theme / 清除 activeHolidayId
  └─ 应用 data-theme 到 documentElement
```

### EffectLayer 逻辑

```
EffectLayer
  ├─ 读取 activeHolidayId + effectIntensity
  ├─ effectIntensity === 'off' → return null
  ├─ mobile (<768px) → intensity 降级为 'low'
  ├─ prefers-reduced-motion → return null
  └─ 根据 holidayTheme.effectType 渲染:
       ├─ 'firework' → <FireworkEffect intensity />
       ├─ 'snow'     → <SnowfallEffect intensity />
       ├─ 'petal'    → <PetalFallEffect intensity />
       ├─ 'lantern'  → <LanternFallEffect intensity />
       └─ 'none'     → null
```

### shared 包入口

```json
// packages/shared/package.json 新增 exports
{
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./holiday": { "import": "./dist/holiday/index.js", "types": "./dist/holiday/index.d.ts" }
  }
}
```

### CSS 变量示例（holiday-themes.css）

```css
[data-theme="holiday-spring-festival"] {
  --color-primary: #E63946;
  --color-accent: #FFD700;
  --color-bg: #1A0A0A;
  --color-surface: #2D1810;
  --color-gradient-from: #8B0000;
  --color-gradient-via: #E63946;
  --color-gradient-to: #FFD700;
  /* 其他 20+ 变量... */
}
```

## DDD Layer Design

**无后端变更。** 纯前端功能。

## API Design

**无 API 变更。**

## Database Design

**无数据库变更。** 设置项通过 localStorage 持久化。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| `lunar-typescript` 在 Vite 中打包体积大 (~200KB) | 子路径导入，仅 holiday 消费者加载；Vite tree-shaking + code-split |
| tsParticles 重 Canvas 拖慢移动端 | 强度自动降级 + `prefers-reduced-motion` 检测 |
| 16 个主题 CSS 变量覆盖不全导致视觉不一致 | 只覆盖核心 8 个变量（primary/accent/bg/surface/gradient-*），其余继承默认主题 |
| 用户手动设了颜色但被节日覆盖 | `themeMode='manual'` 时完全不触发 auto；auto 模式下临时手动选择在当天有效 |
| `@daily-schedule/shared` 子路径导出在旧版 pnpm/node 中不兼容 | pnpm workspace 已支持 exports 子路径（pnpm 8+），Node 22+ 完全支持 |

## Migration Plan

1. 更新 `packages/shared/package.json` 添加 `"./holiday"` export → rebuild shared
2. 前端 `npm install` 确认路径解析
3. 新增 `holiday-themes.css` + `EffectLayer` + 4 个特效组件
4. 扩展 `settingsStore` + 改造 `useTheme`
5. `App.tsx` 中挂载 `<EffectLayer />`
6. 全量验证: `npm run verify` + `mvn test` + smoke test（改日期验证节日切换）

**回滚**: 设置 `themeMode='manual'` → 完全恢复旧行为。删除文件即可回滚代码。

## Open Questions

1. **locale 默认值从哪里取？** 建议 v1 默认 `'CN'`（做中国节+国际节），后续从 `navigator.language` 或用户设置获取。
2. **主题切换是否需要过渡动画？** 建议加 500ms `transition` 在 `:root` 上，颜色平滑切换。
3. **节日宠物装扮建议如何传递给 PetPanel？** 通过事件总线 `{ type: 'holiday:activated', payload: { theme } }` → petStore 更新建议装扮。
