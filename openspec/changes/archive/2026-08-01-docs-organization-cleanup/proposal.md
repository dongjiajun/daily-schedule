# Proposal: 文档组织清理与 CLAUDE.md 精简

## Why
项目文档经过 v3.1 → v3.3.0 多轮迭代后出现三类问题：**(1) 冗余** — `frontend/README.md` 描述的是已废弃的旧目录结构，`memory/` 目录存有 v1.1 时代历史记录且不被任何机制自动加载（约束力为零），`docs/phase1-verification-report.md` 为一次性验收报告（结论已沉淀在 OpenSpec 归档）；**(2) 过时** — 规划文档（`execution-plan.md`/`vision-roadmap-draft.md`）中的 CI 门禁数、测试数停留在 Phase 0 时代，且与实际情况冲突；**(3) 双轨** — 规划文档声称"v4.5 就绪"，实际契约版本为 v3.3.0，存在"两个官方版本号"的歧义。此外 `CLAUDE.md` 已达 225 行，超出官方建议的 100-200 行范围，查表型信息稀释核心约束的注意力。

## What Changes
- **删除** `frontend/README.md` — 目录结构描述已过时（旧 `src/hooks/`、`src/components/event/` 结构），内容与根 `README.md` + `CLAUDE.md` 重复
- **删除** `memory/` 目录（`feedback-process.md` + `v1.1-improvements.md`）— 无外部引用；feedback 内容并入 CLAUDE.md 文档检查段落（见下），历史记录已由 git + CHANGELOG 覆盖
- **迁移** `docs/phase1-verification-report.md` → `openspec/changes/archive/2026-07-27-phase1-stability-verification/` — 一次性记录归归档，docs/ 只放"当前真值"
- **合并** `docs/vision-roadmap-draft.md` + `docs/execution-plan.md` → `docs/planning/execution-plan.md`（新建目录），删除草案文件；更新 CI 门禁数（五层）、测试数（257/166/25）等过时数字
- **版本号双轨**：规划文档声明 v4.0/v4.5/v5.0 为**内部规划代号**，与实际契约版本号（v3.x）独立演进，消除"两个官方版本"歧义
- **精简** `CLAUDE.md` 225 → ~160 行：删除"关键路径"与"本地环境"段、压缩命令查表（首次设置移入 README 引用）、架构段指针化（详情指向 `docs/architecture.md`）；在"文档检查"段落补充"不走 OpenSpec 流程的小改动同样适用文档检查清单"的兜底规则
- **更新** `README.md` 文档索引表，移除已删除文档条目

## Capabilities

### New Capabilities
<!-- 无新增 capability，均为对现有文档同步工作流的修订 -->

### Modified Capabilities
- `doc-sync-workflow`: 文档生命周期规范修订——docs/ 目录只保留"当前真值"（历史决议/验收报告归 OpenSpec 归档）、规划文档统一收纳于 docs/planning/ 并带状态标记、CLAUDE.md 文档检查覆盖不走 OpenSpec 流程的小改动、规划版本号与契约版本号解耦（内部代号声明）

## API Contract Impact
无影响。不涉及 specs/openapi.yaml 的端点、schema 或版本号变更（v3.3.0 保持不变）。

## DDD Layer Impact
无影响。纯文档层变更，不触碰后端任何层级。

## Database Impact
无需 Flyway 迁移。

## Impact
| 范围 | 详情 |
|------|------|
| **删除** | `frontend/README.md`、`memory/feedback-process.md`、`memory/v1.1-improvements.md`（目录随删）、`docs/vision-roadmap-draft.md` |
| **迁移** | `docs/phase1-verification-report.md` → `openspec/changes/archive/2026-07-27-phase1-stability-verification/` |
| **合并** | `docs/execution-plan.md` + 愿景章节 → `docs/planning/execution-plan.md` |
| **精简** | `CLAUDE.md`（~160 行，含小改动兜底句） |
| **更新** | `README.md` 文档索引表 |
| **版本号** | 无契约版本变更；仅规划文档增加"内部代号"声明 |
| **测试** | 无 — 不涉及代码 |
| **风险评估** | 低 — 唯一需注意的引用点是 README.md 文档表（同步更新）；CLAUDE.md 精简需逐段核对保留核心约定 |
