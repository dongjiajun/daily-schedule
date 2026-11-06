# Frontend Experience Baseline（前端体验基线）

## Purpose
定义全站前端体验的基线规范——弹层过渡动画、主题 token 使用、文档语言声明与减弱动态偏好，保证视觉一致性与可访问性。

## Requirements

### Requirement: 弹层过渡动画
Dialog / Popover / Select 等弹层组件 SHALL 提供入场/离场过渡动画，且在全站实际生效。

- 依赖 `tw-animate-css` 提供 `animate-in`/`zoom-in-95`/`slide-in-from-*` 等动画工具类
- 组件已书写的动画类（如 `data-[state=open]:animate-in`）MUST 在编译产物中有对应 CSS 命中，不得因依赖缺失而静默失效

#### Scenario: 打开事件编辑弹窗
- **WHEN** 用户打开任意 Dialog（如事件编辑、新建任务）
- **THEN** 弹窗带缩放/淡入过渡动画出现（非瞬时弹出）

#### Scenario: 下拉与气泡层
- **WHEN** 用户展开 Popover 或 Select 下拉
- **THEN** 层带淡入/滑动过渡出现

### Requirement: 宠物模块主题一致性
宠物模块 UI SHALL 仅使用主题系统中已定义的 CSS 变量与工具类，不得使用未定义的 Tailwind 类导致样式静默缺失。

- 现状问题类:`bg-muted`/`text-muted-foreground`（全项目未定义 `--color-muted`）→ 替换为既有 token `bg-hover`/`text-foreground-muted`
- 涉及组件:PetMenu、PetStatus、SidebarPet、PetPage、PetSelection

#### Scenario: 宠物状态面板渲染
- **WHEN** 用户查看宠物状态面板（进度条轨道、信息卡标签）
- **THEN** 背景色与文字色按主题正确渲染（非透明/非默认色）

### Requirement: 文档语言声明
应用入口 HTML SHALL 以 `lang="zh-CN"` 声明文档语言，与全站中文内容一致。

#### Scenario: 屏幕阅读器访问
- **WHEN** 屏幕阅读器用户访问页面
- **THEN** 以中文发音规则朗读内容（而非按英文规则）

### Requirement: 减弱动态偏好
全局动效 SHALL 尊重系统"减弱动态效果"偏好（prefers-reduced-motion），双层覆盖：

- framer-motion 层：App 根节点 SHALL 包裹 `<MotionConfig reducedMotion="user">`
- CSS 层：全局媒体查询 SHALL 将动画/过渡时长压缩至 0.01ms（覆盖弹层动画、宠物动作动画等）

#### Scenario: 系统开启减弱动态
- **WHEN** 用户系统设置开启"减少动态效果"
- **THEN** framer-motion 动画自动降级为最小化位移/透明度变化
- **THEN** CSS 动画与过渡近乎瞬时完成（弹窗出现无缩放过程、宠物小动作无播放）

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

### Requirement: 中文排版与密度基线

前端排版 SHALL 使用 `--font-sans` 显式 CJK 字体栈与契约字阶，数值类文本 SHALL 使用 `tabular-nums`；中文标签 SHALL NOT 依赖 `uppercase` 或过度字距制造层级；密度模式 SHALL 通过 `data-density` 与密度 token 驱动，组件内 SHALL NOT 写死尺寸。

#### Scenario: 中文分组标签排版

- **WHEN** 用户查看侧栏分组标题（如「分类」「标签」）
- **THEN** 标签使用契约字阶与显式 CJK 字体栈，不依赖 `uppercase` 与宽字距区分层级

#### Scenario: 切换紧凑密度

- **WHEN** 用户在偏好设置中把密度从 comfortable 改为 compact 并刷新
- **THEN** 控件高度、卡片内边距与日历行高按密度 token 收窄，且设置被持久化
