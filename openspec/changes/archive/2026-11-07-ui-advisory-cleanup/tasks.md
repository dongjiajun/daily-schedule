# Tasks: ui-advisory-cleanup

<!--
  LITE 工作流：1 实施 → 2 文档同步 → 3 全量验证。本变更 skip_specs: true（无行为变化）。
-->

## 1. 实施

- [x] 1.1 新增 `scripts/lib/tokens.mjs`：抽出主题块解析（`parseDeclarations`/`collectBlocks`/`readThemes`）、token 查找与色值解析（`lookup`/`resolveColor`）、对比度（`luminance`/`contrastRatio`）、几何/动效裸值判定（`geometryViolation`，允许集合读契约）
- [x] 1.2 `scripts/ui-check.mjs` 改为引用 `scripts/lib/tokens.mjs`（删除本地重复实现，六项检查行为不变）；`--self-test` 仍全绿
- [x] 1.3 `frontend/src/core/styles/__tests__/design-tokens.test.ts` 改为引用共享模块，并新增「契约几何/动效档位合法性」断言（复用 `geometryViolation`）
- [x] 1.4 `e2e/ui-theme.spec.ts`：删除硬编码 `CRITICAL_TOKENS`，改为读取 `design-tokens.json` 的全部 token 生成断言清单
- [x] 1.5 组件级配色断言：`TaskCard.test.tsx` 覆盖 URGENT/HIGH/MEDIUM 徽标（error/warning/info 类）；`EventModal.test.tsx` 覆盖完成徽标 `Badge tone=success`
- [x] 1.6 `e2e/ui-primitives.spec.ts` 新增密度持久化用例：打开偏好设置 → 切「紧凑」→ 刷新 → 断言 `data-density=compact` 且分段控件高度 28px
- [x] 1.7 未行动 advisory 的结论落盘（视觉基线跨 OS 差异 / 失败路径模拟 / 原语单测是否拆分），写入归档记录，避免反复挂账

## 2. 文档同步

- [x] 2.1 `docs/frontend/component-catalog.md` — 核对结论：无组件新增/修改，现有描述仍准确（仅测试与工具链整理）
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 核对结论：无表/字段/领域模型变更，现有描述仍准确
- [x] 2.3 `docs/api/overview.md` — 核对结论：无端点/契约变更，现有描述仍准确
- [x] 2.4 `docs/architecture.md` + `AGENTS.md` — 若前端用例数变化则同步计数（测试文件数不变）
- [x] 2.5 `README.md` — 核对结论：无测试规模/组件计数表述，现有描述仍准确
- [x] 2.6 运行 `node scripts/docs-check.mjs` 与 `node scripts/openspec-check.mjs` — 均通过

## 3. 全量验证

- [x] 3.1 `cd frontend && pnpm run verify` — lint + tsc + build + vitest 全部通过
- [x] 3.2 `pnpm run test:e2e` + `pnpm run test:visual` — E2E 全量（排除 @visual）与视觉基线均通过
- [x] 3.3 `pnpm run ui:check` — 六项检查全绿（含 `--self-test`）
- [x] 3.4 `pnpm exec openspec validate ui-advisory-cleanup --strict` — 变更校验通过（skip_specs 零 delta）
- [x] 3.5 `cd backend && mvn test` — N/A：无后端变更；由 3.1/3.2 覆盖前端面，后端代码零改动

## Workflow follow-up

- `/opsx:verify` — 触碰 `frontend/src/` 测试文件，须报告无 CRITICAL
- `/opsx:archive` — 归档已完成的变更
- 归档后复跑门禁：`pnpm run openspec:check` + `openspec validate --archived` + `node scripts/docs-check.mjs`
