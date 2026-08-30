# Tasks: verify-before-archive

<!--
  LITE 工作流（spec-driven-custom-lite）：1-4 固定分组，无 DDD 1-9 固定组。
  小规模/单模块变更用；若需架构级决策记录请改用 spec-driven-custom。
-->

## 1. 实施
<!-- 按文件/模块列出本次改动（含对应测试），粒度一次会话可完成，按依赖排序 -->
- [x] 1.1 主 spec 同步：将 delta `specs/openspec-conventions/spec.md` 的 ADDED Requirement「归档前验证门禁」经 sync-specs 落到 `openspec/specs/openspec-conventions/spec.md`（Requirements 末尾追加，含 3 个 Scenario；已存在能力，不带 Purpose）
- [x] 1.2 `openspec/schemas/spec-driven-custom/schema.yaml` — tasks.instruction 补门禁一句：真实代码变更须含 `/opsx:verify` 任务；纯工具链/文档/元数据变更在第 9 组（全量验证）注明等效依据
- [x] 1.3 `openspec/schemas/spec-driven-custom-lite/schema.yaml` — tasks.instruction 同步同一门禁语义（编排要点补一句：实施组含 `/opsx:verify` 任务；工具链变更验证组注明等效依据）
- [x] 1.4 `CLAUDE.md` — 工作流小节（Artifact 序列/CI 门禁附近）补"归档前验证门禁"一句

## 2. 文档同步
<!-- 逐项评估：未触及的文档类别也必须写明"现有描述已核对仍准确"，不得仅以"无新增"标记 N/A -->
- [x] 2.1 `docs/frontend/component-catalog.md` — 涉及组件/目录（新增**或修改**）？→ 未触及，现有描述已核对仍准确
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 涉及表/字段/领域模型（新增**或修改**）？→ 未触及，现有描述已核对仍准确
- [x] 2.3 `docs/api/overview.md` — 涉及端点/契约（新增**或修改**）？→ 未触及，现有描述已核对仍准确
- [x] 2.4 `docs/architecture.md` + `CLAUDE.md` — 涉及架构/模块/版本/测试规模/OpenSpec 流程？→ CLAUDE.md 已在 1.4 更新（流程门禁）；architecture.md 未触及（CI 描述不含流程门禁层面），现有描述已核对仍准确
- [x] 2.5 `README.md` — 涉及版本/功能清单？→ 未触及（CI 四道门禁描述仍准确，本门禁为流程门禁非 CI 门禁），现有描述已核对仍准确
- [x] 2.6 运行 `node scripts/docs-check.mjs` + `./scripts/sync-version.sh --check` — 文档一致性检查通过（EXIT=0）
- [x] 2.7（CI/工具链类变更）运行 `pnpm run openspec:check` — OpenSpec 一致性检查通过（EXIT=0，5 门禁全绿：主 specs 68、活动变更、delta 头守卫 0 命中、CLI 版本、validate --archived）

## 3. 全量验证
<!-- 按变更面取用：前端 pnpm run verify / 后端 mvn test / openspec validate --specs --strict / E2E 评估 -->
- [x] 3.1 `openspec validate --all --strict` — 主 specs + 活动变更严格校验通过（EXIT=0，69/69：68 specs + verify-before-archive；新 Requirement 无 Purpose、3 个 Scenario WHEN/THEN 完整）
- [x] 3.2 后端 `mvn test` / 前端 `pnpm run verify` — 零源码变更：无回归面，跳过结论（本变更不触碰 `backend/`、`frontend/src/`、`apps/miniprogram/` 源码；变更面审计 = openspec/ + CLAUDE.md）
- [x] 3.3 E2E — 无 UI 变更，跳过结论

## 4. 归档
- [x] 4.1 归档留痕：✓ 已存档至 `openspec/changes/archive/2026-08-30-verify-before-archive/`；delta 已在 apply 阶段同步至 `openspec/specs/openspec-conventions/spec.md`（Requirement「归档前验证门禁」+ 3 Scenarios，归档前复核 delta↔主 spec 需求块逐行相等）；归档后复跑 `validate --archived`（首跑因 4.1 未勾 14/15 拦截 → 补齐后 64/64 全绿）+ `pnpm run openspec:check` ✓ 五门禁全绿 + `pnpm run docs:check` ✓ EXIT=0（specs-count 68 不变）+ sync-version ✓；**等效依据：零代码变更（变更面 = openspec/ + CLAUDE.md），全量验证组套件（validate --all --strict 69/69 + openspec:check + docs-check）+ validate --archived 全绿——本变更即「工具链变更等效替代」Scenarios 实例**
