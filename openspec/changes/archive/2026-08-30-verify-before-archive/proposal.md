<!-- 单源同步：与 spec-driven-custom/templates/proposal.md 内容一致（custom 为先，修改须两处同步） -->
# Proposal: verify-before-archive

## Why
归档是变更全流程的终点，但当前缺少一道强制的"归档前验证门禁"：已归档的 6 个变更在 apply 后均未运行 `/opsx:verify`（靠 tasks 9.x 套件 + `validate --archived` 兜底），且主 spec 只落在"记录层"——它不会自动注入 agent 生成 artifacts 时的指令，仅靠主 spec 无法让门禁真正生效。本变更把门禁同时写入规范层、触达层与指南层。

## What Changes
- 在 `openspec-conventions` 主 spec 新增 Requirement「归档前验证门禁」+ Scenarios（对已存在能力的需求级 ADDED，delta 不带 Purpose）
- 触达层：`spec-driven-custom` 与 `spec-driven-custom-lite` 两 schema 的 `tasks.instruction` 各补一句门禁要求，使 agent 生成 tasks 时即带上门禁任务/等效说明
- 指南层：`CLAUDE.md` 工作流小节补一句门禁适用性说明
- 无系统行为变化（不触碰业务代码 / API / 数据库）

## Capabilities

### New Capabilities

<!-- 新增能力，kebab-case 命名 (如 event-recurrence, dark-mode, ics-import)
     每个将生成 specs/<name>/spec.md；无行为变化（纯重构/工具链/文档/热修）时
     在 .openspec.yaml 设 skip_specs: true，本小节留空，不得绕过 OpenSpec -->
（无 — 本变更为对已有能力的需求级增强，非新能力）

### Modified Capabilities

<!-- 仅列需求级变更（非实现细节），用 openspec/specs/ 下的已有名称 -->
- `openspec-conventions`: 新增「归档前验证门禁」需求——真实代码变更归档前必须运行 `/opsx:verify` 且报告无 CRITICAL；纯工具链/文档/元数据变更可由 tasks 9.x 套件 + `validate --archived` 等效替代并在归档条目注明等效依据

## API Contract Impact
<!-- 是否需修改 specs/openapi.yaml？ -->
无影响（不改 `specs/openapi.yaml`，无新增/修改端点）

## DDD Layer Impact
<!-- 标记变更触碰的后端层级： -->
无（纯 OpenSpec 工作流规范/触达/指南层，不触碰 API/应用/领域/基础设施任何一层）

## Database Impact
<!-- 是否需要新 Flyway 迁移 (V5, V6...)？涉及哪些表/列？ -->
无需

## Impact
<!-- 受影响的代码模块、前端组件、依赖、文档 -->
- `openspec/specs/openspec-conventions/spec.md`（+1 Requirement + 3 Scenarios）
- `openspec/schemas/spec-driven-custom/schema.yaml`（tasks.instruction 补一句）
- `openspec/schemas/spec-driven-custom-lite/schema.yaml`（tasks.instruction 补一句）
- `CLAUDE.md`（工作流小节一句）
- 本变更自身即以 lite 流程（proposal → specs → tasks）完整演练一遍，作为 lite schema 的首个真实用例
