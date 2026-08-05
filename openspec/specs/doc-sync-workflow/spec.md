# Doc Sync Workflow

## Purpose

确保代码变更后文档同步不遗漏：通过 OpenSpec tasks 模板、config rules、CLAUDE.md 检查清单三层机制约束文档更新，并规范 docs/ 目录生命周期（当前真值 vs 归档）与规划文档组织。

## Requirements
### Requirement: Tasks 模板强制包含文档同步阶段
`openspec/schemas/spec-driven-custom/templates/tasks.md` SHALL 包含独立的"文档同步"阶段（非可选收尾），在契约同步之后、验证之前。该阶段的条目 SHALL 为逐项评估语义：固定列出的每类文档（component-catalog / schema+uml / overview / architecture+CLAUDE.md / README）必须给出"已更新"或"现有描述已核对仍准确"的明确结论，不得仅以"无新增"标记 N/A；阶段末 SHALL 包含运行 `node scripts/docs-check.mjs` 且通过的验证条目。

#### Scenario: 新变更生成 tasks 时自动包含文档检查
- **WHEN** 开发者通过 `/opsx:propose` 或 `/opsx:ff` 创建新变更
- **THEN** 生成的 tasks.md 包含"文档同步"阶段，列出需逐项评估的文档文件与 docs-check 验证条目

#### Scenario: 修改类变更不能以"无新增"跳过文档核对
- **GIVEN** 变更仅修改现有组件行为（如宠物游走机制），无新增组件/实体/端点
- **WHEN** 开发者填写文档同步阶段条目
- **THEN** 每类文档条目要求写明"现有描述已核对仍准确"或列出具体更新，仅"无新增"不构成完成依据

### Requirement: Config rules 声明文档检查规则
`openspec/config.yaml` 的 `rules.tasks` SHALL 包含文档检查规则：新增或修改前端组件→component-catalog.md、新增或修改实体/表/领域模型→schema.md + uml/README.md、新增或修改 API 端点→api/overview.md、架构/模块结构/测试规模/版本号变更→architecture.md + CLAUDE.md + README.md，且 SHALL 包含"文档同步条目必须逐项评估（未触及类别须写明核对结论），不得仅以'无新增'标记 N/A"与"文档同步完成后必须运行 `node scripts/docs-check.mjs` 且通过"两条约束。

#### Scenario: AI 在 task 生成阶段收到修改类规则约束
- **WHEN** AI 读取 config.yaml 的 rules.tasks 约束生成 tasks
- **THEN** 对修改现有组件/实体/端点的变更，AI 生成对应的文档核对条目而非 N/A

#### Scenario: 架构与规模变更触发 architecture.md 任务
- **GIVEN** 变更涉及模块结构或测试规模变动
- **WHEN** AI 读取 rules.tasks 中对应的规则
- **THEN** 生成的 tasks 包含 `docs/architecture.md` 与 CLAUDE.md 的更新条目

### Requirement: CLAUDE.md 提交前验证包含文档检查
CLAUDE.md 的"提交前验证"章节 SHALL 要求提交前检查 `docs/` 下文档是否需要同步更新，并引用 `node scripts/docs-check.mjs` 作为自动化验证手段。

#### Scenario: 开发者提交前执行完整验证
- **WHEN** 开发者在提交前阅读 CLAUDE.md 验证清单
- **THEN** 清单明确提示"检查 docs/ 目录文档是否需要同步"并包含运行 docs-check 的验证步骤

### Requirement: 文档一致性自动化检查
仓库 SHALL 提供 `scripts/docs-check.mjs`（可经 `pnpm run docs:check` 调用），从契约与代码树独立重算以下事实并与文档声明比对，任一不一致即以非零退出码失败并打印修复指引：
- 版本声明：`specs/openapi.yaml` 的 `version` 与 `docs/api/overview.md`、`docs/database/schema.md`、`docs/planning/execution-plan.md`、`CLAUDE.md` 中的版本声明一致
- 端点覆盖：`specs/openapi.yaml` 全部端点路径均出现在 `docs/api/overview.md` 中（`{id}` 归一化后做出现性匹配）；overview 中存在而 openapi 中不存在的路径仅告警，经确认后可加入脚本白名单
- 结构计数：文档中可独立验证的计数声明以 `<!-- DOCS-CHECK: <key>=<value> -->` 注释就地标注（如 `frontend-test-files`、`backend-test-classes`、`domain-files`、`specs-count`、`e2e-files`、`theme-sets`、`holiday-themes`、`ui-components`），脚本从代码树现场重算并比对

CI 的 `version-check` job SHALL 在版本同步检查之后执行 `node scripts/docs-check.mjs`；文档漂移 SHALL 阻断该 job。

#### Scenario: 新增端点未更新 overview 导致 CI 失败
- **GIVEN** 开发者新增 `GET /pets/me/stats` 端点并提交（未更新 `docs/api/overview.md`）
- **WHEN** CI 运行 version-check job 中的 docs-check
- **THEN** 检查失败，输出指明 `/pets/me/stats` 未出现在 overview.md，并要求同步文档

#### Scenario: 版本号同步后 docs 声明滞后
- **GIVEN** `specs/openapi.yaml` version 升至 3.4.0，`docs/api/overview.md` 仍声明 3.3.4
- **WHEN** 运行 `node scripts/docs-check.mjs`
- **THEN** 报告版本声明不一致并列出应更新的文件与期望值

#### Scenario: 测试文件数漂移被计数检查拦截
- **GIVEN** 新增前端测试文件后 CLAUDE.md 的 `frontend-test-files` marker 未同步
- **WHEN** 运行 `node scripts/docs-check.mjs`
- **THEN** 报告 `frontend-test-files` 实际值 ≠ marker 值，指示更新文档声明

#### Scenario: 语义类描述不受自动化检查约束
- **WHEN** 文档涉及无法机器验证的语义描述（如"SSE 鉴权走 Cookie"）
- **THEN** 此类内容不设 DOCS-CHECK marker，由 tasks 模板的逐项评估与变更评审保证准确性

### Requirement: uml 领域模型图方法签名降级声明
`docs/uml/README.md` SHALL 在头部声明：领域模型图用于表达实体关系与字段，方法签名以代码为准；仅修改方法签名而不改实体关系时 SHALL 不必更新该图。

#### Scenario: 方法签名变更不强制触发 uml 更新
- **GIVEN** 开发者修改 `Pet` 领域类的某个方法实现或签名（不改变实体关系与字段）
- **WHEN** 判断是否需更新 `docs/uml/README.md`
- **THEN** 依据头部声明，方法级变更不强制更新本图，关系与字段级变更仍必须更新

### Requirement: CLAUDE.md 检查清单覆盖架构与规模声明
CLAUDE.md 的"文档检查"清单 SHALL 覆盖：架构/模块结构变动 → `docs/architecture.md` + CLAUDE.md；版本号/测试规模/模块列表变动 → CLAUDE.md 版本声明 + README.md。

#### Scenario: 测试规模变动触发文档任务
- **GIVEN** 变更新增或删除前端测试文件/用例
- **WHEN** 生成 tasks 的文档同步阶段
- **THEN** 自动包含更新 CLAUDE.md 测试覆盖声明（含 DOCS-CHECK marker）的任务

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
