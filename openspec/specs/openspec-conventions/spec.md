# OpenSpec 工作流约定（openspec-conventions）

## Purpose

定义项目 OpenSpec 工作流（spec-driven-custom）的规范约定：新能力 delta 的 Purpose 要求、无行为变化变更的 skip_specs 出口、项目 context 的事实同步、以及规范的单源化原则。使项目的 artifact 生成与官方 OpenSpec 1.11.0 约定一致。

## Requirements
### Requirement: 新能力 delta 必须携带 Purpose 段
项目 OpenSpec 工作流 SHALL 要求：为**新能力**创建的 delta spec 必须以 `## Purpose` 段开头，内容 SHALL ≥50 字符并描述该能力用途；归档/同步时，新建主 spec 的 Purpose SHALL 取自该 delta 的 `## Purpose` 段。为**已存在能力**创建的 delta SHALL NOT 携带 `## Purpose` 段（主 spec 已有，delta 的会被忽略）；修改已存在能力的 Purpose SHALL 直接编辑 `openspec/specs/<cap>/spec.md`。

#### Scenario: 新能力 delta 创建
- **WHEN** 变更引入新能力并创建 `specs/<capability>/spec.md`
- **THEN** delta 以 `## Purpose` 段开头且内容 ≥50 字符，归档后主 spec 出现对应 Purpose，`openspec validate --strict` 不报 "Purpose section is too brief"

#### Scenario: 已存在能力 delta 不带 Purpose
- **WHEN** 变更修改已存在能力的行为（仅需求级变更，非新增能力）
- **THEN** delta 不含 `## Purpose` 段；该能力 Purpose 的修改直接落在 `openspec/specs/<cap>/spec.md`

#### Scenario: Purpose 过短被拦截
- **WHEN** 新能力 delta 的 `## Purpose` 少于 50 字符
- **THEN** `openspec validate --strict` 报告 WARNING（Purpose section is too brief），须补足后通过

### Requirement: 无行为变化变更使用 skip_specs 出口
项目 OpenSpec 工作流 SHALL 支持官方 `skip_specs: true` 机制：当变更无 spec 级行为变化（纯重构/工具链/文档/热修）时，在变更的 `.openspec.yaml` 设置 `skip_specs: true`，不得以"绕过 OpenSpec 流程"的方式处理此类变更；`openspec validate` SHALL 对零 delta 且声明 `skip_specs` 的变更放行。

#### Scenario: 文档/热修变更
- **WHEN** 变更只改文档或热修且无行为变化
- **THEN** `.openspec.yaml` 含 `skip_specs: true`，不创建 delta specs，`openspec validate` 通过且报告 INFO "skip_specs is set"

#### Scenario: 行为变更必须提供 delta
- **WHEN** 变更影响系统行为（需求级）
- **THEN** 必须提供 delta specs，不得以 `skip_specs` 逃避（官方 validate 对零 delta 且未声明 skip_specs 的变更报 ERROR）

### Requirement: 项目 context 反映当前事实
`openspec/config.yaml` 的 `context` SHALL 反映项目当前事实（版本号、技术栈、架构、模块、测试规模等），并在项目架构/版本发生显著变化时同步更新——因为 `context` 被注入到每个 artifact 的生成指令，过时 content 会误导 artifact 产出。

#### Scenario: 架构/版本变化后
- **WHEN** 项目版本或架构发生显著变化（如模块新增、多端演进）
- **THEN** `context` 相应更新，生成 artifacts 时注入的是当前事实而非历史描述

#### Scenario: 新变更生成 artifacts
- **WHEN** 代理通过 `openspec instructions <artifact>` 获取指令
- **THEN** 指令中的 project context 与 CLAUDE.md/docs 描述的当前状态一致

### Requirement: 规范单源化
项目 OpenSpec 规范 SHALL 以 `openspec/schemas/spec-driven-custom/schema.yaml` 的 instruction 与 `templates/*.md` 为权威来源；`openspec/config.yaml` 的 `rules` SHALL 仅保留与 schema/模板不重复的约束，不得在同一规则上多处编码导致漂移。

#### Scenario: 修改格式规范
- **WHEN** 需要调整某 artifact 的格式/结构规范
- **THEN** 修改 schema instruction 或对应模板，config rules 中无该规则的重复副本

#### Scenario: 校验一致性
- **WHEN** 运行 `openspec instructions <artifact>` 生成指令
- **THEN** 指令不包含互相矛盾的规则（config rules 与 schema instruction 对同一规范态度一致）

### Requirement: CI 门禁执行 OpenSpec 一致性验证
项目 OpenSpec 一致性 SHALL 由 CI 自动把关：`.github/workflows/ci.yml` 的 `openspec-validation` job SHALL 安装与 `CLAUDE.md` 声明版本一致的钉版本 `@fission-ai/openspec` CLI（npm 全局），并运行 `scripts/openspec-check.mjs`（可经 `pnpm run openspec:check` 调用）；该脚本 SHALL 依次执行以下检查，任一失败以非零退出码阻断 CI：
1. `openspec validate --all --strict --no-interactive`——主 specs 与活动变更全部按 strict 校验，活动变更的 proposal/specs/design/tasks 未生成完整即失败
2. `openspec doctor`——根与引用关系健康
3. 主 spec delta 头守卫——`openspec/specs/` 下所有 spec.md SHALL NOT 包含 `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements`、`## RENAMED Requirements` 或 `### (Modified|Removed|Renamed) Requirement` 行（delta 专用标记仅允许存在于 `openspec/changes/` 的变更内）
4. CLI 版本守卫——`openspec --version` SHALL 与 CLAUDE.md 声明的 OpenSpec 版本一致
5. `openspec validate --archived --no-interactive`——归档变更的 tasks SHALL 全部勾选完成（`- [x]`），任一归档变更残留 `- [ ]` 即失败（`backfill-archive-task-completion` 补正后的历史归档须保持全绿）
6. test-plan 内容门禁——活动变更：存在 test-plan.md 时，其行 SHALL 对 delta specs 中的每个 `#### Scenario:` 逐条对应（Requirement/Scenario 引用一致，无遗漏）；归档变更：含 test-plan.md 时其 `Initial State` SHALL 无残留 `🔴`（全部翻绿）

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

#### Scenario: test-plan 门禁拦截风险
- **WHEN** 活动变更的 delta 场景与 test-plan 行不一致（缺行/引用错），或归档变更的 test-plan.md 残留 `🔴`
- **THEN** test-plan 内容门禁输出变更名与问题行并失败，CI 红（须补齐映射或翻绿后通过）

### Requirement: 归档前验证门禁
项目 OpenSpec 工作流 SHALL 在归档前执行验证门禁：

1. **真实代码变更**（触碰 `backend/`、`frontend/src/`、`apps/miniprogram/` 或 `packages/` 下源码）在 apply 后归档前 SHALL 运行 `/opsx:verify`（`openspec-verify-change`，输出 Completeness/Correctness/Coherence 三维报告）；报告 SHALL 无 CRITICAL 级别问题方可归档，存在 CRITICAL 时 SHALL 修复后重跑 `/opsx:verify` 并确认无 CRITICAL 再归档。
2. **纯工具链/文档/元数据变更**（无源码行为变化）SHALL NOT 跳过验证，但可由 tasks 全量验证组套件（custom 第 9 组 / lite 第 3 组：`openspec validate --all --strict`、`pnpm run openspec:check`、`pnpm run docs:check` 及相关测试回归）加 `validate --archived` 等效替代；归档条目 SHALL 注明等效依据（如"零代码变更，全量验证组套件 + validate --archived 全绿"）。

该门禁不改变任务的执行方式——任务勾选仍以实际完成为准；门禁只约束"归档动作"的前置状态。

#### Scenario: 代码变更 verify 通过后归档
- **WHEN** 变更触碰源码，apply 后运行 `/opsx:verify` 且报告无 CRITICAL
- **THEN** 允许执行归档，归档条目记录 verify 结论（无 CRITICAL 即通过）

#### Scenario: 存在 CRITICAL 时归档被拦截
- **WHEN** `/opsx:verify` 报告存在 CRITICAL 级别问题（如任务未完成、spec 与实现不一致）
- **THEN** 归档 SHALL 中止；修复问题并重跑 `/opsx:verify` 至无 CRITICAL 后方可归档，不得以 `validate --archived` 代替 verify 结论

#### Scenario: 工具链变更等效替代验证
- **WHEN** 变更不触碰源码（纯工具链/文档/元数据），归档前未运行 `/opsx:verify`
- **THEN** 变更以 tasks 全量验证组套件 + `validate --archived` 等效验证，归档条目注明等效依据，`openspec validate --archived` 通过
