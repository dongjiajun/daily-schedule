# Doc Sync Workflow

## ADDED Requirements

### Requirement: tasks 模板双源同步维护
tasks 模板的任何修改 SHALL 同时落地两处：`openspec/schemas/spec-driven-custom/templates/tasks.md` 与 `openspec/schemas/spec-driven-custom/schema.yaml` 内嵌模板，保持内容一致，避免 `/opsx:ff` 与 `/opsx:continue` 生成结果分叉。

#### Scenario: 修改模板后两处一致
- **GIVEN** 修改 tasks 模板（如 smoke test 占位符调整）
- **WHEN** 检查 schema.yaml 中内嵌的对应段落
- **THEN** 两处文本一致，无遗漏

#### Scenario: 生成 tasks 时应用最新模板
- **WHEN** 开发者通过 `/opsx:propose` 或 `/opsx:ff` 创建新变更
- **THEN** 生成的 tasks.md §9.4 包含可替换的 smoke test 示例项（非空白注释框）
