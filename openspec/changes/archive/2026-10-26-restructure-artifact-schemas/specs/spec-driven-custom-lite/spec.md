# Spec-Driven Custom Lite

## MODIFIED Requirements

### Requirement: 轻量 artifact 链（proposal → specs → tasks）
项目 SHALL 提供 `spec-driven-custom-lite` schema（`openspec/schemas/spec-driven-custom-lite/schema.yaml` 为权威）：artifact 链为 `proposal → specs → tasks`，**无 design 工件**；`tasks` 依赖 `proposal` 与 `specs`；`apply.requires=[tasks]`。使用方式为显式 opt-in：`openspec new change <name> --schema spec-driven-custom-lite`；`openspec/config.yaml` 的默认 `schema` SHALL 为 `spec-driven-custom-standard`（本档仅在显式选用时生效）。

#### Scenario: 小变更走 lite 链
- **WHEN** 开发者在项目根运行 `openspec new change <name> --schema spec-driven-custom-lite`
- **THEN** 变更以 lite schema 创建，`openspec status` 显示 proposal/specs/tasks 三个工件（无 design、无 test-plan），指令生成与 apply 序列按 lite 定义执行

#### Scenario: 默认 schema 不受影响
- **WHEN** 开发者不带 `--schema` 运行 `openspec new change <name>`
- **THEN** 变更以 `spec-driven-custom-standard`（默认）创建，链为 proposal → specs → design → tasks

### Requirement: 适用范围
`spec-driven-custom-lite` SHALL 用于小规模、单模块、无架构决策诉求的变更（不需要 design 级决策记录）；需要 design 级决策但不需要红绿测试账本的中等变更 SHALL 使用 `spec-driven-custom-standard`；跨模块/新架构模式/外部依赖/安全/性能/迁移复杂度或需可审计场景↔验证账本的变更 SHALL 使用 `spec-driven-custom`；无行为变化变更（纯重构/工具链/文档/热修）在任一 schema 下均 SHALL 设 `skip_specs: true`。

#### Scenario: 小行为变更用 lite
- **WHEN** 变更仅涉及单模块的小范围行为调整（无新架构/依赖/迁移）
- **THEN** 开发者可选用 lite schema 生成 proposal/specs/tasks，无需 design

#### Scenario: 中等变更用 standard
- **WHEN** 变更需要 design 级方案决策，但无独立测试面或不需红绿测试账本
- **THEN** 使用 `spec-driven-custom-standard`（proposal→specs→design→tasks），不强制 test-plan

#### Scenario: 复杂变更不得用 lite
- **WHEN** 变更涉及跨模块、新架构模式、外部依赖、安全/性能/迁移复杂度
- **THEN** 按规则必须用 `spec-driven-custom`（design + test-plan 承载架构/风险/迁移决策与验证账本），lite 不适用

#### Scenario: 工具链变更 skip_specs 通用
- **WHEN** 变更无行为变化（纯工具链/文档/热修），schema 为 lite
- **THEN** `.openspec.yaml` 设 `skip_specs: true`，`openspec validate` 对零 delta + skip_specs 放行（与 custom 同规则）

### Requirement: 模板单源化与同步纪律
`spec-driven-custom-lite` 的 `templates/proposal.md` 与 `templates/spec.md` SHALL 与 `spec-driven-custom` 同内容，由 `scripts/sync-schema-templates.mjs` 机械同步（custom 为源，CI 第 9 检阻断漂移）；`templates/tasks.md` 为 lite 自有精简版：分组 1 实施 / 2 文档同步 / 3 全量验证，末尾 `## Workflow follow-up` 纯 bullet 列出 verify/archive/归档后门禁复跑（不勾选），不继承 custom 的 DDD 1-9 分组。模板变更后 SHALL 运行 `node scripts/sync-schema-templates.mjs --check` 与 `openspec schema validate spec-driven-custom-lite`。

#### Scenario: custom 模板变更后 lite 同步
- **WHEN** 修改 `spec-driven-custom` 的 proposal 模板格式
- **THEN** 运行 `node scripts/sync-schema-templates.mjs --write` 后 `spec-driven-custom-lite` 的 proposal 模板逐字节一致，`--check` 与 `openspec-check` 第 9 检通过

#### Scenario: lite 冒烟验证
- **WHEN** lite 模板/schema 变更后运行 `openspec schema validate spec-driven-custom-lite` 并用 `openspec instructions tasks --schema spec-driven-custom-lite` 查看指令
- **THEN** 校验通过，指令含 1/2/3 三组与 `## Workflow follow-up`，不出现 DDD 1-9 固定组
