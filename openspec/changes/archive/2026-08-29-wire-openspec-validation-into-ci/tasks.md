# Tasks: wire-openspec-validation-into-ci

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  本变更是纯 CI/元工作流变更（.github/workflows/ci.yml + scripts/openspec-check.mjs +
  package.json + CLAUDE.md + README.md + docs/architecture.md），
  零后端/前端/小程序代码变更：1-7 组 N/A，核心实施在 8A（机制修订）+ 8B（文档同步）。
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
- [x] 7.5 N/A — vitest 零变更（本变更仅根 package.json 加 script，不触及前端测试面）
- [x] 7.6 N/A — Playwright E2E 不涉及（无 Web 功能变更；CI job 结构变更由 9.5 diff 审计确认）
- [x] 7.7 N/A — 同 7.6

## 8. 文档同步（含流程机制修订）

### 8A. CI 门禁机制修订（本变更核心实施）
- [x] 8.1 `scripts/openspec-check.mjs` — 已创建（跨平台 Node ESM，仿 docs-check.mjs）：① `openspec validate --all --strict --no-interactive` ② `openspec doctor`（含 root 状态断言）③ 主 spec delta 头守卫（扫描 `openspec/specs/` 下 67 个 spec.md，命中 `^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements$` / `^### (Modified|Removed|Renamed) Requirement:` 输出 `路径:行号`）④ CLI 版本守卫（`openspec --version` ↔ CLAUDE.md `OpenSpec CLI <version>`）；`--self-test` 覆盖守卫正/负例与版本解析器；未装 CLI 时给出 `npm install -g @fission-ai/openspec@<version>` 指引
- [x] 8.2 根 `package.json` — 已新增 `"openspec:check": "node scripts/openspec-check.mjs"`（与 docs:check 并列）
- [x] 8.3 `.github/workflows/ci.yml` — 已新增 `openspec-validation` job（checkout → setup-node 22 [package-manager-cache: false] → `npm install -g @fission-ai/openspec@1.11.0` [钉版，注释标明升级须同步 CLAUDE.md 声明] → `node scripts/openspec-check.mjs`），无 needs 与 backend/frontend 并行
- [x] 8.4 本地复跑 — `pnpm run openspec:check -- --self-test` ✓（self-test OK + 四检查全绿）+ `pnpm run openspec:check` ✓（exit 0，CLI 版本守卫 installed=1.11.0 = declared=1.11.0）

### 8B. 文档同步
- [x] 8.5 `docs/frontend/component-catalog.md` — 未触及组件/目录 → 核对结论："现有描述已核对仍准确"（无前端组件/目录变更，9.5 git diff 审计确认）
- [x] 8.6 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型 → 核对结论："现有描述已核对仍准确"（零数据库变更，无 Flyway）
- [x] 8.7 `docs/api/overview.md` — 未触及端点/契约 → 核对结论："现有描述已核对仍准确"（specs/openapi.yaml 零变更）
- [x] 8.8 `docs/architecture.md` + `CLAUDE.md` — 已更新：architecture.md `## 测试` CI 行补 `openspec-validation` job（门禁序列 version-check → openspec-validation → backend → frontend，E2E 软性不变，"三道"→"四道"阻断门禁）；CLAUDE.md 工作流小节补 CI 门禁 bullet、提交前验证小节 "CI 五层门禁" 改写为四道阻断 + E2E 软性、自动化验证补 `pnpm run openspec:check`；specs-count=67 等结构 marker 无变化（无新 spec 目录，仅 openspec-conventions 主 spec 内容在归档时新增 Requirement）
- [x] 8.9 `README.md` — 已更新第 129 行 CI 门禁描述，纳入 openspec-validation 门禁
- [x] 8.10 已运行 `node scripts/docs-check.mjs`（✓ 全部通过，exit 0）+ `./scripts/sync-version.sh --check`（✓ exit 0）

## 9. 全量验证
- [x] 9.1 `openspec validate --changes wire-openspec-validation-into-ci --strict` — ✓ 1 passed（ADDED Requirement + 5 Scenarios 格式合规）
- [x] 9.2 `openspec validate --specs --strict` — ✓ **67 PASS / 0 FAIL**（exit 0，基线保持）
- [x] 9.3 `openspec doctor` — ✓ OpenSpec root: ok（exit 0）
- [x] 9.4 门禁脚本自测：`pnpm run openspec:check -- --self-test` ✓（self-test OK：守卫正/负例 + 版本解析器正/负例）+ `pnpm run openspec:check` ✓（四检查全绿，exit 0）
- [x] 9.5 `git diff --stat` — 确认变更面仅 `.github/workflows/ci.yml` / `scripts/openspec-check.mjs` / `package.json` / `CLAUDE.md` / `README.md` / `docs/architecture.md` / `openspec/**`，零后端/前端/小程序源码变更（git status 核对：无 backend/src、frontend/src、apps/miniprogram 条目）
- [x] 9.6 `cd backend && mvn test` — ✓ **Tests run: 342, Failures: 0, Errors: 0（BUILD SUCCESS，exit 0）**（零后端变更回归确认）
- [x] 9.7 `cd frontend && pnpm run verify` — ✓ **ESLint ✓ + tsc/vite build ✓（2969 模块）+ vitest 51 文件 / 267 用例全过（exit 0）**（stderr Router/act 告警为既有测试噪声）
- [x] 9.8 E2E — 经评估跳过（无 Web 用户流程变更，前后端回归由 9.6/9.7 覆盖；CI job 结构仅在 push 后由 GitHub Actions 实测，本地无法运行 Actions）
- [x] 9.9 归档：✓ 已存档至 `openspec/changes/archive/2026-08-29-wire-openspec-validation-into-ci/`；delta 已 sync → `openspec/specs/openspec-conventions/spec.md`（**5 Requirements / 14 Scenarios** 与 delta 一致：ADDED Requirement "CI 门禁执行 OpenSpec 一致性验证" + 5 Scenarios）；`validate --specs` **67/67** + `--strict` **0 失败**；`pnpm run openspec:check` ✓ 绿（守卫扫描 67 文件 0 命中——主 spec 正文内 delta 头字面量不误报）；活动变更已归零
