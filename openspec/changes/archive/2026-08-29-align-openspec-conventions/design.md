# Design: align-openspec-conventions

<!-- 参考: docs/architecture.md + CLAUDE.md 技术约定 -->

## Context
OpenSpec 已升级至 1.11.0（CLI + `.dsh` skills/commands 已同步），但项目自定义 schema `spec-driven-custom` 的模板 / schema / config 仍沿用 1.7.0 约定。官方 1.11.0 默认 schema 的关键规范：新能力 delta 必须带 `## Purpose`（≥50 字符，`--strict` 校验）；无行为变化变更用 `skip_specs: true`（`validate` 对零 delta 未声明者报错）；`config.yaml` 的 `context` 注入每次 artifact 生成；规范以 schema instruction + 模板为权威。

## Goals / Non-Goals

**Goals:**
- 自定义 spec 模板与 schema instruction 对齐官方 Purpose / skip_specs 约定
- 刷新 `openspec/config.yaml` 的 `context` 到当前事实（v3.5.1）
- 规则单源化（config rules 去重）
- 修正 `CLAUDE.md` 中 OpenSpec 工作流描述（artifact 顺序笔误等）

**Non-Goals:**
- 17 个既有主 spec 的短 Purpose 补写（独立 `fix-spec-purpose-length` change）
- `spec-driven-custom-lite` 轻量 schema（独立评估）
- `retire_capabilities` 全链路实现（本 change 仅在 instruction 提及）

## Decisions

### Decision 1: 模板采用官方 `## Purpose` 规范
- **选择**: 自定义 `templates/spec.md` 在 `## ADDED Requirements` 前加 `## Purpose` 段（注释明确"仅新能力；已存在能力 delta 禁用"）；`schema.yaml` 的 specs instruction 写全规则（≥50 字符、已存在能力不带、改已有 Purpose 直接编辑主 spec）。
- **理由**: 官方 1.11.0 强制且 `--strict` 校验 ≥50 字符；消除"归档后主 spec 留 TBD / 靠手补"的依赖，也顺带压低 `--strict` 后续新增失败。
- **备选方案**: 维持现有模板，sync 时靠代理判断补 Purpose —— 已被实测证明主 spec Purpose 依赖人，且 17 个主 spec 因短 Purpose 过不了 `--strict`。

### Decision 2: `skip_specs` 替代"绕过 OpenSpec"
- **选择**: `schema.yaml` 的 proposal instruction 与 `config.yaml` 注明：无行为变化（纯重构/工具链/文档/热修）→ 变更 `.openspec.yaml` 设 `skip_specs: true`；移除 config rules 中"**不走 OpenSpec 流程的小改动**"的表述。
- **理由**: 官方内置机制（validate 放行零 delta + skip_specs），留痕、可校验、归档统一；"绕过"让决策记录丢失且无验证。
- **备选方案**: 保持 config 引导绕过 —— 与官方 1.11.0 机制相悖，且与本项目 57 个归档变更的纪律不对齐。

### Decision 3: context 手工刷新（本次）
- **选择**: 以 `CLAUDE.md` + `docs/architecture.md` 为核对基准，手工刷新 `config.yaml` 的 `context` 到 v3.5.1 现状；不引入自动生成脚本。
- **理由**: context 体量小、手工维护成本可控；自动再生（脚本解析 CLAUDE.md）复杂度高，可作后续优化。
- **备选方案**: 脚本自动再生 —— 暂缓，收益/复杂度比不划算。

### Decision 4: 规则单源化
- **选择**: `config.yaml` 的 `rules` 删除与 schema instruction / 模板重复的格式类条目；保留项目特有约束（DDD 分层映射、版本同步、文档逐项核对、docs-check 验证）；规范权威 = schema instruction + 模板。
- **理由**: 三处重复（config rules × schema instruction × 模板）是漂移根源；schema instruction 已覆盖绝大多数格式规则。
- **备选方案**: 保留三处并同步维护 —— 已出现 config rules 与模板重复编码同一规则，维护成本高。

## DDD Layer Design

### 领域层 (domain/)
N/A — 后端零变更。

### 基础设施层 (infrastructure/)
N/A — 无 persistence/security/scheduled/notification 变更。

### 应用层 (application/)
N/A — 无 ApplicationService 变更。

### API 层 (api/)
N/A — 无 Controller/Assembler 变更。

### 前端 (frontend/src/)
N/A — 前端零变更。本变更仅涉及 OpenSpec 元工作流文件：
- `openspec/schemas/spec-driven-custom/templates/{proposal,spec,design,tasks}.md`
- `openspec/schemas/spec-driven-custom/schema.yaml`
- `openspec/config.yaml`
- `CLAUDE.md`

## API Design
无。`specs/openapi.yaml` 不变，**不触发**版本号同步（openapi.yaml / pom.xml / package.json 均不动），`specs/CHANGELOG.md` 无新增条目。

## Database Design
无。无 Flyway 迁移，无 H2 schema 变更。

## Risks / Trade-offs
- [context 刷新后仍可能遗漏细节（模块清单/测试规模/版本号）] → 以 CLAUDE.md 与 docs 为核对基准，tasks 8.x 逐项确认
- [config rules 删减导致行为差异] → 仅移除与 schema/模板纯重复的条目，项目特有约束全部保留
- [模板加 Purpose 后与历史 delta 格式并存] → 官方 sync 规则已兼容（无 Purpose → TBD 占位，有则种子）；新规范只影响新建 delta，归档无回归
- [CLAUDE.md 修改影响代理行为] → 仅修正描述性错误与顺序笔误，不改变命令集合与流程

## Migration Plan
1. 改 `templates/spec.md` + `schema.yaml`（specs / proposal instruction）
2. 改 `openspec/config.yaml`（context 刷新 + rules 单源）
3. 改 `CLAUDE.md`（顺序笔误 + skip_specs / 版本说明）
4. 验证：`openspec schema validate spec-driven-custom` + `openspec validate --specs` + `node scripts/docs-check.mjs`
回滚：所有改动均为文本文件，`git restore` 即可；无数据迁移。

## Open Questions
- context 是否改用脚本自动再生？（本 change 不做，后续评估）
- `spec-driven-custom-lite` 轻量 schema 是否引入？（独立评估）
- `retire_capabilities` 能力退休是否单独立 change 实现？（本 change 仅提及）
