# Tasks: spec-driven-custom-lite

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  本变更是 OpenSpec 元工作流变更（新增 schema + 模板 + 主 spec + 文档），
  零后端/前端/小程序代码变更：1-7 组 N/A，核心实施在 8A（schema/模板）+ 8B（文档同步）。
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

### 8A. lite schema 机制（本变更核心实施）
- [x] 8.1 `openspec/schemas/spec-driven-custom-lite/schema.yaml` — 已创建：3 artifacts（proposal → specs → tasks，**无 design**）；tasks.requires=[proposal,specs]；apply.requires=[tasks]；specs 指令含 Purpose/delta 规范 + lite 提示（决策并入 proposal/tasks，复杂变更改用 custom）
- [x] 8.2 `templates/proposal.md` + `templates/spec.md` — 已从 `spec-driven-custom` 复制（内容一致，头部注释标明单源同步 custom 为先）
- [x] 8.3 `templates/tasks.md` — lite 精简版已建：4 分组（1 实施 / 2 文档同步[逐项评估 + docs-check/sync-version + 2.7 openspec:check] / 3 全量验证 / 4 归档），无 DDD 1-9 固定组
- [x] 8.4 `openspec schema validate spec-driven-custom-lite` — ✓ "Schema is valid"；`openspec schemas` 已注册 `spec-driven-custom-lite (project)`（Artifacts: proposal → specs → tasks）

### 8B. 文档同步
- [x] 8.5 `docs/frontend/component-catalog.md` — 未触及组件/目录 → 核对结论："现有描述已核对仍准确"（无前端变更，9.6 审计确认）
- [x] 8.6 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型 → 核对结论："现有描述已核对仍准确"（零数据库变更）
- [x] 8.7 `docs/api/overview.md` — 未触及端点/契约 → 核对结论："现有描述已核对仍准确"（specs/openapi.yaml 零变更）
- [x] 8.8 `docs/architecture.md` — 措施：**marker 67→68 在归档 sync 时执行**（新主 spec 目录由 sync 创建后才与树一致；apply 阶段 marker 67 = 树 67，docs-check 已绿）；其余（架构/CI 行/测试规模）核对结论："现有描述已核对仍准确"
- [x] 8.9 `CLAUDE.md` — 已更新工作流小节：新增「lite 工作流」bullet（`openspec new change <name> --schema spec-driven-custom-lite`；适用范围；默认不变；模板单源同步 custom 为先）
- [x] 8.10 `README.md` — 未触及版本/功能清单 → 核对结论："现有描述已核对仍准确"（v3.5.1 未变）
- [x] 8.11 已运行 `node scripts/docs-check.mjs`（✓ exit 0）+ `./scripts/sync-version.sh --check`（✓ exit 0）

## 9. 全量验证
- [x] 9.1 `openspec schema validate spec-driven-custom-lite` — ✓ 通过（结构 + 模板）
- [x] 9.2 `openspec validate --changes spec-driven-custom-lite --strict` — ✓ 1 passed（新能力 Purpose ≥50 字符 + 3 Requirements/Scenarios 合规）
- [x] 9.3 `openspec validate --specs --strict` — ✓ **67 PASS / 0 FAIL**（基线保持；68 在归档 sync 后）
- [x] 9.4 冒烟 — ✓ TEMP 根：`openspec new change smoke-lite`（config schema: lite）→ status **proposal/specs/tasks 三工件（无 design）** + instructions proposal/tasks 渲染含 LITE 4 组指令 → 临时根已删除（不落项目）
- [x] 9.5 `pnpm run openspec:check` — ✓ 五检查全绿（含 --archived）
- [x] 9.6 `git status` 审计 — 变更面 = `openspec/schemas/spec-driven-custom-lite/**` / `openspec/changes/spec-driven-custom-lite/` / `CLAUDE.md`，**零后端/前端/小程序源码变更**（docs/architecture.md 的 M 为先前变更同一工作树）
- [x] 9.7 `cd backend && mvn test` — ✓ **Tests run: 342, Failures: 0, Errors: 0（BUILD SUCCESS，exit 0）**（零后端变更回归确认）
- [x] 9.8 `cd frontend && pnpm run verify` — ✓ **ESLint ✓ + tsc/vite build ✓（2969 模块）+ vitest 51 文件 / 267 用例全过（exit 0）**（首轮与后端并行时 3 个"模块可导入"5s 超时——机器负载 flaky；后端结束后**单独重跑 35s 全过**，确认与本次变更无关）
- [x] 9.9 E2E — 经评估跳过（无 Web 用户流程变更，前后端回归由 9.7/9.8 覆盖）
- [x] 9.10 归档：✓ 已存档至 `openspec/changes/archive/2026-08-30-spec-driven-custom-lite/`；delta 已 sync → `openspec/specs/spec-driven-custom-lite/spec.md`（新主 spec：Purpose + 3 Requirements / 8 Scenarios，与 delta 一致）；`docs/architecture.md` specs-count marker **67→68**；复跑 `validate --specs --strict` ✓ **68/68** + docs-check ✓（specs-count 68）+ `pnpm run openspec:check` ✓ 五检查全绿（守卫 68 文件 0 命中）；归档后复跑 `validate --archived` ✓ **63/63**（62 + 本归档自身）
