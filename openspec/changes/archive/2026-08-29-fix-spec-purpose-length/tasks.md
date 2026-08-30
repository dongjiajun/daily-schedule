# Tasks: fix-spec-purpose-length

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  本变更是纯主 spec 文档修复（17 个 Purpose 段重写），零后端/前端/小程序代码变更：
  1-7 组 N/A，核心实施在 8A（Purpose 重写），9.x 以 strict 校验为核心验收。
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

## 8. 文档同步（主 spec Purpose 修复）

### 8A. 主 spec Purpose 重写（17 个，仅改 `## Purpose` 段落，≥50 字符、无 TBD 占位）
- [x] 8.1 认证/提醒 4 个 — `authentication`（101 字符，JWT 认证授权体系）/ `event-lifecycle`（81，三态生命周期）/ `multi-user-isolation`（96，userId 注入链路）/ `reminder-scheduler`（75，定时轮询提醒）—— TBD 占位全部替换为真实描述
- [x] 8.2 宠物 9 个 — `pet-emotion-state-machine`（61）/ `pet-event-bridge`（71）/ `pet-interaction-particle`（56）/ `pet-interaction-ui`（63）/ `pet-panel-theming`（62）/ `pet-roaming-system`（67）/ `pet-selection`（57）/ `pet-sidebar-presence`（60）/ `pet-status-panel`（61）
- [x] 8.3 前端/通用 4 个 — `frontend-unit-test-coverage`（83）/ `pwa`（83）/ `sidebar-navigation`（60）/ `task-list-view`（52）

### 8B. 存量文档核对（逐项评估）
- [x] 8.4 `docs/frontend/component-catalog.md` — 未触及组件/目录 → 核对结论："现有描述已核对仍准确"
- [x] 8.5 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型 → 核对结论："现有描述已核对仍准确"
- [x] 8.6 `docs/api/overview.md` — 未触及端点/契约 → 核对结论："现有描述已核对仍准确"
- [x] 8.7 `docs/architecture.md` + `CLAUDE.md` — 未触及架构/测试规模（specs-count 不变 67）→ 核对结论："现有描述已核对仍准确"
- [x] 8.8 `README.md` — 未触及版本/功能清单 → 核对结论："现有描述已核对仍准确"
- [x] 8.9 运行 `node scripts/docs-check.mjs` — ✓ "docs-check 全部通过"

## 9. 全量验证
- [x] 9.1 `openspec validate --specs --strict` — ✓ **17 失败 → 0 失败**（核心验收判据；pet-sidebar-presence / sidebar-navigation 首轮 48 字符被拦截，二次补足至 60）
- [x] 9.2 `openspec validate --specs` — ✓ 67/67 全部通过
- [x] 9.3 `cd backend && mvn test` — ✓ BUILD SUCCESS：342 测试 / 0 失败 / 0 错误（零变更确认）
- [x] 9.4 `cd frontend && pnpm run verify` — ✓ 51 文件 / 267 用例通过，VERIFY_EXIT:0（首轮 5 用例在负载下 flaky 失败，复跑两次均全绿；零代码变更，与本变更无关）
- [x] 9.5 E2E — 经评估跳过（无 Web 用户流程变更，提交前后端回归由 9.3/9.4 覆盖）
- [x] 9.6 归档：✓ 已存档至 `openspec/changes/archive/2026-08-29-fix-spec-purpose-length/`（skip_specs 无 delta 同步）；复验 `openspec validate --specs` 67/67、`--strict` 0 失败
