# OpenSpec 工作流约定（openspec-conventions）

## REMOVED Requirements

### Requirement: 指令体系分层与收敛
**Reason**: 机制层归属调整（由"本地 `.dsh/skills` 不入库"改为"仓库 `.agents/skills` 入库"）、文档层文件名改为 `AGENTS.md`；原需求含「机制层本地生成不入库」「dsh 机制层仅保留 skills」等与新策略冲突的场景名，无法只靠 RENAMED 保留。
**Migration**: 由本变更 ADDED 的「指令体系分层与机制层归属」承接：三层划分保留，机制层/文档层载体与归属更新。

### Requirement: CI 门禁执行 OpenSpec 一致性验证
**Reason**: 新增第 8 检（机制层完整性），检查数由七项增至八项；文档层改名 `AGENTS.md`，「CLAUDE.md 序列漂移被第 7 检拦截」等场景名与新载体不符，需求需整体重述。
**Migration**: 由本变更 ADDED 的「CI 门禁执行 OpenSpec 一致性与机制层完整性验证」承接（八项检查口径见其场景）。

## ADDED Requirements

### Requirement: 指令体系分层与机制层归属
项目 OpenSpec 指令体系 SHALL 分三层管理，维护职责不得混淆：机制层为仓库内 `.agents/skills/`（由 CLI 的 agents 适配器生成、入库、禁止手改，`.dsh/` 仅存本机个人技能且不入库）；指令层（`openspec instructions`）是工件撰写依据的唯一动态来源；文档层为 `AGENTS.md`，仅承载 CLI 无法表达的约定。

#### Scenario: 三层职责边界

- **WHEN** 维护 OpenSpec 指令体系
- **THEN** 机制层——`.agents/skills/` SHALL 由 `pnpm exec openspec init --tools agents` 生成并提交入库（`.agents/skills/.openspec-target` = `agents`），任意 AGENTS.md 兼容工具（DSH / Codex 等）零配置加载；SHALL NOT 手改，升级经 `pnpm exec openspec update` 重生成后提交；`.dsh/skills/` SHALL NOT 入库（仅存本机个人技能）
- **THEN** 指令层——`openspec instructions <artifact> --change <name>` SHALL 按 schema（工件链/模板/instruction）与 `openspec/config.yaml`（context/rules）动态生成，是每个工件撰写依据的唯一动态来源；代理 SHALL NOT 以机制层技能中的示例工序文字或文档层重复描述替代动态指令
- **THEN** 文档层——`AGENTS.md` 工作流节 SHALL 仅承载 CLI 无法表达的约定（流水线/CI 门禁/验证/文档同步），工件格式与序列 SHALL 指向指令层而不得重复撰写；其声明的工件序列 SHALL 与 schema 实际工件链一致，由 `openspec-check.mjs` 第 7 检自动校验

#### Scenario: 机制层随 CLI 升级重生成
- **WHEN** 升级 OpenSpec CLI（改根 `package.json` 版本 + `pnpm install`）并运行 `pnpm exec openspec update`
- **THEN** `.agents/skills/` 刷新为当前 CLI 生成内容（`generatedBy` 对应新版本），刷新结果 SHALL 提交入库；`openspec-check` 第 8 检（机制层完整性）保持全绿

#### Scenario: 新环境克隆即可加载机制层
- **WHEN** 新环境克隆仓库并执行 `pnpm install`
- **THEN** `.agents/skills/` 含 12 个 `openspec-*/SKILL.md` 与 `.openspec-target` 标记，直接可用，无需再执行 `openspec init`；`.dsh/` 不存在也不影响加载

#### Scenario: 机制层禁漂移
- **WHEN** 有人手改 `.agents/skills/openspec-*/SKILL.md`，或升级 CLI 后未提交重生成结果，或 `.dsh/` 被误提交
- **THEN** CI 第 8 检的 `generatedBy` 校验 / `openspec update --dry-run` 待变更检测 / `.dsh` 跟踪检测失败，提示运行 `pnpm exec openspec update` 并提交（或移除 `.dsh` 跟踪）后通过

#### Scenario: schema 变更不触发机制层重生成
- **WHEN** 修改自定义 schema（如新增 test-plan 工件）但 CLI 版本不变
- **THEN** `openspec update` 判定工具已最新（无强制项则无需更新），机制层内容保持不变；工件链变化仅经指令层透传，无需手改任何技能文件

#### Scenario: 指令层透传自定义工件链
- **WHEN** 对自定义 schema 变更运行 `openspec instructions <artifact> --change <name>`
- **THEN** 输出包含 schema 定义的工件链/模板与 `config.yaml` 注入的 context/rules，不与 CLI 内建 spec-driven 工序示例混淆

#### Scenario: 文档层不重复指令层
- **WHEN** 代理撰写某个工件的具体内容
- **THEN** 依据 `openspec instructions <artifact>` 的动态输出（模板 + instruction + rules），`AGENTS.md` 中无对应工件格式的重复副本

### Requirement: CI 门禁执行 OpenSpec 一致性与机制层完整性验证
项目 OpenSpec 一致性 SHALL 由 CI 自动把关：`@fission-ai/openspec` 精确版本 SHALL 锁定于仓库根 `package.json` 的 `devDependencies`（唯一版本源），CI SHALL 以 `pnpm install --frozen-lockfile` 安装后运行 `pnpm run openspec:check`，SHALL NOT 全局安装；脚本 SHALL 依次执行八项检查（清单见场景「openspec-check 八项检查口径」），任一失败 SHALL 非零退出码阻断 CI。版本守卫 SHALL 校验"安装版本 = `package.json` 锁定版本 = AGENTS.md 声明版本"；本地运行 SHALL 优先使用仓库内 CLI。

`version-check` job 的 docs-check 门禁与 OpenSpec 门禁相互独立：任一门的检查失败 SHALL 各自以非零退出码阻断 CI。

#### Scenario: openspec-check 八项检查口径

- **WHEN** CI 的 `openspec-validation` job 运行 `pnpm run openspec:check`（CLI 由 `pnpm install --frozen-lockfile` 按 `package.json` 锁定版本安装）
- **THEN** 第 1 项：`openspec validate --all --strict --no-interactive`——主 specs 与活动变更全部按 strict 校验，活动变更的 proposal/specs/design/tasks 未生成完整即失败
- **THEN** 第 2 项：`openspec doctor`——根与引用关系健康
- **THEN** 第 3 项：主 spec delta 头守卫——`openspec/specs/` 下所有 spec.md SHALL NOT 包含 `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements`、`## RENAMED Requirements` 或 `### (Modified|Removed|Renamed) Requirement` 行（delta 专用标记仅允许存在于 `openspec/changes/` 的变更内）
- **THEN** 第 4 项：CLI 版本守卫——实际安装的 `openspec --version` SHALL 等于 `package.json` 锁定的精确版本，且与 AGENTS.md 声明的版本一致
- **THEN** 第 5 项：`openspec validate --archived --no-interactive`——归档变更的 tasks SHALL 全部勾选完成（`- [x]`），任一归档变更残留 `- [ ]` 即失败
- **THEN** 第 6 项：test-plan 内容门禁——活动变更：存在 test-plan.md 时，其行 SHALL 对 delta specs 中的每个 `#### Scenario:` 逐条对应；归档变更：含 test-plan.md 时其 `Initial State` SHALL 无残留 `🔴`
- **THEN** 第 7 项：AGENTS.md 序列一致性守卫——AGENTS.md 声明的工件序列 SHALL 与 schema 实际工件链一致（漂移即失败，如漏写 test-plan）
- **THEN** 第 8 项：机制层完整性守卫——`.agents/skills/.openspec-target` SHALL 为 `agents`；12 个 `openspec-*/SKILL.md` 的 `generatedBy` SHALL 等于 `package.json` 锁定版本；`openspec update --dry-run --json` 的 `changes` SHALL 为空（机制层与 CLI 生成结果一致）；`.dsh/` SHALL NOT 出现在 git 索引

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
- **WHEN** 根 `package.json` 与 `pnpm-lock.yaml` 锁定 `@fission-ai/openspec@1.15.0`，AGENTS.md 声明同为 1.15.0，且主 specs/活动变更/归档变更/关系健康/主 spec 无 delta 头
- **THEN** `openspec-check.mjs` 通过全部八项检查，openspec-validation job 绿色

#### Scenario: test-plan 门禁拦截风险
- **WHEN** 活动变更的 delta 场景与 test-plan 行不一致（缺行/引用错），或归档变更的 test-plan.md 残留 `🔴`
- **THEN** test-plan 内容门禁输出变更名与问题行并失败，CI 红（须补齐映射或翻绿后通过）

#### Scenario: AGENTS.md 序列漂移被第 7 检拦截
- **WHEN** AGENTS.md 声明的工件序列与 schema 实际工件链不一致（如漏写 test-plan）
- **THEN** 第 7 检输出 AGENTS.md 声明与 schema 链的差异并失败，CI 红（修正 AGENTS.md 对齐后通过）

#### Scenario: 机制层漂移被第 8 检拦截
- **WHEN** 升级 CLI 后未重生成并提交 `.agents/skills`（`generatedBy` 滞后 / `update --dry-run` 有待变更项），或手改 SKILL.md，或 `.dsh/` 被误提交
- **THEN** 第 8 检输出具体不一致项并失败，CI 红（运行 `pnpm exec openspec update` 并提交，或移除 `.dsh` 跟踪后通过）

#### Scenario: 本地优先使用仓库内 CLI
- **WHEN** 开发者执行 `pnpm install` 后运行 `pnpm run openspec:check`（本机未全局安装 openspec）
- **THEN** 脚本解析 `node_modules` 内 `@fission-ai/openspec` 的 bin 启动 CLI，八项检查照常执行并通过；若依赖未安装，失败消息指引先运行 `pnpm install`

## MODIFIED Requirements

### Requirement: 项目 context 反映当前事实
`openspec/config.yaml` 的 `context` SHALL 反映项目当前事实（版本号、技术栈、架构、模块、测试规模等），并在项目架构/版本发生显著变化时同步更新——因为 `context` 被注入到每个 artifact 的生成指令，过时 content 会误导 artifact 产出。

#### Scenario: 架构/版本变化后
- **WHEN** 项目版本或架构发生显著变化（如模块新增、多端演进）
- **THEN** `context` 相应更新，生成 artifacts 时注入的是当前事实而非历史描述

#### Scenario: 新变更生成 artifacts
- **WHEN** 代理通过 `openspec instructions <artifact>` 获取指令
- **THEN** 指令中的 project context 与 AGENTS.md/docs 描述的当前状态一致
