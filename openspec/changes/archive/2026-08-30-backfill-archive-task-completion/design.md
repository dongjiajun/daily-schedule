# Design: backfill-archive-task-completion

## Context
10 个历史归档变更（2026-07-19 ~ 2026-08-26）的 `tasks.md` 勾选状态早于勾选纪律（该纪律由 `align-openspec-conventions`/`docs-sync-guarantee` 明确）：61 项 `- [ ]` 中，绝大多数是**已落地**的 smoke/verify/模板修复项（对应功能在 v3.5.1 均可用），2 项是**移交用户**目测的观感项（leaf-heart-fall-effects 真实节日视觉、rhythm-e2e-stability 回窝动画时长）。`openspec validate --archived` 因此 10/59 红，阻断将 `--archived` 接入 CI 门禁。

约束：
- 只改归档内 `tasks.md`（已 version-controlled 项目数据，正文是历史留痕，须轻量改动而非重写）
- `validate --archived` 的计数语义 = tasks.md 内全部 `- [ ]` / `- [x]` 行（含嵌套子行）
- 勾选补正须可追溯（记录日期/变更/依据），不得伪造"当时已勾"的历史

## Goals / Non-Goals

**Goals:**
- 10 个归档 tasks.md 的 61 个未勾选项补正为完成，`openspec validate --archived` 59/59
- 每文件留一行 backfill 记录注释（可追溯）；2 个用户跟进观感项语义保留（移交用户）
- 为后续"把 `validate --archived` 接入 openspec-check.mjs"提供全绿前置

**Non-Goals:**
- 不重写/规范化归档 tasks.md 的既有结构（历史留痕最小改动）
- 不修改代码/前端/小程序/契约/基准文档
- 本次不接入 `validate --archived` 门禁（下一独立变更）
- 不声称已替用户完成目测观感项

## Decisions

### Decision 1: 逐行补正 + 头部注释，而非整文件重写
- **选择**: 每个归档 tasks.md 仅做两件事——`^\s*- \[ \]` → `- [x]` 逐行替换；标题下插入一行 `<!-- backfilled: ... -->` 注释
- **理由**: 最小 diff、历史正文（任务描述/分组/编号/顺序）零改动，可审查性与可追溯性最好；`validate --archived` 只认勾选状态，注释不干扰
- **备选方案**: 整文件按当前模板重排——diff 噪音大、破坏历史留痕，否决；删除未勾项——丢失任务记录，否决

### Decision 2: 用户跟进观感项"勾选补正 + 原文保留"
- **选择**: leaf-heart-fall-effects / rhythm-e2e-stability 的观感项也 `- [x]`，但保留原文"建议用户在实际节日/时段目测确认"，并在文件背书记录注释中注明"该两项为移交用户跟进"
- **理由**: 任务的**动作**是"移交用户"（代理人无法执行目测），移交已完成即该任务关闭；勾选语义 = 流程留痕补正，而非已目测——避免 `--archived` 永久红
- **备选方案**: 保持未勾——`--archived` 永久红，否决；删除条目——丢失观感提示，否决

### Decision 3: 用 skip_specs 出口，不建 delta
- **选择**: `.openspec.yaml` 设 `skip_specs: true`，零 delta specs
- **理由**: 无 spec 级行为变化（只改归档勾选）；官方规则对零 delta + skip_specs 放行，符合 `openspec-conventions` 已确立的约定
- **备选方案**: 建 delta——本无行为语义可描述，仅为流程而造 delta，否决

### Decision 4: 本轮不接 `--archived` 门禁
- **选择**: 本 change 收尾于 `validate --archived` 全绿 + 前后端回归；`openspec-check.mjs` 增加 `--archived` 子检查另开独立小变更（依赖本 change 全绿为前置）
- **理由**: 聚焦"修复历史留痕"单一目标；门禁接入需同步 ci.yml/CLAUDE.md/架构文档与主 spec Requirement，混入本变更会扩大审查面
- **备选方案**: 同 change 一并接线——一次闭环但混合两个关注点，否决（列为下一候选）

## DDD Layer Design
无。本变更为归档元数据补正，后端零代码。

## API Design
无。`specs/openapi.yaml` 零变更。

## Database Design
无。无 Flyway 迁移。

## Risks / Trade-offs
- [61 处批量改动误漏/误改其他格式行] → 以 `^\s*- \[ \]` 全集扫描定位 + `validate --archived` 终验（任一残留即红）
- [观感项被误读为"已目测" ] → 文件背书记录注释与任务原文双重明示"移交用户跟进"
- [backfill 注释被认为污染历史] → 注释记录变更名与日期，属可审计的留痕补正（与 docs-sync-guarantee 的"归档 vs 当前真值"原则一致）

## Migration Plan
1. 按文件补正 → 2. `validate --archived` 59/59 → 3. 前后端回归保持 → 4. 归档；回滚 = revert 勾选/注释（无数据迁移）

## Open Questions
- 是否在下一变更同时更新 `openspec-conventions` 主 spec（把 `--archived` 纳入 CI 门禁 Requirement）？——计划纳入，与脚本/文档一起做
