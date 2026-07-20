# Proposal: Version Sync Automation

## Why

版本号分散在三个文件中（`specs/openapi.yaml`、`backend/pom.xml`、`frontend/package.json`），手动同步易遗漏。需要自动化脚本确保三者一致。

## What Changes

- 新增 `scripts/sync-version.sh` — 读取 `specs/openapi.yaml` 版本号，同步到 `pom.xml` 和 `package.json`
- 在 `turbo.json` 或 CI 中集成版本校验步骤

## Capabilities

### New Capabilities

- `version-sync`: 自动化版本同步 — 单一真相源（openapi.yaml）→ pom.xml + package.json

### Modified Capabilities

无

## API Contract Impact

无（脚本只读 openapi.yaml，不修改）

## DDD Layer Impact

无。

## Database Impact

无。

## Impact

| 文件 | 说明 |
|------|------|
| `scripts/sync-version.sh` | 新增：版本同步脚本 |
| `turbo.json` | 可选：新增 `version-check` 任务 |
