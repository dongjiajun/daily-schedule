# Doc Sync Workflow

## ADDED Requirements

### Requirement: Tasks 模板强制包含文档同步阶段
`openspec/schemas/spec-driven-custom/templates/tasks.md` SHALL 包含独立的"文档同步"阶段（非可选收尾），在契约同步之后、验证之前。

#### Scenario: 新变更生成 tasks 时自动包含文档检查
- **WHEN** 开发者通过 `/opsx:propose` 或 `/opsx:ff` 创建新变更
- **THEN** 生成的 tasks.md 包含"文档同步"阶段，列出需检查的文档文件

### Requirement: Config rules 声明文档检查规则
`openspec/config.yaml` 的 `rules.tasks` SHALL 包含三条文档检查规则：新组件→component-catalog.md、新实体/表→schema.md、新端点→overview.md。

#### Scenario: AI 在 task 生成阶段收到规则约束
- **WHEN** AI 读取 config.yaml 的 rules.tasks 约束
- **THEN** AI 在生成 tasks 时自动将对应的文档检查项写入任务列表

### Requirement: CLAUDE.md 提交前验证包含文档检查
CLAUDE.md 的"提交前验证"章节 SHALL 要求提交前检查 `docs/` 下文档是否需要同步更新。

#### Scenario: 开发者提交前执行完整验证
- **WHEN** 开发者在提交前阅读 CLAUDE.md 验证清单
- **THEN** 清单明确提示"检查 docs/ 目录文档是否需要同步"

### Requirement: docs/ 三份文档更新至 v3.1 实际状态
- `docs/frontend/component-catalog.md` SHALL 反映当前组件树（含 useTheme、themes.css、colors.ts、主题状态）
- `docs/architecture.md` 测试矩阵 SHALL 更新为 17 类/134 用例
- `docs/uml/README.md` SHALL 更新 User（v3.0 字段）、Event（status 字段）

#### Scenario: 新成员阅读 docs/ 获得准确的项目理解
- **WHEN** 新成员按顺序阅读 docs/ 下文档
- **THEN** 组件树、测试矩阵、领域模型均与实际代码一致
