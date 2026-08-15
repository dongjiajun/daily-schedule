# Design: frontend-quick-polish

<!-- 参考: docs/architecture.md + CLAUDE.md 技术约定 -->

## Context

四线调查（frontend-ux 线）发现的 4 个低成本高感知问题：

1. **P5 弹层动画未编译**:`core/components/ui/dialog.tsx:19-20,42-44`、`popover.tsx:20-23`、`select.tsx:72-74` 已书写 `animate-in`/`fade-in-0`/`zoom-in-95`/`slide-in-from-*` 等类，但 `package.json` 无 `tw-animate-css`（或 `tailwindcss-animate`）依赖——已验证 dist CSS 零命中，全站弹窗无过渡动画
2. **P6 宠物模块未定义类**:`--color-muted` 全项目未定义（themes.css 只有 `--color-hover`/`--color-foreground-muted` 等），但 pet 模块 5 个文件使用 `bg-muted`/`text-muted-foreground` → 编译后无 CSS（宠物页进度条轨道无背景、信息卡标签颜色错误）
3. **P11 文档语言与主题色**:`index.html:2` `lang="en"` 与全站中文不符；manifest `theme_color` 为固定蓝与 5 套主题不符
4. **P12 reduced-motion**:仅 EffectLayer 手动检查 matchMedia，App 根无 `<MotionConfig reducedMotion="user">`，framer-motion 动效不尊重系统偏好
5. **文档勘误**:`component-catalog.md:67` 与 `moduleRegistry.ts:40` 宣称"lazy 路由"，实际 routes.tsx 静态 import

约束：前端零契约变更；样式 token 只允许用 themes.css 已定义变量；弹层动画类已由 shadcn 组件模板写好，只需补依赖。

## Goals / Non-Goals

**Goals:**
- 弹层入场/离场动画在全站实际生效（装依赖即恢复，不改组件结构）
- pet 模块样式按主题正确渲染（未定义类替换为既有 token）
- html lang 声明中文；theme-color 与默认主题一致
- 全站 framer-motion 尊重 reduced-motion
- 文档描述与实现一致（lazy → 静态）

**Non-Goals:**
- 不做主题切换平滑过渡、skeleton 统一、Sheet 抽屉等后续打磨项（P7-P16 留待后续变更）
- 不改 shadcn 组件结构、不新增组件
- 不触碰后端

## Decisions

### Decision 1: 动画依赖选 `tw-animate-css`（而非 `tailwindcss-animate`）
- **选择**: `tw-animate-css`，Tailwind v4 原生兼容，`@import "tw-animate-css"` 一行接入（本项目 Tailwind CSS 4 + Vite）
- **理由**: Tailwind v4 官方推荐;零配置、无 JS;已书写的 `animate-in` 类族与其语法完全对应
- **备选方案**: ① `tailwindcss-animate`(v0.x)——为 Tailwind v3 设计,在 v4 需 plugin 兼容层;② 手写 keyframes——重复造轮子且维护成本高

### Decision 2: 未定义类替换映射（严格对应既有 token）
- **选择**: `bg-muted` → `bg-hover`;`text-muted-foreground` → `text-foreground-muted`（themes.css 已定义 `--color-hover`、`--color-foreground-muted`,各主题均有值）
- **理由**: 语义最近似（muted 前景 → foreground-muted;柔和背景 → hover 色）,零新 token、零主题文件改动
- **备选方案**: ① 新增 `--color-muted` 到 5 套主题——改动面大(每主题 2 个变量),收益不明确;② 删除类名——丢失设计意图

### Decision 3: theme-color 策略——静态默认 + 与默认主题对齐
- **选择**: `index.html` 补 `<meta name="theme-color">` 与默认主题背景一致;`manifest.webmanifest` 的 `theme_color` 从固定蓝改为同色
- **理由**: 静态 meta 无法跟随运行时主题切换,与默认主题对齐是成本最低的一致方案;运行时动态跟随(读取 settingsStore 切换 meta)留给主题系统深化时再做
- **备选方案**: 运行时动态更新 meta content——引入主题耦合代码,超本变更范围

### Decision 4: MotionConfig 挂载点——App 最外层 + CSS 层媒体查询配合
- **选择**: `App.tsx` 根节点包裹 `<MotionConfig reducedMotion="user">`,与 AuthGuard 平级的最外层
- **理由**: framer-motion 官方推荐全局单一配置点;EffectLayer 的手动 matchMedia 检查保留不动（双保险,无冲突）

### Decision 5: reduced-motion 双层覆盖——CSS 媒体查询 + MotionConfig
- **选择**: `index.css` 全局 `@media (prefers-reduced-motion: reduce)` 将 `animation-duration`/`transition-duration` 压缩至 `0.01ms !important`;framer-motion 层由 MotionConfig 处理
- **理由**: MotionConfig 只覆盖 framer-motion,而弹层动画走 tw-animate-css(CSS)、宠物动作走 CSS keyframes——不加媒体查询则"减少动态效果"下弹窗/宠物动画依然播放,覆盖不完整
- **备选方案**: ① 逐组件 matchMedia 判断(如 EffectLayer)——散落易漏;② 不做 CSS 覆盖——违背"全站动效尊重偏好"的需求本意

### Decision 6: theme-color 动态跟随——读取 CSS 变量计算值
- **选择**: `useTheme` 在 data-theme 变化后读 `getComputedStyle(document.documentElement).getPropertyValue('--color-bg')` 写入 `<meta name="theme-color">`(覆盖 5 套主题 + 节日主题);`index.html` 静态 meta 保留为初始值
- **理由**: 零硬编码色值、主题新增自动生效
- **备选方案**: ① 纯静态值(原 Decision 3 方案)——运行时主题切换后状态栏颜色错误;② 主题色映射表——与 themes.css 数据重复,易漂移

## DDD Layer Design

纯前端变更,后端无影响。

### 前端 (frontend/src/)
- `package.json`: + `tw-animate-css` devDependency
- `src/index.css`(或 Tailwind 入口 css): + `@import "tw-animate-css"`
- `index.html`: lang + theme-color meta
- `public/manifest.webmanifest`: theme_color 对齐默认主题
- `App.tsx`: + `<MotionConfig reducedMotion="user">` 包裹
- `modules/pet/` 5 文件:类名替换(PetMenu.tsx:77、PetStatus.tsx:14,26、PetPage.tsx:55-68、PetSelection.tsx:54,70、SidebarPet.tsx:77)

## API Design

无契约变更。

## Database Design

无。

## Risks / Trade-offs

- [tw-animate-css 引入后动画类名冲突/样式意外变化] → 仅添加缺失类,不删改组件类名;`pnpm run verify`(build)确认产物,视觉验证弹窗动画
- [`bg-hover` 在部分主题下作为背景可能偏深/偏浅] → `--color-hover` 各主题均已定义且用于同类"选中/悬停底"场景(pet 模块同构),视觉验证确认
- [theme-color 静态值与运行时主题不一致(深色主题下状态栏仍是浅色)] → 接受,运行时跟随留待后续(已写入 Non-Goals)

## Migration Plan

- 部署:仅前端产物;`pnpm run verify` 通过后合入
- 回滚:纯前端代码,回滚提交即恢复

## Open Questions

无
