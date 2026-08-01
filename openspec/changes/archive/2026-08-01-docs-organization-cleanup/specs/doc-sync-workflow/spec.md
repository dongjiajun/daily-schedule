# Doc Sync Workflow

## MODIFIED Requirements

### Requirement: docs/ 目录只保留"当前真值"
`docs/` 目录 SHALL 仅包含反映当前代码状态的参考文档；历史决议、一次性验收报告、已完成变更的中间产物 SHALL 归档至 `openspec/changes/archive/<date>-<name>/`，而非保留在 docs/ 中。

#### Scenario: 一次性验收报告归入归档
- **GIVEN** 已完成的 `docs/phase1-verification-report.md`（结论已沉淀在 OpenSpec 归档 `2026-07-27-phase1-stability-verification`）
- **WHEN** 执行本次文档组织清理
- **THEN** 报告文件移至归档目录，docs/ 中不再保留

#### Scenario: 新增一次性文档时遵循生命周期
- **WHEN** 未来产生验收报告、评审纪要等一次性文档
- **THEN** 直接写入对应 OpenSpec 变更目录或归档，不进入 docs/

### Requirement: 规划文档统一收纳于 docs/planning/ 并带状态标记
规划类文档（路线图、执行计划）SHALL 集中存放于 `docs/planning/` 目录，文件头部 SHALL 标注状态与版本说明，避免与常驻技术参考混放、避免过时不可辨。

#### Scenario: 规划文档合并与状态标记
- **GIVEN** `docs/vision-roadmap-draft.md` 与 `docs/execution-plan.md` 内容重叠且数字过时
- **WHEN** 执行本次清理
- **THEN** 两文档合并为 `docs/planning/execution-plan.md`，头部标注 `状态: 📋 规划中` 及版本说明，过时的 CI 门禁数（五层）、测试数（后端 257 / 前端 166 / E2E 25）与实际一致

#### Scenario: 新成员通过状态标记识别文档时效
- **WHEN** 新成员浏览 `docs/planning/` 下文档
- **THEN** 通过头部状态标记立即判断哪些章节已完成、哪些仍在规划

## ADDED Requirements

### Requirement: CLAUDE.md 文档检查覆盖不走 OpenSpec 流程的小改动
CLAUDE.md 的"文档检查"章节 SHALL 明确：不走 OpenSpec 流程的小改动（热修、文档勘误）同样适用文档同步检查清单，提交前逐项核对。

#### Scenario: 小改动提交前执行文档核对
- **GIVEN** 开发者直接修改代码未创建 OpenSpec 变更（如紧急热修）
- **WHEN** 提交前阅读 CLAUDE.md 验证清单
- **THEN** 清单提示检查 docs/、specs/ 是否需同步更新，弥补流程外变更的文档盲区

### Requirement: 规划版本号声明为内部代号
规划文档中的版本号（v4.0/v4.5/v5.0）SHALL 明确标注为"内部规划代号"，与实际契约版本号（specs/openapi.yaml ↔ backend/pom.xml ↔ frontend/package.json 三处同步的 v3.x）独立演进，消除"两个官方版本"歧义。

#### Scenario: 规划文档与契约版本并存不冲突
- **GIVEN** 规划文档头部声明"v4.0/v4.5/v5.0 为内部规划代号"
- **WHEN** 读者对比规划版本与代码中实际版本（v3.3.0）
- **THEN** 能立即理解二者关系，不产生"版本不一致"的困惑

### Requirement: CLAUDE.md 保持精简（100-200 行）
CLAUDE.md 篇幅 SHALL 维持在官方建议的 100-200 行范围内，只保留核心约定与高频命令，查表型与重复型信息外移或精简。

#### Scenario: CLAUDE.md 行数检查
- **GIVEN** 清理后 CLAUDE.md 目标 ~160 行
- **WHEN** 未来新增内容导致行数接近或超过 200 行
- **THEN** 应优先精简/外移，而非无节制增长

### Requirement: 冗余文档移除
- `frontend/README.md` SHALL 被删除（描述废弃目录结构，内容与根 README + CLAUDE.md 重复）
- `memory/` 目录 SHALL 被删除（`feedback-process.md` 约束已并入 CLAUDE.md 文档检查段落，`v1.1-improvements.md` 为历史记录已被 CHANGELOG 覆盖；项目 memory/ 不被会话自动加载，无约束力）
- `README.md` 文档索引表 SHALL 同步移除被删文档条目

#### Scenario: 删除后无引用残留
- **GIVEN** 删除 `frontend/README.md`、`memory/` 目录
- **WHEN** 全仓库搜索 `frontend/README.md` 与 `memory/` 路径引用
- **THEN** 仅剩 README.md 文档索引表条目（已同步移除），无其他断链
