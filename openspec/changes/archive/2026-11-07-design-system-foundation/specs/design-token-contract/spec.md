# design-token-contract

## MODIFIED Requirements

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

### Requirement: 门禁接入本地脚本与 CI

`package.json` SHALL 提供 `ui:check` 脚本；CI 的 frontend job SHALL 在 lint 之后执行该脚本，任一检查失败 SHALL 阻断合并。

#### Scenario: 本地执行门禁

- **WHEN** 开发者运行 `pnpm run ui:check`
- **THEN** 六项检查依次执行并输出统一摘要，失败时非零退出

#### Scenario: CI 阻断

- **WHEN** 提交引入未覆盖契约的主题、裸色值或裸几何值
- **THEN** CI frontend job 在 ui:check 步骤失败，PR 不可合并

## ADDED Requirements

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
