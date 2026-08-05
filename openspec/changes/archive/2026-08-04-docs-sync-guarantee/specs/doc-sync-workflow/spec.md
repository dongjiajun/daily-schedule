# Doc Sync Workflow

## Purpose

确保代码变更后文档同步不遗漏：通过 OpenSpec tasks 模板、config rules、CLAUDE.md 检查清单三层机制约束文档更新，并规范 docs/ 目录生命周期（当前真值 vs 归档）与规划文档组织。

## Requirements

## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements
（无）

## RENAMED Requirements
（无）

## Test Coverage

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 新增端点未更新 overview 导致 CI 失败 | scripts/docs-check.mjs（自带失败用例集） | docs-check --self-test | ➕ |
| 版本号同步后 docs 声明滞后 | scripts/docs-check.mjs | checkVersion | ➕ |
| 测试文件数漂移被计数检查拦截 | scripts/docs-check.mjs | checkCounts | ➕ |
| 语义类描述不受自动化检查约束 | 设计约定，无自动化 | — | ➕ |
| 方法签名变更不强制触发 uml 更新 | 人工评审 + docs-check 结构校验 | — | ➕ |
| 测试规模变动触发文档任务 | 模板 smoke：后续变更生成验证 | — | ➕ |
| 修改类变更不能以"无新增"跳过 | 模板 smoke：本变更 tasks 即首例 | — | ➕ |
