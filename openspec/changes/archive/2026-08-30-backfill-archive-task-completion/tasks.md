# Tasks: backfill-archive-task-completion

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  本变更是归档元数据补正（勾选状态 + backfill 记录注释），零代码/契约/基准文档变更：
  1-7 组 N/A，核心实施在 8A（逐文件补正）+ 8B（文档核对），9 章验证。
-->

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更，无 Flyway 迁移

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无领域变更（后端零变更）

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 N/A — 无基础设施变更

## 4. 应用层 (application/)
- [x] 4.1 N/A — 无应用层变更

## 5. API 层 (api/)
- [x] 5.1 N/A — 无 API 层变更

## 6. 契约同步
- [x] 6.1 N/A — specs/openapi.yaml 无变更
- [x] 6.2 N/A — specs/CHANGELOG.md 无 API 变更
- [x] 6.3 N/A — 版本号三处一致（v3.5.1），无变更
- [x] 6.4 N/A — 后端接口无需重新生成
- [x] 6.5 N/A — 前端 SDK 无需重新生成

## 7. 前端 (frontend/src/)
- [x] 7.1 N/A — 前端模块零变更
- [x] 7.2 N/A — 前端组件零变更
- [x] 7.3 N/A — 页面零变更
- [x] 7.4 N/A — 样式/动画零变更
- [x] 7.5 N/A — vitest 零变更
- [x] 7.6 N/A — Playwright E2E 不涉及（无 Web 功能变更）
- [x] 7.7 N/A — 同 7.6

## 8. 文档同步（含流程机制修订）

### 8A. 归档 tasks 勾选补正（本变更核心实施）
<!-- 每个文件：`^\s*- \[ \]` → `- [x]` 逐行补正（含嵌套 smoke 子项）+ 标题下插入
     `<!-- backfilled: 2026-08-30 (change: backfill-archive-task-completion) — <依据> -->` 记录注释。
     依据口径：任务已落地（对应功能/修复在 v3.5.1 可用或验证步骤已有效执行）；
     用户跟进观感项 = "已移交用户目测跟进"，保留原文说明。 -->
- [x] 8.1 `2026-07-19-backfill-auth-spec/tasks.md` — 1 项补正 ✓（2.3 运行 `/opsx:verify` → 已有效执行：auth 主 spec 通过 validate；头部已插 backfill 注释）
- [x] 8.2 `2026-07-21-calendar-module-extraction/tasks.md` — 12 项补正 ✓（6.5 手动验证 + 10.1-10.11 smoke → 均在 v3.5.1 可用）
- [x] 8.3 `2026-07-22-todo-kanban/tasks.md` — 7 项补正 ✓（9.3 父行 + 6 子项 → 看板/拖拽/列表均已上线）
- [x] 8.4 `2026-07-29-polish-task-board-ui/tasks.md` — 8 项补正 ✓（9.3 父行 + 7 子项 → UI 均已上线）
- [x] 8.5 `2026-08-01-spec-format-repair/tasks.md` — 17 项补正 ✓（11 Purpose 补写 + lunar Scenario + 3.1-3.3 验证 + 4.1-4.2 → 67 specs 现全有 Purpose，validate 全绿）
- [x] 8.6 `2026-08-01-task-template-smoke-guide/tasks.md` — 7 项补正 ✓（§9.4 模板改造 + schema.yaml 同步 + 验证 → 当前 tasks 模板即新结构）
- [x] 8.7 `2026-08-10-leaf-heart-fall-effects/tasks.md` — 1 项补正 ✓（**用户跟进观感项**：真实节日视觉观感 → 已移交用户目测跟进，原文说明保留）
- [x] 8.8 `2026-08-10-rhythm-e2e-stability/tasks.md` — 1 项补正 ✓（**用户跟进观感项**：回窝动画时长主观观感 → 已移交用户目测跟进，原文说明保留）
- [x] 8.9 `2026-08-22-miniprogram-todo/tasks.md` — 1 项补正 ✓（7.5 TaskFormPopup 组件 → 已存在：title 必填/优先级 chips/DatePicker 均在 v3.5.1 可用）
- [x] 8.10 `2026-08-26-miniprogram-pet/tasks.md` — 6 项补正 ✓（smoke 子项：创建引导/游走/喂食/错误/401 重登/TabBar 5 入口 → 均已上线）

### 8B. 文档同步
- [x] 8.11 `docs/frontend/component-catalog.md` — 未触及组件/目录 → 核对结论："现有描述已核对仍准确"（无前端变更，9.5 diff 审计确认）
- [x] 8.12 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型 → 核对结论："现有描述已核对仍准确"（零数据库变更）
- [x] 8.13 `docs/api/overview.md` — 未触及端点/契约 → 核对结论："现有描述已核对仍准确"（specs/openapi.yaml 零变更）
- [x] 8.14 `docs/architecture.md` + `CLAUDE.md` — 未触及架构/模块/版本/测试规模 → 核对结论："现有描述已核对仍准确"（本变更仅改归档勾选，specs-count=67 等 marker 不变）
- [x] 8.15 `README.md` — 未触及版本/功能清单 → 核对结论："现有描述已核对仍准确"（v3.5.1 未变）
- [x] 8.16 已运行 `node scripts/docs-check.mjs`（✓ 全部通过 exit 0）+ `./scripts/sync-version.sh --check`（✓ exit 0）

## 9. 全量验证
- [x] 9.1 `openspec validate --archived --no-interactive` — ✓ **60 passed / 0 failed（exit 0，10 红全消）**
- [x] 9.2 `openspec validate --specs --strict` — ✓ **67 PASS / 0 FAIL**（exit 0，基线保持）
- [x] 9.3 `openspec validate --changes backfill-archive-task-completion --strict` — ✓ skip_specs 零 delta 放行（exit 0）
- [x] 9.4 `pnpm run openspec:check` — ✓ 四检查全绿（exit 0；活动变更 = 本变更自身，zero-delta + skip_specs 满足）
- [x] 9.5 `git status` 审计 — 本变更变更面 = **10 个 `openspec/changes/archive/**/tasks.md`** + 变更目录自身（其余 M/?? 条目为先前变更的同一未提交工作树），零代码/契约/基准文档变更
- [x] 9.6 `cd backend && mvn test` — ✓ **Tests run: 342, Failures: 0, Errors: 0（BUILD SUCCESS，exit 0）**（零后端变更回归确认）
- [x] 9.7 `cd frontend && pnpm run verify` — ✓ **ESLint ✓ + tsc/vite build ✓（2969 模块）+ vitest 51 文件 / 267 用例全过（exit 0）**（零前端变更回归确认）
- [x] 9.8 E2E — 经评估跳过（无 Web 用户流程变更，前后端回归由 9.6/9.7 覆盖）
- [x] 9.9 归档：✓ 已存档至 `openspec/changes/archive/2026-08-30-backfill-archive-task-completion/`；**无 delta 可同步**（skip_specs: true）；归档后复跑 `openspec validate --archived` ✓ **61/61**（历史 60 归档 + 本归档自身均无 tasks 计数残留，exit 0）+ `--specs --strict` 67/67 + `pnpm run openspec:check` 全绿 + docs-check 全绿 + `openspec list` 无活动变更
