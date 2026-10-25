# Tasks: restructure-artifact-schemas

<!--
  本变更为 OpenSpec 工作流/schema 元变更（零运行时代码），DDD 实施分组 1-7 不适用；
  工作流资产（schema/模板/脚本）更新归入第 8 组，验证归入第 9 组，归档动作见 Workflow follow-up。
-->

## 1. 数据库迁移
- [x] 1.1 无数据库变更（N/A）— 本变更不涉及表/字段/Flyway 迁移

## 2. 领域层 (domain/)
- [x] 2.1 无领域层变更（N/A）— 本变更不触碰后端 Java 源码

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 无基础设施层变更（N/A）— 仅 `scripts/` 工具链与 `openspec/` 工作流资产

## 4. 应用层 (application/)
- [x] 4.1 无应用层变更（N/A）

## 5. API 层 (api/)
- [x] 5.1 无 API 层变更（N/A）

## 6. 契约同步
- [x] 6.1 无契约变更（N/A）— `specs/openapi.yaml` 与 SDK 均不涉及，无需重新生成

## 7. 前端 (frontend/src/)
- [x] 7.1 无前端/小程序变更（N/A）

## 8. 文档与工作流资产同步
<!-- 逐项评估：未触及的文档类别也必须写明"现有描述已核对仍准确"，不得仅以"无新增"标记 N/A -->
- [x] 8.1 `docs/frontend/component-catalog.md` — 未触及组件/目录（现有描述已核对仍准确）
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型（现有描述已核对仍准确）
- [x] 8.3 `docs/api/overview.md` — 未触及端点/契约（现有描述已核对仍准确）
- [x] 8.4 `docs/architecture.md` + `AGENTS.md` — 均已更新：三档 schema 选择规则、CI 九检（含第 9 检）、test-plan 双模式、机制层 `.agents/skills` 现状、`specs-count` 计数（归档后 70）
- [x] 8.5 `README.md` — 核对（现有描述已核对仍准确，无 schema/CLI 相关条目需改）
- [x] 8.6 新增 `openspec/schemas/spec-driven-custom-standard/`（schema.yaml + proposal/spec/design/tasks 模板），工件链 proposal → specs → design → tasks；`openspec schema validate` 通过
- [x] 8.7 更新 `spec-driven-custom` 与 `spec-driven-custom-lite` 的 schema instruction 与模板：test-plan 双模式、specs 场景质量规则、delta 禁 `## Test Coverage`、design Review Checklist、tasks 组内测试 + `## Workflow follow-up`
- [x] 8.8 新增 `scripts/sync-schema-templates.mjs`（`--check`/`--write`），共享模板（proposal/spec → 三档，design → standard）单源机械化
- [x] 8.9 `openspec/config.yaml` 默认 schema 改为 `spec-driven-custom-standard`
- [x] 8.10 `scripts/openspec-check.mjs` 新增第 9 检「模板单源同步」（子进程调用 sync 脚本 `--check`），头部注释改为九类检查并接入主流程
- [x] 8.11 主 spec delta：`openspec-conventions`（三档选择规则 + 九检 + 归档门禁组别）、`spec-driven-custom`（双模式/范围/同步）、`spec-driven-custom-lite`（默认值/范围/模板同步）、新增 `spec-driven-custom-standard` 能力；custom spec Purpose 直接编辑
- [x] 8.12 运行 `node scripts/docs-check.mjs` 与 `pnpm run openspec:check` — 通过（docs-check 归档前按 69 口径，归档后更新为 70 并复跑，见 4.x 留痕）

## 9. 全量验证
- [x] 9.1 `pnpm exec openspec schema validate` 三档 schema（custom / standard / lite）全部通过 — ✅ 3/3 valid
- [x] 9.2 `node scripts/sync-schema-templates.mjs --check` 通过 — ✅ "模板单源一致（3 共享模板 → 5 目标）"
- [x] 9.3 指令冒烟：`openspec instructions tasks --change restructure-artifact-schemas --schema spec-driven-custom-standard` 输出 1/2/3 三组 + `## Workflow follow-up`；`openspec instructions test-plan --change restructure-artifact-schemas` 输出模式 A/B 双模式 — ✅ 冒烟通过
- [x] 9.4 `openspec validate --all --strict --no-interactive` — ✅ 70/70（69 主 spec + 本变更）
- [x] 9.5 `openspec validate --archived --no-interactive` — ✅ 72/72
- [x] 9.6 `pnpm run openspec:check` — ✅ 九项检查全绿；`node scripts/openspec-check.mjs --self-test` 通过
- [x] 9.7 无源码变更，`mvn test` / `pnpm run verify` / E2E 跳过（等效依据：仅 schema/模板/脚本/文档，门禁由 openspec-validation + version-check job 覆盖）
- [x] 9.8 Smoke test — 本变更无 UI/用户流程影响（N/A）

## Workflow follow-up
<!-- 以下不属于 checkbox 任务；归档前必须逐条完成 -->
- `/opsx:verify` — 本变更零源码变更，可用全量验证组套件等效替代，归档条目注明依据
- `/opsx:archive` — 归档并同步 delta specs 到主 spec（含新建 `spec-driven-custom-standard` 能力）
- 归档后复跑 `pnpm run openspec:check`、`node scripts/docs-check.mjs`、`openspec validate --archived`
- 提交并推送到 `origin/main`
