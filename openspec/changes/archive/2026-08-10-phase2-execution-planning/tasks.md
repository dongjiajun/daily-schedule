# Tasks: phase2-execution-planning

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  本变更为文档 + 检查脚本变更：无后端/前端业务代码改动，核心实施集中在 8. 文档同步分组。
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
- [x] 7.1 N/A — 无前端代码变更（frontend/src/ 不修改）

## 8. 文档同步（含执行规划文档与检查脚本）

### 8A. 执行规划文档
- [x] 8.1 新增 `docs/planning/phase2-execution-plan.md`：
  - 演进顺序与依赖分析（小程序主链先行 → 习惯/专注并行支线 → 宠物 v2 依赖资源经济闭环 → 稳定性收尾）
  - 里程碑分组 M2.1-2.2 / M2.3 / M2.4 / M2.5 + 任务清单（`- [ ] <kebab-name> — 描述`，每项 = 一个 OpenSpec 变更，名称与归档目录去日期前缀后一致）
  - marker `<!-- DOCS-CHECK: phase2-changes=0 -->`（初始 0）+ 同步规则说明 + 完成/移除条件

### 8B. 检查脚本
- [x] 8.2 `scripts/docs-check.mjs` COUNTERS 新增 `phase2-changes`：解析文档任务行（`^- \[[ x]\] ([a-z][a-z0-9-]*)`），与 `openspec/changes/archive/` 目录名（去 `YYYY-MM-DD-` 前缀）求交集计数；文档不存在时该 counter 不被触发（marker 随文档消失）<br>**附带修复**：`MARKER_RE` 的 key 模式 `[a-z-]+` 不支持数字（`phase2-changes` 含 `2` 导致 marker 静默不被解析），改为 `[a-z][a-z0-9-]*`

### 8C. 引用与核对
- [x] 8.3 `docs/planning/execution-plan.md` — Phase 2 小节加新文档引用
- [x] 8.4 `docs/frontend/component-catalog.md` — 未触及（无组件变更）→ 现有描述已核对仍准确
- [x] 8.5 `docs/database/schema.md` + `docs/uml/README.md` — 未触及（无表/字段/领域模型变更）→ 现有描述已核对仍准确
- [x] 8.6 `docs/api/overview.md` — 未触及（无端点变更）→ 现有描述已核对仍准确
- [x] 8.7 `docs/architecture.md` + `CLAUDE.md` — 未触及架构；docs-check 的 CLAUDE.md 描述（"版本声明/端点覆盖/结构计数"）仍准确，新增 counter 属脚本内部实现 → 现有描述已核对仍准确
- [x] 8.8 `README.md` — 未触及（版本/功能清单不变）→ 现有描述已核对仍准确
- [x] 8.9 运行 `node scripts/docs-check.mjs` — 全绿（新 marker 声明 0 与实际归档交集 0 一致；修复 MARKER_RE 后复验仍全绿）

## 9. 全量验证
- [x] 9.1 `node scripts/docs-check.mjs --self-test` — 检测器自检通过
- [x] 9.2 counter 防呆验证：临时 fixture 构造两场景——(a) 归档目录存在但文档 marker 未 +1 → docs-check 非零退出（实际=1 声明=0）；(b) 文档任务标 [x] 且 marker +1 但无归档 → docs-check 非零退出（实际=0 声明=1）；清理 fixture 后恢复全绿。**期间发现 MARKER_RE 缺陷并修复（见 8.2 备注），修复后两场景均正确拦截**
- [x] 9.3 `cd backend && mvn test` — 后端回归通过
- [x] 9.4 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest（50 文件 238 用例）回归通过
- [x] 9.5 N/A — 纯文档/脚本变更，无用户流程变化，E2E 由 CI 兜底（不触碰 backend/src、frontend/src、packages/shared 任何业务代码）
