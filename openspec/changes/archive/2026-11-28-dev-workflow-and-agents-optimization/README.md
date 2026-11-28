# dev-workflow-and-agents-optimization

研发流程提效、验证流水线降噪去重与 `AGENTS.md` 瘦身重构：移除 `turbo.json` 中 `verify` 任务重复嵌套，改为包内串行 + 跨包并行单次执行（root `package.json` 新增 `verify:frontend` / `verify:miniprogram` 并统一 `--output-logs=errors-only`）；为 `frontend/vitest.config.ts`（含 `testTimeout: 15_000`）与 `apps/miniprogram/vitest.config.ts` 配置本地 `dot` reporter，为 `playwright.config.ts` 收敛本地默认 `workers: 2` + `reporter: 'line'`；修复 `apps/miniprogram/src/__tests__/shared-reuse.test.ts` 中跨时区日期构造缺陷；依据 `/writing-for-agents` 将微信小程序页面实现细节披露同步至 `docs/architecture.md`（并修正前端用例计数 `314 -> 318`），将 `AGENTS.md` 从 `20,330` 字节精简至 `7,522` 字节（`-63%`），固化上下文隔离、OpenSpec 节点切会话提醒与按影响面分级验证矩阵。

## 归档记录（2026-11-28）

- **verify 结论**：`spec-driven-custom-lite`（`skip_specs: true`）工件完整，tasks `16/16` 全部勾选，`apps/miniprogram/src/__tests__/shared-reuse.test.ts` 与全部配置/文档变更已逐项核对，**0 CRITICAL / 0 WARNING / 0 SUGGESTION**（对应功能提交 `9572df8`、`8fa3df5`）。
- **门禁结果**：`pnpm run verify`（`4 successful, 4 total`，`119.8s`，全量单次通过）、`pnpm run verify:frontend`（Turbo 命中缓存 `3.7s`）、`pnpm --filter @daily-schedule/miniprogram run verify`（`8` 文件 `86` 用例 + `eslint` + `tsc --noEmit` + `taro build` 通过）、`pnpm exec playwright test --list --grep-invert '@visual'`（`15` 文件 `71` 用例加载正常）、`node scripts/docs-check.mjs` 与 `pnpm run openspec:check`（十项检查含 84 份归档变更）全部通过。
- **delta 同步**：`skip_specs: true`（无主 spec 变更，主 spec 保持 `72` 份）。
