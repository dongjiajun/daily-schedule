# Tasks: instructions-convergence

<!--
  LITE 工作流（spec-driven-custom-lite）：1-4 固定分组，无 DDD 1-9 固定组。
  小规模/单模块变更用；若需架构级决策记录请改用 spec-driven-custom。
-->

## 1. 实施

- [x] 1.1 动态指令层透传验证（临时 custom 变更，不留痕）：`openspec new change probe-instructions --schema spec-driven-custom` → `status --json` 确认 5 工件链（proposal → specs → design → test-plan → tasks）→ 对每个工件（含 test-plan/design + apply/archive）运行 `openspec instructions <artifact> --change probe-instructions`，确认输出含 schema instruction 字段（test-plan 指令来自 schema.yaml）与 config.yaml context/rules 透传 → 记录验证矩阵结论 → 删除临时变更目录

  > 验证矩阵结论：status --json 工件链 = proposal/specs/design/test-plan/tasks（5 工件，test-plan 位于 design 后 tasks 前，与非 custom 内建 spec-driven 的 4 工件不同）；`openspec instructions test-plan` 输出含 schema.yaml instruction 字段（6 列表 / 🔴→🟢 / 漂移停流）+ test-plan.md 模板 + `unlocks: tasks`；proposal 指令注入 config.yaml context（项目概要/DDD 四层/API 契约）与 rules（skip_specs、契约影响等）；apply/archive 指令正常生成（apply 对无工件变更正确报 blocked: Missing artifacts）。全流程零 .dsh/.claude 改动——机制层未触碰即完成指令透传。临时变更已删除。
- [x] 1.2 `scripts/openspec-check.mjs` — 新增第 7 检 `checkClaudeSequence()`：解析 CLAUDE.md「Artifact 序列」声明（`proposal → specs → design → test-plan → tasks`），与 `openspec/schemas/spec-driven-custom/schema.yaml` artifacts 链核对，漂移（缺/多/乱序）→ FAILURES 输出 CLAUDE.md 声明 vs schema 链差异；文件头"六类检查"→"七类检查"；`--self-test` 增加解析器正/负例
- [x] 1.3 `CLAUDE.md` — 工作流节收敛：新增「指令体系分层」小节（机制层=`.dsh`/`.claude` 由 `openspec update` 随 CLI 升级重生成、禁止手改、schema 变更不触发；指令层=`openspec instructions <artifact>` 为工件撰写指引唯一动态来源；文档层=本文件仅承载流水线/门禁/验证/文档同步约定）；工件序列声明与 schema 链保持一致（第 7 检读取）；各工件格式描述移除重复、改为指向 `openspec instructions <artifact>`
- [x] 1.4 `docs/architecture.md` + `README.md` — CI 门禁描述补「CLAUDE.md 序列一致性守卫」（openspec-validation 内）；`docs/architecture.md` 文档段补一句「指令体系分层」定位说明（机制层/指令层/文档层，详见 openspec-conventions 主 spec）

## 2. 文档同步

- [x] 2.1 `docs/frontend/component-catalog.md` — 未触及（无组件/目录新增或修改）：现有描述已核对仍准确
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及（无表/字段/领域模型变更）：现有描述已核对仍准确
- [x] 2.3 `docs/api/overview.md` — 未触及（无端点/契约变更）：现有描述已核对仍准确
- [x] 2.4 `docs/architecture.md` + `CLAUDE.md` — 本次变更直接更新（1.3/1.4）
- [x] 2.5 `README.md` — 本次变更直接更新（1.4 CI 门禁描述）
- [x] 2.6 运行 `node scripts/docs-check.mjs` + 版本同步检查（pwsh 等效 sync-version：openapi.yaml/pom.xml/package.json 三处一致）— 通过
- [x] 2.7（CI/工具链类变更）运行 `pnpm run openspec:check` — 七检全绿（含新第 7 检）

## 3. 全量验证

- [x] 3.1 `pnpm run openspec:check` + `openspec validate --all --strict --no-interactive` — 通过（活动变更 instructions-convergence 校验在内）
- [x] 3.2 `node scripts/docs-check.mjs` — 通过；**等效依据**：零代码变更（backend/frontend/miniprogram/packages 源码未触碰），纯工具链/文档/元数据变更以全量验证组套件 + `validate --archived` 等效替代 `/opsx:verify`
- [x] 3.3 E2E — 跳过结论：无 UI/用户流程变更

## 4. 归档

- [x] 4.1 归档留痕（sync 结论：delta↔主 spec 对齐；归档后复跑 validate/docs-check/openspec-check 结论；等效依据注明）

  > 归档留痕：**sync 结论**——delta（ADDED「指令体系分层与收敛」4 场景 + MODIFIED「CI 门禁执行 OpenSpec 一致性验证」第 7 检 + 新场景）已合并至主 spec `openspec/specs/openspec-conventions/spec.md`（需求 6 → 7 项，R5 检查清单 6 → 7 项，场景 11 → 13），主 spec 无 delta 头残留、与 delta 内容一致（UTF-8 复核 OK）。**等效依据**：零代码变更（backend/frontend/miniprogram/packages 源码未触碰），纯工具链/文档/元数据变更以全量验证组套件（openspec:check 七检 + docs-check + validate --archived）等效替代 `/opsx:verify`。**归档后复跑结论**：`openspec validate --archived` 67/67 全绿（含本归档）；`openspec:check` 七检全绿（第 7 检：CLAUDE.md 序列 = schema 链）；`docs-check` 全绿（specs-count 69 不变——本变更未新增能力目录）。
