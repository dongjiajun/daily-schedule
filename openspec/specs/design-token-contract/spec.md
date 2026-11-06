# design-token-contract Specification

## Purpose
定义前端设计 token 的单一真相源与可验证门禁，使主题、配色与可访问性变更在 CI 中被强制校验，而不是依赖人工比对与口头约定。

## Requirements

### Requirement: Token 契约单一真相源

系统 SHALL 在代码中维护一份设计 token 契约清单（token 名称、语义分组、对比度配对），主题 CSS、Tailwind `@theme` 注册与校验脚本 SHALL 均以该清单为准。文档 SHALL NOT 以硬编码数字重复声明 token 总数。

#### Scenario: 契约清单新增 token

- **WHEN** 开发者在契约清单中新增一个语义 token
- **THEN** 完整性门禁立即要求全部主题（5 套基础 + 18 套节日）补齐该 token

#### Scenario: 文档声明与清单不一致

- **WHEN** 文档正文以 prose 数字声明 token 数量
- **THEN** 该数字不构成验收依据，验收以契约清单与 `ui:check` 输出为准

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
- **THEN** 四项检查依次执行并输出统一摘要，失败时非零退出

#### Scenario: CI 阻断

- **WHEN** 提交引入未覆盖契约的主题或裸色值
- **THEN** CI frontend job 在 ui:check 步骤失败，PR 不可合并
