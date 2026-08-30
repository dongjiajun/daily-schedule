# Proposal: wire-openspec-validation-into-ci

## Why
OpenSpec 一致性目前仅靠本地人工复验——`openspec validate` / `doctor` 不在 CI 门禁内，主 spec 漂移（strict 违规）、活动变更 artifacts 不完整、delta 头误入主 spec 都可能静默合入（本次 align / fix 两次变更全靠人工复验才通过）。接入 CI 使 spec 健康与代码验证同层阻断，且 CI 安装钉版本 CLI，避免"本地版本漂移"造成的伪绿。

## What Changes
- 新增 `scripts/openspec-check.mjs`（跨平台 Node，可经 `pnpm run openspec:check` 调用），依次执行且任一失败即非零退出：`openspec validate --all --strict --no-interactive`（主 specs + 活动变更）、`openspec doctor`、主 spec delta 头守卫（`openspec/specs/**/spec.md` 不得含 `## ADDED/MODIFIED/REMOVED/RENAMED Requirements` 及 `### (Modified|Removed|Renamed) Requirement`——delta 专用标记仅允许出现在 `openspec/changes/**/specs/`）、CLI 版本守卫（`openspec --version` 与 CLAUDE.md 声明一致）
- `.github/workflows/ci.yml` 新增 `openspec-validation` job：Node 22 环境内钉版安装 `@fission-ai/openspec@1.11.0`（npm 全局）→ `node scripts/openspec-check.mjs`
- 根 `package.json` 新增 `openspec:check` script（与 `docs:check` 并列）
- `CLAUDE.md`：工作流小节注明 CI 门禁；提交前验证清单加入 `pnpm run openspec:check`
- 不在本 change 内：10 个历史归档变更 tasks 未全勾（`openspec validate --archived` 报红），本门禁不纳入 `--archived` 校验，修复另开 `backfill-archive-task-completion`

## Capabilities

### New Capabilities
（无）

### Modified Capabilities
- `openspec-conventions`: 新增 Requirement「CI 门禁执行 OpenSpec 一致性验证」——CI SHALL 钉版安装与 CLAUDE.md 声明一致的 CLI 并运行 `openspec-check.mjs`（validate --all --strict / doctor / 主 spec 无 delta 头 / 版本一致），任一失败阻断

## API Contract Impact
无。`specs/openapi.yaml` 零变更。

## DDD Layer Impact
无。后端零变更（仅 CI 工作流 + 元工作流脚本 + 文档）。

## Database Impact
无需。无 Flyway 迁移。

## Impact
- `.github/workflows/ci.yml`（新增 `openspec-validation` job）
- `scripts/openspec-check.mjs`（新增）
- `package.json`（`openspec:check` script）
- `CLAUDE.md`（工作流 + 提交前验证章节）
- `openspec/specs/openspec-conventions/spec.md`（apply/sync 时新增 Requirement）
- 依赖：CI 运行时 `npm install -g @fission-ai/openspec@1.11.0`（钉版本，不入仓库依赖树）
