# Proposal: upgrade-ci-actions

## Why
CI 门禁全绿但持续报告 6 条弃用警告：`actions/checkout@v4`、`actions/setup-node@v4`、`actions/setup-java@v4`、`pnpm/action-setup@v4` 内部跑 Node 20（GitHub 2025-09-19 起强制迁移到 Node 24，未来将移除兼容层），且 `setup-java@v4` 停止维护。当前无害，但属时间炸弹——升级成本极低（改 4 类 action 版本 + 一次 CI 验证）。

## What Changes
- `.github/workflows/ci.yml`：`actions/checkout@v4 → v5`、`actions/setup-node@v4 → v5`、`actions/setup-java@v4 → v5`、`pnpm/action-setup@v4 → v6`（全部使用 Node 24 runtime 的版本）

## Capabilities

### New Capabilities
- `ci-actions-maintenance`: CI workflow 中 GitHub Actions SHALL 使用非弃用版本（Node 24 runtime），弃用警告清零

### Modified Capabilities
- 无

## API Contract Impact
无（不涉及 `specs/openapi.yaml`）

## DDD Layer Impact
无（不触碰后端任何层）

## Database Impact
无需新 Flyway 迁移

## Impact
- `.github/workflows/ci.yml`（4 类 action 版本）
- 文档：`docs/architecture.md` 测试/CI 描述核对（CI 流程结构不变）
