# ui-advisory-cleanup

清理前两阶段遗留 advisory：E2E token 硬编码、门禁解析逻辑重复、组件级配色断言、密度持久化 E2E。

## 遗留 advisory 结论（apply 阶段落盘）

| advisory（来源） | 处理结论 |
|---|---|
| E2E 主题断言硬编码 token 清单（ui-token-contract verify S1） | **已修复**：`e2e/ui-theme.spec.ts` 改为从 `design-tokens.json` 读取全部 token 生成断言清单 |
| ui-check 与契约测试各写一份 CSS 解析（ui-token-contract verify S2） | **已修复**：抽出 `scripts/lib/tokens.mjs`，门禁与 vitest 共用解析/对比度/几何判定 |
| 组件级配色断言（ui-token-contract verify 保留项） | **已修复**：TaskCard 优先级（error/info）、EventModal 完成徽标（success）增加断言 |
| 密度设置浏览器侧持久化未测（design-system-foundation verify S3） | **已修复**：`e2e/ui-primitives.spec.ts` 增加「偏好设置切紧凑 → 刷新仍保持」用例 |
| 视觉基线失败路径未模拟（design-system-foundation verify S1） | **不行动**：差异失败由 Playwright 原生 diff 报告；人为构造坏基线无长期价值，基线缺失时 `test:visual` 会直接报 missing |
| 视觉基线仅 win32 / CI 排除（design-system-foundation verify S1） | **不行动**：已在 design.md 与 README 记录，后续随「视觉基线容器化」独立变更处理 |
| 8 原语共用单测文件（design-system-foundation verify S2） | **不行动**：单文件 9 用例定位清晰，拆分只增加文件数无行为收益 |
| CI 阻断需在 PR checks 观察（两阶段共同） | **不行动**：本地等价命令已全绿，合并后首个 PR 观察 `ui:check` step 状态 |

## 归档记录（2026-11-07）

- **verify 结论**：lite + `skip_specs: true`，无 delta specs——Spec Coverage / Requirement Mapping / Scenario Coverage 与本 schema 未定义的 Design Adherence 均 **Not applicable**；Applicable 的 Task Completion 18/18、Code Pattern Consistency 通过，**0 CRITICAL**。
- **门禁结果**：`cd frontend && pnpm run verify`（53 文件 284 用例）、`pnpm run test:e2e`（70 passed / 1 skipped）、`pnpm run test:visual`（5 passed / 30 张基线不变）、`pnpm run ui:check`（六项全绿）、`docs-check`、`openspec:check`、`validate --strict` 全部通过；后端零改动（3.5 N/A）。
- **specs**：skip_specs，无 spec 同步（specsUpdated=false），主 spec 树与 specs-count 不变。
- **等效验证依据**：纯测试/工具链变更，全量验证组（前端 verify + E2E + 视觉基线 + ui:check）与归档后复跑门禁等效覆盖。
