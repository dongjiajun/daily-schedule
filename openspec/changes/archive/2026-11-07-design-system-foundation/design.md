# Design: design-system-foundation

## Context

上阶段 `ui-token-contract` 已把颜色层收口：40 个 color token、5 套基础主题 + 18 套节日主题、语义色 utility、对比度门禁、裸色值门禁（`scripts/ui-check.mjs`）。颜色之外的维度仍无系统：

- **几何**：圆角 6 档混用（full 30 / lg 29 / xl 23 / md 14 / 2xl 7 / 3xl 1），阴影 5 档混用（sm 20 / lg 8 / md 4 / xl 2 / 2xl 1），均直接使用 Tailwind 默认档位，无「卡片/浮层」语义
- **排版**：`text-sm` 54 处、`text-xs` 37 处、任意值 28 处（11px×14、13px×9、15px×2、12px×2、10px×1）；`font-family` 为 `-apple-system, BlinkMacSystemFont, "Segoe UI"…`，CJK 走浏览器兜底
- **动效**：仅 12 处显式时长（150/200/500ms），曲线默认
- **组件**：`core/components/ui` 9 个原子；手写卡片组合 12 处；15 处 `title=` 充当 tooltip；无 Badge / Segmented / EmptyState / Skeleton / Progress
- **密度**：全部尺寸写死（`h-9`、`px-3`、日历 `min-height:120px`）
- **回归网**：无截图基线；Playwright 已具备 `toHaveScreenshot` 能力
- **约束**：颜色契约与 `ui:check` 已成型，本变更只扩展不推翻；无后端/API/DB 变化；现有 52 文件 269 单测、14 文件 65 E2E 必须保持通过

## Goals / Non-Goals

**Goals:**

- 设计 token 三层化：primitive（几何/排版/动效/密度）→ semantic（颜色，已有）→ component（`--cal-*` 等已有）
- 8 个组件原语落地并替换现有手写实现；原语只依赖 token
- 中文排版基线（CJK 栈 + 收敛字阶 + tabular-nums + 清理无效 uppercase）
- 双密度可切换，默认 comfortable，观感零回归
- `ui:check` 覆盖几何/动效裸值；视觉回归基线可本地执行

**Non-Goals:**

- 不改配色/主题机制（上阶段已闭环）、不加新主题
- 不改信息架构、导航、路由、移动端布局（留给 `app-shell-ia-refresh`）
- 不实现「跟随系统深色」、不重做宠物/特效视觉
- 不引入 webfont / 图表库 / 新 UI 框架
- 小程序端（`apps/miniprogram`）不在范围

## Decisions

### Decision 1: 几何/动效 token 通过 `@theme` 覆盖 Tailwind 默认档位

- **选择**: 在 `index.css` 的 `@theme` 中定义 `--radius-sm|md|lg|xl|2xl`、`--shadow-card|float|overlay`、`--duration-fast|base|slow`、`--ease-standard`；现有 `rounded-lg` 等类名自动映射到 token 值；契约清单登记允许档位，`ui:check` 校验裸值。
- **理由**: 零类名重写即可让全站几何受 token 控制；Tailwind 4 原生机制，无新依赖；`shadow-card` 等语义名补充「卡片/浮层」意图。
- **备选方案**: ① 自造 `rounded-token-md` 类 —— 全站改名成本高；② 组件内联 CSS 变量 —— 丧失 utility 与 IDE 补全。

### Decision 2: 字阶收敛到 6 档，不动 `text-sm` 基准

- **选择**: 保留 Tailwind 默认（`xs` 12 / `sm` 14 / `base` 16 / `lg` 18 / `xl` 20 / `2xl` 24），新增 `--text-2xs` 11px、`--text-3xs` 10px。28 处任意值映射：`11px→2xs`、`12px→xs`、`13px→sm`（侧栏菜单/工具栏按钮）、`15px→base`（标题语义）、`10px→3xs`。
- **理由**: `text-sm` 是最大群体（54 处），下移基准会造成全站视觉位移；只收敛任意值即可消除漂移。
- **备选方案**: 整体下移一档（14→13）—— 视觉回归大、收益低；引入完整设计令牌体系（如 12 档）—— 与现状差距过大。

### Decision 3: 显式 CJK 字体栈，不引 webfont

- **选择**: `--font-sans: "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`；数值型文本加 `tabular-nums` utility。
- **理由**: 系统字体零加载开销；中文界面需要显式 CJK 顺序避免拉丁字体抢占回退；数字等宽避免统计/日期跳宽。
- **备选方案**: 引入 Noto Sans SC webfont —— 增加 ~2MB 资源与首屏成本，与 PWA 缓存策略冲突。

### Decision 4: 8 个原语与替换关系

- **选择**: `Card`（容器：surface/border/radius/shadow）、`Badge`（标签/状态 chip）、`Segmented`（视图切换/密度切换）、`EmptyState`（标题+说明+操作）、`Skeleton`（加载占位）、`Tooltip`（替代 `title=`）、`Kbd`（快捷键键帽）、`Progress`（进度条）。替换清单：12 处手写卡片组合 → `Card`；15 处 `title=` → `Tooltip`；日历/看板 loading → `Skeleton`；空列表 → `EmptyState`；日历视图切换 + 待办视图切换 → `Segmented`；标签 chips → `Badge`；快捷键弹窗 → `Kbd`；WeekStats + 宠物状态条 → `Progress`。
- **理由**: 每个原语都有 ≥2 处真实消费方，避免「为抽象而抽象」；`DropdownMenu` 因当前无菜单型消费方而**不**纳入（原计划 8 个之一，改由 `Progress` 替代，理由记录于此）。
- **备选方案**: 一次性引入 shadcn 全套组件 —— 大量未使用代码与样式；只做 token 不做原语 —— 手写重复无法消除。

### Decision 5: 密度通过 `data-density` + 密度 token 实现

- **选择**: `<html data-density="comfortable|compact">`；`index.css` 定义 `--density-control-h`（36/32px）、`--density-pad-card`（16/12px）、`--density-row-py`（8/6px）、`--density-cal-row-min`（120/96px）；原语与关键布局用 `h-[var(--density-control-h)]` 等引用；`settingsStore.density` 默认 `comfortable` 并持久化；`ManagePanel` 偏好项提供切换。
- **理由**: 一个属性切换全站密度，组件不重复实现；新增设置项在既有 settings 框架内（persist + 偏好面板），零架构改动。
- **备选方案**: 两套组件尺寸变体（cva size variants）—— 组合爆炸；仅 CSS media query —— 无法用户自选。

### Decision 6: 视觉基线用 tag 隔离，本地执行

- **选择**: `e2e/visual.spec.ts`，`test.describe('@visual')` + `serial` 串行；6 个截面 × 5 套主题 = 30 张截图，基线落 `e2e/visual.spec.ts-snapshots/`；固定测试用���与固定日期（Date 覆盖）保证确定性，并隐藏 JS 驱动的游走宠物；`package.json` 增 `test:visual`（`playwright test --grep @visual`），`test:e2e` 改为 `--grep-invert @visual`；`maxDiffPixelRatio: 0.02`；CI 的 e2e 软性 job 不跑视觉用例（跨 OS 字体渲染差异），由本地/人工触发；基线更新必须 `--update-snapshots` 并在 PR 中评审图片。
- **理由**: 本机为 Windows、CI 为 Linux，截图跨平台不稳定；tag 隔离避免 CI 假红，同时保留本地回归网。
- **备选方案**: CI 内 Linux 容器生成基线 —— 需要额外的 Docker/CI 环境投入，留作后续；完全不做视觉基线 —— 字阶/几何改动无客观回归证据。

### Decision 7: `ui:check` 新增几何/动效裸值检查

- **选择**: 契约清单新增 `geometry`/`motion` 分组；检查器扫描 `.tsx` 中 `rounded-*`、`shadow-*`、`duration-*`、`ease-*` 的档位，允许集合来自契约（含 `none`/`full`/`inset` 等关键字），其余非零退出并输出行号。
- **理由**: 与颜色裸值检查对称；可机械验证「几何是否真的收口」。
- **备选方案**: 仅靠 code review —— 无法防回归。

### Decision 8: 测试策略

- **选择**: 每个原语新增 vitest（渲染、aria、键盘交互、密度 class 切换）；`settingsStore.density` 单测（默认值、切换、持久化）；视觉基线 E2E；现有单测/E2E 不回归。
- **理由**: 原语是共享层，行为断言成本低收益高；视觉差异由截图兜底。
- **备选方案**: 只做 E2E —— 反馈慢，无法定位原语行为。

## DDD Layer Design

### 领域层 (domain/)

不涉及：无后端代码。

### 基础设施层 (infrastructure/)

不涉及：无 persistence/security/scheduled/notification 与 Flyway 改动。

### 应用层 (application/)

不涉及：无 ApplicationService/事务/缓存变更。

### API 层 (api/)

不涉及：无 Controller/Assembler/异常映射变更。

### 前端 (frontend/src/)

- `core/styles/`：`design-tokens.json` 扩展 geometry/typography/motion/density 契约；`index.css` 注册 `@theme` 几何/动效/字体 token 与 `[data-density]` 变量；`themes.css` 不动颜色
- `core/components/ui/`：新增 `card.tsx`、`badge.tsx`、`segmented.tsx`、`empty-state.tsx`、`skeleton.tsx`、`tooltip.tsx`、`kbd.tsx`、`progress.tsx`；改造 `button/input/textarea/select` 使用密度 token
- `modules/{calendar,todo,pet}/components/`：替换卡片/徽标/tooltip/loading/empty/进度条/视图切换
- `core/store/settingsStore.ts`：新增 `density`；`ManagePanel` 偏好项；App 根写入 `data-density`
- 路由 / React Query / 事件总线无变更

## API Design

无变更：不修改 `specs/openapi.yaml`，不重新生成前端 SDK。

## Database Design

无变更：无 Flyway 迁移、无表/列调整。localStorage `settings.v1` 新增 `density` 字段，旧数据由 persist merge 使用默认值。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|---|---|
| 几何/字阶变化造成视觉位移（`text-sm` 54 处群体不变，但任意值收敛会变） | 视觉基线覆盖 5 主题 × 6 截面；改动按截面拆分评审 |
| 视觉截图跨 OS 不稳定 | `@visual` tag 隔离，CI 排除；仅本地/人工触发；后续容器化 CI |
| 原语替换遗漏（12 处卡片、15 处 tooltip） | 替换前跑 grep 清单逐项勾选；`ui:check` 几何裸值兜底 |
| compact 密度破坏日历格子布局 | 密度只调 CSS 变量，不改变结构；视觉基线覆盖两种密度各 1 截面 |
| 新增 Tooltip 引入 Radix 依赖 | `@radix-ui/react-tooltip` 与现有 Radix 组件同源，体积增量小；如评审反对可用原生 `popover` 实现 |
| 契约扩展让 `ui:check` 一次性变红 | 先加 token 与替换，再启用检查；与上阶段同法 |
| `data-density` 首帧闪烁 | 与主题同思路：入口脚本读取 `settings.v1.density` 同步设置属性 |

## Review Checklist

- [x] 失败路径是否覆盖？—— 覆盖：密度非法值回退 comfortable（store 校验 + 单测）、截图缺失时 `test:visual` 报 missing baseline、Tooltip/Segmented 键盘路径有单测、`ui:check` 裸几何值失败路径有 self-test 断言。无网络/并发路径（纯前端样式层）。
- [x] 回滚/降级方案是什么？—— 单 PR 可整体 revert；token 与组件分 commit；无数据迁移与外部依赖；`density` 字段旧数据默认 comfortable。
- [x] 契约/DB 兼容性影响？—— 无 OpenAPI/DB 变更；localStorage 新增字段向后兼容；组件类名调整仅内部；`Box` 类原语均为新增导出，无破坏性 API。

## Migration Plan

1. 扩展 `design-tokens.json` 契约 + `index.css` `@theme`（几何/动效/字体/密度 token）
2. 字阶收敛与 CJK 字体栈、`tabular-nums` 应用
3. 实现 8 个原语 + vitest
4. 替换手写实现（卡片 / tooltip / loading / empty / 进度 / 视图切换 / 徽标 / 键帽）
5. 密度：store 字段 + 首帧脚本 + `ManagePanel` 偏好项 + 原语与布局引用
6. `ui:check` 新增几何/动效检查（先跑基线报告再修至全绿）
7. 视觉基线：`test:visual` + 基线图片入库
8. 文档同步（component-catalog / architecture / AGENTS / README 核对）

回滚：整体 revert 本 PR；无部署顺序依赖。

## Open Questions

- 视觉基线是否在后续阶段接入容器化 CI（Linux 基线）以纳入阻断门禁？
- `Badge` 与现有 `tag.color` 动态色如何协作（token 色 vs 数据色）——当前决定：数据色直接用于 backgroundColor，样式仍走原语。
- compact 密度下日历 `min-height` 96px 是否足够容纳 3 条日程，需视觉评审确认。
