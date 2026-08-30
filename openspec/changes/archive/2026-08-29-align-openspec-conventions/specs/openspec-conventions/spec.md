# OpenSpec 工作流约定（openspec-conventions）

<!-- 参考: specs/openapi.yaml + docs/api/overview.md + docs/database/schema.md -->

## Purpose

定义项目 OpenSpec 工作流（spec-driven-custom）的规范约定：新能力 delta 的 Purpose 要求、无行为变化变更的 skip_specs 出口、项目 context 的事实同步、以及规范的单源化原则。使项目的 artifact 生成与官方 OpenSpec 1.11.0 约定一致。

## ADDED Requirements

### Requirement: 新能力 delta 必须携带 Purpose 段
项目 OpenSpec 工作流 SHALL 要求：为**新能力**创建的 delta spec 必须以 `## Purpose` 段开头，内容 SHALL ≥50 字符并描述该能力用途；归档/同步时，新建主 spec 的 Purpose SHALL 取自该 delta 的 `## Purpose` 段。为**已存在能力**创建的 delta SHALL NOT 携带 `## Purpose` 段（主 spec 已有，delta 的会被忽略）；修改已存在能力的 Purpose SHALL 直接编辑 `openspec/specs/<cap>/spec.md`。

#### Scenario: 新能力 delta 创建
- **WHEN** 变更引入新能力并创建 `specs/<capability>/spec.md`
- **THEN** delta 以 `## Purpose` 段开头且内容 ≥50 字符，归档后主 spec 出现对应 Purpose，`openspec validate --strict` 不报 "Purpose section is too brief"

#### Scenario: 已存在能力 delta 不带 Purpose
- **WHEN** 变更修改已存在能力的行为（仅需求级变更，非新增能力）
- **THEN** delta 不含 `## Purpose` 段；该能力 Purpose 的修改直接落在 `openspec/specs/<cap>/spec.md`

#### Scenario: Purpose 过短被拦截
- **WHEN** 新能力 delta 的 `## Purpose` 少于 50 字符
- **THEN** `openspec validate --strict` 报告 WARNING（Purpose section is too brief），须补足后通过

### Requirement: 无行为变化变更使用 skip_specs 出口
项目 OpenSpec 工作流 SHALL 支持官方 `skip_specs: true` 机制：当变更无 spec 级行为变化（纯重构/工具链/文档/热修）时，在变更的 `.openspec.yaml` 设置 `skip_specs: true`，不得以"绕过 OpenSpec 流程"的方式处理此类变更；`openspec validate` SHALL 对零 delta 且声明 `skip_specs` 的变更放行。

#### Scenario: 文档/热修变更
- **WHEN** 变更只改文档或热修且无行为变化
- **THEN** `.openspec.yaml` 含 `skip_specs: true`，不创建 delta specs，`openspec validate` 通过且报告 INFO "skip_specs is set"

#### Scenario: 行为变更必须提供 delta
- **WHEN** 变更影响系统行为（需求级）
- **THEN** 必须提供 delta specs，不得以 `skip_specs` 逃避（官方 validate 对零 delta 且未声明 skip_specs 的变更报 ERROR）

### Requirement: 项目 context 反映当前事实
`openspec/config.yaml` 的 `context` SHALL 反映项目当前事实（版本号、技术栈、架构、模块、测试规模等），并在项目架构/版本发生显著变化时同步更新——因为 `context` 被注入到每个 artifact 的生成指令，过时 content 会误导 artifact 产出。

#### Scenario: 架构/版本变化后
- **WHEN** 项目版本或架构发生显著变化（如模块新增、多端演进）
- **THEN** `context` 相应更新，生成 artifacts 时注入的是当前事实而非历史描述

#### Scenario: 新变更生成 artifacts
- **WHEN** 代理通过 `openspec instructions <artifact>` 获取指令
- **THEN** 指令中的 project context 与 CLAUDE.md/docs 描述的当前状态一致

### Requirement: 规范单源化
项目 OpenSpec 规范 SHALL 以 `openspec/schemas/spec-driven-custom/schema.yaml` 的 instruction 与 `templates/*.md` 为权威来源；`openspec/config.yaml` 的 `rules` SHALL 仅保留与 schema/模板不重复的约束，不得在同一规则上多处编码导致漂移。

#### Scenario: 修改格式规范
- **WHEN** 需要调整某 artifact 的格式/结构规范
- **THEN** 修改 schema instruction 或对应模板，config rules 中无该规则的重复副本

#### Scenario: 校验一致性
- **WHEN** 运行 `openspec instructions <artifact>` 生成指令
- **THEN** 指令不包含互相矛盾的规则（config rules 与 schema instruction 对同一规范态度一致）

## Test Coverage
<!-- 可选。回填历史 spec 时用于审计现有测试覆盖；新建 spec 时可留空，apply 阶段再填充。 -->

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 新能力 delta 创建 / Purpose 过短被拦截 | openspec validate --strict | CLI 校验 | ⚠️ 缺少覆盖(需补测试) |
| 文档/热修变更 skip_specs 放行 | openspec validate | CLI 校验 | ⚠️ 缺少覆盖(需补测试) |
| 架构/版本变化后 context 更新 | scripts/docs-check.mjs | 人工核对 | ⚠️ 缺少覆盖(需补测试) |
| 修改格式规范单源 | openspec instructions | 人工核对 | ⚠️ 缺少覆盖(需补测试) |

<!-- 状态: ✅ 已有覆盖 / ⚠️ 缺少覆盖(需补测试) / ➕ 本次新增 -->
