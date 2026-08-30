# Design: wire-archived-into-ci

## Context
`wire-openspec-validation-into-ci` 已把 OpenSpec 一致性接入 CI：`scripts/openspec-check.mjs` 四子检查（validate --all --strict / doctor / 主 spec 无 delta 头 / CLI 版本=声明），`ci.yml` 的 `openspec-validation` job 钉版安装并运行。归档完整性（`openspec validate --archived`）当时因 10 个历史归档 tasks 未全勾而**故意未纳入**（Non-Goal + 后续前置）；`backfill-archive-task-completion` 已补正（`--archived` 61/61 全绿，含移交用户语义的观感项记录），前置达成，本变更补第 5 子检查。

约束：
- `ci.yml` 结构不动（job 已调用本脚本，脚本新增检查即生效）
- 既有 4 检查的顺序与语义不重排、不改变（`--archived` 作为追加项）
- `openspec-conventions` 主 spec 的「CI 门禁」Requirement 是**约定需求**，须经 delta MODIFIED 同步（与 docs-sync-guarantee 对既有约定能力的先例一致）

## Goals / Non-Goals

**Goals:**
- `scripts/openspec-check.mjs` 新增第 5 子检查 `openspec validate --archived --no-interactive`，任一归档残留 `- [ ]` 即非零退出
- `openspec-conventions` 主 spec 的 CI 门禁 Requirement 同步为 5 项检查 + 新 Scenario
- CLAUDE.md / architecture.md / README.md 门禁描述补 `--archived`，与脚本/主 spec 口径一致

**Non-Goals:**
- 不改 `ci.yml` job 结构（不新增 job/步骤）
- 不重排既有 4 检查（顺序参考主 spec 清单）
- 不改变 `--self-test`（无新检测器——第 5 检查为纯 CLI 调用，其失效由 validate 调用失败自然暴露）

## Decisions

### Decision 1: 第 5 检查作为脚本追加项，而非独立 job
- **选择**: `openspec-check.mjs` 主流程末尾追加 `runOpenSpec(['validate', '--archived', '--no-interactive'])`；CI job 零改动
- **理由**: 检查属于同一门禁职责域（OpenSpec 一致性），同 job 内一次安装/一次运行，失败归因与既有 4 检查一致；`--archived` 是全库级检查（~61 个归档），无独立平行价值
- **备选方案**: 独立 `archived-validation` CI job——重复安装 CLI、扩大 CI 面，否决；并入 version-check job——混淆职责，否决

### Decision 2: 用 delta MODIFIED 同步主 spec，而非直接编辑主 spec
- **选择**: 本变更携带 `specs/openspec-conventions/spec.md`（`## MODIFIED Requirements`，完整重贴 Requirement + 追加第 5 项 + 新 Scenario），apply/sync 时合并进主 spec
- **理由**: 该 Requirement 是项目约定（openspec-conventions 能力）的正式规范，检查项变化属需求级变更；与 `docs-sync-guarantee` 对 doc-sync-workflow 做 MODIFIED 的先例一致；主 spec 唯一权威、delta 可审计
- **备选方案**: 直接编辑主 spec（skip_specs 或裸改）——绕过流程留痕，否决

### Decision 3: 第 5 项检查失败语义 = 归档完整性门禁
- **选择**: `--archived` 检查归档变更 tasks 全部 `- [x]`；因 backfill 已把"用户跟进观感项"记录为移交用户（勾选补正 + 原文保留），门禁不会误阻用户跟进项
- **理由**: 门禁衡量的是"流程留痕完整性"而非"目测已发生"；backfill 的移交语义与之配套，避免归档完整性检查与用户跟进项长期冲突
- **备选方案**: 对观感项豁免——无机制支持、且不必要（已在勾选状态自洽），否决

## DDD Layer Design
无。本变更为 CI 门禁脚本 + 工作流约定文档，后端零代码。

## API Design
无。`specs/openapi.yaml` 零变更。

## Database Design
无。无 Flyway 迁移。

## Risks / Trade-offs
- [未来归档漏勾 → CI 红] → 正是门禁意图；修复指引由 `--archived` 输出（N incomplete tasks）给出
- [backfill 注释与门禁误读] → 脚本仅认勾选状态；观感项移交语义已记录于背书记录注释
- [第 5 检查拖长 job ~数秒] → `--archived` 为本地校验（61 归档），耗时可忽略

## Migration Plan
1. 改脚本 → 2. docs 三处 → 3. 本地 `pnpm run openspec:check` 全绿 → 4. 前后端回归 → 5. 归档（sync 主 spec）；回滚 = revert 脚本/文档（无数据迁移）

## Open Questions
- 无——第 5 检查与 docs-sync 已对齐，无待决项
