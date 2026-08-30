# Design: fix-spec-purpose-length

<!-- 参考: docs/architecture.md + CLAUDE.md 技术约定 -->

## Context
OpenSpec 1.11.0 `--strict` 对主 spec 的 `## Purpose` 有两类检查：占位（`TBD`/归档模板句）与长度（<50 字符）。当前 17 个主 spec 不过：4 个占位 + 13 个过短。官方规范明确：**修改已有能力的 Purpose 直接编辑 `openspec/specs/<cap>/spec.md`**（delta 的 `## Purpose` 只在新建能力时生效）；无行为变化的纯文档质量修复用 `skip_specs: true`（align-openspec-conventions 已落地该约定）——本变更是该约定的第一次实际运用。

## Goals / Non-Goals

**Goals:**
- 17 个主 spec 的 `## Purpose` 全部重写为真实描述（≥50 字符、无占位）
- `openspec validate --specs --strict` → 0 失败（为 CI strict 门禁铺路）

**Non-Goals:**
- 不动 Requirements/Scenarios/Test Coverage 等其余内容
- 不改 `specs-count`（无能力增删，维持 67）
- 不实现 CI 接入（独立 `wire-openspec-validation-into-ci` change）

## Decisions

### Decision 1: 重写口径 = 能力用途的一句话概述
- **选择**: 每个 Purpose 用 1 句中文概述"该能力是什么 + 为什么存在"（≥50 字符，避免 TBD/样板句），措辞与 CLAUDE.md 能力描述、spec 标题一致。
- **理由**: strict 检查的是真实描述而非长度凑数；与 doc-sync-workflow 等既有合格主 spec 口径一致。
- **备选方案**: 直接机械加长现有句子 → 语义重复且仍可能被识别为模板句；不做逐条核对。

### Decision 2: skip_specs + 直接编辑主 spec
- **选择**: `.openspec.yaml` 设 `skip_specs: true`（无 spec 级行为变化）；apply 阶段逐文件只改 `## Purpose` 段落。
- **理由**: 官方规范明确已有能力 Purpose 修改不走 delta；本变更零行为变化，正是 `skip_specs` 适用场景（放行零 delta 校验）。
- **备选方案**: 走 17 个 delta → 与官方规范违背，且 MODIFIED 机制不支持 Purpose 段。

### Decision 3: 分组实施 + 双验证
- **选择**: 按模块分 4 组（auth/reminder 组、pet 组、前端组、通用组）逐文件最小编辑；完成后 `strict` 与 `docs-check` 双验证。
- **理由**: 17 个文件分散，分组便于核对遗漏；双验证分别覆盖 spec 格式与文档计数。
- **备选方案**: 一次性批量替换 → 易误触其他段落。

## DDD Layer Design

### 领域层 (domain/)
N/A — 无后端变更。

### 基础设施层 (infrastructure/)
N/A。

### 应用层 (application/)
N/A。

### API 层 (api/)
N/A。

### 前端 (frontend/src/)
N/A — 本变更仅编辑 `openspec/specs/*/spec.md` 的 Purpose 段。

## API Design
无。不触发版本号同步（openapi.yaml / pom.xml / package.json 均不动）。

## Database Design
无。

## Risks / Trade-offs
- [误触 Requirement/Scenario 内容] → 每文件仅替换目的正则提取的 Purpose 段落（`## Purpose` 与下一 `##` 之间），编辑后 diff 核对
- [重写口径与既有内容矛盾] → 以各 spec 标题 + CLAUDE.md 能力描述为准绳
- [strict 仍失败（计数口径差异）] → 目标长度放宽到明显 >50 字符（≥60 字），并逐条看 strict 输出确认

## Migration Plan
1. 逐文件替换 17 个 Purpose 段
2. `openspec validate --specs --strict`（期望 0 失败）
3. `node scripts/docs-check.mjs`（期望全绿）
回滚：`git restore openspec/specs/` 即可；无数据迁移。

## Open Questions
- 无。CI strict 门禁留待独立 change。
