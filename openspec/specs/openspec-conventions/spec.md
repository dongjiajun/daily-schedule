# OpenSpec 工作流约定（openspec-conventions）

## Purpose

定义项目 OpenSpec 工作流（spec-driven-custom）的规范约定：新能力 delta 的 Purpose 要求、无行为变化变更的 skip_specs 出口、项目 context 的事实同步、以及规范的单源化原则。使项目的 artifact 生成与官方 OpenSpec 1.15.0 约定一致。

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
- **THEN** 指令中的 project context 与 AGENTS.md/docs 描述的当前状态一致

### Requirement: 规范单源化
项目 OpenSpec 规范 SHALL 以 `openspec/schemas/spec-driven-custom/schema.yaml` 的 instruction 与 `templates/*.md` 为权威来源；`openspec/config.yaml` 的 `rules` SHALL 仅保留与 schema/模板不重复的约束，不得在同一规则上多处编码导致漂移。

#### Scenario: 修改格式规范
- **WHEN** 需要调整某 artifact 的格式/结构规范
- **THEN** 修改 schema instruction 或对应模板，config rules 中无该规则的重复副本

#### Scenario: 校验一致性
- **WHEN** 运行 `openspec instructions <artifact>` 生成指令
- **THEN** 指令不包含互相矛盾的规则（config rules 与 schema instruction 对同一规范态度一致）

### Requirement: 归档前验证门禁
项目 OpenSpec 工作流 SHALL 在归档前执行验证门禁：真实代码变更 SHALL 经 `/opsx:verify` 确认无 CRITICAL 后方可归档；纯工具链/文档/元数据变更 SHALL NOT 跳过验证，但可以全量验证组套件加 `validate --archived` 等效替代并在归档条目注明等效依据。

该门禁不改变任务的执行方式——任务勾选仍以实际完成为准；门禁只约束"归档动作"的前置状态。

#### Scenario: 验证门禁的两条适用口径

- **WHEN** 判断某变更归档前应执行哪种验证
- **THEN** 真实代码变更（触碰 `backend/`、`frontend/src/`、`apps/miniprogram/` 或 `packages/` 下源码）在 apply 后归档前 SHALL 运行 `/opsx:verify`（`openspec-verify-change`，输出 Completeness/Correctness/Coherence 三维报告）；报告 SHALL 无 CRITICAL 级别问题方可归档，存在 CRITICAL 时 SHALL 修复后重跑 `/opsx:verify` 并确认无 CRITICAL 再归档
- **THEN** 纯工具链/文档/元数据变更（无源码行为变化）SHALL NOT 跳过验证，但可由 tasks 全量验证组套件（custom 第 9 组 / standard 第 3 组 / lite 第 3 组：`openspec validate --all --strict`、`pnpm run openspec:check`、`pnpm run docs:check` 及相关测试回归）加 `validate --archived` 等效替代；归档条目 SHALL 注明等效依据（如"零代码变更，全量验证组套件 + validate --archived 全绿"）

#### Scenario: 代码变更 verify 通过后归档
- **WHEN** 变更触碰源码，apply 后运行 `/opsx:verify` 且报告无 CRITICAL
- **THEN** 允许执行归档，归档条目记录 verify 结论（无 CRITICAL 即通过）

#### Scenario: 存在 CRITICAL 时归档被拦截
- **WHEN** `/opsx:verify` 报告存在 CRITICAL 级别问题（如任务未完成、spec 与实现不一致）
- **THEN** 归档 SHALL 中止；修复问题并重跑 `/opsx:verify` 至无 CRITICAL 后方可归档，不得以 `validate --archived` 代替 verify 结论

#### Scenario: 工具链变更等效替代验证
- **WHEN** 变更不触碰源码（纯工具链/文档/元数据），归档前未运行 `/opsx:verify`
- **THEN** 变更以 tasks 全量验证组套件 + `validate --archived` 等效验证，归档条目注明等效依据，`openspec validate --archived` 通过

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

### Requirement: 三档 workflow schema 选择规则
项目 SHALL 提供三档 workflow schema 并按风险选择：默认（`openspec new change` 不带 `--schema`）SHALL 为 `spec-driven-custom-standard`；小规模/单模块/无架构决策变更 SHALL 选用 `spec-driven-custom-lite`；复杂/高风险变更（跨模块、新架构、外部依赖、安全/性能/迁移、需红绿测试账本）SHALL 选用 `spec-driven-custom`。所选 schema SHALL 在 proposal 中说明理由；无行为变化变更在任一档 SHALL 设 `skip_specs: true`。

#### Scenario: 默认档位为 standard
- **WHEN** 开发者运行 `openspec new change <name>`（不带 `--schema`）
- **THEN** 变更以 `spec-driven-custom-standard` 创建，`openspec status` 显示 proposal/specs/design/tasks 四个工件，无 test-plan

#### Scenario: 小变更选用 lite
- **WHEN** 变更仅涉及单模块小范围行为调整（无新架构/依赖/迁移/安全影响）
- **THEN** 使用 `spec-driven-custom-lite`（proposal→specs→tasks），proposal 中注明选择理由

#### Scenario: 复杂变更必须用 custom
- **WHEN** 变更涉及跨模块、新架构模式、外部依赖、安全/性能/迁移，或需要可审计的场景↔验证账本
- **THEN** 使用 `spec-driven-custom`（proposal→specs→design→test-plan→tasks），不得以 standard/lite 降低留痕

#### Scenario: schema 选择留痕
- **WHEN** 审阅任一新变更
- **THEN** proposal 的 Impact 或 Why 中可读到所选 schema 与理由；.openspec.yaml 的 schema 字段与实际工件链一致

### Requirement: CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验
项目 OpenSpec 一致性 SHALL 由 CI 自动把关：`@fission-ai/openspec` 精确版本 SHALL 锁定于仓库根 `package.json` 的 `devDependencies`（唯一版本源），CI SHALL 以 `pnpm install --frozen-lockfile` 安装后运行 `pnpm run openspec:check`，SHALL NOT 全局安装；脚本 SHALL 依次执行九项检查（清单见场景「openspec-check 检查口径」），任一失败 SHALL 非零退出码阻断 CI。版本守卫 SHALL 校验"安装版本 = `package.json` 锁定版本 = AGENTS.md 声明版本"；本地运行 SHALL 优先使用仓库内 CLI。

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
- **THEN** 第 8 项：机制层完整性守卫——`.agents/skills/.openspec-target` SHALL 为 `agents`；12 个 `openspec-*/SKILL.md` 的 `generatedBy` SHALL 等于 `package.json` 锁定版本；`openspec update --dry-run --json` 的 `changes` SHALL 为空；`.dsh/` SHALL NOT 出现在 git 索引
- **THEN** 第 9 项：模板单源同步守卫——`node scripts/sync-schema-templates.mjs --check` SHALL 通过：proposal/spec 模板在 custom、standard、lite 三档逐字节一致，design 模板在 custom 与 standard 逐字节一致

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
- **WHEN** 根 `package.json` 与 `pnpm-lock.yaml` 锁定 `@fission-ai/openspec@1.15.0`，AGENTS.md 声明同为 1.15.0，且主 specs/活动变更/归档变更/关系健康/主 spec 无 delta 头/机制层/模板单源均通过
- **THEN** `openspec-check.mjs` 通过全部九项检查，openspec-validation job 绿色

#### Scenario: test-plan 门禁拦截风险
- **WHEN** 活动变更的 delta 场景与 test-plan 行不一致（缺行/引用错，模式 A/B 均适用），或归档变更的 test-plan.md 残留 `🔴`
- **THEN** test-plan 内容门禁输出变更名与问题行并失败，CI 红（须补齐映射或翻绿后通过）

#### Scenario: AGENTS.md 序列漂移被第 7 检拦截
- **WHEN** AGENTS.md 声明的工件序列与 schema 实际工件链不一致（如漏写 test-plan）
- **THEN** 第 7 检输出 AGENTS.md 声明与 schema 链的差异并失败，CI 红（修正 AGENTS.md 对齐后通过）

#### Scenario: 机制层漂移被第 8 检拦截
- **WHEN** 升级 CLI 后未重生成并提交 `.agents/skills`（`generatedBy` 滞后 / `update --dry-run` 有待变更项），或手改 SKILL.md，或 `.dsh/` 被误提交
- **THEN** 第 8 检输出具体不一致项并失败，CI 红（运行 `pnpm exec openspec update` 并提交，或移除 `.dsh` 跟踪后通过）

#### Scenario: 模板单源漂移被第 9 检拦截
- **WHEN** 修改了 custom 的 proposal/spec/design 模板但未同步 standard/lite（或直接手改 standard/lite 的共享模板）
- **THEN** 第 9 检输出不一致的模板路径并失败，CI 红（运行 `node scripts/sync-schema-templates.mjs --write` 后提交）

#### Scenario: 本地优先使用仓库内 CLI
- **WHEN** 开发者执行 `pnpm install` 后运行 `pnpm run openspec:check`（本机未全局安装 openspec）
- **THEN** 脚本解析 `node_modules` 内 `@fission-ai/openspec` 的 bin 启动 CLI，九项检查照常执行并通过；若依赖未安装，失败消息指引先运行 `pnpm install`
