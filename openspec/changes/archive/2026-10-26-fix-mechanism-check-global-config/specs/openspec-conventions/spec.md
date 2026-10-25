# OpenSpec 工作流约定（openspec-conventions）

## MODIFIED Requirements

### Requirement: CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验
项目 OpenSpec 一致性 SHALL 由 CI 自动把关：`@fission-ai/openspec` 精确版本 SHALL 锁定于仓库根 `package.json` 的 `devDependencies`（唯一版本源），CI SHALL 以 `pnpm install --frozen-lockfile` 安装后运行 `pnpm run openspec:check`，SHALL NOT 全局安装；脚本 SHALL 依次执行十项检查（清单见场景「openspec-check 检查口径」），任一失败 SHALL 非零退出码阻断 CI。版本守卫 SHALL 校验"安装版本 = `package.json` 锁定版本 = AGENTS.md 声明版本"；本地运行 SHALL 优先使用仓库内 CLI。

`version-check` job 的 docs-check 门禁与 OpenSpec 门禁相互独立：任一门的检查失败 SHALL 各自以非零退出码阻断 CI。

#### Scenario: openspec-check 检查口径

- **WHEN** CI 的 `openspec-validation` job 运行 `pnpm run openspec:check`（CLI 由 `pnpm install --frozen-lockfile` 按 `package.json` 锁定版本安装）
- **THEN** 第 1 项：`openspec validate --all --strict --no-interactive`——主 specs 与活动变更全部按 strict 校验，活动变更的 proposal/specs/design/test-plan/tasks 未生成完整即失败
- **THEN** 第 2 项：`openspec doctor`——根与引用关系健康
- **THEN** 第 3 项：主 spec delta 头守卫——`openspec/specs/` 下所有 spec.md SHALL NOT 包含 delta 专用标记行（仅允许存在于 `openspec/changes/` 的变更内）
- **THEN** 第 4 项：CLI 版本守卫——实际安装的 `openspec --version` SHALL 等于 `package.json` 锁定的精确版本，且与 AGENTS.md 声明的版本一致
- **THEN** 第 5 项：`openspec validate --archived --no-interactive`——归档变更的 tasks SHALL 全部勾选完成（`- [x]`），任一归档变更残留 `- [ ]` 即失败
- **THEN** 第 6 项：test-plan 内容门禁——活动变更：存在 test-plan.md 时，其行 SHALL 对 delta specs 中的每个 `#### Scenario:` 逐条对应（模式 A/B 均要求，无遗漏）；归档变更：含 test-plan.md 时其 `Initial State` SHALL 无残留 `🔴`
- **THEN** 第 7 项：AGENTS.md 序列一致性守卫——AGENTS.md 声明的工件序列 SHALL 与 schema 实际工件链一致（漂移即失败）
- **THEN** 第 8 项：机制层完整性守卫——`.agents/skills/.openspec-target` SHALL 为 `agents`；12 个 `openspec-*/SKILL.md` 的 `generatedBy` SHALL 等于 `package.json` 锁定版本；`openspec update --dry-run --json` 的**项目内** `changes` SHALL 为空（`~/` 全局配置/全局技能等项目外变更不计为漂移）；`.dsh/` SHALL NOT 出现在 git 索引
- **THEN** 第 9 项：模板单源同步守卫——`node scripts/sync-schema-templates.mjs --check` SHALL 通过：proposal/spec 模板在 custom、standard、lite 三档逐字节一致，design 模板在 custom 与 standard 逐字节一致
- **THEN** 第 10 项：指令配置预算守卫——`openspec/config.yaml` 的 `context` SHALL ≤20 行且 ≤1200 字符，`rules` SHALL ≤8 条，`operations.apply.guidance` 与 `operations.archive.guidance` SHALL 非空

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
- **WHEN** 实际安装的 CLI 版本、`package.json` 锁定版本、AGENTS.md 声明版本三者任一不一致（如升级只改了 `package.json` 未 `pnpm install`，或升级后漏改声明）
- **THEN** 版本守卫失败，消息指示"改根 `package.json` 版本 + `pnpm install` + 同步 AGENTS.md 声明"三步

#### Scenario: 归档变更 tasks 未全勾被拦截
- **WHEN** 存在归档变更且其 tasks.md 含未勾选项（如勾选纪律建立前的历史归档）
- **THEN** `openspec validate --archived` 报告该变更 "N incomplete tasks" 并失败，CI 红（须补正勾选后通过）

#### Scenario: 钉版本安装与声明一致时 CI 绿
- **WHEN** 根 `package.json` 与 `pnpm-lock.yaml` 锁定 `@fission-ai/openspec@1.15.0`，AGENTS.md 声明同为 1.15.0，且主 specs/活动变更/归档变更/关系健康/主 spec 无 delta 头/机制层/模板单源/配置预算均通过
- **THEN** `openspec-check.mjs` 通过全部十项检查，openspec-validation job 绿色

#### Scenario: test-plan 门禁拦截风险
- **WHEN** 活动变更的 delta 场景与 test-plan 行不一致（缺行/引用错，模式 A/B 均适用），或归档变更的 test-plan.md 残留 `🔴`
- **THEN** test-plan 内容门禁输出变更名与问题行并失败，CI 红（须补齐映射或翻绿后通过）

#### Scenario: AGENTS.md 序列漂移被第 7 检拦截
- **WHEN** AGENTS.md 声明的工件序列与 schema 实际工件链不一致（如漏写 test-plan）
- **THEN** 第 7 检输出 AGENTS.md 声明与 schema 链的差异并失败，CI 红（修正 AGENTS.md 对齐后通过）

#### Scenario: 机制层漂移被第 8 检拦截
- **WHEN** 项目内机制层漂移（升级 CLI 后未重生成并提交 `.agents/skills`、手改 SKILL.md，或 `.dsh/` 被误提交）
- **THEN** 第 8 检输出具体不一致项并失败，CI 红（运行 `pnpm exec openspec update` 并提交，或移除 `.dsh` 跟踪后通过）

#### Scenario: 项目外全局配置初始化不误报
- **WHEN** 全新环境（CI runner / 新机器，无全局 OpenSpec 配置）运行第 8 检
- **THEN** `openspec update --dry-run --json` 的计划可能包含 `~/` 下的全局配置初始化或全局技能项，第 8 检 SHALL 仅按项目内变更判定，仍通过并给出"忽略 N 项项目外变更"信息

#### Scenario: 模板单源漂移被第 9 检拦截
- **WHEN** 修改了 custom 的 proposal/spec/design 模板但未同步 standard/lite（或直接手改 standard/lite 的共享模板）
- **THEN** 第 9 检输出不一致的模板路径并失败，CI 红（运行 `node scripts/sync-schema-templates.mjs --write` 后提交）

#### Scenario: 本地优先使用仓库内 CLI
- **WHEN** 开发者执行 `pnpm install` 后运行 `pnpm run openspec:check`（本机未全局安装 openspec）
- **THEN** 脚本解析 `node_modules` 内 `@fission-ai/openspec` 的 bin 启动 CLI，十项检查照常执行并通过；若依赖未安装，失败消息指引先运行 `pnpm install`
