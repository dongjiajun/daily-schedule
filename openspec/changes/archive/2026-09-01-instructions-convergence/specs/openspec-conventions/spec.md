# OpenSpec 工作流约定（openspec-conventions）

## ADDED Requirements

### Requirement: 指令体系分层与收敛
项目 OpenSpec 指令体系 SHALL 分三层管理，维护职责不得混淆：

1. **机制层**——`.dsh/` 与 `.claude/` 下的技能与命令文件 SHALL 由 CLI 随版本重生成：OpenSpec 升级后运行 `openspec update` 统一刷新（文件元数据 `generatedBy` 对应 CLI 版本）；schema/工件链变更 SHALL NOT 触发重生成；该层文件 SHALL NOT 被手改，以 CLI 版本内容为准。
2. **指令层**——`openspec instructions <artifact> --change <name>` SHALL 按 schema（工件链/模板/instruction 字段）与 `openspec/config.yaml`（context/rules）动态生成工件撰写指引，是每个工件撰写依据的唯一动态来源；代理 SHALL NOT 以机制层技能中的示例工序文字或文档层重复描述替代动态指令。
3. **文档层**——`CLAUDE.md` 工作流节 SHALL 仅承载 CLI 无法表达的约定（流水线/CI 门禁/验证/文档同步），工件格式与序列 SHALL 指向指令层（`openspec instructions <artifact>`）而不得重复撰写；CLAUDE.md 声明的工件序列 SHALL 与 schema 实际工件链一致，由 `openspec-check.mjs` 第 7 检自动校验。

#### Scenario: 机制层随 CLI 升级重生成
- **WHEN** 升级 OpenSpec CLI（如 1.11.0 → 1.12.0）并运行 `openspec update` 刷新指令文件
- **THEN** `.dsh/` 与 `.claude/` 技能/命令刷新为当前 CLI 版本内容（`generatedBy` 对应新版本），覆盖旧版本文件

#### Scenario: schema 变更不触发机制层重生成
- **WHEN** 修改自定义 schema（如新增 test-plan 工件）但 CLI 版本不变
- **THEN** `openspec update` 判定工具已最新（无强制项则无需更新），机制层内容保持不变；工件链变化仅经指令层透传，无需手改任何技能/命令文件

#### Scenario: 指令层透传自定义工件链
- **WHEN** 对自定义 schema 变更运行 `openspec instructions <artifact> --change <name>`
- **THEN** 输出包含 schema 定义的工件链/模板与 config.yaml 注入的 context/rules（如 test-plan 工件的 instruction 来自 schema.yaml 的 instruction 字段），不与 CLI 内建 spec-driven 工序示例混淆

#### Scenario: 文档层不重复指令层
- **WHEN** 代理撰写某个工件的具体内容
- **THEN** 依据 `openspec instructions <artifact>` 的动态输出（模板 + instruction + rules），CLAUDE.md 中无对应工件格式的重复副本

## MODIFIED Requirements

### Requirement: CI 门禁执行 OpenSpec 一致性验证
项目 OpenSpec 一致性 SHALL 由 CI 自动把关：`.github/workflows/ci.yml` 的 `openspec-validation` job SHALL 安装与 `CLAUDE.md` 声明版本一致的钉版本 `@fission-ai/openspec` CLI（npm 全局），并运行 `scripts/openspec-check.mjs`（可经 `pnpm run openspec:check` 调用）；该脚本 SHALL 依次执行以下检查，任一失败以非零退出码阻断 CI：
1. `openspec validate --all --strict --no-interactive`——主 specs 与活动变更全部按 strict 校验，活动变更的 proposal/specs/design/tasks 未生成完整即失败
2. `openspec doctor`——根与引用关系健康
3. 主 spec delta 头守卫——`openspec/specs/` 下所有 spec.md SHALL NOT 包含 `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements`、`## RENAMED Requirements` 或 `### (Modified|Removed|Renamed) Requirement` 行（delta 专用标记仅允许存在于 `openspec/changes/` 的变更内）
4. CLI 版本守卫——`openspec --version` SHALL 与 CLAUDE.md 声明的 OpenSpec 版本一致
5. `openspec validate --archived --no-interactive`——归档变更的 tasks SHALL 全部勾选完成（`- [x]`），任一归档变更残留 `- [ ]` 即失败（`backfill-archive-task-completion` 补正后的历史归档须保持全绿）
6. test-plan 内容门禁——活动变更：存在 test-plan.md 时，其行 SHALL 对 delta specs 中的每个 `#### Scenario:` 逐条对应（Requirement/Scenario 引用一致，无遗漏）；归档变更：含 test-plan.md 时其 `Initial State` SHALL 无残留 `🔴`（全部翻绿）
7. CLAUDE.md 序列一致性守卫——CLAUDE.md 声明的工件序列 SHALL 与 schema 实际工件链一致（按当前 schema 工件链核对，漂移即失败，如漏写 test-plan）

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

#### Scenario: CLAUDE.md 序列漂移被第 7 检拦截
- **WHEN** CLAUDE.md 声明的工件序列与 schema 实际工件链不一致（如漏写 test-plan）
- **THEN** 第 7 检输出 CLAUDE.md 声明与 schema 链的差异并失败，CI 红（修正 CLAUDE.md 对齐后通过）
