# frontend-experience-baseline Delta Specification

## ADDED Requirements

### Requirement: 日历网格层次与模块顶栏材质一致性

日历星期表头 SHALL 遵循中文自然字距与字重，SHALL NOT 对中文标签使用 `uppercase` 与宽字距；月视图当月日期格 SHALL 具备细边微框架，非当月格视觉退后；日程条 SHALL 具备同色系微描边与 `tabular-nums` 等宽时间前缀；待办模块工具栏 SHALL 与日历顶栏保持一致的高度、半透明背景与底部细分隔线。

#### Scenario: 中文星期表头与月视图网格层次渲染

- **WHEN** 用户访问日历月视图（含浅色与深色主题）
- **THEN** 星期表头无 `uppercase` 变形与过宽字距，当月与非当月日期格边界清晰区分，非全天日程前缀时间对齐显示

#### Scenario: 空日程浮层不遮蔽日历网格辨识

- **WHEN** 当前日历视图范围无日程而显示空态引导提示
- **THEN** 引导提示呈现为轻量居中的卡片浮层，不影响底层日历星期表头与日期网格的轮廓可读性
