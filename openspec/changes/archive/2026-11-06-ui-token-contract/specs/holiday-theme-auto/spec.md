# Holiday Theme Auto

## MODIFIED Requirements

### Requirement: 节日主题 CSS 变量注入

系统 SHALL 将 `HolidayTheme` 映射为 `[data-theme="holiday-<id>"]` 块写入 `core/styles/holiday-themes.css`。每个节日主题块 SHALL 覆盖设计 token 契约中的全部语义 Token；允许只声明种子色并由派生规则生成，但运行时每个契约 Token 必须有定义。

#### Scenario: CSS 变量正确映射

- **WHEN** 春节主题激活
- **THEN** `data-theme="holiday-spring-festival"`，`--color-bg`/`--color-accent`/`--color-surface` 反映春节配色，且前景、前景次级、muted、边框、hover、sidebar 与日历专用 Token 均为已定义值

#### Scenario: 新增节日主题缺少契约 Token

- **WHEN** 新增的节日主题块只声明背景、表面、强调与渐变 7 个变量
- **THEN** `pnpm run ui:check` 报出缺失 Token 并非零退出

#### Scenario: 未注册的死 Token 不得保留

- **WHEN** 节日主题块声明了 `@theme` 未注册、全站无引用的自定义属性（如 `--color-primary`）
- **THEN** `ui:check` 的未知 Token 检查将其列为待清理项，不得作为配色来源继续使用
