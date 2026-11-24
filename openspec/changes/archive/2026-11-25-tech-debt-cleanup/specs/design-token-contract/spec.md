# design-token-contract

## ADDED Requirements

### Requirement: 业务组件禁止残留 bg-white 与 bg-black 硬编码背景
白名单之外的前端业务与布局组件 SHALL NOT 使用 `bg-white` 或 `bg-black`（含透明度修饰符）硬编码背景类，应改用契约语义 token（如 `bg-surface`、`bg-overlay`）；`scripts/ui-check.mjs` 的裸色值检查 SHALL 拦截此类用法并在非零退出时输出文件与行号。

#### Scenario: 业务组件迁移至语义背景 token 后门禁通过
- **WHEN** `PetPage`、`ManagePanel` 将 `bg-white` 替换为 `bg-surface`，`OnboardingGuide` 将 `bg-black/40` 替换为 `bg-overlay` 后运行 `pnpm run ui:check`
- **THEN** 裸色值检查通过，暗色与节日主题下卡片及遮罩保持主题适配

#### Scenario: 源码出现 bg-white 或 bg-black 时门禁拦截
- **WHEN** 白名单外 TSX 源码包含 `bg-white` 或 `bg-black/40`（`text-white` 除外）
- **THEN** `ui-check.mjs` 裸色值扫描命中并报告文件与行号，进程以非零状态退出
