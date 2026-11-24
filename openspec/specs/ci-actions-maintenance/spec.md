# CI Actions Maintenance（CI Action 版本维护）

## Purpose
CI workflow 中 GitHub Actions 使用非弃用版本，消除 Node 20 运行时弃用警告与 setup-java 停更风险。

## Requirements

### Requirement: CI actions 使用非弃用版本
CI workflow（`.github/workflows/ci.yml`）中使用的 GitHub Actions SHALL 为 Node 24 runtime 的当前版本：`actions/checkout@v5`、`actions/setup-node@v5`、`actions/setup-java@v5`、`pnpm/action-setup@v6`，不得停留在 Node 20 runtime 的 v4 版本。

#### Scenario: 无弃用警告
- **WHEN** CI workflow 运行任一 job
- **THEN** GitHub Actions 不报告 "Node.js 20 is deprecated" 或 "setup-java v4 is deprecated" 警告
- **THEN** 五层门禁（Version Sync / Backend / Frontend / E2E）全部通过

### Requirement: CI 覆盖微信小程序验证
`.github/workflows/ci.yml` SHALL 定义阻断性 `miniprogram` job（使用 Node 24 runtime 兼容版本 `actions/checkout@v5`、`pnpm/action-setup@v6`、`actions/setup-node@v5`），安装依赖后构建 `@daily-schedule/shared` 并运行 `@daily-schedule/miniprogram` 的 `verify`（lint + tsc + test + taro build）。

#### Scenario: CI 配置包含阻断性小程序验证任务
- **WHEN** 推送或提 PR 到 `main` 分支触发 CI workflow
- **THEN** `miniprogram` job 执行 `pnpm --filter @daily-schedule/shared run build` 与 `pnpm --filter @daily-schedule/miniprogram run verify`，且未设置 `continue-on-error: true`

#### Scenario: 小程序包验证失败阻断流程
- **WHEN** 小程序包存在 lint、类型、单测或 Taro 构建错误
- **THEN** `pnpm --filter @daily-schedule/miniprogram run verify` 返回非零退出码并使 CI 失败

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 无弃用警告 | CI 运行结果（GitHub Actions annotations） | 推送后检查 annotation 列表 | ➕ |
