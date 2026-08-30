# Tasks: <!-- 变更名称 -->

<!--
  LITE 工作流（spec-driven-custom-lite）：1-4 固定分组，无 DDD 1-9 固定组。
  小规模/单模块变更用；若需架构级决策记录请改用 spec-driven-custom。
-->

## 1. 实施
<!-- 按文件/模块列出本次改动（含对应测试），粒度一次会话可完成，按依赖排序 -->
- [ ] 1.1 <!-- 改动描述（文件/模块 + 行为） -->

## 2. 文档同步
<!-- 逐项评估：未触及的文档类别也必须写明"现有描述已核对仍准确"，不得仅以"无新增"标记 N/A -->
- [ ] 2.1 `docs/frontend/component-catalog.md` — 涉及组件/目录（新增**或修改**）？→ 更新；未触及 → 核对结论
- [ ] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 涉及表/字段/领域模型（新增**或修改**）？→ 更新；未触及 → 核对结论
- [ ] 2.3 `docs/api/overview.md` — 涉及端点/契约（新增**或修改**）？→ 更新；未触及 → 核对结论
- [ ] 2.4 `docs/architecture.md` + `CLAUDE.md` — 涉及架构/模块/版本/测试规模/OpenSpec 流程？→ 更新；未触及 → 核对结论
- [ ] 2.5 `README.md` — 涉及版本/功能清单？→ 更新；未触及 → 核对结论
- [ ] 2.6 运行 `node scripts/docs-check.mjs` + `./scripts/sync-version.sh --check` — 文档一致性检查通过
- [ ] 2.7（CI/工具链类变更）运行 `pnpm run openspec:check` — OpenSpec 一致性检查通过

## 3. 全量验证
<!-- 按变更面取用：前端 pnpm run verify / 后端 mvn test / openspec validate --specs --strict / E2E 评估 -->
- [ ] 3.1 <!-- 适用的验证命令（如 cd frontend && pnpm run verify） -->
- [ ] 3.2 <!-- 适用的验证命令（如 cd backend && mvn test） -->
- [ ] 3.3 E2E — 涉及 Web 用户流程时评估执行；无 UI 变更写明跳过结论

## 4. 归档
- [ ] 4.1 归档留痕（sync 结论 + 归档后复跑 validate/docs-check/openspec-check 结论）

<!-- 删除本模板注释示例行，逐项替换为实际内容 -->
