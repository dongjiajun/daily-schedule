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
