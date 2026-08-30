# Tasks: wire-archived-into-ci

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  本变更是 CI 门禁脚本扩展（+ 工作流约定文档同步），零后端/前端/小程序代码变更：
  1-7 组 N/A，核心实施在 8A（脚本第 5 检查）+ 8B（文档同步），9 章验证。
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

### 8A. CI 门禁脚本扩展（本变更核心实施）
- [x] 8.1 `scripts/openspec-check.mjs` — 已新增第 5 子检查：`validateArchived()`（`runOpenSpec(['validate', '--archived', '--no-interactive'])`）挂主流程末尾（checkCliVersion 之后）；头部注释"四类检查"→"五类检查"并纳入第 5 项；`--self-test` 未改（无新检测器，纯 CLI 调用）
- [x] 8.2 `.github/workflows/ci.yml` — 核对结论：**零改动**（`openspec-validation` job 已安装 CLI 并运行 `node scripts/openspec-check.mjs`，脚本新增检查即生效；git status 确认 ci.yml 本变更未动）

### 8B. 文档同步
- [x] 8.3 `docs/frontend/component-catalog.md` — 未触及组件/目录 → 核对结论："现有描述已核对仍准确"（无前端变更，9.6 审计确认）
- [x] 8.4 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型 → 核对结论："现有描述已核对仍准确"（零数据库变更）
- [x] 8.5 `docs/api/overview.md` — 未触及端点/契约 → 核对结论："现有描述已核对仍准确"（specs/openapi.yaml 零变更）
- [x] 8.6 `docs/architecture.md` — 已更新 `## 测试` CI 行：openspec-validation 描述补 `+ 归档完整性 validate --archived`；版本/测试规模 marker 核对结论："现有描述已核对仍准确"（specs-count=67 不变）
- [x] 8.7 `CLAUDE.md` — 已更新两处：工作流小节 CI 门禁 bullet 补 `+ validate --archived 归档完整性`；提交前验证"CI 门禁"行 openspec-validation 描述补 `+ 归档完整性 validate --archived`
- [x] 8.8 `README.md` — 已更新第 129 行门禁描述：openspec-validation 括号内补 `+ 归档完整性 validate --archived`
- [x] 8.9 已运行 `node scripts/docs-check.mjs`（✓ exit 0）+ `./scripts/sync-version.sh --check`（✓ exit 0）

## 9. 全量验证
- [x] 9.1 `openspec validate --changes wire-archived-into-ci --strict` — ✓ 1 passed（MODIFIED Requirement 完整重贴 + 6 Scenarios 合规）
- [x] 9.2 `openspec validate --specs --strict` — ✓ **67 PASS / 0 FAIL**（基线保持）
- [x] 9.3 `openspec validate --archived --no-interactive` — ✓ **61 PASS / 0 FAIL**（基线保持）
- [x] 9.4 `pnpm run openspec:check` — ✓ **五检查全绿**（validate --all --strict / doctor / 守卫 / 版本 / **--archived**，exit 0）
- [x] 9.5 `pnpm run openspec:check -- --self-test` — ✓ self-test OK（exit 0）
- [x] 9.6 `git status` 审计 — 变更面 = `scripts/openspec-check.mjs` / `CLAUDE.md` / `README.md` / `docs/architecture.md` / `openspec/changes/wire-archived-into-ci/`，**零后端/前端/小程序源码变更**
- [x] 9.7 `cd backend && mvn test` — ✓ **Tests run: 342, Failures: 0, Errors: 0（BUILD SUCCESS，exit 0）**（零后端变更回归确认）
- [x] 9.8 `cd frontend && pnpm run verify` — ✓ **ESLint ✓ + tsc/vite build ✓（2969 模块）+ vitest 51 文件 / 267 用例全过（exit 0）**（零前端变更回归确认）
- [x] 9.9 E2E — 经评估跳过（无 Web 用户流程变更，前后端回归由 9.7/9.8 覆盖）
- [x] 9.10 归档：✓ 已存档至 `openspec/changes/archive/2026-08-30-wire-archived-into-ci/`；delta 已 sync → `openspec/specs/openspec-conventions/spec.md`（**5 Requirements / 15 Scenarios**：CI 门禁 Requirement 含 5 检查项 + 6 Scenarios，与 delta 一致）；`validate --specs` **67/67** + `--strict` 0 失败 + `pnpm run openspec:check` 全绿（含 --archived，守卫对主 spec 新正文 0 误报）；归档后复跑 `validate --archived` ✓ **62/62**（61 + 本归档自身）
