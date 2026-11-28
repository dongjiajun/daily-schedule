# Tasks: dev-workflow-and-agents-optimization

## 1. 实施
- [ ] 1.1 更新 `turbo.json` 任务图（移除 `verify` 对 `lint`/`build`/`test` 的重复依赖，补齐 `typecheck` 与 `test` 的 `^build` 依赖）
- [ ] 1.2 更新根 `package.json` 与子包 `package.json`（`frontend`、`apps/miniprogram`、`packages/shared`），统一安静输出（`--output-logs=errors-only` / `dot`），新增 `verify:frontend` 与 `verify:miniprogram` 快捷脚本并保持 CI 命令兼容
- [ ] 1.3 更新 `frontend/vitest.config.ts`、`apps/miniprogram/vitest.config.ts`（本地 `dot` reporter）与 `playwright.config.ts`（本地 `workers: 2`、`reporter: 'line'`）
- [ ] 1.4 将 `AGENTS.md` 中微信小程序页面细节与更新后的任务编排说明披露同步至 `docs/architecture.md`，并修正其中过时的前端用例计数（`314 -> 318`）
- [ ] 1.5 按 `/writing-for-agents` 原则重写精简 `AGENTS.md`（目标 <10 KB，保留 `OpenSpec CLI 1.15.0`、Artifact 序列、`当前版本：v3.5.1` 及全部 `DOCS-CHECK` marker，新增上下文纪律、分级验证表与 PowerShell 5.1 约定）

## 2. 文档同步
- [ ] 2.1 `docs/frontend/component-catalog.md` — 未触及前端 UI 组件，现有描述已核对仍准确
- [ ] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表结构与领域模型，现有描述已核对仍准确
- [ ] 2.3 `docs/api/overview.md` — 未触及 API 端点与契约，现有描述已核对仍准确
- [ ] 2.4 `docs/architecture.md` + `AGENTS.md` — 已在 1.4 与 1.5 更新披露与重构
- [ ] 2.5 `README.md` — 未变更版本与对外功能清单，现有描述已核对仍准确
- [ ] 2.6 运行 `node scripts/docs-check.mjs` + `./scripts/sync-version.sh --check` — 文档与版本一致性检查通过
- [ ] 2.7 运行 `pnpm run openspec:check` — OpenSpec 十项一致性检查通过

## 3. 全量验证
- [ ] 3.1 检查 `AGENTS.md` 字节数（目标 < 10,000 bytes）并运行全量 `pnpm run verify` 与 `pnpm run verify:frontend`，确认单次执行无重复且全部通过
- [ ] 3.2 独立运行 `pnpm --filter @daily-schedule/miniprogram run verify`，验证 CI 小程序阻断命令兼容通过
- [ ] 3.3 Playwright 配置加载校验（`pnpm exec playwright test --list --grep-invert '@visual'`）；本变更为工具链与文档优化，无 UI 渲染改动，不重跑完整浏览器 E2E 套件（保留 CI E2E 兜底）

## Workflow follow-up
- 纯工具链、构建配置与文档重构变更（未触碰 `backend/`、`frontend/src/`、`apps/miniprogram/src/`、`packages/shared/src/` 业务源码），按 `openspec-conventions` 第 3 组全量验证套件 + `pnpm run openspec:check`（含 `validate --archived`）等效替代 `/opsx:verify`
- 经用户确认后执行 `/opsx:archive` 归档变更并独立 commit
- 归档后复跑 `pnpm run openspec:check` 与 `pnpm run docs:check`
