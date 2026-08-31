# Tasks: Archify 交互式架构图

## 1. 实施
- [x] 1.1 生成 8 张 archify 图（Archify CLI，showcase 质量档）至 `docs/diagrams/*.html`：architecture-overview / frontend-module-platform / domain-model-er / pet-economy / contract-pipeline / sse-reminder-sequence / event-status-lifecycle / pet-emotion-lifecycle；候选规格保留在 `docs/diagrams/_drafts/*.json`
- [x] 1.2 每张图校验：`validate --quality showcase` 9/9 检查通过、composition 0 errors / 0 warnings；`deliver` 原子交付（规格+产物 SHA-256 收据）；`visual-check` 四档×双主题包含性（7/8 exit 0；contract-pipeline 因 workflow 渲染器内容宽硬编码 680px 无法触发宽画布自适应，四档纵向滚动——与官方 workflow 示例行为一致，如实记录）
- [x] 1.3 `docs/uml/README.md` 新增"交互式图（Archify）"导航（domain-model-er / event-status-lifecycle / pet-emotion-lifecycle / sse-reminder-sequence）
- [x] 1.4 `docs/architecture.md` 新增"交互式架构图（Archify）"索引（architecture-overview / frontend-module-platform / pet-economy / contract-pipeline / sse-reminder-sequence）
- [x] 1.5 `.gitignore` 追加 `docs/diagrams/*.visual-check.*`（截图/contact sheet/收据，可用 `archify visual-check` 再生；HTML 图与 `_drafts/` 候选规格入库）

## 2. 文档同步
- [x] 2.1 `docs/frontend/component-catalog.md` — 未触及（无组件新增/修改；现描述已核对仍准确）
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — schema.md 未触及（无表/字段变化）；uml/README.md 已更新（交互式图导航，内容与 ASCII 图并用）
- [x] 2.3 `docs/api/overview.md` — 未触及（无端点/契约变化；现描述已核对仍准确）
- [x] 2.4 `docs/architecture.md` + `CLAUDE.md` — architecture.md 已更新（交互式图索引）；CLAUDE.md 未触及（无架构/模块/版本/测试规模/流程变化）
- [x] 2.5 `README.md` — 未触及（无版本/功能清单变化；现索引已核对仍准确，文档表无需加条目——交互式图入口在 architecture.md / uml/README.md）
- [x] 2.6 运行 `node scripts/docs-check.mjs` + `./scripts/sync-version.sh --check` — 全部通过（docs-check 只扫描 `docs/**/*.md` 的版本声明/端点/DOCS-CHECK marker，`docs/diagrams/` HTML/JSON 不在扫描范围；见验证记录）
- [x] 2.7 运行 `pnpm run openspec:check` — 通过（含本变更 validate --all --strict）

## 3. 全量验证
- [x] 3.1 `openspec validate --change archify-diagrams --strict` 通过（skip_specs + 零 delta 放行）
- [x] 3.2 `node scripts/docs-check.mjs` 通过（0 失败；VERSION/ENDPOINTS/COUNTS 全绿）
- [x] 3.3 E2E — 跳过结论：无 UI/用户流程变更，纯文档资产，不涉及 Playwright 用例

## 4. 归档
- [x] 4.1 归档本变更（`openspec archive archify-diagrams --skip-specs -y`）；归档后复跑 `openspec validate --archived` + `pnpm run openspec:check` + `node scripts/docs-check.mjs` 全通过
- 等效依据（归档条目注明）：纯文档资产变更（无 backend/frontend/miniprogram/packages 源码改动），按 CLAUDE.md 归档前验证门禁由 lite 第 3 组全量验证（doc/openspec 检查）+ `validate --archived` 等效替代
