# Theme System

## MODIFIED Requirements

### Requirement: 系统提供五套内置主题预设

系统 SHALL 内置 5 套主题：default（冷灰蓝）、warm（暖琥珀色系）、nature（森林绿色系）、dark（深色模式）、lavender（薰衣草紫色系）。每套主题 SHALL 定义设计 token 契约中的全部语义 Token（契约清单唯一真相源见 `design-token-contract`）。

#### Scenario: 用户浏览所有可用主题

- **WHEN** 用户打开偏好设置面板
- **THEN** 系统展示 5 个主题选项，每个附带名称与颜色预览

#### Scenario: 切换到 warm 主题后创建日程

- **WHEN** 用户在 warm 主题下创建新日程
- **THEN** 日程表单的背景、输入框边框、按钮颜色均呈现暖色系风格

#### Scenario: 主题缺少契约 Token

- **WHEN** 任一主题块遗漏契约中的语义 Token
- **THEN** `pnpm run ui:check` 输出缺失清单并非零退出

### Requirement: 存在统一的语义化设计 Token 层

系统 SHALL 以代码内 token 契约清单为唯一真相源定义语义化设计 Token，覆盖背景、文本、边框（含可交互控件边界 `border-strong`）、强调与焦点、状态与悬停、日历专用、渐变。所有组件 SHALL 通过 Tailwind 4 `@theme` 注册的 utility 类引用这些 Token。

#### Scenario: 新增第六套主题

- **WHEN** 开发者在 `themes.css` 中新增一套主题块并定义契约内全部 Token
- **THEN** 系统无需修改任何组件代码即可使用新主题

#### Scenario: 引用未注册的 Token

- **WHEN** 组件使用 `@theme` 未注册的 utility（如 `bg-muted`）
- **THEN** `pnpm run ui:check` 非零退出并在报告中列出行号

### Requirement: 语义色不受主题影响

系统 SHALL 为成功（success）、错误（error）、警告（warning）定义主题无关的语义色 Token，并在 `@theme` 注册对应 utility 及 `-bg` / `-fg` 变体，使组件无需裸色值即可表达语义。语义色取值 SHALL 满足对比度门禁。

#### Scenario: 在 dark 主题下查看表单验证错误

- **WHEN** 用户在 dark 主题下提交一个有验证错误的新建日程表单
- **THEN** 错误边框与错误文字仍显示红色系语义色，且与背景对比度达到 4.5:1

#### Scenario: 破坏性按钮文字对比度

- **WHEN** 组件以 error 语义色为底、白色为前景渲染破坏性按钮
- **THEN** 该配对对比度达到 4.5:1（而不是使用 3.76:1 的调色板红）

#### Scenario: 语义色随主题改变

- **WHEN** 用户从 default 切换到 dark 主题
- **THEN** success/error/warning 的色相语义保持不变（仅允许 bg/fg 变体按主题调整明度）

## ADDED Requirements

### Requirement: 主题对比度与可读性

每套主题 SHALL 保证正文与标签文本对背景 4.5:1、可交互控件边界对相邻背景 3:1 的最低对比度。装饰性分隔线不受此约束，但 SHALL 与 `border-strong` 使用不同 Token 表达。

#### Scenario: 小字标签可读

- **WHEN** 用户在 default 或 dark 主题下查看侧栏 11–12px 分组标签
- **THEN** 文本与背景对比度 ≥ 4.5:1

#### Scenario: 输入框边界可辨

- **WHEN** 用户在任一主题下聚焦或识别输入框/下拉框边界
- **THEN** 控件边界与相邻背景对比度 ≥ 3:1
