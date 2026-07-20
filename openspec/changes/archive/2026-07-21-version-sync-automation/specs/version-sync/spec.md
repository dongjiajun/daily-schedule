# Version Sync

自动化版本同步 — 以 `specs/openapi.yaml` 为唯一真相源。

## ADDED Requirements

### Requirement: Version Sync Script

项目 SHALL 提供 `scripts/sync-version.sh`，从 `specs/openapi.yaml` 提取版本号并同步到 `backend/pom.xml` 和 `frontend/package.json`。

- 脚本 SHALL 读取 `specs/openapi.yaml` 的 `info.version` 字段
- 脚本 SHALL 更新 `backend/pom.xml` 的 `<version>` 标签（仅 `<groupId>com.dailyschedule</groupId>` 下的）
- 脚本 SHALL 更新 `frontend/package.json` 的 `"version"` 字段
- 若版本号已一致，脚本 SHALL 输出 "Already in sync" 并退出 0

#### Scenario: 版本同步

- **WHEN** `specs/openapi.yaml` 版本为 `3.2.0`，而 `pom.xml` 为 `3.1.0`
- **THEN** 运行 `./scripts/sync-version.sh` SHALL 将 `pom.xml` 更新为 `3.2.0`
- **THEN** `package.json` SHALL 更新为 `3.2.0`

#### Scenario: 版本已一致

- **WHEN** 三个文件版本号相同
- **THEN** 脚本 SHALL 输出 "Already in sync" 并退出码 0

### Requirement: CI Version Check

CI SHALL 在构建前校验版本号一致性。

- 校验失败 SHALL 阻止合并
- 校验 SHALL 在 `turbo run verify` 中触发（或作为独立 step）

#### Scenario: CI 检测版本不一致

- **WHEN** 开发者提交了版本号不一致的代码
- **THEN** CI SHALL 在版本校验步骤失败
- **THEN** 失败信息 SHALL 指示运行 `./scripts/sync-version.sh` 修复
