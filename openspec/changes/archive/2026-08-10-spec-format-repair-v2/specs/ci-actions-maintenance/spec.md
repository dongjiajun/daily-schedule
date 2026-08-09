# CI Actions Maintenance

## MODIFIED Requirements

### Requirement: CI actions 使用非弃用版本
CI workflow（`.github/workflows/ci.yml`）中使用的 GitHub Actions SHALL 为 Node 24 runtime 的当前版本：`actions/checkout@v5`、`actions/setup-node@v5`、`actions/setup-java@v5`、`pnpm/action-setup@v6`，不得停留在 Node 20 runtime 的 v4 版本。
（格式修复：主 spec 的 `## ADDED Requirements` 节标题改为规范的 `## Requirements`，需求内容与场景不变）

#### Scenario: 无弃用警告
- **WHEN** CI workflow 运行任一 job
- **THEN** GitHub Actions 不报告 "Node.js 20 is deprecated" 或 "setup-java v4 is deprecated" 警告
- **THEN** 五层门禁（Version Sync / Backend / Frontend / E2E）全部通过
