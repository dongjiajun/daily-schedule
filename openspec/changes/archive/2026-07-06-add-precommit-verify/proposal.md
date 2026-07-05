# Proposal: 提交前本地验证流程

## Why

主题系统变更提交后 CI lint 门禁失败，原因是本地验证时只跑了 `npm run build`，没有跑 `npm run lint`——而 CI 有三层门禁（lint + tsc + test）。需要将本地验证流程与 CI 对齐，避免"本地过、CI 挂"。

## What Changes

- `frontend/package.json` 新增 `"verify"` 脚本：`npm run lint && npm run build`，一键前端验证
- `CLAUDE.md` 新增"提交前验证"章节，明确要求提交前必须通过 `npm run verify` + `mvn test`

## Capabilities

### New Capabilities
- `precommit-verify`: 项目级提交前验证约束，package.json 提供 `verify` 脚本，CLAUDE.md 记录强制验证流程

### Modified Capabilities
- 无

## API Contract Impact

无影响。

## DDD Layer Impact

无影响。纯项目配置层变更（CLAUDE.md + package.json）。

## Database Impact

无。无需 Flyway 迁移。

## Impact

- `frontend/package.json`：新增 `verify` script
- `CLAUDE.md`：新增"提交前验证"章节
