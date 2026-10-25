# Spec-Driven Custom

## MODIFIED Requirements

### Requirement: test-plan 内容契约（场景映射活账本）
`test-plan.md` SHALL 以表格记录测试映射，列 SHALL 为 `Requirement | Scenario | Test File / 验证项 | Test Name / 验证命令 | Initial State | Coverage Notes`；delta specs 中每个 `#### Scenario:` SHALL 在 test-plan 中有一行对应（Requirement/Scenario 引用一致，前两列固定以兼容 CI 解析）。支持两种模式：**模式 A（有测试面）** 将场景映射到命名测试，未实现记 `🔴`、实现且测试通过后改 `🟢`；**模式 B（无测试面：工具链/文档/配置/CI 脚本）** 将场景映射到等价机械验证项（验证命令或 CI 检查名），同样 🔴→🟢 翻转，并在 Coverage Notes 注明"等价机械验证"及理由，禁止虚标测试文件/名称。

#### Scenario: 场景全覆盖
- **WHEN** custom 变更的 delta specs 含若干 `#### Scenario:`
- **THEN** test-plan.md 逐条存在对应行且 Requirement/Scenario 引用一致，无遗漏场景（模式 A/B 均适用）

#### Scenario: 初始红与翻绿
- **WHEN** 变更处于 apply 前或实现中某场景尚未完成
- **THEN** 该行 `Initial State` 为 `🔴`
- **WHEN** 场景已实现且对应测试/机械验证通过
- **THEN** 该行 `Initial State` 改写为 `🟢`

#### Scenario: 无测试面场景留痕
- **WHEN** 某场景仅可手工验证（如浏览器 smoke、配置核对）
- **THEN** test-plan 对应行存在，`Coverage Notes` 写明"手工验证"及理由，不虚标测试文件/名称

#### Scenario: 无测试面变更使用机械验证模式
- **WHEN** custom 变更整体无独立测试面（纯工具链/文档/schema/CI 脚本）
- **THEN** test-plan 采用模式 B：每行填等价机械验证项与验证命令，Coverage Notes 注明理由，归档前全部翻 `🟢`，`openspec-check` 第 6 检照常通过

### Requirement: 红绿纪律与 spec 漂移停流
apply 阶段 SHALL 对每个场景先使对应验证失败（模式 A 为测试失败，模式 B 为机械验证未通过）再实现至通过，逐步翻账本；spec 发生漂移（需求变更）时 SHALL 停止实施、修改 delta spec、重审 test-plan 并更新后继续，不得带病推进。

#### Scenario: 先红后绿
- **WHEN** 实现某个场景
- **THEN** 先有对应测试失败（模式 A）或机械验证未通过（模式 B）记录为 `🔴`，再实现/修复至通过翻 `🟢`，账本行同步翻转

#### Scenario: spec 漂移即停
- **WHEN** apply 过程中需求发生变更（spec 与实现不一致）
- **THEN** 实施暂停；先更新 delta spec 与 test-plan 行，重审后继续，test-plan 与 spec 始终一致

### Requirement: 范围与模板同步纪律
`test-plan` 工件 SHALL 仅存在于 `spec-driven-custom`（复杂/高风险变更，模板含双模式）；`spec-driven-custom-standard` 与 `spec-driven-custom-lite` SHALL NOT 包含该工件。三档共享模板（proposal/spec → 三档，design → custom 与 standard）SHALL 由 `scripts/sync-schema-templates.mjs` 机械同步（custom 为源，`--write` 复制、`--check` 校验），漂移由 `openspec-check` 第 9 检阻断；`test-plan`/`tasks` 模板为各档自有，不参与同步。

#### Scenario: lite 变更无 test-plan
- **WHEN** 开发者以 `spec-driven-custom-lite` 创建新变更
- **THEN** `openspec status` 显示 proposal/specs/tasks 三个工件，无 test-plan 工件

#### Scenario: standard 变更无 test-plan
- **WHEN** 开发者以 `spec-driven-custom-standard` 创建新变更
- **THEN** `openspec status` 显示 proposal/specs/design/tasks 四个工件，无 test-plan 工件

#### Scenario: custom 模板变更后 lite 同步
- **WHEN** 修改 `spec-driven-custom` 的 proposal/spec/design 模板
- **THEN** 运行 `node scripts/sync-schema-templates.mjs --write` 后 standard/lite 对应模板逐字节一致，`--check` 与 `openspec-check` 第 9 检通过；`test-plan` 模板不参与同步
