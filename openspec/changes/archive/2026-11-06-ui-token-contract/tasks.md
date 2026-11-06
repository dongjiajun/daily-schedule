# Tasks: ui-token-contract

<!--
  STANDARD 工作流：1 实施 → 2 文档同步 → 3 全量验证。
  本变更为纯前端样式层 + 前端工具链，后端四层与契约/DB 项标记 N/A 打勾。
  实施按 design.md 的 Decision 顺序排列，测试随实施条目自带。
-->

## 1. 实施

- [x] 1.1 数据库迁移：N/A — 无 Flyway 迁移、无表/列变更（见 design.md Database Design）
- [x] 1.2 领域层 (domain/)：N/A — 无后端代码
- [x] 1.3 基础设施层 (infrastructure/)：N/A — 无 persistence/security/scheduled/notification 变更
- [x] 1.4 应用层 (application/)：N/A — 无 ApplicationService/事务/缓存变更
- [x] 1.5 API 层 (api/)：N/A — 无 Controller/Assembler 变更
- [x] 1.6 契约同步：N/A — `specs/openapi.yaml` 无变更，不重新生成后端接口与前端 SDK
- [x] 1.7 新增 `frontend/src/core/styles/design-tokens.json`（Decision 1）：token 分组清单、对比度配对与阈值、裸色值白名单条目（含每条理由）
- [x] 1.8 基础主题取值调整（Decision 5）：`themes.css` 中 default/dark 的 `foreground-muted`、dark `foreground-secondary`、新增 `border-strong`；逐主题核对覆盖契约全集
- [x] 1.9 节日主题收敛（Decision 2）：`holiday-themes.css` 新增 `[data-theme^="holiday-"]` 共享派生块（前景三级显式色值 `#f5f7fa`/`#c3cbd6`/`#9aa6b4`，其余由 surface/accent 用 `color-mix` 派生）、删除 18 块中的 `--color-primary`、删除末尾无效 `transition`
- [x] 1.10 语义色与 `border-strong` 注册（Decision 3/4）：`:root` 定义 success/error/warning/info 及 `-fg`/`-bg`，dark 与节日共享块覆盖 tint；`index.css` 的 `@theme` 注册全部新增 utility
- [x] 1.11 组件裸色值收敛（Decision 6）：`core/components/ui/{button,input,textarea,select,switch}.tsx`、`modules/calendar/components/*`、`modules/todo/components/*`、`modules/pet/components/*`、`pages/LoginPage.tsx` 按映射表替换；`OnboardingGuide.tsx` 的 `dark:` 变体改语义 token；`input/textarea/select/switch` 边界改 `border-border-strong`
- [x] 1.12 静默失效修复（Decision 7/8）：`calendar.css` 4 处硬编码改 token/`color-mix`；`CalendarView` 的 `color + '22'` 改 `color-mix()`；`statusColor.ts` 改 success/warning/error；`index.html` 首帧脚本读 `themeMode`/`theme`/`activeHolidayId`
- [x] 1.13 移除死配置 `autoDarkMode`（Decision 8）：`settingsStore.ts` 删除字段与 setter，确认无组件引用
- [x] 1.14 vitest 契约测试（Decision 10）：新增 `frontend/src/core/styles/__tests__/design-tokens.test.ts` — 契约 ↔ CSS 声明一致、语义 utility 已注册、对比度函数单测、23 套主题声明集合快照
- [x] 1.15 Playwright E2E（Decision 10）：新增 `e2e/ui-theme.spec.ts` — 登录页写 `settings.v1` 后断言 5 套主题 `--color-bg` 计算值（不依赖后端）
- [x] 1.16 UI 门禁脚本与 CI（Decision 9/10）：新增 `scripts/ui-check.mjs`（契约完整性 / 对比度 / 裸色值白名单 / 未知 token / CSS 死 token 五项 + `--self-test`）；`package.json` 增 `ui:check`；`.github/workflows/ci.yml` 的 frontend job 在 lint 后执行

## 2. 文档同步

- [x] 2.1 `docs/frontend/component-catalog.md` — 修改：新增 `core/styles/design-tokens.json` 与 UI 门禁说明；主题 token 数量表述改为引用契约（不再写死数字）
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 核对结论：无表/字段/领域模型变更，现有描述仍准确
- [x] 2.3 `docs/api/overview.md` — 核对结论：无端点/契约变更，现有描述仍准确
- [x] 2.4 `docs/architecture.md` + `AGENTS.md` — 更新：门禁清单加入 `ui:check`、测试文件计数（frontend/e2e 的 `DOCS-CHECK` marker）、版本声明段
- [x] 2.5 `README.md` — 核对结论：门禁与测试规模表述若在 README 出现则同步，否则写明仍准确
- [x] 2.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 3. 全量验证

- [x] 3.1 `cd backend && mvn test` — 后端单测全绿（本次无后端变更，作为门禁复跑）
- [x] 3.2 `cd frontend && pnpm run verify` — lint + tsc + build + vitest 全部通过
- [x] 3.3 `pnpm run test:e2e` — 全量 E2E 通过（含新增 `ui-theme.spec.ts`）
- [x] 3.4 `pnpm run ui:check` — 四项门禁全绿，输出摘要符合预期
- [x] 3.5 Smoke test — 启动前后端浏览器手工验证：切换 5 套主题 + 用 devtools 强制 `data-theme="holiday-spring-festival"` 检查文字/边框/日历可读、日历拖拽改期、任务看板拖拽、宠物互动
- [x] 3.6 `pnpm run openspec:check` — OpenSpec 一致性 + 归档完整性通过

## Workflow follow-up

- `/opsx:verify` — 真实代码变更必备，须报告无 CRITICAL
- `/opsx:archive` — 归档已完成的变更
- 归档后复跑门禁：`pnpm run openspec:check` + `openspec validate --archived` + `node scripts/docs-check.mjs`
