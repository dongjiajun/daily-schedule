# frontend-ui-texture-polish

克制精致派（Linear / Apple Calendar 路线）前端 UI 质感与交互一致性打磨：修复 `dark` 主题 `--color-border-subtle` 与 `--color-surface` 同色隐形边框及 `holiday-*` 表面阶梯；升级 `design-tokens.json` 与 `index.css` 多层投影并在暗底叠顶部微高光；为 `Segmented` 增加同实例 `framer-motion` 弹性滑动指示底片、`Button` 收敛 `shadow-card` 与轻按回弹、`DialogContent` 补细边框、`Sidebar` 优化活跃指示；移除 `calendar.css` 中文表头 `uppercase`/宽字距，补足月视图格微框与周/日暗色半小时分割线，对齐搜索 `<Kbd>/</Kbd>`；将 `TaskForm` 与 `TaskColumn` 内联新建迁移至设计系统原语，统一 `<Badge>` 优先级、柔和标签胶囊、悬停抬升、拖拽反馈与 `DONE` 删除线；为 `/pet` 主卡增加主题径向光晕与地面投影陈列台，并扩展 `FoodActionList` `layout="grid"` 与 `PetMenu` `Segmented` 切换。

## 归档记录（2026-11-27）

- **verify 结论**：`spec-driven-custom-standard` 四工件完整，tasks 21/21 全部勾选，6 份 delta spec 全部实现并核对，**0 CRITICAL / 0 WARNING**（2 条低优先级视觉微调 SUGGESTION 已记录）。
- **门禁结果**：`pnpm run ui:check`（23 套主题 × 40 token 全覆盖、373 对比度通过 / 18 派生跳过、0 越界）、`pnpm --filter frontend run verify` + `pnpm run verify`（`@daily-schedule/shared` 8 文件 117 用例 + `frontend` 59 文件 318 用例 + `@daily-schedule/miniprogram` 8 文件 86 用例 + eslint + `tsc -b` + Vite 构建）、后端 `mvn test`（354/354）、Playwright `pnpm run test:e2e -- --workers=2`（70 passed / 1 pre-existing skip）、`playwright test --grep '@visual' --update-snapshots=all` 刷新全部 30 张基线并复跑 `pnpm run test:visual`（5/5 通过）、真实浏览器冒烟（`http://localhost:5173`，0 控制台报错、0 请求失败），以及归档后复跑的 `pnpm run openspec:check`、`pnpm exec openspec validate --archived --strict --no-interactive` 与 `node scripts/docs-check.mjs` 全部通过。
- **delta 同步**：6 份已有主 spec 完成合入（`design-token-contract` ADDED 1 条；`component-primitives` ADDED 1 条；`frontend-experience-baseline` ADDED 1 条；`task-kanban` MODIFIED 1 条 + ADDED 1 条；`task-list-view` MODIFIED 1 条；`pet-interaction-ui` ADDED 1 条），主 spec 保持 72 份，delta 头 0 残留。
