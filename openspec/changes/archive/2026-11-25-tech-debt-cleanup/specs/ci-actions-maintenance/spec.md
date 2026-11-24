# CI Actions Maintenance（CI Action 版本维护）

## ADDED Requirements

### Requirement: CI 覆盖微信小程序验证
`.github/workflows/ci.yml` SHALL 定义阻断性 `miniprogram` job（使用 Node 24 runtime 兼容版本 `actions/checkout@v5`、`pnpm/action-setup@v6`、`actions/setup-node@v5`），安装依赖后构建 `@daily-schedule/shared` 并运行 `@daily-schedule/miniprogram` 的 `verify`（lint + tsc + test + taro build）。

#### Scenario: CI 配置包含阻断性小程序验证任务
- **WHEN** 推送或提 PR 到 `main` 分支触发 CI workflow
- **THEN** `miniprogram` job 执行 `pnpm --filter @daily-schedule/shared run build` 与 `pnpm --filter @daily-schedule/miniprogram run verify`，且未设置 `continue-on-error: true`

#### Scenario: 小程序包验证失败阻断流程
- **WHEN** 小程序包存在 lint、类型、单测或 Taro 构建错误
- **THEN** `pnpm --filter @daily-schedule/miniprogram run verify` 返回非零退出码并使 CI 失败
