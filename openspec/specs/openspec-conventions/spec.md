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
- **THEN** 指令中的 project context 与 CLAUDE.md/docs 描述的当前状态一致

### Requirement: 规范单源化
项目 OpenSpec 规范 SHALL 以 `openspec/schemas/spec-driven-custom/schema.yaml` 的 instruction 与 `templates/*.md` 为权威来源；`openspec/config.yaml` 的 `rules` SHALL 仅保留与 schema/模板不重复的约束，不得在同一规则上多处编码导致漂移。

#### Scenario: 修改格式规范
- **WHEN** 需要调整某 artifact 的格式/结构规范
- **THEN** 修改 schema instruction 或对应模板，config rules 中无该规则的重复副本

#### Scenario: 校验一致性
- **WHEN** 运行 `openspec instructions <artifact>` 生成指令
- **THEN** 指令不包含互相矛盾的规则（config rules 与 schema instruction 对同一规范态度一致）

### Requirement: 指令体系分层与收敛
项目 OpenSpec 指令体系 SHALL 分三层管理，维护职责不得混淆：机制层（`.dsh/skills/`）由 CLI 在本地生成、禁止手改且不入版本库，项目 SHALL NOT 提交 `.dsh/`、`.claude/` 或维护 `.dsh/commands/`；指令层（`openspec instructions`）是工件撰写依据的唯一动态来源；文档层（`CLAUDE.md`）仅承载 CLI 无法表达的约定。

#### Scenario: 三层职责边界

- **WHEN** 维护 OpenSpec 指令体系
- **THEN** 机制层——`.dsh/skills/` 由 CLI 在本地生成（`openspec init --tools dsh` 或 `openspec update`，`generatedBy` 对应 CLI 版本），SHALL NOT 提交入库（`.gitignore` 排除 `.dsh/` 与 `.claude/`），SHALL NOT 被手改；项目 SHALL NOT 维护 `.claude/` 与 `.dsh/commands/`
- **THEN** 指令层——`openspec instructions <artifact> --change <name>` SHALL 按 schema（工件链/模板/instruction 字段）与 `openspec/config.yaml`（context/rules）动态生成工件撰写指引，是每个工件撰写依据的唯一动态来源；代理 SHALL NOT 以机制层技能中的示例工序文字或文档层重复描述替代动态指令
- **THEN** 文档层——`CLAUDE.md` 工作流节 SHALL 仅承载 CLI 无法表达的约定（流水线/CI 门禁/验证/文档同步），工件格式与序列 SHALL 指向指令层（`openspec instructions <artifact>`）而不得重复撰写；CLAUDE.md 声明的工件序列 SHALL 与 schema 实际工件链一致，由 `openspec-check.mjs` 第 7 检自动校验

#### Scenario: 机制层随 CLI 升级重生成
- **WHEN** 升级 OpenSpec CLI（如 1.11.0 → 1.15.0）并运行 `openspec update` 刷新指令文件
- **THEN** 本机 `.dsh/skills/` 刷新为当前 CLI 版本内容（`generatedBy` 对应新版本），覆盖旧版本文件；因 `.dsh/` 不入库，本次刷新 SHALL NOT 产生 `git status` 变更

#### Scenario: 机制层本地生成不入库
- **WHEN** 新环境克隆仓库（无 `.dsh/`）并安装 OpenSpec CLI
- **THEN** 执行 `openspec init --tools dsh`（或 `openspec update`）生成 `.dsh/skills/openspec-*/SKILL.md` 共 12 个；`openspec/config.yaml` 保持已有 schema/context/rules 不变；`.dsh/` 始终不出现在版本控制中（`git ls-files .dsh` 为空）

#### Scenario: dsh 机制层仅保留 skills
- **WHEN** 检查 DeepSeek Harness 的机制层产物
- **THEN** 仅 `.dsh/skills/openspec-*/SKILL.md` 由 `openspec update` 生成与刷新；`.dsh/commands/` 与 `.claude/` SHALL NOT 存在（OpenSpec 官方 `dsh` 适配器无 command adapter，DSH harness 只扫描 `.dsh/skills` 与 `.agents/skills` 技能根），项目 SHALL NOT 人工镜像命令文件

#### Scenario: schema 变更不触发机制层重生成
- **WHEN** 修改自定义 schema（如新增 test-plan 工件）但 CLI 版本不变
- **THEN** `openspec update` 判定工具已最新（无强制项则无需更新），机制层内容保持不变；工件链变化仅经指令层透传，无需手改任何技能/命令文件

#### Scenario: 指令层透传自定义工件链
- **WHEN** 对自定义 schema 变更运行 `openspec instructions <artifact> --change <name>`
- **THEN** 输出包含 schema 定义的工件链/模板与 config.yaml 注入的 context/rules（如 test-plan 工件的 instruction 来自 schema.yaml 的 instruction 字段），不与 CLI 内建 spec-driven 工序示例混淆

#### Scenario: 文档层不重复指令层
- **WHEN** 代理撰写某个工件的具体内容
- **THEN** 依据 `openspec instructions <artifact>` 的动态输出（模板 + instruction + rules），CLAUDE.md 中无对应工件格式的重复副本

### Requirement: CI 门禁执行 OpenSpec 一致性验证
项目 OpenSpec 一致性 SHALL 由 CI 自动把关：`@fission-ai/openspec` 精确版本 SHALL 锁定于仓库根 `package.json` 的 `devDependencies`（唯一版本源），CI SHALL 以 `pnpm install --frozen-lockfile` 安装后运行 `pnpm run openspec:check`，SHALL NOT 全局安装；脚本 SHALL 依次执行七项检查（清单见场景「openspec-check 七项检查口径」），任一失败 SHALL 非零退出码阻断 CI。版本守卫 SHALL 校验"安装版本 = `package.json` 锁定版本 = CLAUDE.md 声明版本"；本地运行 SHALL 优先使用仓库内 CLI。

`version-check` job 的 docs-check 门禁与 OpenSpec 门禁相互独立：任一门的检查失败 SHALL 各自以非零退出码阻断 CI。

#### Scenario: openspec-check 七项检查口径

- **WHEN** CI 的 `openspec-validation` job 运行 `pnpm run openspec:check`（CLI 由 `pnpm install --frozen-lockfile` 按 `package.json` 锁定版本安装）
- **THEN** 第 1 项：`openspec validate --all --strict --no-interactive`——主 specs 与活动变更全部按 strict 校验，活动变更的 proposal/specs/design/tasks 未生成完整即失败
- **THEN** 第 2 项：`openspec doctor`——根与引用关系健康
- **THEN** 第 3 项：主 spec delta 头守卫——`openspec/specs/` 下所有 spec.md SHALL NOT 包含 `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements`、`## RENAMED Requirements` 或 `### (Modified|Removed|Renamed) Requirement` 行（delta 专用标记仅允许存在于 `openspec/changes/` 的变更内）
- **THEN** 第 4 项：CLI 版本守卫——实际安装的 `openspec --version` SHALL 等于 `package.json` 锁定的精确版本，且与 CLAUDE.md 声明的版本一致
- **THEN** 第 5 项：`openspec validate --archived --no-interactive`——归档变更的 tasks SHALL 全部勾选完成（`- [x]`），任一归档变更残留 `- [ ]` 即失败（`backfill-archive-task-completion` 补正后的历史归档须保持全绿）
- **THEN** 第 6 项：test-plan 内容门禁——活动变更：存在 test-plan.md 时，其行 SHALL 对 delta specs 中的每个 `#### Scenario:` 逐条对应（Requirement/Scenario 引用一致，无遗漏）；归档变更：含 test-plan.md 时其 `Initial State` SHALL 无残留 `🔴`（全部翻绿）
- **THEN** 第 7 项：CLAUDE.md 序列一致性守卫——CLAUDE.md 声明的工件序列 SHALL 与 schema 实际工件链一致（按当前 schema 工件链核对，漂移即失败，如漏写 test-plan）

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
- **WHEN** 实际安装的 CLI 版本、`package.json` 锁定版本、CLAUDE.md 声明版本三者任一不一致（如升级只改了 `package.json` 未 `pnpm install`，或升级后漏改声明）
- **THEN** 版本守卫失败，消息指示"改根 `package.json` 版本 + `pnpm install` + 同步 CLAUDE.md 声明"三步

#### Scenario: 归档变更 tasks 未全勾被拦截
- **WHEN** 存在归档变更且其 tasks.md 含未勾选项（如勾选纪律建立前的历史归档）
- **THEN** `openspec validate --archived` 报告该变更 "N incomplete tasks" 并失败，CI 红（须补正勾选后通过）

#### Scenario: 钉版本安装与声明一致时 CI 绿
- **WHEN** 根 `package.json` 与 `pnpm-lock.yaml` 锁定 `@fission-ai/openspec@1.15.0`，CLAUDE.md 声明同为 1.15.0，且主 specs/活动变更/归档变更/关系健康/主 spec 无 delta 头
- **THEN** `openspec-check.mjs` 通过全部检查，openspec-validation job 绿色

#### Scenario: test-plan 门禁拦截风险
- **WHEN** 活动变更的 delta 场景与 test-plan 行不一致（缺行/引用错），或归档变更的 test-plan.md 残留 `🔴`
- **THEN** test-plan 内容门禁输出变更名与问题行并失败，CI 红（须补齐映射或翻绿后通过）

#### Scenario: CLAUDE.md 序列漂移被第 7 检拦截
- **WHEN** CLAUDE.md 声明的工件序列与 schema 实际工件链不一致（如漏写 test-plan）
- **THEN** 第 7 检输出 CLAUDE.md 声明与 schema 链的差异并失败，CI 红（修正 CLAUDE.md 对齐后通过）

#### Scenario: 本地优先使用仓库内 CLI
- **WHEN** 开发者执行 `pnpm install` 后运行 `pnpm run openspec:check`（本机未全局安装 openspec）
- **THEN** 脚本解析 `node_modules` 内 `@fission-ai/openspec` 的 bin 启动 CLI，七项检查照常执行并通过；若依赖未安装，失败消息指引先运行 `pnpm install`

### Requirement: 归档前验证门禁
项目 OpenSpec 工作流 SHALL 在归档前执行验证门禁：真实代码变更 SHALL 经 `/opsx:verify` 确认无 CRITICAL 后方可归档；纯工具链/文档/元数据变更 SHALL NOT 跳过验证，但可以全量验证组套件加 `validate --archived` 等效替代并在归档条目注明等效依据。

该门禁不改变任务的执行方式——任务勾选仍以实际完成为准；门禁只约束"归档动作"的前置状态。

#### Scenario: 验证门禁的两条适用口径

- **WHEN** 判断某变更归档前应执行哪种验证
- **THEN** 真实代码变更（触碰 `backend/`、`frontend/src/`、`apps/miniprogram/` 或 `packages/` 下源码）在 apply 后归档前 SHALL 运行 `/opsx:verify`（`openspec-verify-change`，输出 Completeness/Correctness/Coherence 三维报告）；报告 SHALL 无 CRITICAL 级别问题方可归档，存在 CRITICAL 时 SHALL 修复后重跑 `/opsx:verify` 并确认无 CRITICAL 再归档
- **THEN** 纯工具链/文档/元数据变更（无源码行为变化）SHALL NOT 跳过验证，但可由 tasks 全量验证组套件（custom 第 9 组 / lite 第 3 组：`openspec validate --all --strict`、`pnpm run openspec:check`、`pnpm run docs:check` 及相关测试回归）加 `validate --archived` 等效替代；归档条目 SHALL 注明等效依据（如"零代码变更，全量验证组套件 + validate --archived 全绿"）

#### Scenario: 代码变更 verify 通过后归档
- **WHEN** 变更触碰源码，apply 后运行 `/opsx:verify` 且报告无 CRITICAL
- **THEN** 允许执行归档，归档条目记录 verify 结论（无 CRITICAL 即通过）

#### Scenario: 存在 CRITICAL 时归档被拦截
- **WHEN** `/opsx:verify` 报告存在 CRITICAL 级别问题（如任务未完成、spec 与实现不一致）
- **THEN** 归档 SHALL 中止；修复问题并重跑 `/opsx:verify` 至无 CRITICAL 后方可归档，不得以 `validate --archived` 代替 verify 结论

#### Scenario: 工具链变更等效替代验证
- **WHEN** 变更不触碰源码（纯工具链/文档/元数据），归档前未运行 `/opsx:verify`
- **THEN** 变更以 tasks 全量验证组套件 + `validate --archived` 等效验证，归档条目注明等效依据，`openspec validate --archived` 通过
