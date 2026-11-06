# design-system-foundation

设计系统基建：几何/排版/动效 token 三层化 + 8 个组件原语 + 中文排版 + 双密度 + 视觉回归基线。

## 归档记录（2026-11-07）

- **verify 结论**：无 CRITICAL。5 项 WARNING 中修复 4 项——① 补 Tooltip 键盘聚焦可见性 E2E；② 补 TodoPage 加载骨架单测；③ 补双密度 E2E（comfortable 32px / compact 28px 分段控件高度）；④ 补中文排版基线 E2E（11px + CJK 字体栈）。保留 1 项发布期观测：CI 阻断需在真实 PR checks 中确认。
- **门禁结果**：`pnpm run ui:check`（六项全绿）、`cd frontend && pnpm run verify`（53 文件 281 用例）、`cd backend && mvn test`（342 用例）、`pnpm run test:e2e`（69 passed / 1 skipped）、`pnpm run test:visual`（5 passed / 30 张基线）、`docs-check`、`openspec:check`、`validate --strict` 全部通过。
- **delta 同步**：新增主 spec `component-primitives`；`design-token-contract`（2 改 2 增）、`frontend-experience-baseline`（1 增）已合并；主 spec delta 头 0 残留。
- **设计偏差（已在 design.md 记录）**：DropdownMenu 因无消费方改为 Progress；13px→`text-sm`、15px→`text-base`；视觉基线 serial 执行 + 固定日期/测试用户 + 隐藏游走宠物（仅 win32 基线，CI 排除 `@visual`）。
- **等效验证依据**：真实代码变更已执行 `/opsx:verify` 并修复全部可修复 WARNING；归档后复跑 `openspec:check` / `validate --archived` / `docs:check`。
