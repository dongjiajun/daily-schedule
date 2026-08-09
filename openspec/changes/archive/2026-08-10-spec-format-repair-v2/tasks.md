# Tasks: spec-format-repair-v2

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  本变更为主 specs 格式修复 + 计数同步：无后端/前端业务代码改动。
-->

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无后端领域层变更

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 N/A — 无后端基础设施层变更

## 4. 应用层 (application/)
- [x] 4.1 N/A — 无后端应用层变更

## 5. API 层 (api/)
- [x] 5.1 N/A — 无后端 API 层变更

## 6. 契约同步
- [x] 6.1 N/A — 无 API 契约变更（specs/openapi.yaml 不改）
- [x] 6.2 N/A — 无契约变更，无需 CHANGELOG 条目
- [x] 6.3 N/A — 版本号不动：pom.xml + package.json + openapi.yaml 均维持 3.3.4
- [x] 6.4 N/A — 无契约变更，无需 mvn compile 重新生成
- [x] 6.5 N/A — 无契约变更，无需 generate:api

## 7. 前端 (frontend/src/)
- [x] 7.1 N/A — 无前端代码变更

## 8. 文档同步（主 specs 格式修复 + 计数同步）

### 8A. 主 spec 修复
- [x] 8.1 修复 `openspec/specs/ci-actions-maintenance/spec.md`：`## ADDED Requirements` → `## Requirements`（需求内容、场景、Test Coverage 表均不变）
- [x] 8.2 修复 `openspec/specs/pet-roaming-system/spec.md`：需求 8 改为短标题 `格内物理互动` + 正文首行 SHALL 句（7 个场景保留）；需求 9 改为短标题 `格内状态机驱动` + 正文首行 SHALL 句（4 个场景保留）

### 8B. 计数同步（归档 phase2-execution-planning 联动）
- [x] 8.3 更新 `docs/architecture.md`：`specs-count` 52 → 53（`openspec/specs/` 新增 phase2-execution-planning 目录）

### 8C. 存量文档核对
- [x] 8.4 `docs/frontend/component-catalog.md` — 未触及（无组件变更）→ 现有描述已核对仍准确
- [x] 8.5 `docs/database/schema.md` + `docs/uml/README.md` — 未触及 → 现有描述已核对仍准确
- [x] 8.6 `docs/api/overview.md` — 未触及（无端点变更）→ 现有描述已核对仍准确
- [x] 8.7 `docs/planning/execution-plan.md` + `CLAUDE.md` — 未触及架构；CLAUDE.md 版本/测试覆盖声明不变 → 现有描述已核对仍准确
- [x] 8.8 `README.md` — 未触及 → 现有描述已核对仍准确
- [x] 8.9 运行 `node scripts/docs-check.mjs` — 全绿（specs-count=53 声明生效）

## 9. 全量验证
- [x] 9.1 `openspec validate --specs` — 53/53 全部通过（本变更核心验收判据）
- [x] 9.2 `node scripts/docs-check.mjs` — 全绿
- [x] 9.3 `cd backend && mvn test` — 后端回归通过
- [x] 9.4 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 回归通过
- [x] 9.5 N/A — 纯 spec/文档变更，无用户流程变化，E2E 由 CI 兜底（不触碰任何业务代码）
