# Tasks: test-plan-ledger

## 1. 实施
- [x] 1.1 `openspec/schemas/spec-driven-custom/schema.yaml` — 在 design 与 tasks 之间新增 `test-plan` 工件（id/generates `test-plan.md`/template `test-plan.md`/instruction：场景映射 6 列表、初始 🔴、apply 翻绿、spec 漂移即停改 spec 重审再继续；requires: [specs, design]）
- [x] 1.2 `openspec/schemas/spec-driven-custom/schema.yaml` — `tasks.requires` 增加 `test-plan`（变为 `[specs, design, test-plan]`）；`apply.requires` 保持不变
- [x] 1.3 新建 `openspec/schemas/spec-driven-custom/templates/test-plan.md` — 6 列表格模板（Requirement | Scenario | Test File | Test Name | Initial State | Coverage Notes）+ 使用说明注释
- [x] 1.4 `scripts/openspec-check.mjs` — 增加 `checkTestPlanContent()`：活动变更存在 test-plan.md 时校验 delta 场景逐条对应（Requirement/Scenario 引用一致）；归档变更含 test-plan.md 时校验无残留 `🔴`；接入主检查流程，header 注释"五类检查"→"六类检查"，--self-test 补用例
- [x] 1.5 `openspec schema validate spec-driven-custom` 通过 + 冒烟（临时变更 `openspec new change smoke-test-plan --schema spec-driven-custom` 后 `openspec status` 显示 5 工件含 test-plan，随后删除临时变更目录）

## 2. 文档同步
- [x] 2.1 `docs/frontend/component-catalog.md` — 未触及；现有描述已核对仍准确（无 OpenSpec/工件提及，本变更不涉组件）
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及；现有描述已核对仍准确（无 OpenSpec/工件提及，本变更不涉库表）
- [x] 2.3 `docs/api/overview.md` — 未触及；现有描述已核对仍准确（无 OpenSpec/工件提及，本变更不涉端点）
- [x] 2.4 `docs/architecture.md` + `CLAUDE.md` — 触及并更新：CLAUDE.md artifact 序列（proposal → specs → design → test-plan → tasks）、/opsx:continue 行、变更目录说明、CI 门禁（六检查含 test-plan 内容门禁）、新增 test-plan 工件 bullet、提交前验证 CI 门禁清单；architecture.md CI 行更新。`specs-count` marker 保持 68（apply 阶段主 spec 未出现，docs-check 已通过；归档 sync 后改为 69）
- [x] 2.5 `README.md` — 触及并更新：CI 门禁 openspec-validation 括号补 "+ test-plan 内容门禁"
- [x] 2.6 运行 `node scripts/docs-check.mjs` + 版本同步等效检查（`./scripts/sync-version.sh --check` 因本机无 WSL/bash 不可用，已用等效提取复验：openapi/pom/package 均为 3.5.1，SYNC_OK=True）— 文档一致性检查通过
- [x] 2.7 运行 `pnpm run openspec:check` — OpenSpec 一致性检查通过（六检查全绿；新增 test-plan 归档检查 0/64 含 test-plan、无残留 🔴）

## 3. 全量验证
- [x] 3.1 `openspec validate --all --strict` + `openspec schema validate spec-driven-custom` + `spec-driven-custom-lite` — 主 specs/活动变更/schema 全部通过（69 项 0 失败）
- [x] 3.2 `pnpm run openspec:check` + `pnpm run docs:check` — 六检查全绿 + 文档一致性通过
- [x] 3.3 E2E — 无 UI 变更，跳过（结论：纯工具链/模板/文档，无 Web 用户流程受影响；未运行 test:e2e）

## 4. 归档
- [x] 4.1 归档留痕 — **sync 结论**：主 specs 已同步——新增 `openspec/specs/spec-driven-custom/spec.md`（Purpose 由 delta 种子），`openspec-conventions/spec.md` R5 替换为六检查版本（含 test-plan 内容门禁 + 新拦截场景）；两 delta 与主 spec 需求块字节一致（SPEC1_SAME=True / SPEC2_SAME=True）；无 REMOVED/RENAMED，无能力 retire。**归档后复跑**：`openspec validate --all --strict` 71 项 0 失败、`pnpm run docs:check` 全绿（specs-count marker 已更新为 69）、`pnpm run openspec:check` 六检查全绿（含 validate --archived）。**等效依据**：零源码行为变化（纯 schema/模板/CI 脚本/文档变更），按归档前验证门禁以 tasks 全量验证组套件（3.1/3.2）+ `validate --archived` 等效替代；另附 `/opsx:verify` 报告（无 CRITICAL，1 项 WARNING 即本留痕）
