# design-token-contract Delta Specification

## ADDED Requirements

### Requirement: 暗色与节日主题表面及微描边层次契约

`dark` 与全部 `holiday-*` 主题的 `--color-border-subtle` SHALL 与 `--color-surface` 保持可辨识的视觉区分，且 `--color-surface-elevated` SHALL 与 `--color-surface`、`--color-border` 形成清晰阶梯。三档投影 token（`shadow-card` / `shadow-float` / `shadow-overlay`）SHALL 采用多层柔和投影，并在暗色与节日主题下叠加顶部微高光轮廓。

#### Scenario: 暗色主题下卡片与容器边界清晰可辨

- **WHEN** 用户切换到 `dark` 或任意 `holiday-*` 主题浏览日历、看板或弹窗
- **THEN** `border-subtle` 与 `surface`、`surface-elevated` 与 `surface` 存在肉眼可辨的亮度阶梯，卡片与弹窗边缘不再与背景融为一体

#### Scenario: 门禁对比度与契约数量守卫不退化

- **WHEN** 开发者更新暗色/节日主题表面色阶与多层阴影定义后运行 `pnpm run ui:check`
- **THEN** 全量 23 套主题 × 40 个颜色 token 完整性、WCAG 对比度（文本 ≥ 4.5:1 / 控件边界 ≥ 3:1）与几何/动效检查全部通过，零非零退出
