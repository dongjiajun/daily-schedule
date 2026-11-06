# Tasks: design-system-foundation

<!--
  STANDARD 工作流：1 实施 → 2 文档同步 → 3 全量验证。
  本变更为纯前端设计系统层（token + 组件原语 + 密度 + 视觉基线），后端四层与契约/DB 项标记 N/A 打勾。
-->

## 1. 实施

- [x] 1.1 数据库迁移：N/A — 无 Flyway 迁移、无表/列变更
- [x] 1.2 领域层 (domain/)：N/A — 无后端代码
- [x] 1.3 基础设施层 (infrastructure/)：N/A — 无 persistence/security/scheduled/notification 变更
- [x] 1.4 应用层 (application/)：N/A — 无 ApplicationService/事务/缓存变更
- [x] 1.5 API 层 (api/)：N/A — 无 Controller/Assembler 变更
- [x] 1.6 契约同步：N/A — `specs/openapi.yaml` 无变更，不重新生成 SDK
- [x] 1.7 token 契约扩展（Decision 1/3/5）：`design-tokens.json` 增加 geometry/typography/motion/density 分组；`index.css` 的 `@theme` 注册 `--radius-*`/`--shadow-card|float|overlay`/`--duration-fast|base|slow`/`--ease-standard`/`--text-2xs|3xs`/`--font-sans`，并定义 `[data-density]` 密度变量
- [x] 1.8 排版收敛（Decision 2/3）：28 处任意字号按映射表收敛到 `2xs/xs/sm`；显式 CJK 字体栈生效；统计/日期/数字类文本补 `tabular-nums`；清理中文标签上无效的 `uppercase` 与过度字距
- [x] 1.9 组件原语实现（Decision 4）：新增 `card/badge/segmented/empty-state/skeleton/tooltip/kbd/progress` 8 个原语 + 各自 vitest（渲染、aria、键盘、密度 class）
- [x] 1.10 替换手写实现（Decision 4）：12 处卡片组合→`Card`、15 处 `title=`→`Tooltip`、加载态→`Skeleton`、空态→`EmptyState`、视图切换→`Segmented`、标签 chips→`Badge`、快捷键键帽→`Kbd`、WeekStats/宠物状态条→`Progress`
- [x] 1.11 双密度（Decision 5）：`settingsStore.density`（默认 comfortable + 持久化）+ 首帧脚本写 `data-density` + `ManagePanel` 偏好项 + 原语与关键布局引用密度 token；补 store 单测（默认/切换/持久化）
- [x] 1.12 门禁扩展（Decision 7）：`scripts/ui-check.mjs` 新增「几何/动效裸值」检查（允许集合来自契约，白名单含 `none/full/inset` 等）+ self-test 失败路径断言；`package.json` 保持 `ui:check` 六项
- [x] 1.13 视觉基线（Decision 6）：`playwright.config.ts` 视觉配置（`maxDiffPixelRatio`）+ `e2e/visual.spec.ts`（5 主题 × 6 截面，`@visual` tag）+ `package.json` 的 `test:visual` / `test:e2e --grep-invert @visual`；`.github/workflows/ci.yml` e2e job 保持排除视觉用例
- [x] 1.14 测试补全：原语与密度相关单测随 1.9/1.11 落地；确认新增测试文件计入 `DOCS-CHECK: frontend-test-files`

## 2. 文档同步

- [x] 2.1 `docs/frontend/component-catalog.md` — 更新原语清单（9 → 17）与 token 分组说明、密度模式说明
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 核对结论：无表/字段/领域模型变更，现有描述仍准确
- [x] 2.3 `docs/api/overview.md` — 核对结论：无端点/契约变更，现有描述仍准确
- [x] 2.4 `docs/architecture.md` + `AGENTS.md` — 更新组件数、测试规模计数、`ui:check` 六项描述、密度与视觉基线说明
- [x] 2.5 `README.md` — 核对结论：若含组件/测试规模表述则同步，否则写明仍准确
- [x] 2.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 3. 全量验证

- [x] 3.1 `cd backend && mvn test` — 后端单测全绿（无后端变更，门禁复跑）
- [x] 3.2 `cd frontend && pnpm run verify` — lint + tsc + build + vitest 全部通过
- [x] 3.3 `pnpm exec playwright test --grep-invert @visual` + `pnpm run test:visual` — E2E 与视觉基线分别通过（后者需本地基线已生成/更新）
- [x] 3.4 `pnpm run ui:check` — 六项检查全绿
- [x] 3.5 Smoke — 启动前后端：5 套主题 × 登录/日历月/日历周/看板/列表/宠物 6 截面人工过一遍；切换 comfortable/compact 密度确认布局无溢出
- [x] 3.6 `pnpm run openspec:check` — OpenSpec 一致性 + 归档完整性通过

## Workflow follow-up

- `/opsx:verify` — 真实代码变更必备，须报告无 CRITICAL
- `/opsx:archive` — 归档已完成的变更
- 归档后复跑门禁：`pnpm run openspec:check` + `openspec validate --archived` + `node scripts/docs-check.mjs`
