# design-token-contract Specification

## Purpose
定义前端设计 token 的单一真相源与可验证门禁，使主题、配色与可访问性变更在 CI 中被强制校验，而不是依赖人工比对与口头约定。

## Requirements

### Requirement: Token 契约单一真相源

系统 SHALL 在代码中维护一份设计 token 契约清单（颜色、几何、排版、动效、密度 token 的名称与分组，以及对比度配对），主题 CSS、Tailwind `@theme` 注册与校验脚本 SHALL 均以该清单为准。文档 SHALL NOT 以硬编码数字重复声明 token 总数。

#### Scenario: 契约清单新增 token

- **WHEN** 开发者在契约清单中新增一个语义 token
- **THEN** 完整性门禁立即要求全部主题（5 套基础 + 18 套节日）补齐该 token

#### Scenario: 文档声明与清单不一致

- **WHEN** 文档正文以 prose 数字声明 token 数量
- **THEN** 该数字不构成验收依据，验收以契约清单与 `ui:check` 输出为准

#### Scenario: 契约清单新增几何 token

- **WHEN** 开发者在契约清单中新增一个圆角或阴影 token
- **THEN** `ui:check` 的几何检查立即允许该 token，并要求组件不再使用契约外的裸值

### Requirement: 主题 Token 完整性门禁

`pnpm run ui:check` SHALL 解析全部 `[data-theme]` 主题块，校验每个块声明的 token 集合为契约清单的超集；任一缺失 SHALL 非零退出，并输出主题 id 与缺失 token 列表。

#### Scenario: 节日主题缺少前景色

- **WHEN** 某节日主题块只声明 7 个变量（背景/表面/强调/渐变）
- **THEN** `ui:check` 报出该主题缺失的契约 token 并非零退出

#### Scenario: 全部主题覆盖完整契约

- **WHEN** 5 套基础主题与 18 套节日主题均覆盖契约清单
- **THEN** 完整性检查通过，并输出主题数量与 token 数量摘要

### Requirement: 对比度门禁

`ui:check` SHALL 对契约清单中声明的对比度配对计算 WCAG 比值：正文与标签文本对背景 SHALL ≥ 4.5:1，可交互控件边界 SHALL ≥ 3:1；任一配对不达标 SHALL 非零退出并输出实测比值。

#### Scenario: muted 文本对比度不足

- **WHEN** default 主题 `foreground-muted` 取值为对白底 2.54:1 的色值
- **THEN** 对比度检查输出该配对与实测比值并非零退出

#### Scenario: 调整至达标取值

- **WHEN** 该 token 调整为对白底与页面底色均 ≥ 4.5:1 的取值
- **THEN** 对比度检查通过

### Requirement: 裸色值白名单门禁

`ui:check` SHALL 扫描前端源码，禁止在白名单之外出现 Tailwind 调色板类（如 `text-red-500`）与十六进制色值。白名单 SHALL 仅含引导插画、宠物 SVG、特效粒子、登录页装饰光斑，且每条 SHALL 登记理由。

#### Scenario: 业务组件新增裸色值

- **WHEN** 某业务组件新增 `hover:bg-red-50`
- **THEN** `ui:check` 输出文件与行号并非零退出

#### Scenario: 白名单内的角色配色

- **WHEN** 宠物 SVG 使用 `fill="#F4A261"`
- **THEN** 检查通过（该文件已登记为角色配色白名单）

### Requirement: 未知 Token 引用门禁

`ui:check` SHALL 检测组件对 `@theme` 未注册 token utility（如 `bg-muted`、`text-muted-foreground`）的引用；命中 SHALL 非零退出，避免样式静默缺失。

#### Scenario: 引用未注册 utility

- **WHEN** 组件使用 `bg-muted` 而 `@theme` 未注册该 token
- **THEN** `ui:check` 输出文件名与行号并非零退出

#### Scenario: 引用已注册 utility

- **WHEN** 组件使用 `bg-hover` 或 `text-foreground-muted`
- **THEN** 检查通过

### Requirement: 门禁接入本地脚本与 CI

`package.json` SHALL 提供 `ui:check` 脚本；CI 的 frontend job SHALL 在 lint 之后执行该脚本，任一检查失败 SHALL 阻断合并。

#### Scenario: 本地执行门禁

- **WHEN** 开发者运行 `pnpm run ui:check`
- **THEN** 六项检查依次执行并输出统一摘要，失败时非零退出

#### Scenario: CI 阻断

- **WHEN** 提交引入未覆盖契约的主题、裸色值或裸几何值
- **THEN** CI frontend job 在 ui:check 步骤失败，PR 不可合并

### Requirement: 几何与动效 token 门禁

`ui:check` SHALL 校验前端源码中的圆角、阴影、动效时长与曲率仅引用契约注册的 token 档位；白名单之外出现 `rounded-3xl`、`shadow-[...]`、`duration-150` 等契约外的裸值 SHALL 非零退出并输出文件行号。

#### Scenario: 使用契约外的圆角档位

- **WHEN** 某组件使用 `rounded-3xl` 而契约只定义到 `xl`
- **THEN** `ui:check` 报出该行并非零退出

#### Scenario: 几何与动效全部来自 token

- **WHEN** 组件使用 `rounded-lg`、`shadow-card`、`duration-base`、`ease-standard`
- **THEN** 几何/动效检查通过

### Requirement: 视觉回归基线

系统 SHALL 提供 Playwright 截图基线，覆盖 5 套主题 × 6 个关键截面（登录、日历月、日历周、待办看板、待办列表、宠物）；基线更新 SHALL 通过显式 `--update-snapshots` 触发并随 PR 评审；视觉用例 SHALL 用 `@visual` tag 与常规 E2E 隔离。

#### Scenario: 主题或截面发生像素变化

- **WHEN** 组件改动导致某主题下截图偏离基线
- **THEN** `pnpm run test:visual` 报告差异并输出对比图

#### Scenario: 显式更新基线

- **WHEN** 需求变更后开发者运行 `pnpm run test:visual -- --update-snapshots`
- **THEN** 基线图片更新并纳入同一次提交评审

### Requirement: 业务组件禁止残留 bg-white 与 bg-black 硬编码背景
白名单之外的前端业务与布局组件 SHALL NOT 使用 `bg-white` 或 `bg-black`（含透明度修饰符）硬编码背景类，应改用契约语义 token（如 `bg-surface`、`bg-overlay`）；`scripts/ui-check.mjs` 的裸色值检查 SHALL 拦截此类用法并在非零退出时输出文件与行号。

#### Scenario: 业务组件迁移至语义背景 token 后门禁通过
- **WHEN** `PetPage`、`ManagePanel` 将 `bg-white` 替换为 `bg-surface`，`OnboardingGuide` 将 `bg-black/40` 替换为 `bg-overlay` 后运行 `pnpm run ui:check`
- **THEN** 裸色值检查通过，暗色与节日主题下卡片及遮罩保持主题适配

#### Scenario: 源码出现 bg-white 或 bg-black 时门禁拦截
- **WHEN** 白名单外 TSX 源码包含 `bg-white` 或 `bg-black/40`（`text-white` 除外）
- **THEN** `ui-check.mjs` 裸色值扫描命中并报告文件与行号，进程以非零状态退出

### Requirement: 暗色与节日主题表面及微描边层次契约

`dark` 与全部 `holiday-*` 主题的 `--color-border-subtle` SHALL 与 `--color-surface` 保持可辨识的视觉区分，且 `--color-surface-elevated` SHALL 与 `--color-surface`、`--color-border` 形成清晰阶梯。三档投影 token（`shadow-card` / `shadow-float` / `shadow-overlay`）SHALL 采用多层柔和投影，并在暗色与节日主题下叠加顶部微高光轮廓。

#### Scenario: 暗色主题下卡片与容器边界清晰可辨

- **WHEN** 用户切换到 `dark` 或任意 `holiday-*` 主题浏览日历、看板或弹窗
- **THEN** `border-subtle` 与 `surface`、`surface-elevated` 与 `surface` 存在肉眼可辨的亮度阶梯，卡片与弹窗边缘不再与背景融为一体

#### Scenario: 门禁对比度与契约数量守卫不退化

- **WHEN** 开发者更新暗色/节日主题表面色阶与多层阴影定义后运行 `pnpm run ui:check`
- **THEN** 全量 23 套主题 × 40 个颜色 token 完整性、WCAG 对比度（文本 ≥ 4.5:1 / 控件边界 ≥ 3:1）与几何/动效检查全部通过，零非零退出
