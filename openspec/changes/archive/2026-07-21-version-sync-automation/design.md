# Design: Version Sync Automation

## Context

执行计划约束 8：版本号同步 — `openapi.yaml` ↔ `pom.xml` ↔ `package.json`。当前靠开发者手动同步，易出错。

**约束**：Shell 脚本（Windows Git Bash / Linux / macOS 通用）。

## Goals / Non-Goals

**Goals:**
- Shell 脚本自动同步版本号
- 脚本在 Windows Git Bash 和 Linux 均可运行
- CI 中校验版本一致性

**Non-Goals:**
- 不自动更新 `specs/CHANGELOG.md`
- 不管理 git tag

## Decisions

### Decision 1: 脚本语言 — Bash

- **选择**: Bash（POSIX sh 兼容）
- **理由**: 所有开发者环境均可运行（Git Bash on Windows）；CI 环境原生支持；无需额外依赖
- **备选方案**: Node.js 脚本 — 需要 Node 运行时，但项目已有 Node；Bash 更轻量

### Decision 2: 真相源 — openapi.yaml

- **选择**: `specs/openapi.yaml` 的 `info.version` 为唯一版本真相源
- **理由**: API 契约是项目核心，版本号自然以契约为准；`pom.xml` 和 `package.json` 是派生值
- **备选方案**: 三文件任意一个为源 — 不如 openapi.yaml 语义明确

### Decision 3: CI 集成方式

- **选择**: 在 `turbo.json` 中新增 `version-check` 任务，CI workflow 中新增独立 step
- **理由**: 不阻塞本地开发（本地 `verify` 不强制版本一致）；CI 中校验，fail fast
- **备选方案**: 集成到 `verify` pipeline — CI 本地行为一致，但本地开发时版本号不同步不应阻塞

## Implementation

### sync-version.sh

```bash
#!/bin/bash
set -euo pipefail

# Extract version from specs/openapi.yaml
VERSION=$(grep -Po '(?<=version: )\d+\.\d+\.\d+' specs/openapi.yaml | head -1)
echo "Target version: $VERSION"

# Sync backend/pom.xml (only under com.dailyschedule group)
sed -i "/<groupId>com.dailyschedule<\/groupId>/,/<\/version>/ s|<version>[^<]*</version>|<version>$VERSION</version>|" backend/pom.xml

# Sync frontend/package.json
# Use node for JSON manipulation to avoid jq dependency
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
pkg.version = '$VERSION';
fs.writeFileSync('frontend/package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Version synced: $VERSION"
```

### CI 集成

```yaml
# .github/workflows/ci.yml 中新增 step
- name: Check version consistency
  run: ./scripts/sync-version.sh --check
```

或使用 `turbo.json`:
```json
{ "tasks": { "version-check": { "dependsOn": [], "cache": false } } }
```

## Risks

| 风险 | 缓解措施 |
|------|---------|
| `sed -i` 在 macOS 语法不同 | 检测 OS 并使用兼容语法 |
| 脚本修改未跟踪的本地文件 | 开发者手动运行后 commit |
