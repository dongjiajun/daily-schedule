# Spec-Driven Custom Lite

## Purpose

定义项目轻量工作流 `spec-driven-custom-lite` 的约定：小规模变更可选用 `proposal → specs → tasks`（无 design 工件）的 artifact 链，模板与 `spec-driven-custom` 单源同步，为小变更降低流程负担而不牺牲留痕与验证纪律。

## Requirements
### Requirement: 轻量 artifact 链（proposal → specs → tasks）
项目 SHALL 提供 `spec-driven-custom-lite` schema（`openspec/schemas/spec-driven-custom-lite/schema.yaml` 为权威）：artifact 链为 `proposal → specs → tasks`，**无 design 工件**；`tasks` 依赖 `proposal` 与 `specs`；`apply.requires=[tasks]`。使用方式为按变更 opt-in：`openspec new change <name> --schema spec-driven-custom-lite`；`openspec/config.yaml` 的默认 `schema` SHALL 保持 `spec-driven-custom` 不变。

#### Scenario: 小变更走 lite 链
- **WHEN** 开发者在项目根运行 `openspec new change <name> --schema spec-driven-custom-lite`
- **THEN** 变更以 lite schema 创建，`openspec status` 显示 proposal/specs/tasks 三个工件（无 design），指令生成与 apply 序列按 lite 定义执行

#### Scenario: 默认 schema 不受影响
- **WHEN** 开发者不带 `--schema` 运行 `openspec new change <name>`
- **THEN** 变更仍以 `spec-driven-custom`（默认）创建，完整链 proposal → specs → design → tasks

### Requirement: 适用范围
`spec-driven-custom-lite` SHALL 用于小规模、单模块、无架构决策诉求的变更（不需要 design 级决策记录）；跨模块/新架构模式/外部依赖/安全/性能/迁移复杂度变更 SHALL 使用 `spec-driven-custom`；无行为变化变更（纯重构/工具链/文档/热修）在两个 schema 下均 SHALL 设 `skip_specs: true`。

#### Scenario: 小行为变更用 lite
- **WHEN** 变更仅涉及单模块的小范围行为调整（无新架构/依赖/迁移）
- **THEN** 开发者可选用 lite schema 生成 proposal/specs/tasks，无需 design

#### Scenario: 复杂变更不得用 lite
- **WHEN** 变更涉及跨模块、新架构模式、外部依赖、安全/性能/迁移复杂度
- **THEN** 按规则必须用 `spec-driven-custom`（design 工件承载架构/风险/迁移决策），lite 不适用

#### Scenario: 工具链变更 skip_specs 通用
- **WHEN** 变更无行为变化（纯工具链/文档/热修），schema 为 lite
- **THEN** `.openspec.yaml` 设 `skip_specs: true`，`openspec validate` 对零 delta + skip_specs 放行（与 custom 同规则）

### Requirement: 模板单源化与同步纪律
`spec-driven-custom-lite` 的 `templates/proposal.md` 与 `templates/spec.md` SHALL 与 `spec-driven-custom` 同内容；修改任一 custom 模板 SHALL 同步 lite 对应模板（反之亦然），修改以 custom 为先、lite 复制为准；`templates/tasks.md` 为 lite 自有精简版（分组：1 实施 / 2 文档同步 / 3 全量验证 / 4 归档），不继承 custom 的 DDD 1-9 分组。任何模板变更后 SHALL 运行 `openspec schema validate spec-driven-custom-lite` 并通过冒烟（`openspec status` 指令含新结构）。

#### Scenario: custom 模板变更后 lite 同步
- **WHEN** 修改 `spec-driven-custom` 的 proposal 模板格式
- **THEN** `spec-driven-custom-lite` 的 proposal 模板同步为相同内容，`openspec schema validate` 通过

#### Scenario: lite 冒烟验证
- **WHEN** lite 模板/schema 变更后运行 `openspec schema validate spec-driven-custom-lite` 并在临时根用 `--schema` 新建变更
- **THEN** 校验通过且 status 显示 3 工件（无 design），指令含 lite tasks 精简分组
