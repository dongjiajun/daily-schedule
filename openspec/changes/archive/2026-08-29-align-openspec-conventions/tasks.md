# Tasks: align-openspec-conventions

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  本变更是纯 OpenSpec 元工作流变更（模板/schema/config/CLAUDE.md），
  零后端/前端/小程序代码变更：1-7 组 N/A，核心实施在 8A（机制修订）+ 8B（文档同步）。
-->

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更

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
- [x] 6.2 N/A — specs/CHANGELOG.md 无新增 API 变更
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

### 8A. OpenSpec 元工作流机制修订（本变更核心实施）
- [x] 8.1 `openspec/schemas/spec-driven-custom/templates/spec.md` — 已在 `## ADDED Requirements` 前加 `## Purpose` 段（注释明确：仅新能力、≥50 字符、已存在能力 delta 不得携带、改已有 Purpose 直接编辑主 spec）
- [x] 8.2 `openspec/schemas/spec-driven-custom/schema.yaml` — `specs.instruction` 补 Purpose 规范（新能力必带 ≥50 字符 / 已存在能力不带 / 改已有 Purpose 编辑主 spec）+ `retire_capabilities` 提及；`proposal.instruction` 补 `skip_specs: true` 用法
- [x] 8.3 `openspec/config.yaml` — `context` 刷新到 v3.5.1 当前事实（DDD 四层、契约管道、frontend modules、apps/miniprogram、shared 包、测试规模、docs 自动化）；`rules` 单源化（删除纯格式重复项：模板结构/delta 格式/Decision 编号/1-9 分组/8.x 逐项评估；新增 skip_specs 规则）
- [x] 8.4 `openspec/schemas/spec-driven-custom/templates/{proposal,design,tasks}.md` — proposal 模板 Capabilities 补 skip_specs 注释；design/tasks 模板核对无与新规范冲突表述

### 8B. 文档同步
- [x] 8.5 `docs/frontend/component-catalog.md` — 未触及组件/目录 → 核对结论："现有描述已核对仍准确"（git 变更面仅 openspec/* + CLAUDE.md，无前端组件/目录变更）
- [x] 8.6 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型 → 核对结论："现有描述已核对仍准确"（零数据库变更）
- [x] 8.7 `docs/api/overview.md` — 未触及端点/契约 → 核对结论："现有描述已核对仍准确"（specs/openapi.yaml 零变更）
- [x] 8.8 `docs/architecture.md` + `CLAUDE.md` — 已更新 `CLAUDE.md` OpenSpec 工作流小节：artifact 顺序修正（`proposal → specs → design → tasks`）、补 skip_specs 说明、补新能力 delta Purpose 规范、补 OpenSpec CLI 1.11.0 说明；`docs/architecture.md` 核对结论："现有描述已核对仍准确"（架构/模块/测试规模无变化）
- [x] 8.9 `README.md` — 未触及版本/功能清单 → 核对结论："现有描述已核对仍准确"（v3.5.1 未变，无新能力）
- [x] 8.10 运行 `node scripts/docs-check.mjs` — ✓ "docs-check 全部通过"（exit 0）

## 9. 全量验证
- [x] 9.1 `openspec schema validate spec-driven-custom` — ✓ "Schema 'spec-driven-custom' is valid"
- [x] 9.2 `openspec validate --changes align-openspec-conventions` — ✓ strict 下 "Change ... is valid"（delta Purpose ≥50 字符）
- [x] 9.3 `openspec validate --specs` — ✓ 66 PASS / 0 FAIL
- [x] 9.4 `openspec validate --specs --strict` — ✓ 17 失败 = 1.11.0 基线（无新增回归；17 个短 Purpose 由独立 change 处理）
- [x] 9.5 `cd backend && mvn test` — ✓ **BUILD SUCCESS：342 测试 / 0 失败 / 0 错误**（常规 shell 复跑通过，先前失败确认为沙箱环境问题）
- [x] 9.6 `cd frontend && pnpm run verify` — ✓ **VERIFY_EXIT:0**：lint ✓ + tsc/vite build ✓（2969 模块）+ vitest 51 文件 267 用例全过（stderr 的 Router/act 告警为既有测试噪声，不影响通过）
- [x] 9.7 E2E — 经评估跳过（无 Web 用户流程变更，提交前后端回归由 9.5/9.6 覆盖）
- [x] 9.8 新模板 smoke：`openspec instructions specs --change align-openspec-conventions` — ✓ 模板含 `## Purpose`、context 含 v3.5.1/apps/miniprogram/modules/shared/pet、proposal instruction 含 skip_specs
- [x] 9.9 归档：✓ 已存档至 `openspec/changes/archive/2026-08-29-align-openspec-conventions/`；delta 已 sync → `openspec/specs/openspec-conventions/spec.md`（4 Requirements / 9 Scenarios 与 delta 一致，67/67 validate 通过）；`docs/architecture.md` specs-count marker 66→67，docs-check 全绿
