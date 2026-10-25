# Tasks: converge-instruction-layers

<!--
  STANDARD 工作流（spec-driven-custom-standard）：1 实施 → 2 文档同步 → 3 全量验证，共三组。
  本变更为指令层配置收敛（零运行时代码），实施按 design.md 的 Decision 顺序排列。
  第 3 组后的 Workflow follow-up 为纯 bullet，不是 checkbox 任务。
-->

## 1. 实施
- [x] 1.1 重写 `openspec/config.yaml`：context 压到 ≤20 行/≤1200 字符（项目级事实 + 指针）；rules 19 → 4 条；新增 `operations.apply.guidance` 与 `archive.guidance` —— ✅ 实测 context 5 行/321 字符、rules 4 条、apply/archive guidance 2/3 条；`openspec instructions proposal` 注入正常
- [x] 1.2 三档 schema `apply.instruction` 指针化：apply 纪律唯一来源 = `config.yaml` operations guidance（custom/standard/lite 同步）—— ✅ 三档 `openspec schema validate` 通过；`openspec instructions apply` 输出指针 + Operation Guidance
- [x] 1.3 `scripts/openspec-check.mjs` 新增第 10 检「指令配置预算」（context ≤20 行/≤1200 字符、rules ≤8、operations.apply/archive guidance 非空），头部注释改十类检查，`parseConfigBudget` 纯函数 + `--self-test` 正负例 —— ✅ self-test 通过，第 10 检输出"context 5 行/321 字符，rules 4 条，apply/archive guidance 2/3 条"
- [x] 1.4 `AGENTS.md` 更新：指令层说明补 operations guidance、CI 门禁九项→十项、新增「归档时机（多人/PR 流）」、升级 SOP 补 `openspec version --check` 与 `update --dry-run` —— ✅ 完成；`docs/architecture.md` 同步十检与配置三层职责
- [x] 1.5 `openspec instructions apply --change converge-instruction-layers` 与 `openspec instructions archive --change converge-instruction-layers` 冒烟：均输出 "Operation Guidance (advisory)" 且内容为本次写入的纪律 —— ✅ 两者均输出，apply 纪律 2 条 / archive 纪律 3 条
- [x] 1.6 修正 lite specs instruction 旧档位指引（→ `spec-driven-custom-standard`）；将 custom/standard schema 内嵌 tasks 示例与 `templates/tasks.md` 对齐（双源一致），三档 `openspec schema validate` 通过 —— ✅ 完成（lite 提示已改；两档内嵌示例由模板正文重生成）

## 2. 文档同步
<!-- 逐项评估：未触及的文档类别也必须写明"现有描述已核对仍准确"，不得仅以"无新增"标记 N/A -->
- [x] 2.1 `docs/frontend/component-catalog.md` — 未触及组件/目录（现有描述已核对仍准确）
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型（现有描述已核对仍准确）
- [x] 2.3 `docs/api/overview.md` — 未触及端点/契约（现有描述已核对仍准确）
- [x] 2.4 `docs/architecture.md` + `AGENTS.md` — 均已更新（CI 十检、配置三层职责 context/rules/operations guidance、归档时机、升级 SOP）
- [x] 2.5 `README.md` — 核对（现有描述已核对仍准确，无 OpenSpec 配置条目）
- [x] 2.6 运行 `node scripts/docs-check.mjs` — ✅ 通过

## 3. 全量验证
- [x] 3.1 `pnpm exec openspec schema validate spec-driven-custom` / `...-standard` / `...-lite` — ✅ 3/3 valid
- [x] 3.2 `openspec validate --all --strict --no-interactive` — ✅ 通过（openspec-check 第 1 项复查）
- [x] 3.3 `openspec validate --archived --no-interactive` — ✅ 73/73 通过（归档后 74/74 复跑）
- [x] 3.4 `pnpm run openspec:check` — ✅ 十项检查全绿；`node scripts/openspec-check.mjs --self-test` 通过
- [x] 3.5 无源码变更，`mvn test` / `pnpm run verify` / E2E 跳过（等效依据：仅 config/schema instruction/脚本/文档；门禁由 openspec-validation + version-check job 覆盖）
- [x] 3.6 Smoke test — 本变更无 UI/用户流程影响（N/A）

## Workflow follow-up
<!-- 纯 bullet，不是 checkbox 任务：不参与 apply 进度统计，归档前按序执行并留痕 -->
- `/opsx:verify` — 本变更零源码变更，第 3 组全量验证组套件等效替代，归档条目注明依据
- `/opsx:archive` — 单人 main 流：验证完成后同提交/紧邻提交归档
- 归档后复跑门禁：`pnpm run openspec:check` + `openspec validate --archived` + `node scripts/docs-check.mjs`
