# Tasks: fix-mechanism-check-global-config

<!--
  LITE 工作流（spec-driven-custom-lite）：1/2/3 固定分组（实施 → 文档同步 → 全量验证）。
  本变更为 CI 门禁脚本修复（零运行时代码），第 3 组后的 Workflow follow-up 为纯 bullet。
-->

## 1. 实施
- [x] 1.1 `scripts/openspec-check.mjs` 第 8 检：新增纯函数 `repoMechanismChanges(changes)`，只保留项目内路径（排除 `~/` 前缀与绝对路径）；机制层漂移判定改用该过滤结果，项目外变更仅输出提示 —— ✅ 实现并在 fresh HOME 模拟下输出"忽略 1 项项目外变更"
- [x] 1.2 `--self-test` 增加 `repoMechanismChanges` 正负例（`~/`、绝对路径被排除；仓库相对路径保留）—— ✅ self-test 通过
- [x] 1.3 回退临时 CI 调试步骤：`.github/workflows/ci.yml` 的 `Validate OpenSpec consistency` 恢复为 `run: pnpm run openspec:check` —— ✅ 已恢复
- [x] 1.4 `AGENTS.md` CI 门禁说明同步：第 8 检口径为"项目内 `openspec update --dry-run` 无待变更" —— ✅ 已更新
- [x] 1.5 本地模拟全新环境验证：临时 `USERPROFILE`/`HOME`/`APPDATA` 下运行 `pnpm run openspec:check` —— ✅ 全绿（第 8 检不误报，仅信息提示忽略 1 项项目外变更）

## 2. 文档同步
- [x] 2.1 `docs/frontend/component-catalog.md` — 未触及组件/目录（现有描述已核对仍准确）
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型（现有描述已核对仍准确）
- [x] 2.3 `docs/api/overview.md` — 未触及端点/契约（现有描述已核对仍准确）
- [x] 2.4 `docs/architecture.md` + `AGENTS.md` — AGENTS.md 已更新（第 8 检口径）；`docs/architecture.md` 现有描述已核对仍准确（未列第 8 检细节）
- [x] 2.5 `README.md` — 核对（现有描述已核对仍准确）
- [x] 2.6 运行 `node scripts/docs-check.mjs` — ✅ 通过；`./scripts/sync-version.sh --check` 本地无 WSL 不可执行，由 CI version-check job 等效验证

## 3. 全量验证
- [x] 3.1 `openspec validate --all --strict --no-interactive` — ✅ 71/71（70 主 spec + 本变更）
- [x] 3.2 `openspec validate --archived --no-interactive` — ✅ 74/74 通过（归档后 75/75 复跑）
- [x] 3.3 `pnpm run openspec:check` — ✅ 十项检查全绿；`node scripts/openspec-check.mjs --self-test` 通过
- [x] 3.4 无源码变更，`mvn test` / `pnpm run verify` / E2E 跳过（等效依据：仅 CI/脚本/文档；门禁由 openspec-validation + version-check 覆盖）

## Workflow follow-up
<!-- 纯 bullet，不是 checkbox 任务：不参与 apply 进度统计，归档前按序执行并留痕 -->
- `/opsx:verify` — 零源码变更，第 3 组全量验证组套件等效替代，归档条目注明依据
- `/opsx:archive` — 单人 main 流：验证完成后同提交归档
- 归档后复跑门禁并确认下一次 CI run 的 OpenSpec Validation 转绿
