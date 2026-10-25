# Proposal: converge-instruction-layers

## Why

`openspec/config.yaml` 当前 context ~50 行、rules 19 条，大量内容与 schema instruction/模板重复（同一规则多处编码，已多次出现"改了模板没同步 rules"的漂移风险）；apply/archive 的操作纪律仍写在 schema `apply.instruction`，尚未使用官方 1.15 的 `operations.apply.guidance` / `archive.guidance`（advisory，经 `openspec instructions apply/archive` 透传）；多人协作下归档时机也未成文（PR 流与单人 main 流未区分）。B1 已完成 schema/模板/工件链收敛，本变更收敛**指令层配置**：context 只留项目级事实、rules 只留未覆盖约束、操作纪律迁 operations guidance、归档时机成文，并新增第 10 检机械守护配置预算，防止再次膨胀。

## What Changes

- `openspec/config.yaml` 重写：context 由 ~50 行压到 ≤20 行（仅项目级事实 + 指针，≤1200 字符）；rules 由 19 条压到 **4 条**（仅 schema/模板未覆盖的约束：API 契约/迁移版本/档位理由/安全影响）；新增 `operations.apply.guidance` 与 `archive.guidance`（实现顺序与暂停纪律、verify 门禁、归档时机、归档后复跑）
- 三档 schema 的 `apply.instruction` 收敛为指针：apply 纪律唯一来源 = `config.yaml` 的 `operations.apply.guidance`（规避官方 apply skill 静态文案冲突，Issue #1893 面），`custom`/`standard`/`lite` 同步
- `scripts/openspec-check.mjs` 新增第 10 检「指令配置预算」：context ≤20 行且 ≤1200 字符、rules ≤8 条、`operations.apply/archive.guidance` 非空；`--self-test` 覆盖预算解析器
- `AGENTS.md`：指令层说明补 operations guidance；CI 门禁九项→十项；新增「归档时机（多人/PR 流）」；升级 SOP 增补 `openspec version --check` 与 `update --dry-run` 检查
- `docs/architecture.md`：CI 门禁说明补第 10 检与配置三层职责
- 主 spec delta（`openspec-conventions`）：context 精简口径、规范单源化扩展为 schema/rules/operations 三层配置职责、新增多人协作归档时机、CI 门禁九项→十项
- 修正 lite specs instruction 的旧档位指引（架构级决策记录应改用 `spec-driven-custom-standard`）；对齐 custom/standard schema 内嵌 tasks 示例与 `templates/tasks.md`（双源一致）
- 非 **BREAKING**（工作流/工具链，无 API 契约、无运行时代码变化）

## Capabilities

### New Capabilities

- 无（工具链/流程约定变更）

### Modified Capabilities

- `openspec-conventions`: 项目 context 精简口径；规范单源化扩展为"schema 权威 / rules 去重 / operations guidance"三层配置职责；新增多人协作归档时机；CI 门禁九项→十项（新增指令配置预算守卫）

## API Contract Impact

无影响——不修改 `specs/openapi.yaml`，不涉及任何端点/字段。

## DDD Layer Impact

无——不触碰后端 API/应用/领域/基础设施任一层。

## Database Impact

无需 Flyway 迁移，不涉及表/列。

## Impact

- 文件：`openspec/config.yaml`、`openspec/schemas/*/schema.yaml`（apply.instruction 指针化）、`scripts/openspec-check.mjs`（第 10 检）、`AGENTS.md`、`docs/architecture.md`、`openspec/specs/openspec-conventions/spec.md`（经 delta）
- 行为：artifact 指令注入的 context/rules 更短（每工件省 token 并降漂移）；apply/archive 纪律以 advisory guidance 呈现；配置膨胀被 CI 阻断
- 风险：rules 大幅精简后个别约束只存在于模板（已有机械/模板覆盖，验证时抽查 3 档指令）；config 格式错误会导致 CLI 读取失败（实施后立即冒烟）
- 回退：`git revert` 本变更；或仅回滚 `openspec/config.yaml` 到上一提交
