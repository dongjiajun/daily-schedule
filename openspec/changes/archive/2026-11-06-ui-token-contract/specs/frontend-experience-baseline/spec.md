# Frontend Experience Baseline

## ADDED Requirements

### Requirement: 组件配色使用语义 Token

前端组件 SHALL 通过语义 token utility 表达颜色，SHALL NOT 直接使用 Tailwind 调色板类（如 `text-red-500`）或十六进制色值。成功/错误/警告语义 SHALL 使用 `success`/`error`/`warning` 系列 utility。白名单仅限引导插画、宠物 SVG、特效粒子与登录页装饰光斑。

#### Scenario: 删除操作的错误态配色

- **WHEN** 用户将鼠标悬停在分类删除按钮上
- **THEN** 文字/背景呈现 error 语义色，且在 default 与 dark 主题下均保持可读

#### Scenario: 完成状态的成功色

- **WHEN** 用户在日历事件上标记完成
- **THEN** 勾选圆点使用 success 语义色，而不是写死 `bg-emerald-500`

### Requirement: 样式声明不得静默失效

新增或修改的样式声明 SHALL 在目标浏览器实际生效：对未 `@property` 注册的自定义属性 SHALL NOT 声明过渡；动态生成颜色透明度 SHALL 使用 `color-mix()` 等合法语法；不得保留已知无效的声明。

#### Scenario: 主题切换过渡

- **WHEN** 用户切换主题
- **THEN** 切换瞬时完成且无控制台样式报错；不保留对自定义属性无效的 `transition` 声明

#### Scenario: 事件卡片底色

- **WHEN** 事件没有分类/自定义颜色，走默认色分支渲染
- **THEN** 卡片底色由合法颜色值渲染（非 `var(...)` 拼接十六进制透明度产生的空值）

### Requirement: 首屏主题与自动节日一致

应用入口的首帧主题脚本 SHALL 与 `useTheme` 的判定一致：`themeMode=auto` 且已缓存活跃节日时，首帧 SHALL 直接应用 `holiday-<id>`；不得出现先基础主题、挂载后跳到节日主题的可见闪烁。

#### Scenario: 春节自动主题下刷新页面

- **WHEN** 用户在 `themeMode=auto` 且已检测到春节的次日刷新页面
- **THEN** 首帧即为春节主题，无基础主题闪烁

#### Scenario: 无节日时的首帧

- **WHEN** `themeMode=auto` 且当日无节日
- **THEN** 首帧直接应用用户手动选择的基础主题
