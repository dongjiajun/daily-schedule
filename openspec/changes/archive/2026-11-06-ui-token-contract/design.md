# Design: ui-token-contract

## Context

前端视觉层目前存在三套互不一致的主题契约，且样式可访问性没有自动校验：

- **主题块**：`themes.css` 5 套基础主题，每套 27 个 `--color-*`；`holiday-themes.css` 18 套节日主题，每套仅 7 个（`--color-primary/accent/bg/surface` + 3 个渐变）。两者共用同一个 `:root[data-theme]` 槽位，节日主题激活时前景/边框/hover/sidebar/surface-elevated/日历专用共 20 个 token 无定义。
- **Tailwind 注册**：`index.css` 的 `@theme` 只注册了 27 个颜色 token；`--color-success/error/warning` 在 `:root` 有定义但**未注册**，因此 `text-error`、`bg-success` 等 utility 全站不存在，组件只能写 `text-red-500` 等调色板类。
- **漂移规模**：业务 UI（不含引导插画）约 62 处调色板类；47 处 inline style；`calendar.css` 4 处写死暖色；`statusColor.ts` 用 `var(--color-accent, #22c55e)` 当"绿色"（default 主题 accent 是近黑色）。
- **静默失效**：`holiday-themes.css` 尾部对未 `@property` 注册的自定义属性声明 `transition`（无效）；`CalendarView` 用 `color + '22'` 拼接透明度（默认色分支产出非法值）；`index.html` 首帧脚本只读 `state.theme`，auto 模式命中节日时先渲染基础主题再跳变。
- **约束**：不动后端/API/DB；现有 51 文件 267 前端用例、13 文件 57 E2E 必须保持通过；CI 已有 `version-check`（含 docs-check）、`openspec-validation`、`frontend`、`e2e` job；仓库既有 `scripts/*.mjs` 纯 node 校验脚本的成熟范式。

## Goals / Non-Goals

**Goals:**

- 设计 token 有唯一真相源；23 套主题（5 基础 + 18 节日）运行时每个契约 token 都有定义
- 语义色（success/error/warning/info）以 `@theme` utility 形式可用，业务组件不再需要裸色值
- 文本对比度 ≥4.5:1、可交互控件边界 ≥3:1，并由脚本在 CI 校验
- 4 类静默失效修复；首屏主题与 auto 节日逻辑一致
- 新增 `pnpm run ui:check` 四项门禁，接入 CI frontend job；主题快照与 E2E 计算色断言建立回归网

**Non-Goals:**

- 不改设计语言（字阶/密度/圆角/阴影/组件原语）——留给后续 `design-system-foundation`
- 不改信息架构、导航、布局、移动端专属布局——留给后续 `app-shell-ia-refresh`
- 不实现「跟随系统深色」（本期只移除死配置 `autoDarkMode`）
- 不新增主题、不重做特效/宠物视觉
- 不涉及微信小程序端样式（`apps/miniprogram` 独立体系）

## Decisions

### Decision 1: Token 契约以 JSON 为单一真相源

- **选择**: 新增 `frontend/src/core/styles/design-tokens.json`，包含 token 名称、语义分组、对比度配对（配对双方 + 阈值）、白名单文件清单。`scripts/ui-check.mjs` 与 vitest 均读取该文件；CSS 仍手写，但必须通过校验。
- **理由**: CSS 无法 import JSON；node 校验脚本无法直接 import TS（需转译）；JSON 可被 node 与 vite/vitest 同时消费，零新增依赖，且与仓库既有 `docs-check`/`openspec-check` 从代码树独立重算事实的风格一致。
- **备选方案**: ① TS 模块 `tokens.ts` —— node 脚本需 `tsx`/动态 import 转译，增加工具链复杂度；② Vite 插件从单一源生成 CSS —— 引入代码生成链与构建期隐式行为，收益不足以抵消维护成本。

### Decision 2: 节日主题用「块内种子 + 共享派生块」

- **选择**: 在 18 个节日主题块**之前**新增共享块 `[data-theme^="holiday-"]`，用显式灰阶 + `color-mix()` 从 `--color-surface`/`--color-accent` 派生缺失 token；18 个块保持原有 7 个种子（删除 `--color-primary`），个别强调色不适合深色前景的主题（halloween / sakura / world-book-day）在块内覆盖 `--color-accent-fg`。共享块中的前景三级使用**显式色值**（`#f5f7fa` / `#c3cbd6` / `#9aa6b4`），确保对比度可被脚本精确计算。
- **理由**: 18 × 27 手写共 486 行，未来新增 token 要改 18 处；共享块把"节日主题 = 暗底浅字"这一共同事实表达一次。实测前景三级在最亮的节日底（`#243824`）分别为 11.74 / 7.70 / 5.09，全部达标；若后续某节日不达标，只需在该块内覆盖对应 token。
- **备选方案**: ① 逐块写全 27 个 —— 可控但维护爆炸；② 构建期从种子生成 CSS —— 需要新增代码生成链和漂移校验，超出本次收益；③ 让节日主题回落到 default 基础主题 —— 暗底配浅色前景直接不可读，已否决。

### Decision 3: 语义色注册进 `@theme` 并扩展 info

- **选择**: `:root` 定义 `--color-success/error/warning/info` 及 `-fg`、`-bg`；在 `@theme` 注册对应 utility；dark 与节日主题覆盖 `-bg` 为深色 tint、`-fg` 为浅色 tint，色相语义不变。
- **取值（实测对比度）**: 底色 error `#b91c1c`（白字 6.47）、success `#047857`（5.48）、warning `#b45309`（5.02）、info `#1d4ed8`（6.70）；浅色底 `-fg`/`-bg` 配对最低 4.84；深色底 `-fg`/`-bg` 配对最低 7.35。
- **理由**: 62 处裸色值的根因是「语义色不可用」，只做替换不注册 utility 会让下一批代码继续写调色板；info 用于任务优先级/链接类蓝语义，避免为蓝色单开白名单。
- **备选方案**: ① 只保留 shadcn 的 `destructive` —— 语义面太窄，覆盖不了成功/警告/信息；② 不扩展 info、蓝色统一影射 accent —— default 主题 accent 近黑，会丢失优先级区分度。

### Decision 4: 拆分 `border-strong`，只用于可交互控件

- **选择**: 新增 `--color-border-strong`（default `#8b8f96` 3.25:1、dark `#64748b` 3.07:1、节日由 `color-mix` 从 accent 派生），用于 `input`/`textarea`/`select`/`switch` 边界；装饰性分隔线继续用 `border`/`border-subtle`。
- **理由**: WCAG 1.4.11 约束的是「识别控件所必需的视觉信息」，全量加深边框会让全站过硬；控件边界是真正需要 3:1 的位置。
- **备选方案**: ① 全局加深 `border` —— 观感明显变硬、影响日历网格；② 只靠 focus ring —— 非聚焦态仍无法识别输入框边界。

### Decision 5: 对比度取值表（已实测）

| Token | 现值 | 新值 | 实测（对白底 / 页面底色） |
|---|---|---|---|
| default `foreground-muted` | `#9ca3af` | `#5f6875` | 5.64 / 5.22 |
| dark `foreground-muted` | `#64748b` | `#8b9bb0` | 5.16 / 6.30 |
| dark `foreground-secondary` | `#94a3b8` | `#b6c2d2` | 8.11（与 muted 拉开层级） |
| default `event-done-text` | `#94a3b8` | `#64748b` | 4.76（完成态弱化但可读） |
| dark `event-done-text` | `#64748b` | `#8b9bb0` | 5.16 |
| `border-strong`（新增） | — | default `#878b92` / dark `#64748b` | 最差 3.16 / 3.07 |
| 节日主题前景三级 | 未定义 | `#f5f7fa` / `#c3cbd6` / `#9aa6b4` | 最低 11.74 / 7.70 / 5.09 |

### Decision 6: 裸色值映射表 + 白名单

- **选择**: 按语义映射：`red-*` → `error`（`text-error`/`bg-error`/`bg-error-bg`/`border-error`）、`emerald/green-*` → `success`、`amber/orange-*` → `warning`、`blue-*` → `info`、`gray-*` → `foreground-muted`/`foreground-secondary`/`hover`。白名单仅 4 类：`modules/pet/assets/svg/**`（角色造型色）、`core/components/effects/**`（粒子配色）、登录页装饰光斑、`shared` 包预设分类色（数据驱动、非样式）。
- **额外**: `OnboardingGuide.tsx` 的 `dark:` 变体改为语义 token——`dark:` 走系统 `prefers-color-scheme`，与应用 `data-theme` 机制不一致（应用深色主题 + 系统浅色时引导层会渲染成亮色）。
- **理由**: 映射保持"色相 = 语义"的产品直觉；白名单按**用途**而非按文件豁免，避免成为漂移后门。
- **备选方案**: 整个组件白名单 —— 等于放弃门禁，已否决。

### Decision 7: 静默失效按最小改动修复

- **选择**: ① 删除对自定义属性无效的 `transition` 声明（不做主题渐变，避免为 27+ token 注册 `@property`）；② `color + '22'` 改为 `color-mix(in srgb, <color> 13%, transparent)`（对 hex 与 `var()` 均合法）；③ `calendar.css` 4 处暖色硬编码改为 `foreground-muted` + `color-mix` 派生；④ `statusColor.ts` 改用 `var(--color-success)`/`var(--color-warning)`/`var(--color-error)`。
- **理由**: 每项都是一行级修复，但直接影响节日主题与暗色主题的可读性；不引入新的样式机制。
- **备选方案**: 注册全部 `@property` 实现主题过渡 —— 增加 27+ 条 `@property` 声明与初始值，且对渐变 token 无意义。

### Decision 8: 首帧脚本与 `useTheme` 判定对齐

- **选择**: `index.html` 内联脚本读取 `settings.v1` 的 `themeMode`/`theme`/`activeHolidayId`：`themeMode === 'auto' && activeHolidayId` 时首帧设 `holiday-<id>`，否则设 `theme`。
- **理由**: `activeHolidayId`/`holidayCheckDate` 由 `settingsStore.partialize` 持久化（本变更补齐这两个字段的持久化），首帧脚本无需新增存储即可判定节日主题；消除 auto 模式刷新时的主题跳变。
- **备选方案**: 服务端渲染/构建期注入 —— 应用是纯 SPA，无收益。

### Decision 9: `ui:check` 四项检查的可计算性约束

- **选择**: `scripts/ui-check.mjs` 实现五项：① 契约完整性（基础主题必须显式全集；节日主题按「块 ∪ 共享块」计算）；② 对比度（只对契约中声明为文本的 token 计算，且要求其为显式色值；派生值仅校验存在性）；③ 裸色值白名单；④ 未知 token 引用；⑤ CSS 声明中未注册的 token（死 token，如 `--color-primary`）。输出统一摘要，失败非零退出。
- **理由**: `color-mix()` 的最终色依赖底色合成，Node 侧无法精确计算；把「文本 token 必须显式」写进契约，让对比度检查保持精确且可解释。
- **备选方案**: 用无头浏览器 `getComputedStyle` 跑全部主题对比度 —— 准确但引入 Playwright 依赖进 CI 基础门禁、耗时高；留给 E2E 层的抽样断言。

### Decision 10: 测试与 CI 接线

- **选择**: ① vitest 新增 `frontend/src/core/styles/__tests__/design-tokens.test.ts`：契约 ↔ CSS 声明一致、语义 utility 已在 `@theme` 注册、对比度函数单测、23 套主题声明集合快照；② E2E 新增 `e2e/ui-theme.spec.ts`：登录页设 `settings.v1` 后断言 5 套主题的 `--color-bg` 计算值，不依赖后端；③ CI `frontend` job 在 lint 后增加 `pnpm run ui:check`；④ 同步更新 `AGENTS.md` 中的 `DOCS-CHECK` 测试文件计数。
- **理由**: 单测守住契约与注册，E2E 守住真实浏览器计算值，门禁守住提交；三层成本递增但覆盖面互补。
- **备选方案**: 只做脚本门禁 —— 无法覆盖 `@theme` 注册后的实际计算值；只做 E2E —— 反馈慢且无法覆盖 23 套主题。

## DDD Layer Design

### 领域层 (domain/)

不涉及：本变更无后端代码，领域实体/仓储/DomainService 无改动。

### 基础设施层 (infrastructure/)

不涉及：无 persistence/security/scheduled/notification 改动，无 Flyway 迁移。

### 应用层 (application/)

不涉及：无 ApplicationService/事务/缓存变更。

### API 层 (api/)

不涉及：无 Controller/Assembler/异常映射改动。

### 前端 (frontend/src/)

- `core/styles/design-tokens.json`（新增，契约真相源）
- `core/styles/themes.css`（基础主题取值调整 + 新 token）
- `core/styles/holiday-themes.css`（新增共享派生块、删 `--color-primary`、删无效 transition）
- `index.css`（`@theme` 注册语义色与 border-strong）
- `core/components/ui/{button,input,textarea,select,switch}.tsx`（语义色 + border-strong）
- `modules/calendar/components/{CalendarSidebar,CalendarView,ManagePanel,EventForm,EventModal}.tsx` + `calendar.css`（裸色值收敛、color-mix、周末色 token 化）
- `modules/todo/components/*`、`modules/pet/components/{PetPage,PetSelection,SidebarPet,FloatingText}.tsx`、`modules/pet/lib/statusColor.ts`、`pages/LoginPage.tsx`、`components/layout/OnboardingGuide.tsx`
- `core/store/settingsStore.ts`（移除 `autoDarkMode`）
- `index.html`（首帧主题脚本）
- 状态管理/路由/React Query 无变更

## API Design

无变更：不修改 `specs/openapi.yaml`，不新增/修改端点，不重新生成前端 SDK。

## Database Design

无变更：无 Flyway 迁移、无表/列/索引调整。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|---|---|
| 门禁上线后旧代码一次性变红，PR 过大 | 本变更内同批收敛；测试与脚本分两个 commit（先修代码再开门禁） |
| `foreground-muted` 加深影响观感 | 只调 default/dark 两个 token；配合 5 主题截图人工比对 |
| 控件边界加深显得"硬" | 仅 `border-strong` 用于控件，装饰线不动；必要时下调到刚好 3:1 |
| 节日共享块的 `color-mix` 派生边框不达 3:1 | 非文本检查在 E2E 抽样验证；不达标时共享块改用显式色值 |
| 静态 CSS 解析脆弱（正则匹配主题块） | 契约检查依赖受控格式（一行一个 token 声明）；脚本自带 `--self-test` 用内联样例自检 |
| 删除 `autoDarkMode` 让用户误以为设置丢失 | 该字段从未被任何组件消费，无行为变化；proposal 已声明迁移说明 |
| 白名单成为漂移后门 | 白名单按用途登记理由，`ui:check` 输出白名单条目数并在摘要中可见 |

## Review Checklist

- [x] 失败路径是否覆盖？—— 覆盖：主题缺 token、对比度不足、裸色值、未注册 token 均有失败场景与脚本非零退出；节日主题漏声明、E2E 首帧闪烁均有对应场景。无网络/并发路径（纯前端样式层）。
- [x] 回滚/降级方案是什么？—— 单个 PR 内可整体 revert；门禁与代码分开提交，紧急时可先回滚门禁步骤而不影响样式修复；无数据迁移与外部依赖，回滚无残留。
- [x] 契约/DB 兼容性影响？—— 无 OpenAPI/DB 变更；localStorage `settings.v1` 中 `autoDarkMode` 变为未被消费的残留键，zustand persist 合并时忽略，不影响既有用户；主题 token 只增不删（除死 token `--color-primary`，全站无引用）。

## Migration Plan

1. 新增 `design-tokens.json` 与语义色/`border-strong` token，扩大 `@theme` 注册（先加不删，组件仍可用旧写法）
2. 修 23 套主题：基础主题取值调整 + 节日共享派生块 + 删死 token/无效 transition
3. 业务组件裸色值收敛 + 4 类静默失效修复 + 首帧脚本
4. 引入 `scripts/ui-check.mjs` 与 `ui:check`，先跑出基线报告再修剩余项至全绿
5. 补 vitest 契约测试与 `e2e/ui-theme.spec.ts`
6. CI frontend job 接入 `ui:check`；同步 `docs/frontend/component-catalog.md`、`docs/architecture.md`、`AGENTS.md`（门禁与测试计数）

回滚：整体 revert 该 PR；无数据迁移，无部署顺序依赖。

## Open Questions

- `border-strong` 是否也应覆盖日历格子边界（月视图 day cell）？当前结论：不覆盖，格子边界属装饰性，避免月视图变重。
- warning 语义色 `#b45309` 对页面底色 `#f5f6f8` 实测 4.64，余量较小；若后续主题改动页面底色，需要门禁驱动微调。
- `OnboardingGuide` 是否在后续 `design-system-foundation` 中重做为使用组件原语？本期只做 token 化，不重做布局。
