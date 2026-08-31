# Spec-Driven Custom

## Purpose
定义项目主工作流 schema（spec-driven-custom）的工件链与测试映射纪律：custom 链为 proposal → specs → design → test-plan → tasks；test-plan 工件将每个 spec 场景映射到命名测试并以红绿翻转跟踪，使复杂变更的测试边界可追踪、可机械门禁。

## ADDED Requirements

### Requirement: 工件链包含 test-plan 工件
项目主工作流 schema（`openspec/schemas/spec-driven-custom/schema.yaml` 为权威）SHALL 定义工件链 `proposal → specs → design → test-plan → tasks`：`test-plan` 工件 SHALL 生成 `test-plan.md`，位于 design 之后、tasks 之前；`tasks` 工件的依赖 SHALL 包含 test-plan（`[specs, design, test-plan]`）；`apply.requires` SHALL 保持 `[tasks]` 不变。

#### Scenario: custom 变更生成 5 工件
- **WHEN** 开发者以 `spec-driven-custom` 创建新变更
- **THEN** `openspec status` 显示 proposal/specs/design/test-plan/tasks 五个工件，test-plan 位于 design 与 tasks 之间

#### Scenario: test-plan 缺失时 tasks 受阻
- **WHEN** custom 变更未生成 test-plan.md
- **THEN** `openspec status` 中 tasks 处于 blocked（缺少依赖 test-plan），`openspec validate --all --strict` 报工件不完整

### Requirement: test-plan 内容契约（场景映射活账本）
`test-plan.md` SHALL 以表格记录测试映射：列 SHALL 为 `Requirement | Scenario | Test File | Test Name | Initial State | Coverage Notes`；delta specs 中每个 `#### Scenario:` SHALL 在 test-plan 中有一行对应（Requirement/Scenario 引用一致）；未实现场景的 `Initial State` SHALL 记 `🔴`，实现并通过验证后 SHALL 改写为 `🟢`；无独立测试面的场景（纯配置/手工验证）SHALL 在 `Coverage Notes` 注明理由。

#### Scenario: 场景全覆盖
- **WHEN** custom 变更的 delta specs 含若干 `#### Scenario:`
- **THEN** test-plan.md 逐条存在对应行且 Requirement/Scenario 引用一致，无遗漏场景

#### Scenario: 初始红与翻绿
- **WHEN** 变更处于 apply 前或实现中某场景尚未完成
- **THEN** 该行 `Initial State` 为 `🔴`
- **WHEN** 场景已实现且对应测试通过
- **THEN** 该行 `Initial State` 改写为 `🟢`

#### Scenario: 无测试面场景留痕
- **WHEN** 某场景仅可手工验证（如浏览器 smoke、配置核对）
- **THEN** test-plan 对应行存在，`Coverage Notes` 写明"手工验证"及理由，不虚标测试文件/名称

### Requirement: 红绿纪律与 spec 漂移停流
apply 阶段 SHALL 对每个场景先写或改对应测试（红）再实现至通过（绿），逐步翻账本；spec 发生漂移（需求变更）时 SHALL 停止实施、修改 delta spec、重审 test-plan 并更新后继续，不得带病推进。

#### Scenario: 先红后绿
- **WHEN** 实现某个场景
- **THEN** 先有对应测试失败（🔴）再实现通过（🟢），账本行同步翻转

#### Scenario: spec 漂移即停
- **WHEN** apply 过程中需求发生变更（spec 与实现不一致）
- **THEN** 实施暂停；先更新 delta spec 与 test-plan 行，重审后继续，test-plan 与 spec 始终一致

### Requirement: 范围与模板同步纪律
`test-plan` 工件 SHALL 仅存在于 `spec-driven-custom`（复杂变更，需 design 级决策）；`spec-driven-custom-lite` SHALL NOT 包含该工件（小变更多无独立测试面）；两 schema 共享模板（proposal/spec）的单源同步纪律 SHALL 维持不变（custom 为先），`test-plan` 模板为 custom 自有，不参与同步。

#### Scenario: lite 变更无 test-plan
- **WHEN** 开发者以 `spec-driven-custom-lite` 创建新变更
- **THEN** `openspec status` 显示 proposal/specs/tasks 三个工件，无 test-plan 工件

#### Scenario: custom 模板变更后 lite 同步
- **WHEN** 修改 `spec-driven-custom` 的 proposal 或 spec 模板
- **THEN** `spec-driven-custom-lite` 对应模板同步为相同内容；`test-plan` 模板不涉及同步
