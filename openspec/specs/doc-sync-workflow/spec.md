# Doc Sync Workflow

## Purpose

确保代码变更后文档同步不遗漏：通过 OpenSpec tasks 模板、config rules、CLAUDE.md 检查清单三层机制约束文档更新，并规范 docs/ 目录生命周期（当前真值 vs 归档）与规划文档组织。
## Requirements
### Requirement: Tasks 模板强制包含文档同步阶段
`openspec/schemas/spec-driven-custom/templates/tasks.md` SHALL 包含独立的"文档同步"阶段（非可选收尾），在契约同步之后、验证之前。

#### Scenario: 新变更生成 tasks 时自动包含文档检查
- **WHEN** 开发者通过 `/opsx:propose` 或 `/opsx:ff` 创建新变更
- **THEN** 生成的 tasks.md 包含"文档同步"阶段，列出需检查的文档文件

### Requirement: Config rules 声明文档检查规则
`openspec/config.yaml` 的 `rules.tasks` SHALL 包含三条文档检查规则：新组件→component-catalog.md、新实体/表→schema.md、新端点→overview.md。

#### Scenario: AI 在 task 生成阶段收到规则约束
- **WHEN** AI 读取 config.yaml 的 rules.tasks 约束
- **THEN** AI 在生成 tasks 时自动将对应的文档检查项写入任务列表

### Requirement: CLAUDE.md 提交前验证包含文档检查
CLAUDE.md 的"提交前验证"章节 SHALL 要求提交前检查 `docs/` 下文档是否需要同步更新。

#### Scenario: 开发者提交前执行完整验证
- **WHEN** 开发者在提交前阅读 CLAUDE.md 验证清单
- **THEN** 清单明确提示"检查 docs/ 目录文档是否需要同步"

### Requirement: docs/ 目录只保留"当前真值"
`docs/` 目录 SHALL 仅包含反映当前代码状态的参考文档；历史决议、一次性验收报告、已完成变更的中间产物 SHALL 归档至 `openspec/changes/archive/<date>-<name>/`，而非保留在 docs/ 中。

#### Scenario: 一次性验收报告归入归档
- **GIVEN** 已完成的 `docs/phase1-verification-report.md`（结论已沉淀在 OpenSpec 归档 `2026-07-27-phase1-stability-verification`）
- **WHEN** 执行文档组织清理
- **THEN** 报告文件移至归档目录，docs/ 中不再保留

#### Scenario: 新增一次性文档时遵循生命周期
- **WHEN** 未来产生验收报告、评审纪要等一次性文档
- **THEN** 直接写入对应 OpenSpec 变更目录或归档，不进入 docs/

### Requirement: 规划文档统一收纳于 docs/planning/ 并带状态标记
规划类文档（路线图、执行计划）SHALL 集中存放于 `docs/planning/` 目录，文件头部 SHALL 标注状态与版本说明，避免与常驻技术参考混放、避免过时不可辨。

#### Scenario: 规划文档状态标记可识别时效
- **WHEN** 读者浏览 `docs/planning/` 下文档
- **THEN** 通过头部状态标记立即判断哪些章节已完成、哪些仍在规划，且版本号标注为内部代号

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
- **GIVEN** 清理后 CLAUDE.md 为 176 行
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

### Requirement: 主 specs 结构有效性
所有主 spec（`openspec/specs/<capability>/spec.md`）SHALL 通过 `openspec validate --specs`：每个 spec SHALL 包含 `## Purpose` 与 `## Requirements` 两个必选段，每个需求 SHALL 包含至少一个 `#### Scenario:` 块。归档 sync 之后 SHALL 运行 `openspec validate --specs` 确认全绿。

#### Scenario: 归档后主 specs 全绿
- **GIVEN** 变更归档且 delta specs 已同步至 `openspec/specs/` 主目录
- **WHEN** 运行 `openspec validate --specs`
- **THEN** 全部主 spec 通过（无缺失 Purpose / Requirements / Scenario 错误）

#### Scenario: 新 spec 结构不完整时校验失败
- **WHEN** 某主 spec 缺少 `## Purpose` 段或某需求缺少 Scenario 块
- **THEN** `openspec validate --specs` 报告该 spec 无效，直至修复结构

### Requirement: tasks 模板双源同步维护
tasks 模板的任何修改 SHALL 同时落地两处：`openspec/schemas/spec-driven-custom/templates/tasks.md` 与 `openspec/schemas/spec-driven-custom/schema.yaml` 内嵌模板，保持内容一致，避免 `/opsx:ff` 与 `/opsx:continue` 生成结果分叉。

#### Scenario: 修改模板后两处一致
- **GIVEN** 修改 tasks 模板（如 smoke test 占位符调整）
- **WHEN** 检查 schema.yaml 中内嵌的对应段落
- **THEN** 两处文本一致，无遗漏

#### Scenario: 生成 tasks 时应用最新模板
- **WHEN** 开发者通过 `/opsx:propose` 或 `/opsx:ff` 创建新变更
- **THEN** 生成的 tasks.md §9.4 包含可替换的 smoke test 示例项（非空白注释框）

