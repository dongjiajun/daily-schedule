# ui-token-contract

UI 系统层地基修复：主题 token 契约单一化（含 18 套节日主题）、语义色注册、对比度达标、硬编码收敛，并以 UI 门禁脚本 + 视觉基线固化。

## 归档记录（2026-11-06）

- **verify 结论**：无 CRITICAL；6 项 WARNING 中修复 4 项——① `ui-check --self-test` 补齐四类失败路径断言；② 新增「CSS 声明中未注册 token（死 token）」检查（第 5 项）；③ 删除文档中硬编码 token 数量（遵守单一真相源要求）；④ 补 auto 模式无节日回退的 E2E。保留 2 项 advisory：CI 阻断需在 PR 环境观察、组件级配色断言留给后续 `design-system-foundation`。
- **门禁结果**：`pnpm run ui:check`（5 项全绿）、`cd frontend && pnpm run verify`（52 文件 269 用例）、`cd backend && mvn test`（342 用例）、`pnpm exec playwright test`（65 passed / 1 skipped）、`node scripts/docs-check.mjs`、`node scripts/openspec-check.mjs`、`openspec validate --archived` 全部通过。
- **delta 同步**：新增主 spec `design-token-contract`；`theme-system`（3 改 1 增）、`holiday-theme-auto`（1 改）、`frontend-experience-baseline`（3 增）已合并；主 spec delta 头 0 残留。
- **等效验证依据**：真实代码变更已执行 `/opsx:verify` 并报告无 CRITICAL；归档后复跑 `openspec:check` / `validate --archived` / `docs:check`，结论如上。
