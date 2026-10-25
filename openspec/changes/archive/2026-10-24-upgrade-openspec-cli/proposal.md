# Proposal: upgrade-openspec-cli

## Why
项目 OpenSpec CLI 停在 1.11.0（落后上游 1.12–1.15 四个 minor，1.15.0 为当前最新）。本次按官方方式升级到 1.15.0，并处理升级引入的不兼容：1.14.1 起新增「需求正文 >500 字符」strict 警告，本项目 10 个主 spec 共 15 条需求正文超标；若不修复，升级后 CI 的 openspec-validation（`validate --all --strict`）门禁会变红。

## What Changes
- **官方升级 CLI**：`npm install -g @fission-ai/openspec@1.15.0` + `openspec update`，重生成 `.claude/`（12 commands + 12 skills）与 `.dsh/skills`（1.14.0 起 dsh 为官方支持工具）；`.dsh/commands/opsx` 继续人工镜像，保持现有双份一致
- **CI 钉版同步**：`openspec-validation` job 安装行 1.11.0 → 1.15.0；CLAUDE.md 版本声明与机制层说明同步
- **主 spec 格式修复**：10 个 spec 的 15 条超长需求正文压到 ≤500 字符（细节移入 scenario，语义不变）
- **指令层对齐**：自定义 schema instruction 版本引用 1.11.0 → 1.15.0，并补「需求正文 ≤500 字符」格式纪律（custom 与 lite 两 schema 同步；templates 不变）
- **文档对齐**：`openspec-conventions` 主 spec、`docs/architecture.md`、`README.md` 的版本/门禁描述核对
- 非 **BREAKING**：无 API 契约影响、无代码行为变更；`.openspec.yaml` 设 `skip_specs: true`

## Capabilities

### New Capabilities
（无——纯工具链/元数据升级 + 主 spec 格式修复，无 spec 级行为变化，`.openspec.yaml` 已设 `skip_specs: true`，不创建 delta）

### Modified Capabilities
（无需求级变更；主 spec 仅做格式修复，按官方规范直接编辑主 spec，不走 delta）

## API Contract Impact
无。`specs/openapi.yaml` 零变更，无端点新增/修改。

## DDD Layer Impact
无。后端 API / 应用 / 领域 / 基础设施四层零变更；前端与小程序源码零变更。

## Database Impact
无需。无 Flyway 迁移、无表/列变更。

## Impact
- **工具链**：`@fission-ai/openspec@1.15.0`（npm 全局）；`.github/workflows/ci.yml` 的 openspec-validation job
- **机制层（CLI 重生成，禁止手改）**：`.claude/commands/opsx/*.md`（12）、`.claude/skills/openspec-*/SKILL.md`（12）、`.dsh/skills/openspec-*/SKILL.md`（12）；`.dsh/commands/opsx/*.md`（12，人工镜像）
- **指令层**：`openspec/schemas/spec-driven-custom/schema.yaml`、`openspec/schemas/spec-driven-custom-lite/schema.yaml`（仅 instruction 文本：版本引用 + 篇幅纪律；artifacts 链与 templates 不变）
- **主 spec**：`openspec/specs/{calendar-module,core-directory,doc-sync-workflow,openspec-conventions,pet-accessory-equip,pet-economy-loop,tabbed-dialog,task-crud,task-kanban,task-pet-bridge}/spec.md`
- **文档/脚本**：`CLAUDE.md`、`docs/architecture.md`、`README.md`、`scripts/openspec-check.mjs`（self-test 版本字面量）
- **升级前兼容性核查结论**（1.15.0 CLI 实测）：自定义双 schema `openspec schema validate` 通过；`validate --archived` 67/67 通过；`templates` 5 个工件路径解析正常；`skip_specs` 仍为官方识别键（`change-metadata/schema.js`）；`apply.requires` 与工件链校验通过；**唯一阻断项**为 1.14.1 起的需求正文 500 字符 strict 规则（本变更修复）
