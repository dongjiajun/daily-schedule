# Spec-Driven Custom Standard

## Purpose

定义中等变更工作流 `spec-driven-custom-standard`：工件链为 proposal → specs → design → tasks，承载需要 design 级方案决策但不需要红绿测试账本的中等变更，使流程仪式与变更风险匹配；proposal/spec/design 模板与 `spec-driven-custom` 单源同步，tasks 模板为自有精简编排。

## ADDED Requirements

### Requirement: 工件链为 proposal → specs → design → tasks
项目 SHALL 提供 `spec-driven-custom-standard` schema（`openspec/schemas/spec-driven-custom-standard/schema.yaml` 为权威）：artifact 链为 `proposal → specs → design → tasks`，**无 test-plan 工件**；`tasks` 依赖 `specs` 与 `design`；`apply.requires=[tasks]`；proposal 依赖为空、specs 依赖 proposal、design 依赖 proposal。

#### Scenario: standard 变更生成 4 工件
- **WHEN** 开发者以 `spec-driven-custom-standard` 创建新变更
- **THEN** `openspec status` 显示 proposal/specs/design/tasks 四个工件，design 位于 specs 与 tasks 之间

#### Scenario: 无 test-plan 工件
- **WHEN** 查看 standard 变更的工件链与 tasks 依赖
- **THEN** 不存在 test-plan 工件，tasks 仅依赖 specs 与 design；`openspec validate --all --strict` 不因缺 test-plan 报错

### Requirement: 模板单源与结构纪律
`spec-driven-custom-standard` 的 `templates/proposal.md`、`templates/spec.md`、`templates/design.md` SHALL 与 `spec-driven-custom` 对应模板逐字节一致，由 `scripts/sync-schema-templates.mjs` 机械同步（custom 为源，CI 第 9 检阻断漂移）；`templates/tasks.md` 为 standard 自有编排（分组：1 实施（按 design 决策顺序、分 DDD 层且各层自带测试）/ 2 文档同步 / 3 全量验证，末尾 `## Workflow follow-up` 纯 bullet 不勾选）。schema SHALL 通过 `openspec schema validate spec-driven-custom-standard`。

#### Scenario: custom 模板变更后 standard 同步
- **WHEN** 修改 `spec-driven-custom` 的 design 模板（如 Review Checklist 调整）
- **THEN** 运行 `node scripts/sync-schema-templates.mjs --write` 后 standard 的 design 模板逐字节一致，`--check` 与 `openspec-check` 第 9 检通过

#### Scenario: standard 模板冒烟
- **WHEN** standard schema 或 tasks 模板变更后运行 `openspec schema validate spec-driven-custom-standard` 并用 `openspec instructions tasks --schema spec-driven-custom-standard` 查看指令
- **THEN** 校验通过，指令含 1/2/3 三组与 `## Workflow follow-up`，且不含 test-plan 相关要求

### Requirement: 适用范围与档位选择
`spec-driven-custom-standard` SHALL 用于需要 design 级方案决策（跨层但无高风险迁移、外部依赖、安全/性能硬约束）且不需要红绿测试账本的中等变更；小规模/单模块/无架构决策变更 SHALL 使用 `spec-driven-custom-lite`；复杂/高风险变更（跨模块、新架构、外部依赖、安全/性能/迁移或需可审计场景↔验证账本）SHALL 使用 `spec-driven-custom`。

#### Scenario: 中等变更用 standard
- **WHEN** 变更需要 design 决策但无独立测试面或不需要场景↔测试账本
- **THEN** 使用 standard（proposal→specs→design→tasks），proposal 中说明选择理由

#### Scenario: 复杂变更不得用 standard
- **WHEN** 变更涉及高风险迁移/安全/性能或需要可审计的验证账本
- **THEN** 必须使用 `spec-driven-custom`（含 test-plan），standard 不足以承载验证留痕
