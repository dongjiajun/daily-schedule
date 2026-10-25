# Tasks: <!-- 变更名称 -->

<!--
  LITE 工作流（spec-driven-custom-lite）：1/2/3 固定分组（实施 → 文档同步 → 全量验证），
  文档同步保持在验证之前；第 3 组后的 Workflow follow-up 为纯 bullet，不是 checkbox 任务。
  小规模/单模块变更用；若需架构级决策记录请改用 spec-driven-custom-standard 或 spec-driven-custom。
-->

## 1. 实施
<!-- 按文件/模块列出本次改动（含对应测试），粒度一次会话可完成，按依赖排序 -->
- [ ] 1.1 <!-- 改动描述（文件/模块 + 行为） -->

## 2. 文档同步
<!-- 逐项评估：未触及的文档类别也必须写明"现有描述已核对仍准确"，不得仅以"无新增"标记 N/A -->
- [ ] 2.1 `docs/frontend/component-catalog.md` — 涉及组件/目录（新增**或修改**）？→ 更新；未触及 → 核对结论
- [ ] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 涉及表/字段/领域模型（新增**或修改**）？→ 更新；未触及 → 核对结论
- [ ] 2.3 `docs/api/overview.md` — 涉及端点/契约（新增**或修改**）？→ 更新；未触及 → 核对结论
- [ ] 2.4 `docs/architecture.md` + `AGENTS.md` — 涉及架构/模块/版本/测试规模/OpenSpec 流程？→ 更新；未触及 → 核对结论
- [ ] 2.5 `README.md` — 涉及版本/功能清单？→ 更新；未触及 → 核对结论
- [ ] 2.6 运行 `node scripts/docs-check.mjs` + `./scripts/sync-version.sh --check` — 文档一致性检查通过
- [ ] 2.7（CI/工具链类变更）运行 `pnpm run openspec:check` — OpenSpec 一致性检查通过

## 3. 全量验证
<!-- 按变更面取用：前端 pnpm run verify / 后端 mvn test / openspec validate --specs --strict / E2E 评估 -->
- [ ] 3.1 <!-- 适用的验证命令（如 cd frontend && pnpm run verify） -->
- [ ] 3.2 <!-- 适用的验证命令（如 cd backend && mvn test） -->
- [ ] 3.3 E2E — 涉及 Web 用户流程时评估执行；无 UI 变更写明跳过结论

## Workflow follow-up
<!-- 纯 bullet，不是 checkbox 任务：不参与 apply 进度统计，归档前按序执行并留痕 -->
- `/opsx:verify` — 代码变更必备（真实代码变更须报告无 CRITICAL；纯工具链/文档变更按第 3 组等效依据说明）
- `/opsx:archive` — 归档已完成的变更
- 归档后复跑门禁：`pnpm run openspec:check` + `openspec validate --archived`

<!-- 删除本模板注释示例行，逐项替换为实际内容 -->
