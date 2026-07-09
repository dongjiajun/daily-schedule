# Proposal: 文档同步至 v3.1 并建立防退化机制

## Why

`docs/` 下三份文档落后于实际代码：component-catalog.md 缺少主题系统组件、architecture.md 测试矩阵数字过时、uml/README.md 实体字段不全。根源在于工作流中缺少文档同步的强制触发点——每次变更完成后文档检查被跳过了。

## What Changes

- 修复三份过时文档：component-catalog.md（补主题系统）、architecture.md（补测试矩阵）、uml/README.md（补 v3 字段）
- 更新 tasks 模板：将"文档同步"列为独立阶段，不做可选收尾
- 更新 config.yaml rules：add `tasks` 规则，声明各变更类型对应的文档检查项
- 更新 CLAUDE.md 提交前验证：增加"文档检查"步骤

## Capabilities

### New Capabilities
- `doc-sync-workflow`: OpenSpec 工作流内嵌文档同步强制检查机制，tasks 模板 + config rules 双保险

### Modified Capabilities
- 无

## API Contract Impact

无影响。

## DDD Layer Impact

无影响。纯文档 + OpenSpec 配置变更。

## Database Impact

无。无需 Flyway 迁移。

## Impact

- `docs/frontend/component-catalog.md`：补主题系统（useTheme、colors.ts、themes.css、theme 状态）
- `docs/architecture.md`：测试矩阵从 11 类/81 例更新为 17 类/134 例
- `docs/uml/README.md`：User 补 v3.0 字段、Event 补 status、补 EventFilter
- `openspec/schemas/spec-driven-custom/templates/tasks.md`：新增"文档同步"阶段
- `openspec/config.yaml`：tasks rules 新增文档检查声明
- `CLAUDE.md`：提交前验证增加文档检查
