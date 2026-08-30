# OpenSpec 工作流约定（openspec-conventions）

## MODIFIED Requirements

### Requirement: CI 门禁执行 OpenSpec 一致性验证
项目 OpenSpec 一致性 SHALL 由 CI 自动把关：`.github/workflows/ci.yml` 的 `openspec-validation` job SHALL 安装与 `CLAUDE.md` 声明版本一致的钉版本 `@fission-ai/openspec` CLI（npm 全局），并运行 `scripts/openspec-check.mjs`（可经 `pnpm run openspec:check` 调用）；该脚本 SHALL 依次执行以下检查，任一失败以非零退出码阻断 CI：
1. `openspec validate --all --strict --no-interactive`——主 specs 与活动变更全部按 strict 校验，活动变更的 proposal/specs/design/tasks 未生成完整即失败
2. `openspec doctor`——根与引用关系健康
3. 主 spec delta 头守卫——`openspec/specs/` 下所有 spec.md SHALL NOT 包含 `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements`、`## RENAMED Requirements` 或 `### (Modified|Removed|Renamed) Requirement` 行（delta 专用标记仅允许存在于 `openspec/changes/` 的变更内）
4. CLI 版本守卫——`openspec --version` SHALL 与 CLAUDE.md 声明的 OpenSpec 版本一致
5. `openspec validate --archived --no-interactive`——归档变更的 tasks SHALL 全部勾选完成（`- [x]`），任一归档变更残留 `- [ ]` 即失败（`backfill-archive-task-completion` 补正后的历史归档须保持全绿）

`version-check` job 的 docs-check 门禁与 OpenSpec 门禁相互独立：任一门的检查失败 SHALL 各自以非零退出码阻断 CI。

#### Scenario: 主 spec strict 漂移被拦截
- **WHEN** 主 spec 违反 strict 规则（如新能力主 spec 的 Purpose 过短、格式错误）
- **THEN** `openspec-check.mjs` 非零退出，CI 的 openspec-validation job 失败并输出违规条目

#### Scenario: 活动变更 artifacts 不完整被拦截
- **WHEN** 存在未归档的活动变更且其 artifacts 未生成完整（如仅 proposal 尚无 specs/tasks）
- **THEN** `openspec validate --all --strict` 报告 `change/<name>` 失败，CI 红

#### Scenario: delta 头误入主 spec 被拦截
- **WHEN** 开发者误将 delta 结构（如 `## ADDED Requirements`）提交到 `openspec/specs/<cap>/spec.md`
- **THEN** delta 头守卫输出文件路径与行号并失败，引导将 delta 放回 `openspec/changes/<change>/specs/`

#### Scenario: CLI 版本声明漂移被拦截
- **WHEN** CI 安装的 `@fission-ai/openspec` 版本与 CLAUDE.md 声明的版本不一致（升级 CLI 未同步声明，或声明先行未升级）
- **THEN** 版本守卫失败，消息指示钉版本安装命令与 CLAUDE.md 声明需同步修正

#### Scenario: 归档变更 tasks 未全勾被拦截
- **WHEN** 存在归档变更且其 tasks.md 含未勾选项（如勾选纪律建立前的历史归档）
- **THEN** `openspec validate --archived` 报告该变更 "N incomplete tasks" 并失败，CI 红（须补正勾选后通过）

#### Scenario: 钉版本安装与声明一致时 CI 绿
- **WHEN** `npm install -g @fission-ai/openspec@<version>` 安装的版本等于 CLAUDE.md 声明版本，且主 specs/活动变更/归档变更/关系健康/主 spec 无 delta 头
- **THEN** `openspec-check.mjs` 通过全部检查，openspec-validation job 绿色

## REMOVED Requirements
（无）

## RENAMED Requirements
（无）

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 归档变更 tasks 未全勾被拦截 | scripts/openspec-check.mjs | validateArchived（第 5 子检查，CLI 调用） | ➕ |
| 主 spec strict 漂移被拦截 | scripts/openspec-check.mjs（validate --all --strict） | — | ➕ |
| 活动变更 artifacts 不完整被拦截 | scripts/openspec-check.mjs（validate --all --strict） | — | ➕ |
| delta 头误入主 spec 被拦截 | scripts/openspec-check.mjs | guardMainSpecDeltaHeaders | ➕ |
| CLI 版本声明漂移被拦截 | scripts/openspec-check.mjs | checkCliVersion | ➕ |
| 钉版本安装与声明一致时 CI 绿 | scripts/openspec-check.mjs（本变更本地复跑 `pnpm run openspec:check`） | — | ➕ |
