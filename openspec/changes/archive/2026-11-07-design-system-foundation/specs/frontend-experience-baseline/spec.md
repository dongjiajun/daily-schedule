# Frontend Experience Baseline

## ADDED Requirements

### Requirement: 中文排版与密度基线

前端排版 SHALL 使用 `--font-sans` 显式 CJK 字体栈与契约字阶，数值类文本 SHALL 使用 `tabular-nums`；中文标签 SHALL NOT 依赖 `uppercase` 或过度字距制造层级；密度模式 SHALL 通过 `data-density` 与密度 token 驱动，组件内 SHALL NOT 写死尺寸。

#### Scenario: 中文分组标签排版

- **WHEN** 用户查看侧栏分组标题（如「分类」「标签」）
- **THEN** 标签使用契约字阶与显式 CJK 字体栈，不依赖 `uppercase` 与宽字距区分层级

#### Scenario: 切换紧凑密度

- **WHEN** 用户在偏好设置中把密度从 comfortable 改为 compact 并刷新
- **THEN** 控件高度、卡片内边距与日历行高按密度 token 收窄，且设置被持久化
